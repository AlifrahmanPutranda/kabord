'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import { relativeTime } from '@/lib/client/dates';

export function InvitationsPanel({ invitations, onResolved }: { invitations: any[]; onResolved: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);

  const respond = async (id: number, action: 'accept' | 'reject') => {
    setBusy(id);
    try {
      await api(`/api/invitations/${id}/${action}`, { method: 'POST' });
      toast.success(action === 'accept' ? 'Invitation accepted' : 'Invitation declined');
      onResolved();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to respond');
      setBusy(null);
    }
  };

  return (
    <div className="kb-invitations">
      <div className="kb-dash__section-title">
        <Inbox size={13} /> Pending invitations
      </div>
      {invitations.map((inv: any) => (
        <div key={inv.id} className="kb-invitation">
          <div className="kb-invitation__info">
            <div className="kb-invitation__board">{inv.boardName}</div>
            <div className="kb-invitation__meta">
              Invited by {inv.invitedBy} · {relativeTime(inv.createdAt)}
            </div>
          </div>
          <div className="kb-invitation__actions">
            <Button size="sm" onClick={() => respond(inv.id, 'reject')} disabled={busy === inv.id}>
              Decline
            </Button>
            <Button size="sm" variant="primary" onClick={() => respond(inv.id, 'accept')} disabled={busy === inv.id} loading={busy === inv.id}>
              Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
