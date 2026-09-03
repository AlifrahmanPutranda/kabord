import { NextResponse } from 'next/server';
import { clearUserCookie } from '@/lib/session';
import { withApi } from '@/lib/api-auth';

export const POST = withApi(async () => {
  await clearUserCookie();
  return NextResponse.json({ success: true });
});
