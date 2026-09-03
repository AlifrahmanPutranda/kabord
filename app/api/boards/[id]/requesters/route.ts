import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getBoardRequesters, createRequester } from '@/lib/board-settings';

export const GET = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);
  return NextResponse.json({ requesters: getBoardRequesters(id) });
});

export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const body = await req.json();
  const name = String(body?.name || '').trim();
  if (!name) throw new ApiError(400, 'Requester name is required');

  const requester = createRequester(id, name);
  if (!requester) throw new ApiError(400, 'Requester already exists');
  return NextResponse.json({ requester }, { status: 201 });
});
