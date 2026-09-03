import { getDb } from './db';
import { getColumnById } from './columns';
import crypto from 'crypto';

export interface Task {
  id: string;
  boardId: string;
  number?: number | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  position?: number;
  requestedBy: string;
  assignee: string;
  dueDate: string;
  category: string;
  createdAt: string;
  archived: boolean;
  activity: Activity[];
}

export interface Activity {
  time: string;
  text: string;
}

// Get tasks by board ID
export function getTasksByBoard(boardId: string): Task[] {
  const db = getDb();

  const tasksResult = db.prepare('SELECT * FROM tasks WHERE boardId = ? AND archived = 0').all(boardId) as any[];
  const activityResult = db.prepare('SELECT * FROM activity WHERE boardId = ? ORDER BY id DESC').all(boardId) as any[];

  if (tasksResult.length === 0) return [];

  const tasks: Task[] = tasksResult.map(row => ({
    ...row,
    boardId: row.boardId || boardId,
    archived: row.archived === 1,
    activity: []
  }));

  // Add activities
  activityResult.forEach((actRow: any) => {
    const taskId = actRow.taskId as string;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.activity.push({
        time: actRow.time as string,
        text: actRow.text as string
      });
    }
  });

  return tasks;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;

  if (!task) return null;

  // Get activities
  const activityResult = db.prepare('SELECT time, text FROM activity WHERE taskId = ? ORDER BY id DESC').all(id) as any[];
  task.activity = activityResult.map(a => ({ time: a.time, text: a.text }));
  task.archived = task.archived === 1;
  task.boardId = task.boardId || 'default-board';

  return task;
}

