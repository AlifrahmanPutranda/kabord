import crypto from 'crypto';
import { getDb } from './db';

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  wipLimit: number | null;
  isDone: boolean;
}

export interface BoardColumnWithCount extends BoardColumn {
  taskCount: number;
}

export const DEFAULT_COLUMNS: Array<{ name: string; isDone: boolean }> = [
  { name: 'To Do', isDone: false },
  { name: 'In Progress', isDone: false },
  { name: 'Review', isDone: false },
  { name: 'Done', isDone: true },
];

export function generateColumnId(): string {
  return `col-${crypto.randomBytes(6).toString('hex')}`;
}

function rowToColumn(row: any): BoardColumn {
  return {
    id: row.id,
    boardId: row.boardId,
    name: row.name,
    position: row.position,
    wipLimit: row.wipLimit ?? null,
    isDone: row.isDone === 1,
  };
}

export function getBoardColumns(boardId: string): BoardColumn[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM board_columns WHERE boardId = ? ORDER BY position ASC, createdAt ASC')
    .all(boardId) as any[];
  return rows.map(rowToColumn);
}

export function getBoardColumnsWithCounts(boardId: string): BoardColumnWithCount[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT bc.*, (SELECT COUNT(*) FROM tasks t WHERE t.status = bc.id AND t.archived = 0) AS taskCount
       FROM board_columns bc WHERE bc.boardId = ?
       ORDER BY bc.position ASC, bc.createdAt ASC`
    )
    .all(boardId) as any[];
  return rows.map(row => ({ ...rowToColumn(row), taskCount: row.taskCount }));
}

export function getColumnById(columnId: string): BoardColumn | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM board_columns WHERE id = ?').get(columnId);
  return row ? rowToColumn(row) : null;
}

export function isColumnOfBoard(columnId: string, boardId: string): boolean {
  const col = getColumnById(columnId);
  return col?.boardId === boardId;
}

// Seed the 4 default columns for a board that has none.
export function seedDefaultColumns(boardId: string): void {
  const db = getDb();
  const existing = db.prepare('SELECT COUNT(*) AS n FROM board_columns WHERE boardId = ?').get(boardId) as { n: number };
  if (existing.n > 0) return;
  const insert = db.prepare(
    'INSERT INTO board_columns (id, boardId, name, position, wipLimit, isDone, createdAt) VALUES (?, ?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)'
  );
  DEFAULT_COLUMNS.forEach((col, index) => {
    insert.run(generateColumnId(), boardId, col.name, index, col.isDone ? 1 : 0);
  });
}

export function createColumn(boardId: string, data: { name: string; wipLimit?: number | null; isDone?: boolean }): BoardColumn {
  const db = getDb();
  const max = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS p FROM board_columns WHERE boardId = ?')
    .get(boardId) as { p: number };
  const id = generateColumnId();
  db.prepare(
    'INSERT INTO board_columns (id, boardId, name, position, wipLimit, isDone, createdAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
  ).run(id, boardId, data.name.trim(), max.p + 1, data.wipLimit ?? null, data.isDone ? 1 : 0);
  return getColumnById(id)!;
}

export function updateColumn(
  columnId: string,
  data: { name?: string; wipLimit?: number | null; isDone?: boolean }
): BoardColumn | null {
  const db = getDb();
  const col = getColumnById(columnId);
  if (!col) return null;

  if (data.name !== undefined) {
    db.prepare('UPDATE board_columns SET name = ? WHERE id = ?').run(data.name.trim(), columnId);
  }
  if (data.wipLimit !== undefined) {
    db.prepare('UPDATE board_columns SET wipLimit = ? WHERE id = ?').run(data.wipLimit, columnId);
  }
  if (data.isDone !== undefined) {
    db.prepare('UPDATE board_columns SET isDone = ? WHERE id = ?').run(data.isDone ? 1 : 0, columnId);
  }
  return getColumnById(columnId);
}

export function reorderColumns(boardId: string, columnIds: string[]): BoardColumn[] {
  const db = getDb();
  const current = getBoardColumns(boardId);
  if (columnIds.length !== current.length || !columnIds.every(id => current.some(c => c.id === id))) {
    throw new Error('columnIds must be a permutation of the board columns');
  }
  const update = db.prepare('UPDATE board_columns SET position = ? WHERE id = ?');
  db.transaction(() => {
    columnIds.forEach((id, index) => update.run(index, id));
  })();
  return getBoardColumns(boardId);
}

// Delete a column. If it holds tasks, they are moved to moveToColumnId first.
// The last remaining column cannot be deleted.
export function deleteColumn(columnId: string, moveToColumnId?: string): { ok: boolean; error?: string } {
  const db = getDb();
  const col = getColumnById(columnId);
  if (!col) return { ok: false, error: 'Column not found' };

  const columns = getBoardColumns(col.boardId);
  if (columns.length <= 1) return { ok: false, error: 'Cannot delete the last column of a board' };

  const taskCount = db
    .prepare('SELECT COUNT(*) AS n FROM tasks WHERE status = ? AND archived = 0')
    .get(columnId) as { n: number };

  if (taskCount.n > 0) {
    const target = moveToColumnId ? columns.find(c => c.id === moveToColumnId && c.id !== columnId) : undefined;
    if (!target) return { ok: false, error: 'Column still has tasks — choose a column to move them to' };
    // Move to the end of the target column, preserving relative order.
    db.prepare(
      `UPDATE tasks SET position = (
         SELECT COALESCE(MAX(t2.position), -1) + 1
         FROM tasks t2 WHERE t2.status = ? AND t2.archived = 0
       ) + (
         SELECT COUNT(*) FROM tasks t3
         WHERE t3.status = ? AND t3.archived = 0 AND t3.position < tasks.position
       )
       WHERE status = ? AND archived = 0`
    ).run(target.id, columnId, columnId);
  }

  db.prepare('DELETE FROM board_columns WHERE id = ?').run(columnId);
  // Keep positions dense after removal.
  const remaining = getBoardColumns(col.boardId);
  const update = db.prepare('UPDATE board_columns SET position = ? WHERE id = ?');
  db.transaction(() => {
    remaining.forEach((c, i) => update.run(i, c.id));
  })();
  return { ok: true };
}

// WIP check: how many active tasks does the column hold?
export function columnTaskCount(columnId: string): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE status = ? AND archived = 0').get(columnId) as { n: number };
  return row.n;
}
