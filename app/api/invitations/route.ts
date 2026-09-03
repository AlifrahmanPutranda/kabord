import { NextResponse } from 'next/server';
import { withApi, requireUser } from '@/lib/api-auth';
import { getUserInvitations } from '@/lib/invitations';

export const GET = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json({ invitations: getUserInvitations(user.id) });
});
