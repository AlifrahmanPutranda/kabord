import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getTaskById } from '@/lib/tasks';
import { getBoardRole } from '@/lib/boards';
import { deleteComment } from '@/lib/comments';

export const DELETE = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id, cid } = await ctx.params;
  const user = await requireUser();
  const task = await getTaskById(id);
  if (!task) throw new ApiError(404, 'Task not found');
  requireBoardMember(task.boardId, user);

  const isOwner = getBoardRole(task.boardId, user.id) === 'owner';
  const ok = deleteComment(Number(cid), user.id, isOwner);
  if (!ok) throw new ApiError(403, 'You can only delete your own comments');
  return NextResponse.json({ success: true });
});
