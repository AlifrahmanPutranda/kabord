import { NextRequest, NextResponse } from 'next/server';
import { withApi, requireUser, ApiError } from '@/lib/api-auth';
import { getUserPreferences, setUserPreferences } from '@/lib/prefs';

export const GET = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json({ prefs: getUserPreferences(user.id) });
});

export const PUT = withApi(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json();

  if (body.theme !== undefined && body.theme !== 'dark' && body.theme !== 'light') {
    throw new ApiError(400, 'theme must be dark or light');
  }
  if (body.aiModel !== undefined && body.aiModel !== null && typeof body.aiModel !== 'string') {
    throw new ApiError(400, 'aiModel must be a string');
  }

  const prefs = setUserPreferences(user.id, {
    ...(body.theme !== undefined ? { theme: body.theme } : {}),
    ...(body.aiModel !== undefined ? { aiModel: body.aiModel } : {}),
  });
  return NextResponse.json({ prefs });
});
