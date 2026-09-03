import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withApi, requireUser, ApiError } from '@/lib/api-auth';
import { getDb } from '@/lib/db';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const PUT = withApi(async (req: NextRequest) => {
  const user = await requireUser();
  const rl = rateLimit(`pwchange:${user.id}`, RATE_LIMITS.auth.limit, RATE_LIMITS.auth.windowMs);
  if (!rl.ok) throw new ApiError(429, `Too many attempts — retry in ${rl.retryAfterSec}s`);

  const { currentPassword, newPassword } = await req.json();
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    throw new ApiError(400, 'currentPassword and newPassword are required');
  }

  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (newPassword.length < 8 || !hasUpper || !hasLower || !hasNumber) {
    throw new ApiError(400, 'New password must be 8+ chars with uppercase, lowercase and number');
  }

  const db = getDb();
  const row = db.prepare('SELECT password FROM users WHERE id = ?').get(user.id) as { password: string };
  if (!bcrypt.compareSync(currentPassword, row.password)) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), user.id);
  return NextResponse.json({ success: true });
});
