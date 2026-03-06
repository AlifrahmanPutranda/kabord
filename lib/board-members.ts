import { getDb } from './db';
import { getBoardByIdInternal, isBoardOwner } from './boards';

export interface BoardMember {
  id: number;
  boardId: string;
  userId: number;
  username: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

// Get all members of a board
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

// Get members for assignee dropdown (returns usernames)
export function getBoardMembersForAssignee(boardId: string): { username: string; userId: number }[] {
  const db = getDb();

  const members = db.prepare(`
    SELECT u.username, u.id as userId
    FROM board_members bm
    INNER JOIN users u ON bm.userId = u.id
    WHERE bm.boardId = ?
    ORDER BY u.username ASC
  `).all(boardId) as { username: string; userId: number }[];

  return members;
}

// Invite a user to a board by username
export function inviteMember(
  boardId: string,
  invitedUsername: string,
  invitedByUserId: number
): { success: boolean; error?: string; invitationId?: number } {
  const db = getDb();

  // Check if board exists
  const board = getBoardByIdInternal(boardId);
  if (!board) {
    return { success: false, error: 'Board not found' };
  }

  // Check if inviter is the owner
  if (!isBoardOwner(boardId, invitedByUserId)) {
    return { success: false, error: 'Only the board owner can invite members' };
  }

  // Find the user to invite
  const invitedUser = db.prepare(`
    SELECT id FROM users WHERE username = ?
  `).get(invitedUsername) as { id: number } | undefined;

  if (!invitedUser) {
    return { success: false, error: 'User not found' };
  }

  // Check if user is already a member
  const existingMember = db.prepare(`
    SELECT id FROM board_members WHERE boardId = ? AND userId = ?
  `).get(boardId, invitedUser.id);

  if (existingMember) {
    return { success: false, error: 'User is already a member of this board' };
  }

  // Check if there's a pending invitation
  const existingInvitation = db.prepare(`
    SELECT id FROM board_invitations
    WHERE boardId = ? AND invitedUserId = ? AND status = 'pending'
  `).get(boardId, invitedUser.id);

  if (existingInvitation) {
    return { success: false, error: 'User already has a pending invitation' };
  }

  // Create invitation
  const result = db.prepare(`
    INSERT INTO board_invitations (boardId, invitedUserId, invitedByUserId, status, createdAt)
    VALUES (?, ?, ?, 'pending', datetime('now'))
  `).run(boardId, invitedUser.id, invitedByUserId);

  return { success: true, invitationId: result.lastInsertRowid as number };
}

// Remove a member from a board (owner only)
export function removeMember(
  boardId: string,
  memberId: number,
  requesterId: number
): { success: boolean; error?: string } {
  const db = getDb();

  // Check if requester is the owner
  if (!isBoardOwner(boardId, requesterId)) {
    return { success: false, error: 'Only the board owner can remove members' };
  }

  // Get the member to check if they're the owner
  const member = db.prepare(`
    SELECT bm.role, b.ownerId
    FROM board_members bm
    INNER JOIN boards b ON bm.boardId = b.id
    WHERE bm.boardId = ? AND bm.userId = ?
  `).get(boardId, memberId) as { role: string; ownerId: number } | undefined;

  if (!member) {
    return { success: false, error: 'Member not found' };
  }

  // Can't remove the owner
  if (member.role === 'owner') {
    return { success: false, error: 'Cannot remove the board owner' };
  }

  // Remove the member
  db.prepare(`
    DELETE FROM board_members WHERE boardId = ? AND userId = ?
  `).run(boardId, memberId);

  return { success: true };
}

// Leave a board (for members, not owners)
export function leaveBoard(
  boardId: string,
  userId: number
): { success: boolean; error?: string } {
  const db = getDb();

  // Check if user is the owner
  if (isBoardOwner(boardId, userId)) {
    return { success: false, error: 'Board owner cannot leave the board. Transfer ownership or delete the board instead.' };
  }

  // Remove the user from board members
  const result = db.prepare(`
    DELETE FROM board_members WHERE boardId = ? AND userId = ?
  `).run(boardId, userId);

  if (result.changes === 0) {
    return { success: false, error: 'You are not a member of this board' };
  }

  return { success: true };
}

// Add user as member directly (used when accepting invitation)
export function addBoardMember(
  boardId: string,
  userId: number,
  role: 'owner' | 'member' = 'member'
): boolean {
  const db = getDb();

  try {
    db.prepare(`
      INSERT INTO board_members (boardId, userId, role, joinedAt)
      VALUES (?, ?, ?, datetime('now'))
    `).run(boardId, userId, role);
    return true;
  } catch (e) {
    return false;
  }
}
