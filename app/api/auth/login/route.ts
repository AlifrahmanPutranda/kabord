import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import { setUserCookie } from '@/lib/session';
import { withApi, ApiError } from '@/lib/api-auth';
import { rateLimit, clientIp, RATE_LIMITS } from '@/lib/rate-limit';

export const POST = withApi(async (request: NextRequest) => {
  const rl = rateLimit(`login:${clientIp(request)}`, RATE_LIMITS.auth.limit, RATE_LIMITS.auth.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSec}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  const { username, password } = await request.json();
  if (!username || !password) {
    throw new ApiError(400, 'Username and password required');
  }

  const user = await verifyUser(username, password);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  await setUserCookie(user);
  return NextResponse.json({ user });
});
