import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getUserPreferences } from '@/lib/prefs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user, prefs: getUserPreferences(user.id) });
}
