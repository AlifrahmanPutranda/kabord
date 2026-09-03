import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getTaskById } from '@/lib/tasks';
import { updateSubtask, deleteSubtask } from '@/lib/subtasks';

async function requireTaskMember(taskId: string) {
  const user = await requireUser();
  const task = await getTaskById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  requireBoardMember(task.boardId, user);
}

export const PATCH = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id, subId } = await ctx.params;
  await requireTaskMember(id);

  const body = await req.json();
  const subtask = updateSubtask(id, Number(subId), {
    ...(body.title !== undefined ? { title: String(body.title) } : {}),
    ...(body.done !== undefined ? { done: !!body.done } : {}),
    ...(body.position !== undefined ? { position: Number(body.position) } : {}),
  });
  if (!subtask) throw new ApiError(404, 'Subtask not found');
  return NextResponse.json({ subtask });
});

export const DELETE = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id, subId } = await ctx.params;
  await requireTaskMember(id);

  const ok = deleteSubtask(id, Number(subId));
  if (!ok) throw new ApiError(404, 'Subtask not found');
  return NextResponse.json({ success: true });
});
