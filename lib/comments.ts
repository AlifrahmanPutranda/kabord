import { getDb } from './db';

export interface Comment {
  id: number;
  taskId: string;
  userId: number;
  username: string;
  body: string;
  createdAt: string;
}

function rowToComment(row: any): Comment {
  return {
    id: row.id,
    taskId: row.taskId,
    userId: row.userId,
    username: row.username,
    body: row.body,
    createdAt: row.createdAt,
  };
}

const SELECT = `
  SELECT c.*, u.username FROM comments c
  INNER JOIN users u ON u.id = c.userId
`;

export function getCommentsForTask(taskId: string): Comment[] {
  const db = getDb();
  const rows = db.prepare(`${SELECT} WHERE c.taskId = ? ORDER BY c.createdAt ASC, c.id ASC`).all(taskId);
  return rows.map(rowToComment);
}

export function getCommentsForBoard(boardId: string): Map<string, Comment[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `${SELECT} INNER JOIN tasks t ON t.id = c.taskId WHERE t.boardId = ? ORDER BY c.createdAt ASC, c.id ASC`
    )
    .all(boardId);
  const map = new Map<string, Comment[]>();
  for (const row of rows) {
    const c = rowToComment(row);
    const list = map.get(c.taskId) || [];
    list.push(c);
    map.set(c.taskId, list);
  }
  return map;
}

export function createComment(taskId: string, userId: number, body: string): Comment {
  const db = getDb();
  const result = db
    .prepare('INSERT INTO comments (taskId, userId, body) VALUES (?, ?, ?)')
    .run(taskId, userId, body.trim());
  const row = db.prepare(`${SELECT} WHERE c.id = ?`).get(Number(result.lastInsertRowid));
  return rowToComment(row);
}

export function deleteComment(commentId: number, userId: number, isBoardOwner: boolean): boolean {
  const db = getDb();
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as
    | { id: number; userId: number }
    | undefined;
  if (!comment) return false;
  if (comment.userId !== userId && !isBoardOwner) return false;
  db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
  return true;
}
