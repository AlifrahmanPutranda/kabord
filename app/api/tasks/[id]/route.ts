import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, deleteTask, archiveTask, moveTask } from '@/lib/tasks';
import { withApi, ApiError, requireUser, requireBoardMember, requireBoardOwner, type RouteCtx } from '@/lib/api-auth';

// Load a task and verify the caller is a member of its board.
async function requireTask(id: string) {
  const user = await requireUser();
  const task = await getTaskById(id);
  if (!task) throw new ApiError(404, 'Task not found');
  requireBoardMember(task.boardId, user);
  return { user, task };
}

export const GET = withApi(async (_request: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const { task } = await requireTask(id);
  return NextResponse.json({ task });
});

export const PUT = withApi(async (request: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const { user, task: existing } = await requireTask(id);

  const data = await request.json();

  // Handle archive separately
  if (data.archived === true && data.status === 'archived') {
    await archiveTask(id, user.id);
    const task = await getTaskById(id);
    return NextResponse.json({ task });
  }

  // id/boardId are never client-writable.
  delete data.id;
  delete data.boardId;

  // Column move (drag & drop): columnId + optional target index.
  const columnId = data.columnId !== undefined ? data.columnId : null;
  const position = data.position !== undefined ? Number(data.position) : null;
  delete data.columnId;
  delete data.position;
  delete data.status; // status changes only via columnId moves

  let moved = null;
  if (columnId !== null && (columnId !== existing.status || position !== null)) {
    const result = await moveTask(id, String(columnId), position ?? 0, user.id);
    if (result.error) throw new ApiError(400, result.error);
    if (result.task) moved = result.task;
  }

  const hasOtherUpdates = Object.keys(data).length > 0;
  if (!hasOtherUpdates) {
    const task = moved || (await getTaskById(id));
    return NextResponse.json({ task });
  }

  const task = await updateTask(id, data, user.id);
  if (!task) throw new ApiError(404, 'Task not found');
  return NextResponse.json({ task });
});

export const DELETE = withApi(async (_request: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const { task, user } = await requireTask(id);

  // Only the board owner can permanently delete tasks.
  requireBoardOwner(task.boardId, user);

  await deleteTask(id);
  return NextResponse.json({ success: true });
});
