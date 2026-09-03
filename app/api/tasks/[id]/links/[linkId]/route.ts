import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getTaskById } from '@/lib/tasks';
import { deleteLink, getLinksForTask } from '@/lib/links';

export const DELETE = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id, linkId } = await ctx.params;
  const user = await requireUser();
  const task = await getTaskById(id);
  if (!task) throw new ApiError(404, 'Task not found');
  requireBoardMember(task.boardId, user);

  const links = getLinksForTask(id);
  const link = links.find(l => l.id === Number(linkId));
  if (!link) throw new ApiError(404, 'Link not found');

  deleteLink(Number(linkId));
  return NextResponse.json({ success: true });
});