export async function createTask(task: Omit<Task, 'createdAt' | 'archived' | 'activity'>): Promise<Task> {
  const db = getDb();
  const now = new Date().toISOString().slice(0, 10);
  const activityTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const boardId = task.boardId || 'default-board';

  db.prepare(`
    INSERT INTO tasks (id, boardId, title, description, priority, status, requestedBy, assignee, dueDate, category, createdAt, archived)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    task.id, boardId, task.title, task.description || '', task.priority, task.status,
    task.requestedBy || '', task.assignee || '', task.dueDate || '', task.category, now
  );

  db.prepare('INSERT INTO activity (taskId, boardId, time, text) VALUES (?, ?, ?, ?)').run(task.id, boardId, activityTime, 'Task created');

  return {
    ...task,
    boardId,
    createdAt: now,
    archived: false,
    activity: [{ time: activityTime, text: 'Task created' }]
  };
}

// Create task with explicit board ID (for board-scoped API)
export function createTaskInBoard(
  boardId: string,
  taskData: {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    requestedBy?: string;
    assignee?: string;
    dueDate?: string;
    category?: string;
  },
  actorId?: number
): Task {
  const db = getDb();
  const now = new Date().toISOString().slice(0, 10);
  const activityTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const status = taskData.status || 'todo';

  // Atomic per-board task number (KAB-<n>) + next position in the target column.
  const seq = db
    .prepare('UPDATE boards SET taskSeq = taskSeq + 1 WHERE id = ? RETURNING taskSeq')
    .get(boardId) as { taskSeq: number } | undefined;
  const number = seq?.taskSeq ?? 1;
  const pos = db
    .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM tasks WHERE boardId = ? AND status = ?')
    .get(boardId, status) as { p: number };

  db.prepare(`
    INSERT INTO tasks (id, boardId, title, description, priority, status, requestedBy, assignee, dueDate, category, createdAt, archived, number, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    taskData.id,
    boardId,
    taskData.title,
    taskData.description || '',
    taskData.priority || 'medium',
    status,
    taskData.requestedBy || '',
    taskData.assignee || '',
    taskData.dueDate || '',
    taskData.category || '',
    now,
    number,
    pos.p
  );

  db.prepare('INSERT INTO activity (taskId, boardId, time, text, actorId) VALUES (?, ?, ?, ?, ?)').run(
    taskData.id,
    boardId,
    activityTime,
    'Task created',
    actorId ?? null
  );

  return {
    id: taskData.id,
    boardId,
    title: taskData.title,
    description: taskData.description || '',
    priority: taskData.priority || 'medium',
    status,
    requestedBy: taskData.requestedBy || '',
    assignee: taskData.assignee || '',
    dueDate: taskData.dueDate || '',
    category: taskData.category || '',
    createdAt: now,
    archived: false,
    number,
    position: pos.p,
    activity: [{ time: activityTime, text: 'Task created' }]
  } as Task;
}

export async function updateTask(id: string, updates: Partial<Task>, actorId?: number): Promise<Task | null> {
  const task = await getTaskById(id);
  if (!task) return null;

  const db = getDb();
  const activityTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const boardId = task.boardId || 'default-board';
  const activityLogs: string[] = [];

  // Build activity log based on what changed
  if (updates.status && updates.status !== task.status) {
    const statusLabels: Record<string, string> = {
      todo: 'To Do',
      inprogress: 'In Progress',
      review: 'Review',
      done: 'Done',
    };
    activityLogs.push(`Status changed from ${statusLabels[task.status] || task.status} to ${statusLabels[updates.status] || updates.status}`);
  }

  if (updates.priority && updates.priority !== task.priority) {
    activityLogs.push(`Priority changed from ${task.priority} to ${updates.priority}`);
  }

  if (updates.assignee !== undefined && updates.assignee !== task.assignee) {
    activityLogs.push(`Assignee changed from ${task.assignee || 'Unassigned'} to ${updates.assignee || 'Unassigned'}`);
  }

  if (updates.requestedBy && updates.requestedBy !== task.requestedBy) {
    activityLogs.push(`Requester changed to ${updates.requestedBy}`);
  }

  if (updates.title && updates.title !== task.title) {
    activityLogs.push('Title updated');
  }

  if (updates.description !== undefined && updates.description !== task.description) {
    activityLogs.push('Description updated');
  }

  if (updates.dueDate && updates.dueDate !== task.dueDate) {
    activityLogs.push(`Due date changed to ${updates.dueDate || 'No date'}`);
  }

  if (updates.category && updates.category !== task.category) {
    activityLogs.push(`Category changed to ${updates.category}`);
  }

  // Update task
  db.prepare(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      priority = ?,
      status = ?,
      requestedBy = ?,
      assignee = ?,
      dueDate = ?,
      category = ?,
      archived = ?
    WHERE id = ?
  `).run(
    updates.title ?? task.title,
    updates.description !== undefined ? updates.description : task.description,
    updates.priority ?? task.priority,
    updates.status ?? task.status,
    updates.requestedBy !== undefined ? updates.requestedBy : task.requestedBy,
    updates.assignee !== undefined ? updates.assignee : task.assignee,
    updates.dueDate !== undefined ? updates.dueDate : task.dueDate,
    updates.category ?? task.category,
    updates.archived !== undefined ? (updates.archived ? 1 : 0) : task.archived ? 1 : 0,
    id
  );

  // Add activity logs
  const insertActivity = db.prepare('INSERT INTO activity (taskId, boardId, time, text, actorId) VALUES (?, ?, ?, ?, ?)');
  if (activityLogs.length > 0) {
    activityLogs.forEach(log => {
      insertActivity.run(id, boardId, activityTime, log, actorId ?? null);
    });
  } else {
    // Default log if nothing specific changed
    insertActivity.run(id, boardId, activityTime, 'Task updated', actorId ?? null);
  }

  return getTaskById(id);
}

export async function archiveTask(id: string, actorId?: number): Promise<boolean> {
  const db = getDb();
  const activityTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const task = db.prepare('SELECT boardId FROM tasks WHERE id = ?').get(id) as { boardId: string } | undefined;
  const boardId = task?.boardId || 'default-board';

  db.prepare('UPDATE tasks SET archived = 1 WHERE id = ?').run(id);
  db.prepare('INSERT INTO activity (taskId, boardId, time, text, actorId) VALUES (?, ?, ?, ?, ?)').run(
    id,
    boardId,
    activityTime,
    'Task archived',
    actorId ?? null
  );

  return true;
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = getDb();
  db.prepare('DELETE FROM activity WHERE taskId = ?').run(id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id); // cascades subtasks/comments/links
  return true;
}

// Lightweight cross-board task index for the command palette.
export function getUserTaskIndex(userId: number): Array<{
  id: string;
  number: number | null;
  title: string;
  boardId: string;
  boardName: string;
}> {
  const db = getDb();
  return db
    .prepare(
      `SELECT t.id, t.number, t.title, t.boardId, b.name AS boardName
       FROM tasks t
       INNER JOIN boards b ON b.id = t.boardId
       INNER JOIN board_members bm ON bm.boardId = t.boardId AND bm.userId = ?
       WHERE t.archived = 0
       ORDER BY t.createdAt DESC
       LIMIT 300`
    )
    .all(userId) as any[];
}

// ---------- Import (GitHub / Jira) ----------

export interface ImportItem {
  title: string;
  description?: string;
  labels?: string[];
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  provider: 'github' | 'jira';
  externalId: string;
  url: string;
}

export interface ImportResult {
  tasks: Task[];
  skipped: Array<{ externalId: string; reason: string }>;
}

// Batch import in a single transaction. Skips items already linked on any task
// in this board; creates missing labels (categories) as it goes.
export function importTasksToBoard(boardId: string, columnId: string, items: ImportItem[], actorId?: number): ImportResult {
  const db = getDb();
  const result: ImportResult = { tasks: [], skipped: [] };
  const now = new Date().toISOString().slice(0, 10);
  const activityTime = new Date().toISOString().slice(0, 16).replace('T', ' ');

  db.transaction(() => {
    const findLink = db.prepare('SELECT taskId FROM task_links WHERE provider = ? AND externalId = ?');
    const seqStmt = db.prepare('UPDATE boards SET taskSeq = taskSeq + 1 WHERE id = ? RETURNING taskSeq');
    const posStmt = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM tasks WHERE boardId = ? AND status = ?');
    const insertTask = db.prepare(
      `INSERT INTO tasks (id, boardId, title, description, priority, status, requestedBy, assignee, dueDate, category, createdAt, archived, number, position)
       VALUES (?, ?, ?, ?, ?, ?, '', ?, '', '', ?, 0, ?, ?)`
    );
    const insertLink = db.prepare('INSERT INTO task_links (taskId, provider, externalId, url) VALUES (?, ?, ?, ?)');
    const insertActivity = db.prepare('INSERT INTO activity (taskId, boardId, time, text, actorId) VALUES (?, ?, ?, ?, ?)');
    const findCategory = db.prepare('SELECT id FROM board_categories WHERE boardId = ? AND name = ?');
    const insertCategory = db.prepare(
      "INSERT INTO board_categories (boardId, name, color, position, createdAt) VALUES (?, ?, '#64748b', (SELECT COALESCE(MAX(position),0)+1 FROM board_categories WHERE boardId = ?), CURRENT_TIMESTAMP)"
    );

    for (const item of items.slice(0, 100)) {
      const title = item.title?.trim();
      if (!title) {
        result.skipped.push({ externalId: item.externalId, reason: 'empty title' });
        continue;
      }
      const existing = findLink.get(item.provider, item.externalId) as { taskId: string } | undefined;
      if (existing) {
        result.skipped.push({ externalId: item.externalId, reason: 'already imported' });
        continue;
      }

      const seq = seqStmt.get(boardId) as { taskSeq: number } | undefined;
      const number = seq?.taskSeq ?? 1;
      const pos = posStmt.get(boardId, columnId) as { p: number };
      const taskId = `task-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      // Join multiple labels into the category field (first label wins as primary).
      const primaryLabel = (item.labels || [])[0] || '';
      if (primaryLabel && !findCategory.get(boardId, primaryLabel)) {
        insertCategory.run(boardId, primaryLabel, boardId);
      }

      insertTask.run(
        taskId,
        boardId,
        title,
        item.description || '',
        item.priority || 'medium',
        columnId,
        item.assignee || '',
        now,
        number,
        pos.p
      );
      insertLink.run(taskId, item.provider, item.externalId, item.url);
      insertActivity.run(taskId, boardId, activityTime, `Imported from ${item.provider} (${item.externalId})`, actorId ?? null);

      result.tasks.push({ ...({} as Task), id: taskId, boardId, number, title, description: item.description || '', priority: item.priority || 'medium', status: columnId, position: pos.p, requestedBy: '', assignee: item.assignee || '', dueDate: '', category: primaryLabel, createdAt: now, archived: false, activity: [] });
    }
  })();

  return result;
}

