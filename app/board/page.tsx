import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getAllTasks } from '@/lib/tasks';
import BoardClient from './BoardClient';

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const tasks = await getAllTasks();

  const columns = [
    { id: 'todo', title: 'To Do', icon: '📋', color: '#64748b' },
    { id: 'inprogress', title: 'In Progress', icon: '🔄', color: '#3b82f6' },
    { id: 'review', title: 'Review', icon: '👀', color: '#f59e0b' },
    { id: 'done', title: 'Done', icon: '✅', color: '#22c55e' },
  ];

  const priorities = [
    { id: 'low', label: 'Low', color: '#22c55e' },
    { id: 'medium', label: 'Medium', color: '#f59e0b' },
    { id: 'high', label: 'High', color: '#ef4444' },
  ];

  const statuses = ['todo', 'inprogress', 'review', 'done'];
  const categories = ['System', 'Infrastructure', 'HR', 'Access', 'Finance', 'Marketing', 'CRM', 'Estate', 'Other'];
  const requesters = ['Pak Fiki', 'Pak Vic', 'Pak Victor', 'HR', 'Finance', 'Marketing', 'CRM Team', 'Estate', 'Other'];
  const assignees = ['Pak Fiki', 'IT Team', 'Dev Team', 'Ryan', 'HR & IT', 'Pak Victor'];

  return (
    <BoardClient
      user={user}
      initialTasks={tasks}
      columns={columns}
      priorities={priorities}
      statuses={statuses}
      categories={categories}
      requesters={requesters}
      assignees={assignees}
    />
  );
}
