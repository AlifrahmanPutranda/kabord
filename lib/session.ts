import { cookies } from 'next/headers';
import { signSession, verifySession } from './crypto';
import { getDb } from './db';
import type { User } from './auth';

const COOKIE_NAME = 'kabord_session';
const LEGACY_COOKIES = ['userId', 'username', 'role'];

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySession(token);
  if (!payload) return null;

  // Identity comes from the DB, not the cookie — role changes and user
  // deletion take effect immediately.
  const db = getDb();
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(payload.uid) as
    | { id: number; username: string; role: string }
    | undefined;
  if (!user) return null;

  return { id: user.id, username: user.username, role: user.role };
}

export async function setUserCookie(user: User): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signSession(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  for (const name of LEGACY_COOKIES) {
    cookieStore.delete(name);
  }
}

export async function clearUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  for (const name of LEGACY_COOKIES) {
    cookieStore.delete(name);
  }
}
