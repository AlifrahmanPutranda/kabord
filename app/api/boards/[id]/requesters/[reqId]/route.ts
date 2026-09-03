import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { updateRequester, deleteRequester } from '@/lib/board-settings';

export const PUT = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id, reqId } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const body = await req.json();
  if (body.name !== undefined && !String(body.name).trim()) throw new ApiError(400, 'Requester name cannot be empty');

  const requester = updateRequester(Number(reqId), { name: body.name }, id);
  if (!requester) throw new ApiError(404, 'Requester not found');
  return NextResponse.json({ requester });
});

export const DELETE = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id, reqId } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const ok = deleteRequester(Number(reqId), id);
  if (!ok) throw new ApiError(404, 'Requester not found');
  return NextResponse.json({ success: true });
});
