'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';

export function MembersManager({
  boardId,
  members,
  isOwner,
}: {
  boardId: string;
  members: Array<{ id: number; userId: number; username: string; role: 'owner' | 'member'; joinedAt: string }>;
  isOwner: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [busy, setBusy] = useState(false);

  const invite = async () => {
    if (!inviteName.trim()) return;
    setBusy(true);
    try {
      await api(`/api/boards/${boardId}/invite`, { method: 'POST', body: JSON.stringify({ username: inviteName.trim() }) });
      toast.success(`Invitation sent to ${inviteName.trim()}`);
      setInviteOpen(false);
      setInviteName('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to invite');
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (username: string, userId: number) => {
    if (!window.confirm(`Remove ${username} from this board?`)) return;
    try {
      await api(`/api/boards/${boardId}/members/${userId}`, { method: 'DELETE' });
      toast.success(`${username} removed`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove');
    }
  };

  return (
    <div className="kb-settings__section">
      <div className="kb-settings__section-head">
        <div>
          <div className="kb-settings__section-title">Members</div>
          <div className="kb-settings__section-desc">People who can see and work on this board.</div>
        </div>
        {isOwner && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus size={14} /> Invite
          </Button>
        )}
      </div>
      <div className="kb-settings__section-body">
        {members.map(m => (
          <div key={m.id} className="kb-settings__row">
            <Avatar name={m.username} />
            <div className="kb-settings__row-text">
              <div className="kb-settings__row-title">{m.username}</div>
            </div>
            <Badge tone={m.role === 'owner' ? 'accent' : 'default'}>{m.role}</Badge>
            {isOwner && m.role !== 'owner' && (
              <Button size="sm" variant="danger" onClick={() => removeMember(m.username, m.userId)}>
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite member"
        footer={
          <>
            <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={busy} disabled={!inviteName.trim()} onClick={invite}>
              Send invite
            </Button>
          </>
        }
      >
        <Field label="Username" hint="They will see an invitation on their dashboard.">
          <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="exact username" autoFocus />
        </Field>
      </Modal>
    </div>
  );
}
