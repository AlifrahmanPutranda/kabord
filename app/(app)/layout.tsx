import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getUserBoards } from '@/lib/boards';
import { getUserTaskIndex } from '@/lib/tasks';
import { AppShell } from '@/components/shell/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const boards = getUserBoards(user.id).map(b => ({ id: b.id, name: b.name }));
  const taskIndex = getUserTaskIndex(user.id);

  return (
    <AppShell user={user} boards={boards} taskIndex={taskIndex}>
      {children}
    </AppShell>
  );
}