// Move a task to a column at a target index. Renumbers both affected columns
// densely and enforces the target column's WIP limit.
export async function moveTask(
  taskId: string,
  columnId: string,
  targetIndex: number,
  actorId?: number
): Promise<{ task?: Task; error?: string }> {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!task) return { error: 'Task not found' };

  const column = getColumnById(columnId);
  if (!column || column.boardId !== task.boardId) return { error: 'Invalid target column' };

  const movingColumns = task.status !== columnId;

  // WIP limit only applies when entering a new column.
  if (movingColumns && column.wipLimit !== null) {
    const count = db
      .prepare('SELECT COUNT(*) AS n FROM tasks WHERE status = ? AND archived = 0')
      .get(columnId) as { n: number };
    if (count.n >= column.wipLimit) {
      return { error: `WIP limit reached for "${column.name}" (${column.wipLimit})` };
    }
  }

  const activityTime = new Date().toISOString().slice(0, 16).replace('T', ' ');

  db.transaction(() => {
    const ids = (
      db
        .prepare('SELECT id FROM tasks WHERE status = ? AND archived = 0 AND id != ? ORDER BY position ASC, createdAt ASC')
        .all(columnId, taskId) as Array<{ id: string }>
    ).map(r => r.id);

    const clamped = Math.max(0, Math.min(targetIndex, ids.length));
    ids.splice(clamped, 0, taskId);

    const updatePos = db.prepare('UPDATE tasks SET position = ?, status = ? WHERE id = ?');
    ids.forEach((id, index) => updatePos.run(index, columnId, id));

    db.prepare('INSERT INTO activity (taskId, boardId, time, text, actorId) VALUES (?, ?, ?, ?, ?)').run(
      taskId,
      task.boardId,
      activityTime,
      movingColumns ? `Moved to ${column.name}` : `Reordered in ${column.name}`,
      actorId ?? null
    );
    db.prepare("UPDATE boards SET updatedAt = datetime('now') WHERE id = ?").run(task.boardId);
  })();

  return { task: (await getTaskById(taskId)) || undefined };
}
