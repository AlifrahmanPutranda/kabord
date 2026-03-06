import { getDb } from './db';

export interface BoardCategory {
  id: number;
  boardId: string;
  name: string;
  color: string;
  position: number;
}

export interface BoardRequester {
  id: number;
  boardId: string;
  name: string;
  position: number;
}

// ========================================
// CATEGORIES
// ========================================

export function getBoardCategories(boardId: string): BoardCategory[] {
  const db = getDb();

  const categories = db.prepare(`
    SELECT * FROM board_categories
    WHERE boardId = ?
    ORDER BY position ASC, createdAt ASC
  `).all(boardId) as BoardCategory[];

  return categories;
}

export function createCategory(
  boardId: string,
  name: string,
  color: string = '#64748b'
): BoardCategory | null {
  const db = getDb();

  // Get max position
  const maxPos = db.prepare(`
    SELECT COALESCE(MAX(position), -1) as maxPos FROM board_categories WHERE boardId = ?
  `).get(boardId) as { maxPos: number };

  try {
    const result = db.prepare(`
      INSERT INTO board_categories (boardId, name, color, position, createdAt)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(boardId, name, color, maxPos.maxPos + 1);

    return {
      id: result.lastInsertRowid as number,
      boardId,
      name,
      color,
      position: maxPos.maxPos + 1,
    };
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
}

export function updateCategory(
  categoryId: number,
  data: { name?: string; color?: string },
  boardId: string
): BoardCategory | null {
  const db = getDb();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    values.push(data.color);
  }

  if (updates.length === 0) return null;

  values.push(categoryId, boardId);

  try {
    db.prepare(`
      UPDATE board_categories
      SET ${updates.join(', ')}
      WHERE id = ? AND boardId = ?
    `).run(...values);

    const category = db.prepare(`
      SELECT * FROM board_categories WHERE id = ? AND boardId = ?
    `).get(categoryId, boardId) as BoardCategory | undefined;

    return category || null;
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
}

export function deleteCategory(categoryId: number, boardId: string): boolean {
  const db = getDb();

  try {
    const result = db.prepare(`
      DELETE FROM board_categories WHERE id = ? AND boardId = ?
    `).run(categoryId, boardId);

    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
}

// ========================================
// REQUESTERS
// ========================================

export function getBoardRequesters(boardId: string): BoardRequester[] {
  const db = getDb();

  const requesters = db.prepare(`
    SELECT * FROM board_requesters
    WHERE boardId = ?
    ORDER BY position ASC, createdAt ASC
  `).all(boardId) as BoardRequester[];

  return requesters;
}

export function createRequester(boardId: string, name: string): BoardRequester | null {
  const db = getDb();

  // Get max position
  const maxPos = db.prepare(`
    SELECT COALESCE(MAX(position), -1) as maxPos FROM board_requesters WHERE boardId = ?
  `).get(boardId) as { maxPos: number };

  try {
    const result = db.prepare(`
      INSERT INTO board_requesters (boardId, name, position, createdAt)
      VALUES (?, ?, ?, datetime('now'))
    `).run(boardId, name, maxPos.maxPos + 1);

    return {
      id: result.lastInsertRowid as number,
      boardId,
      name,
      position: maxPos.maxPos + 1,
    };
  } catch (error) {
    console.error('Error creating requester:', error);
    return null;
  }
}

export function updateRequester(
  requesterId: number,
  data: { name?: string },
  boardId: string
): BoardRequester | null {
  const db = getDb();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  if (updates.length === 0) return null;

  values.push(requesterId, boardId);

  try {
    db.prepare(`
      UPDATE board_requesters
      SET ${updates.join(', ')}
      WHERE id = ? AND boardId = ?
    `).run(...values);

    const requester = db.prepare(`
      SELECT * FROM board_requesters WHERE id = ? AND boardId = ?
    `).get(requesterId, boardId) as BoardRequester | undefined;

    return requester || null;
  } catch (error) {
    console.error('Error updating requester:', error);
    return null;
  }
}

export function deleteRequester(requesterId: number, boardId: string): boolean {
  const db = getDb();

  try {
    const result = db.prepare(`
      DELETE FROM board_requesters WHERE id = ? AND boardId = ?
    `).run(requesterId, boardId);

    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting requester:', error);
    return false;
  }
}
