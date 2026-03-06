import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getBoardById, getBoardMembers, isBoardMember, isBoardOwner } from '@/lib/boards';
import { getBoardCategories, getBoardRequesters } from '@/lib/board-settings';
import SettingsClient from './SettingsClient';

export default async function BoardSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
    return;
  }

  const { id } = await params;

  // Check if user is a member of the board
  if (!isBoardMember(id, user.id)) {
    redirect('/dashboard');
    return;
  }

  const board = getBoardById(id, user.id);
  if (!board) {
    redirect('/dashboard');
    return;
  }

  const members = getBoardMembers(id);
  const categories = getBoardCategories(id);
  const requesters = getBoardRequesters(id);
  const isOwner = isBoardOwner(id, user.id);

  return (
    <SettingsClient
      board={board}
      members={members}
      categories={categories}
      requesters={requesters}
      isOwner={isOwner}
      currentUserId={user.id}
    />
  );
}
