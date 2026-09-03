import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser } from '@/lib/api-auth';
import { getUserBoards, createBoard } from '@/lib/boards';

export const GET = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json({ boards: getUserBoards(user.id) });
});

export const POST = withApi(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json();
  const name = String(body?.name || '').trim();
  if (!name) throw new ApiError(400, 'Board name is required');
  const board = createBoard({ name, description: String(body?.description || '').trim() }, user.id);
  return NextResponse.json({ board }, { status: 201 });
});
