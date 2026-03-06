import { getDb } from './db';
import { addBoardMember } from './board-members';

export interface Invitation {
  id: number;
  boardId: string;
  boardName: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

// Get all pending invitations for a user
export function getUserInvitations(userId: number): Invitation[] {
  const db = getDb();

  const invitations = db.prepare(`
    SELECT
      bi.id,
      bi.boardId,
      b.name as boardName,
      u.username as invitedBy,
      bi.status,
      bi.createdAt,
      bi.respondedAt
    FROM board_invitations bi
    INNER JOIN boards b ON bi.boardId = b.id
    INNER JOIN users u ON bi.invitedByUserId = u.id
    WHERE bi.invitedUserId = ? AND bi.status = 'pending'
    ORDER BY bi.createdAt DESC
  `).all(userId) as Invitation[];

  return invitations;
}

// Get invitation by ID
export function getInvitationById(invitationId: number): (Invitation & { invitedUserId: number }) | null {
  const db = getDb();

  const invitation = db.prepare(`
    SELECT
      bi.id,
      bi.boardId,
      bi.invitedUserId,
      b.name as boardName,
      u.username as invitedBy,
      bi.status,
      bi.createdAt,
      bi.respondedAt
    FROM board_invitations bi
    INNER JOIN boards b ON bi.boardId = b.id
    INNER JOIN users u ON bi.invitedByUserId = u.id
    WHERE bi.id = ?
  `).get(invitationId) as (Invitation & { invitedUserId: number }) | undefined;

  return invitation || null;
}

// Accept an invitation
export function acceptInvitation(
  invitationId: number,
  userId: number
): { success: boolean; error?: string; boardId?: string } {
  const db = getDb();

  // Get the invitation
  const invitation = db.prepare(`
    SELECT * FROM board_invitations WHERE id = ? AND invitedUserId = ? AND status = 'pending'
  `).get(invitationId, userId) as { boardId: string } | undefined;

  if (!invitation) {
    return { success: false, error: 'Invitation not found or already processed' };
  }

  // Update invitation status
  db.prepare(`
    UPDATE board_invitations
    SET status = 'accepted', respondedAt = datetime('now')
    WHERE id = ?
  `).run(invitationId);

  // Add user as board member
  const added = addBoardMember(invitation.boardId, userId, 'member');

  if (!added) {
    return { success: false, error: 'Failed to add you as a board member' };
  }

  return { success: true, boardId: invitation.boardId };
}

// Reject an invitation
export function rejectInvitation(
  invitationId: number,
  userId: number
): { success: boolean; error?: string } {
  const db = getDb();

  // Get the invitation
  const invitation = db.prepare(`
    SELECT * FROM board_invitations WHERE id = ? AND invitedUserId = ? AND status = 'pending'
  `).get(invitationId, userId);

  if (!invitation) {
    return { success: false, error: 'Invitation not found or already processed' };
  }

  // Update invitation status
  db.prepare(`
    UPDATE board_invitations
    SET status = 'rejected', respondedAt = datetime('now')
    WHERE id = ?
  `).run(invitationId);

  return { success: true };
}

// Get pending invitation count for a user
export function getPendingInvitationCount(userId: number): number {
  const db = getDb();

  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM board_invitations
    WHERE invitedUserId = ? AND status = 'pending'
  `).get(userId) as { count: number };

  return result.count;
}
