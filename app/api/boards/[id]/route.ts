import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, requireBoardOwner, type RouteCtx } from '@/lib/api-auth';
import { getBoardById, updateBoard, deleteBoard } from '@/lib/boards';

export const GET = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const board = getBoardById(id, user.id);
  if (!board) throw new ApiError(404, 'Board not found');
  return NextResponse.json({ board });
});

export const PUT = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const body = await req.json();
  if (body.name !== undefined && !String(body.name).trim()) throw new ApiError(400, 'Board name cannot be empty');

  const board = updateBoard(id, { name: body.name, description: body.description }, user.id);
  if (!board) throw new ApiError(404, 'Board not found');
  return NextResponse.json({ board });
});

export const DELETE = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardOwner(id, user);

  const result = deleteBoard(id, user.id);
  if (!result.success) throw new ApiError(403, result.error || 'Failed to delete board');
  return NextResponse.json({ success: true });
});
