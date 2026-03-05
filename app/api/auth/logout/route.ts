import { NextResponse } from 'next/server';
import { clearUserCookie } from '@/lib/session';

export async function POST() {
  await clearUserCookie();
  return NextResponse.json({ success: true });
}