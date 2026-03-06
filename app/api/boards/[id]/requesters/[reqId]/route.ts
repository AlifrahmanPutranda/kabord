import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { isBoardMember } from '@/lib/boards';
import { updateRequester, deleteRequester } from '@/lib/board-settings';

// PUT /api/boards/[id]/requesters/[reqId] - Update requester
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, reqId } = await params;
    const requesterId = parseInt(reqId, 10);

    if (isNaN(requesterId)) {
      return NextResponse.json({ error: 'Invalid requester ID' }, { status: 400 });
    }

    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    const requester = updateRequester(requesterId, { name }, id);

    if (!requester) {
      return NextResponse.json({ error: 'Requester not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ requester });
  } catch (error) {
    console.error('Error updating requester:', error);
    return NextResponse.json({ error: 'Failed to update requester' }, { status: 500 });
  }
}

// DELETE /api/boards/[id]/requesters/[reqId] - Delete requester
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, reqId } = await params;
    const requesterId = parseInt(reqId, 10);

    if (isNaN(requesterId)) {
      return NextResponse.json({ error: 'Invalid requester ID' }, { status: 400 });
    }

    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const success = deleteRequester(requesterId, id);

    if (!success) {
      return NextResponse.json({ error: 'Requester not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting requester:', error);
    return NextResponse.json({ error: 'Failed to delete requester' }, { status: 500 });
  }
}
