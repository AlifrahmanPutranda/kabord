import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { updateCategory, deleteCategory } from '@/lib/board-settings';

export const PUT = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id, catId } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const body = await req.json();
  if (body.name !== undefined && !String(body.name).trim()) throw new ApiError(400, 'Label name cannot be empty');

  const category = updateCategory(Number(catId), { name: body.name, color: body.color }, id);
  if (!category) throw new ApiError(404, 'Label not found');
  return NextResponse.json({ category });
});

export const DELETE = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id, catId } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const ok = deleteCategory(Number(catId), id);
  if (!ok) throw new ApiError(404, 'Label not found');
  return NextResponse.json({ success: true });
});
