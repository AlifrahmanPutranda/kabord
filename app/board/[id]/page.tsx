import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getBoardById, getBoardMembers, isBoardMember, isBoardOwner } from '@/lib/boards';
import { getBoardCategories, getBoardRequesters } from '@/lib/board-settings';
import { getTasksByBoard } from '@/lib/tasks';
import BoardClient from './BoardClient';

export const dynamic = 'force-dynamic';

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const { id } = await params;

  // Check if user is a member of this board
  if (!isBoardMember(id, user.id)) {
    redirect('/dashboard');
  }

  const board = getBoardById(id, user.id);
  if (!board) {
    redirect('/dashboard');
  }

  const tasks = getTasksByBoard(id);
  const categories = getBoardCategories(id);
  const requesters = getBoardRequesters(id);
  const members = getBoardMembers(id);
  const assignees = members.map((m) => m.username);
  const isOwner = isBoardOwner(id, user.id);

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

  return (
    <BoardClient
      user={user}
      board={board}
      initialTasks={tasks}
      columns={columns}
      priorities={priorities}
      statuses={statuses}
      categories={categories.map((c) => c.name)}
      requesters={requesters.map((r) => r.name)}
      assignees={assignees}
      isOwner={isOwner}
    />
  );
}
