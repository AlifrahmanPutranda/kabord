import { cookies } from 'next/headers';
import { User } from './auth';

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const username = cookieStore.get('username')?.value;
  const role = cookieStore.get('role')?.value;

  if (!userId || !username || !role) return null;

  return { id: parseInt(userId), username, role };
}

export async function setUserCookie(user: User) {
  const cookieStore = await cookies();
  cookieStore.set('userId', user.id.toString(), { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
  cookieStore.set('username', user.username, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
  cookieStore.set('role', user.role, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export async function clearUserCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  cookieStore.delete('username');
  cookieStore.delete('role');
}