'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanSquare, ListChecks, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import { relativeTime } from '@/lib/client/dates';
import { BoardCard } from './components/BoardCard';
import { CreateBoardModal } from './components/CreateBoardModal';
import { InvitationsPanel } from './components/InvitationsPanel';

interface DashBoard {
  id: string;
  name: string;
  description: string;
  role?: 'owner' | 'member';
  memberCount?: number;
  taskCount?: number;
  updatedAt: string;
}

export function DashboardClient({ boards, invitations }: { boards: DashBoard[]; invitations: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [pendingInvites, setPendingInvites] = useState(invitations);

  // /dashboard?new=1 (sidebar "+") opens the create modal directly.
  useEffect(() => {
    if (searchParams.get('new')) {
      setCreating(true);
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  const deleteBoard = async (board: DashBoard) => {
    if (!window.confirm(`Delete board "${board.name}" and all of its tasks? This cannot be undone.`)) return;
    try {
      await api(`/api/boards/${board.id}`, { method: 'DELETE' });
      toast.success(`Board "${board.name}" deleted`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete board');
    }
  };

  return (
    <div className="kb-dash">
      <div className="kb-dash__head">
        <div>
          <h1 className="kb-dash__title">Dashboard</h1>
          <p className="kb-dash__sub">
            {boards.length === 0 ? 'Create your first board to get started.' : `${boards.length} board${boards.length > 1 ? 's' : ''} · ${boards.reduce((a, b) => a + (b.taskCount || 0), 0)} tasks`}
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={15} /> New board
        </Button>
      </div>

      {pendingInvites.length > 0 && <InvitationsPanel invitations={pendingInvites} onResolved={() => setPendingInvites([])} />}

      {boards.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare size={20} />}
          title="No boards yet"
          description="Boards hold your tasks as customizable columns. Create one for each project, team or incident stream."
          action={
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={15} /> Create your first board
            </Button>
          }
        />
      ) : (
        <>
          <div className="kb-dash__section-title">
            <ListChecks size={13} /> My boards
          </div>
          <div className="kb-boardgrid">
            {boards.map(board => (
              <BoardCard key={board.id} board={board} onDelete={deleteBoard} />
            ))}
            <button className="kb-boardcard" style={{ justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', cursor: 'pointer', minHeight: 132 }} onClick={() => setCreating(true)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--kb-text-secondary)', fontSize: 'var(--kb-fs-lg)' }}>
                <Plus size={18} /> New board
              </span>
            </button>
          </div>
        </>
      )}

      <CreateBoardModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          router.refresh();
        }}
      />
    </div>
  );
}
