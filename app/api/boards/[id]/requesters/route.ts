import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { isBoardMember } from '@/lib/boards';
import { getBoardRequesters, createRequester } from '@/lib/board-settings';

// GET /api/boards/[id]/requesters - Get board requesters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const requesters = getBoardRequesters(id);
    return NextResponse.json({ requesters });
  } catch (error) {
    console.error('Error fetching requesters:', error);
    return NextResponse.json({ error: 'Failed to fetch requesters' }, { status: 500 });
  }
}

// POST /api/boards/[id]/requesters - Create requester
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Requester name is required' }, { status: 400 });
    }

    const requester = createRequester(id, name.trim());

    if (!requester) {
      return NextResponse.json({ error: 'Failed to create requester' }, { status: 500 });
    }

    return NextResponse.json({ requester }, { status: 201 });
  } catch (error) {
    console.error('Error creating requester:', error);
    return NextResponse.json({ error: 'Failed to create requester' }, { status: 500 });
  }
}
