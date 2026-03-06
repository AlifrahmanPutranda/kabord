import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import { setUserCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const user = await verifyUser(username, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await setUserCookie(user);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}