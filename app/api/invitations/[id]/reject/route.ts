import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { rejectInvitation } from '@/lib/invitations';

// POST /api/invitations/[id]/reject - Reject an invitation
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
    const invitationId = parseInt(id, 10);

    if (isNaN(invitationId)) {
      return NextResponse.json({ error: 'Invalid invitation ID' }, { status: 400 });
    }

    const result = rejectInvitation(invitationId, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    return NextResponse.json({ error: 'Failed to reject invitation' }, { status: 500 });
  }
}

// PUT for backward compatibility
export const PUT = POST;
