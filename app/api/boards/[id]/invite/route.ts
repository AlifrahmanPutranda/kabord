import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { inviteMember } from '@/lib/board-members';

// POST /api/boards/[id]/invite - Invite a user to the board
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
    const body = await request.json();
    const { username } = body;

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const result = inviteMember(id, username.trim(), user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, invitationId: result.invitationId });
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}
