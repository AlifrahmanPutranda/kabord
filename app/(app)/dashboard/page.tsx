import { getCurrentUser } from '@/lib/session';
import { getUserBoards } from '@/lib/boards';
import { getUserInvitations } from '@/lib/invitations';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const boards = user ? getUserBoards(user.id) : [];
  const invitations = user ? getUserInvitations(user.id) : [];

  return (
    <DashboardClient
      boards={boards.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description || '',
        role: b.role,
        memberCount: b.memberCount,
        taskCount: b.taskCount,
        updatedAt: b.updatedAt,
      }))}
      invitations={invitations}
    />
  );
}
