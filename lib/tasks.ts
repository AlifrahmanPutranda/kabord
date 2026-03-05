import { getDb } from './db';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
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

export async function getAllTasks(): Promise<Task[]> {
  const db = getDb();

  const tasksResult = db.prepare('SELECT * FROM tasks WHERE archived = 0').all() as any[];
  const activityResult = db.prepare('SELECT * FROM activity ORDER BY id DESC').all() as any[];

  if (tasksResult.length === 0) return [];

  const tasks: Task[] = tasksResult.map(row => ({
    ...row,
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

  return task;
}

export async function createTask(task: Omit<Task, 'createdAt' | 'archived' | 'activity'>): Promise<Task> {
  const db = getDb();
  const now = new Date().toISOString().slice(0, 10);
  const activityTime = new Date().toISOString().slice(0, 16).replace('T', ' ');

  db.prepare(`
    INSERT INTO tasks (id, title, description, priority, status, requestedBy, assignee, dueDate, category, createdAt, archived)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    task.id, task.title, task.description || '', task.priority, task.status,
    task.requestedBy || '', task.assignee || '', task.dueDate || '', task.category, now
  );

  db.prepare('INSERT INTO activity (taskId, time, text) VALUES (?, ?, ?)').run(task.id, activityTime, 'Task created');

  return {
    ...task,
    createdAt: now,
    archived: false,
    activity: [{ time: activityTime, text: 'Task created' }]
  };
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const task = await getTaskById(id);
  if (!task) return null;

  const db = getDb();
  const activityTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
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
  if (activityLogs.length > 0) {
    activityLogs.forEach(log => {
      db.prepare('INSERT INTO activity (taskId, time, text) VALUES (?, ?, ?)').run(id, activityTime, log);
    });
  } else {
    // Default log if nothing specific changed
    db.prepare('INSERT INTO activity (taskId, time, text) VALUES (?, ?, ?)').run(id, activityTime, 'Task updated');
  }

  return getTaskById(id);
}

export async function archiveTask(id: string): Promise<boolean> {
  const db = getDb();
  const activityTime = new Date().toISOString().slice(0, 16).replace('T', ' ');

  db.prepare('UPDATE tasks SET archived = 1 WHERE id = ?').run(id);
  db.prepare('INSERT INTO activity (taskId, time, text) VALUES (?, ?, ?)').run(id, activityTime, 'Task archived');

  return true;
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  db.prepare('DELETE FROM activity WHERE taskId = ?').run(id);
  return true;
}
