import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, requireBoardOwner, type RouteCtx } from '@/lib/api-auth';
import { updateColumn, deleteColumn, getColumnById } from '@/lib/columns';

export const PATCH = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id, colId } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const column = getColumnById(colId);
  if (!column || column.boardId !== id) throw new ApiError(404, 'Column not found');

  const body = await req.json();
  const wipLimit =
    body.wipLimit === null || body.wipLimit === undefined || body.wipLimit === ''
      ? undefined
      : Number(body.wipLimit);
  if (wipLimit !== undefined && (!Number.isInteger(wipLimit) || wipLimit < 1)) {
    throw new ApiError(400, 'WIP limit must be a positive integer or empty');
  }

  const updated = updateColumn(colId, {
    ...(body.name !== undefined ? { name: String(body.name) } : {}),
    ...(wipLimit !== undefined ? { wipLimit } : {}),
    ...(body.isDone !== undefined ? { isDone: !!body.isDone } : {}),
  });
  return NextResponse.json({ column: updated });
});

export const DELETE = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id, colId } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);
  requireBoardOwner(id, user);

  const column = getColumnById(colId);
  if (!column || column.boardId !== id) throw new ApiError(404, 'Column not found');

  let moveToColumnId: string | undefined;
  try {
    const body = await req.json();
    moveToColumnId = body?.moveToColumnId;
  } catch {
    // Empty body is fine when the column has no tasks.
  }

  const result = deleteColumn(colId, moveToColumnId);
  if (!result.ok) throw new ApiError(400, result.error || 'Failed to delete column');
  return NextResponse.json({ success: true });
});
