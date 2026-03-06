import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getUserBoards } from '@/lib/boards';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const boards = getUserBoards(user.id);

  return (
    <DashboardClient
      user={{ id: user.id, username: user.username, role: user.role }}
      initialBoards={boards}
    />
  );
}
