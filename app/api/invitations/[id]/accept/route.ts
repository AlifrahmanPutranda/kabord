import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, type RouteCtx } from '@/lib/api-auth';
import { acceptInvitation } from '@/lib/invitations';

async function handle(req: NextRequest, ctx: RouteCtx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const result = acceptInvitation(Number(id), user.id);
  if (!result.success) throw new ApiError(400, result.error || 'Failed to accept invitation');
  return NextResponse.json({ success: true, boardId: result.boardId });
}

export const POST = withApi(handle);
export const PUT = withApi(handle);
