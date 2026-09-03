import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getTaskById } from '@/lib/tasks';
import { getCommentsForTask, createComment } from '@/lib/comments';

async function requireTaskMember(taskId: string) {
  const user = await requireUser();
  const task = await getTaskById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  requireBoardMember(task.boardId, user);
  return user;
}

export const GET = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  await requireTaskMember(id);
  return NextResponse.json({ comments: getCommentsForTask(id) });
});

export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireTaskMember(id);

  const body = await req.json();
  if (!body.body || !String(body.body).trim()) throw new ApiError(400, 'Comment body is required');
  if (String(body.body).length > 4000) throw new ApiError(400, 'Comment is too long (max 4000 chars)');

  const comment = createComment(id, user.id, String(body.body));
  return NextResponse.json({ comment }, { status: 201 });
});
