import { NextRequest, NextResponse } from 'next/server';
import { createUser, verifyUser } from '@/lib/auth';
import { setUserCookie } from '@/lib/session';
import { withApi, ApiError } from '@/lib/api-auth';
import { rateLimit, clientIp, RATE_LIMITS } from '@/lib/rate-limit';

export const POST = withApi(async (request: NextRequest) => {
  const rl = rateLimit(`register:${clientIp(request)}`, RATE_LIMITS.auth.limit, RATE_LIMITS.auth.windowMs);
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

  const result = await createUser(username, password);
  if (!result.success) {
    throw new ApiError(400, result.error || 'Registration failed');
  }

  // Auto-login after successful registration.
  const user = await verifyUser(username, password);
  if (user) await setUserCookie(user);

  return NextResponse.json({ success: true, user });
});
