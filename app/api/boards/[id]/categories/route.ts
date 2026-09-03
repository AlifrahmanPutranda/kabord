import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getBoardCategories, createCategory } from '@/lib/board-settings';

export const GET = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);
  return NextResponse.json({ categories: getBoardCategories(id) });
});

export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const body = await req.json();
  const name = String(body?.name || '').trim();
  if (!name) throw new ApiError(400, 'Label name is required');

  try {
    const category = createCategory(id, name, String(body?.color || '#64748b'));
    return NextResponse.json({ category }, { status: 201 });
  } catch (e) {
    throw new ApiError(400, 'Label already exists');
  }
});
