'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';

export function DangerZone({ boardId, boardName }: { boardId: string; boardName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [confirmName, setConfirmName] = useState('');
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (confirmName !== boardName) return;
    setBusy(true);
    try {
      await api(`/api/boards/${boardId}`, { method: 'DELETE' });
      toast.success(`Board "${boardName}" deleted`);
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete board');
      setBusy(false);
    }
  };

  return (
    <div className="kb-settings__section kb-settings__danger">
      <div className="kb-settings__section-head">
        <div>
          <div className="kb-settings__section-title" style={{ color: 'var(--kb-danger)' }}>
            <AlertTriangle size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
            Danger zone
          </div>
          <div className="kb-settings__section-desc">Deleting a board permanently removes its tasks, comments and history.</div>
        </div>
      </div>
      <div className="kb-settings__section-body">
        <div className="kb-settings__form-row">
          <Input
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={`Type "${boardName}" to confirm`}
            style={{ flex: 1 }}
          />
          <Button variant="danger-solid" disabled={confirmName !== boardName} loading={busy} onClick={remove}>
            Delete board
          </Button>
        </div>
      </div>
    </div>
  );
}
