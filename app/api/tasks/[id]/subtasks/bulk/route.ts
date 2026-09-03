import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getTaskById } from '@/lib/tasks';
import { createSubtasks } from '@/lib/subtasks';

export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const task = await getTaskById(id);
  if (!task) throw new ApiError(404, 'Task not found');
  requireBoardMember(task.boardId, user);

  const body = await req.json();
  if (!Array.isArray(body.titles) || body.titles.length === 0 || body.titles.length > 30) {
    throw new ApiError(400, 'titles must be a non-empty array (max 30)');
  }

  const subtasks = createSubtasks(id, body.titles.map(String));
  return NextResponse.json({ subtasks }, { status: 201 });
});
