import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getBoardById, getBoardMembers, isBoardMember, getBoardRole } from '@/lib/boards';
import { getTasksByBoard } from '@/lib/tasks';
import { getBoardColumnsWithCounts } from '@/lib/columns';
import { getSubtasksForBoard } from '@/lib/subtasks';
import { getCommentsForBoard } from '@/lib/comments';
import { getLinksForBoard } from '@/lib/links';
import { getBoardCategories, getBoardRequesters } from '@/lib/board-settings';
import { BoardView } from './BoardView';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!isBoardMember(id, user.id)) redirect('/dashboard');

  const board = getBoardById(id, user.id);
  if (!board) redirect('/dashboard');

  const [columns, tasks, categories, requesters, members] = [
    getBoardColumnsWithCounts(id),
    getTasksByBoard(id),
    getBoardCategories(id),
    getBoardRequesters(id),
    getBoardMembers(id),
  ];
  const subtasksByTask = getSubtasksForBoard(id);
  const commentsByTask = getCommentsForBoard(id);
  const linksByTask = getLinksForBoard(id);

  const taskDTOs = tasks.map(t => ({
    ...t,
    number: t.number ?? null,
    position: t.position ?? 0,
    subtasks: subtasksByTask.get(t.id) || [],
    comments: (commentsByTask.get(t.id) || []).map(c => ({
      id: c.id,
      taskId: c.taskId,
      body: c.body,
      createdAt: c.createdAt,
      user: { id: c.userId, username: c.username },
    })),
    links: linksByTask.get(t.id) || [],
  }));

  return (
    <BoardView
      user={user}
      board={{ id: board.id, name: board.name, description: board.description || '' }}
      columns={columns}
      tasks={taskDTOs}
      categories={categories}
      requesters={requesters}
      members={members.map(m => ({ id: m.id, userId: m.userId, username: m.username, role: m.role }))}
      isOwner={getBoardRole(id, user.id) === 'owner'}
    />
  );
}
