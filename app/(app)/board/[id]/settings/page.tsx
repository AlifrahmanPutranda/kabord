import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getBoardById, getBoardMembers, isBoardMember, getBoardRole } from '@/lib/boards';
import { getBoardColumnsWithCounts } from '@/lib/columns';
import { getBoardCategories, getBoardRequesters } from '@/lib/board-settings';
import { SettingsClient } from './SettingsClient';

export default async function BoardSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!isBoardMember(id, user.id)) redirect('/dashboard');

  const board = getBoardById(id, user.id);
  if (!board) redirect('/dashboard');

  return (
    <SettingsClient
      board={{ id: board.id, name: board.name, description: board.description || '' }}
      columns={getBoardColumnsWithCounts(id)}
      categories={getBoardCategories(id)}
      requesters={getBoardRequesters(id)}
      members={getBoardMembers(id)}
      isOwner={getBoardRole(id, user.id) === 'owner'}
    />
  );
}
