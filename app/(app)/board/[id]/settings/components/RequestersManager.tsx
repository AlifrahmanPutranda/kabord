'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';

export function RequestersManager({
  boardId,
  requesters,
}: {
  boardId: string;
  requesters: Array<{ id: number; name: string; position: number }>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api(`/api/boards/${boardId}/requesters`, { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
      setName('');
      toast.success('Requester added');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number, label: string) => {
    if (!window.confirm(`Delete requester "${label}"?`)) return;
    try {
      await api(`/api/boards/${boardId}/requesters/${id}`, { method: 'DELETE' });
      toast.success('Requester deleted');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  return (
    <div className="kb-settings__section">
      <div className="kb-settings__section-head">
        <div>
          <div className="kb-settings__section-title">Requesters</div>
          <div className="kb-settings__section-desc">Who asks for tasks — teams or people outside the board.</div>
        </div>
      </div>
      <div className="kb-settings__section-body">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {requesters.map(r => (
            <span key={r.id} className="kb-badge" style={{ height: 26, fontSize: 'var(--kb-fs-sm)' }}>
              {r.name}
              <button aria-label={`Delete ${r.name}`} onClick={() => remove(r.id, r.name)} style={{ display: 'flex', color: 'var(--kb-text-muted)' }}>
                <X size={11} />
              </button>
            </span>
          ))}
          {requesters.length === 0 && <span style={{ color: 'var(--kb-text-muted)', fontSize: 'var(--kb-fs-sm)' }}>No requesters yet</span>}
        </div>
        <div className="kb-settings__form-row">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="New requester…" onKeyDown={e => e.key === 'Enter' && add()} style={{ width: 220 }} />
          <Button size="sm" onClick={add} loading={busy} disabled={!name.trim()}>
            <Plus size={14} /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
