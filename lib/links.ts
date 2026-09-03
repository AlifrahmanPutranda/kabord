import { getDb } from './db';

export interface TaskLink {
  id: number;
  taskId: string;
  provider: 'github' | 'jira';
  externalId: string;
  url: string;
}

function rowToLink(row: any): TaskLink {
  return { id: row.id, taskId: row.taskId, provider: row.provider, externalId: row.externalId, url: row.url };
}

export function getLinksForTask(taskId: string): TaskLink[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM task_links WHERE taskId = ? ORDER BY id ASC').all(taskId) as any[]).map(rowToLink);
}

export function getLinksForBoard(boardId: string): Map<string, TaskLink[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT l.* FROM task_links l
       INNER JOIN tasks t ON t.id = l.taskId
       WHERE t.boardId = ? ORDER BY l.id ASC`
    )
    .all(boardId);
  const map = new Map<string, TaskLink[]>();
  for (const row of rows) {
    const link = rowToLink(row);
    const list = map.get(link.taskId) || [];
    list.push(link);
    map.set(link.taskId, list);
  }
  return map;
}

export function findLinkByExternal(provider: 'github' | 'jira', externalId: string): TaskLink | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM task_links WHERE provider = ? AND externalId = ?').get(provider, externalId);
  return row ? rowToLink(row) : null;
}

export function addLink(taskId: string, provider: 'github' | 'jira', externalId: string, url: string): TaskLink {
  const db = getDb();
  const result = db
    .prepare('INSERT INTO task_links (taskId, provider, externalId, url) VALUES (?, ?, ?, ?)')
    .run(taskId, provider, externalId, url);
  return { id: Number(result.lastInsertRowid), taskId, provider, externalId, url };
}

export function deleteLink(linkId: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM task_links WHERE id = ?').run(linkId);
  return result.changes > 0;
}
