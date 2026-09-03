import { NextRequest, NextResponse } from 'next/server';
import { withApi, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getBoardMembers } from '@/lib/boards';

export const GET = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);
  return NextResponse.json({ members: getBoardMembers(id) });
});
