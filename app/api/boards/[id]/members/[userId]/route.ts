import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardOwner, type RouteCtx } from '@/lib/api-auth';
import { removeMember } from '@/lib/board-members';
import { getDb } from '@/lib/db';

// DELETE /api/boards/[id]/members/[userId] — owner removes a member.
export const DELETE = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id, userId } = await ctx.params;
  const user = await requireUser();
  requireBoardOwner(id, user);

  // resolve the board_members row for this user on this board
  const db = getDb();
  const member = db
    .prepare('SELECT id FROM board_members WHERE boardId = ? AND userId = ?')
    .get(id, Number(userId)) as { id: number } | undefined;
  if (!member) throw new ApiError(404, 'Member not found');

  const result = removeMember(id, member.id, user.id);
  if (!result.success) throw new ApiError(400, result.error || 'Failed to remove member');
  return NextResponse.json({ success: true });
});
