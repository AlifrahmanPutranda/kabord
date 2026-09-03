import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardOwner, type RouteCtx } from '@/lib/api-auth';
import { inviteMember } from '@/lib/board-members';

export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardOwner(id, user);

  const body = await req.json();
  const username = String(body?.username || '').trim();
  if (!username) throw new ApiError(400, 'Username is required');

  const result = inviteMember(id, username, user.id);
  if (!result.success) throw new ApiError(400, result.error || 'Failed to invite');
  return NextResponse.json({ success: true, invitationId: result.invitationId });
});
