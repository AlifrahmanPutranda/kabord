import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { isBoardMember, isBoardOwner } from '@/lib/boards';
import { removeMember } from '@/lib/board-members';

// DELETE /api/boards/[id]/members/[userId] - Remove a member from board
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId: memberUserId } = await params;
    const memberId = parseInt(memberUserId, 10);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if requester is a member of the board
    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = removeMember(id, memberId, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
