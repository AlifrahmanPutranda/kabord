import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getTaskById } from '@/lib/tasks';
import { getSubtasksForTask, createSubtask } from '@/lib/subtasks';

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
  return NextResponse.json({ subtasks: getSubtasksForTask(id) });
});

export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  await requireTaskMember(id);

  const body = await req.json();
  if (!body.title || !String(body.title).trim()) throw new ApiError(400, 'Subtask title is required');

  const subtask = createSubtask(id, String(body.title));
  return NextResponse.json({ subtask }, { status: 201 });
});
