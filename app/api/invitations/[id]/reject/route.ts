import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, type RouteCtx } from '@/lib/api-auth';
import { rejectInvitation } from '@/lib/invitations';

async function handle(req: NextRequest, ctx: RouteCtx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const result = rejectInvitation(Number(id), user.id);
  if (!result.success) throw new ApiError(400, result.error || 'Failed to reject invitation');
  return NextResponse.json({ success: true });
}

export const POST = withApi(handle);
export const PUT = withApi(handle);
