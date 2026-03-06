import { getDb } from './db';

export interface Board {
  id: string;
  name: string;
  description: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardWithMembership extends Board {
  role: 'owner' | 'member';
  memberCount: number;
  taskCount: number;
}

export interface BoardMember {
  id: number;
  boardId: string;
  userId: number;
  username: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

// Generate unique board ID
function generateBoardId(): string {
  return `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all boards that a user has access to (owned + shared)
export function getUserBoards(userId: number): BoardWithMembership[] {
  const db = getDb();

  const boards = db.prepare(`
    SELECT
      b.*,
      bm.role,
      (SELECT COUNT(*) FROM board_members WHERE boardId = b.id) as memberCount,
      (SELECT COUNT(*) FROM tasks WHERE boardId = b.id AND archived = 0) as taskCount
    FROM boards b
    INNER JOIN board_members bm ON b.id = bm.boardId
    WHERE bm.userId = ?
    ORDER BY b.updatedAt DESC
  `).all(userId) as BoardWithMembership[];

  return boards;
}

// Get a single board by ID (only if user is a member)
export function getBoardById(boardId: string, userId: number): Board | null {
  const db = getDb();

  const board = db.prepare(`
    SELECT b.*
    FROM boards b
    INNER JOIN board_members bm ON b.id = bm.boardId
    WHERE b.id = ? AND bm.userId = ?
  `).get(boardId, userId) as Board | undefined;

  return board || null;
}

// Get board info without membership check (for internal use)
export function getBoardByIdInternal(boardId: string): Board | null {
  const db = getDb();

  const board = db.prepare(`
    SELECT * FROM boards WHERE id = ?
  `).get(boardId) as Board | undefined;

  return board || null;
}

// Create a new board
export function createBoard(data: { name: string; description?: string }, ownerId: number): Board {
  const db = getDb();
  const boardId = generateBoardId();

  // Create the board
  db.prepare(`
    INSERT INTO boards (id, name, description, ownerId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(boardId, data.name, data.description || '', ownerId);

  // Add owner as a member with 'owner' role
  db.prepare(`
    INSERT INTO board_members (boardId, userId, role, joinedAt)
    VALUES (?, ?, 'owner', datetime('now'))
  `).run(boardId, ownerId);

  // Create default categories
  const defaultCategories = ['System', 'Infrastructure', 'HR', 'Access', 'Finance', 'Marketing', 'CRM', 'Estate', 'Other'];
  defaultCategories.forEach((name, index) => {
    db.prepare(`
      INSERT INTO board_categories (boardId, name, position, createdAt)
      VALUES (?, ?, ?, datetime('now'))
    `).run(boardId, name, index);
  });

  // Create default requesters
  const defaultRequesters = ['Pak Fiki', 'Pak Vic', 'Pak Victor', 'HR', 'Finance', 'Marketing', 'CRM Team', 'Estate', 'Other'];
  defaultRequesters.forEach((name, index) => {
    db.prepare(`
      INSERT INTO board_requesters (boardId, name, position, createdAt)
      VALUES (?, ?, ?, datetime('now'))
    `).run(boardId, name, index);
  });

  return getBoardByIdInternal(boardId)!;
}

// Update board (name, description)
export function updateBoard(boardId: string, data: { name?: string; description?: string }, userId: number): Board | null {
  const db = getDb();

  // Check if user is a member
  const board = getBoardById(boardId, userId);
  if (!board) return null;

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }

  if (updates.length === 0) return board;

  updates.push("updatedAt = datetime('now')");
  values.push(boardId);

  db.prepare(`
    UPDATE boards SET ${updates.join(', ')} WHERE id = ?
  `).run(...values);

  return getBoardByIdInternal(boardId);
}

// Delete board (owner only)
export function deleteBoard(boardId: string, userId: number): { success: boolean; error?: string } {
  const db = getDb();

  // Check if user is the owner
  const board = db.prepare(`
    SELECT * FROM boards WHERE id = ? AND ownerId = ?
  `).get(boardId, userId) as Board | undefined;

  if (!board) {
    return { success: false, error: 'Board not found or you are not the owner' };
  }

  // Delete board (cascade will handle members, invitations, categories, requesters, tasks)
  db.prepare('DELETE FROM boards WHERE id = ?').run(boardId);

  return { success: true };
}

// Get board members
export function getBoardMembers(boardId: string): BoardMember[] {
  const db = getDb();

  const members = db.prepare(`
    SELECT bm.*, u.username
    FROM board_members bm
    INNER JOIN users u ON bm.userId = u.id
    WHERE bm.boardId = ?
    ORDER BY bm.role DESC, bm.joinedAt ASC
  `).all(boardId) as BoardMember[];

  return members;
}

// Check if user is a board member
export function isBoardMember(boardId: string, userId: number): boolean {
  const db = getDb();

  const member = db.prepare(`
    SELECT id FROM board_members WHERE boardId = ? AND userId = ?
  `).get(boardId, userId);

  return !!member;
}

// Check if user is the board owner
export function isBoardOwner(boardId: string, userId: number): boolean {
  const db = getDb();

  const board = db.prepare(`
    SELECT id FROM boards WHERE id = ? AND ownerId = ?
  `).get(boardId, userId);

  return !!board;
}

// Get user's role in a board
export function getBoardRole(boardId: string, userId: number): 'owner' | 'member' | null {
  const db = getDb();

  const member = db.prepare(`
    SELECT role FROM board_members WHERE boardId = ? AND userId = ?
  `).get(boardId, userId) as { role: string } | undefined;

  return member?.role as 'owner' | 'member' | null;
}

// Update board's updatedAt timestamp
export function touchBoard(boardId: string): void {
  const db = getDb();
  db.prepare(`UPDATE boards SET updatedAt = datetime('now') WHERE id = ?`).run(boardId);
}
