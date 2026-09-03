import { getDb } from './db';

export interface Subtask {
  id: number;
  taskId: string;
  title: string;
  done: boolean;
  position: number;
}

function rowToSubtask(row: any): Subtask {
  return { id: row.id, taskId: row.taskId, title: row.title, done: row.done === 1, position: row.position };
}

export function getSubtasksForTask(taskId: string): Subtask[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM subtasks WHERE taskId = ? ORDER BY position ASC, id ASC').all(taskId);
  return rows.map(rowToSubtask);
}

export function getSubtasksForBoard(boardId: string): Map<string, Subtask[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT s.* FROM subtasks s
       INNER JOIN tasks t ON t.id = s.taskId
       WHERE t.boardId = ? ORDER BY s.position ASC, s.id ASC`
    )
    .all(boardId);
  const map = new Map<string, Subtask[]>();
  for (const row of rows) {
    const st = rowToSubtask(row);
    const list = map.get(st.taskId) || [];
    list.push(st);
    map.set(st.taskId, list);
  }
  return map;
}

export function createSubtask(taskId: string, title: string): Subtask {
  const db = getDb();
  const max = db.prepare('SELECT COALESCE(MAX(position), -1) AS p FROM subtasks WHERE taskId = ?').get(taskId) as { p: number };
  const result = db
    .prepare('INSERT INTO subtasks (taskId, title, done, position) VALUES (?, ?, 0, ?)')
    .run(taskId, title.trim(), max.p + 1);
  return { id: Number(result.lastInsertRowid), taskId, title: title.trim(), done: false, position: max.p + 1 };
}

export function createSubtasks(taskId: string, titles: string[]): Subtask[] {
  const db = getDb();
  const created: Subtask[] = [];
  db.transaction(() => {
    for (const title of titles) {
      if (title.trim()) created.push(createSubtask(taskId, title.trim()));
    }
  })();
  return created;
}

export function updateSubtask(taskId: string, subtaskId: number, data: { title?: string; done?: boolean; position?: number }): Subtask | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM subtasks WHERE id = ? AND taskId = ?').get(subtaskId, taskId);
  if (!row) return null;

  if (data.title !== undefined) db.prepare('UPDATE subtasks SET title = ? WHERE id = ?').run(data.title.trim(), subtaskId);
  if (data.done !== undefined) db.prepare('UPDATE subtasks SET done = ? WHERE id = ?').run(data.done ? 1 : 0, subtaskId);
  if (data.position !== undefined) db.prepare('UPDATE subtasks SET position = ? WHERE id = ?').run(data.position, subtaskId);

  const updated = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId);
  return rowToSubtask(updated);
}

export function deleteSubtask(taskId: string, subtaskId: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM subtasks WHERE id = ? AND taskId = ?').run(subtaskId, taskId);
  return result.changes > 0;
}
