import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getBoardMembers, isBoardMember } from '@/lib/boards';

// GET /api/boards/[id]/members - List board members
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

    // Check if user is a member of the board
    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const members = getBoardMembers(id);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching board members:', error);
    return NextResponse.json({ error: 'Failed to fetch board members' }, { status: 500 });
  }
}
