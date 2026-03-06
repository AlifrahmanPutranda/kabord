import { isBoardMember, isBoardOwner, getBoardRole } from './boards';

// Check if user can view a board
export async function canViewBoard(boardId: string, userId: number): Promise<boolean> {
  return isBoardMember(boardId, userId);
}

// Check if user can edit board info (all members can)
export async function canEditBoard(boardId: string, userId: number): Promise<boolean> {
  return isBoardMember(boardId, userId);
}

// Check if user can delete a board (owner only)
export async function canDeleteBoard(boardId: string, userId: number): Promise<boolean> {
  return isBoardOwner(boardId, userId);
}

// Check if user can delete a task (owner only)
export async function canDeleteTask(boardId: string, userId: number): Promise<boolean> {
  return isBoardOwner(boardId, userId);
}

// Check if user can invite members (owner only)
export async function canInviteMembers(boardId: string, userId: number): Promise<boolean> {
  return isBoardOwner(boardId, userId);
}

// Check if user can manage board settings (all members can)
export async function canManageSettings(boardId: string, userId: number): Promise<boolean> {
  return isBoardMember(boardId, userId);
}

// Check if user can create tasks (all members can)
export async function canCreateTask(boardId: string, userId: number): Promise<boolean> {
  return isBoardMember(boardId, userId);
}

// Check if user can update tasks (all members can)
export async function canUpdateTask(boardId: string, userId: number): Promise<boolean> {
  return isBoardMember(boardId, userId);
}

// Get user's permission level for a board
export async function getPermissionLevel(boardId: string, userId: number): Promise<'owner' | 'member' | 'none'> {
  const role = getBoardRole(boardId, userId);
  if (!role) return 'none';
  return role;
}

// Check if user can remove a member (owner only)
export async function canRemoveMember(boardId: string, userId: number): Promise<boolean> {
  return isBoardOwner(boardId, userId);
}
