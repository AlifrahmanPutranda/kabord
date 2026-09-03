'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';

const PALETTE = ['#5e6ad2', '#8f6ad2', '#d2699a', '#d2836a', '#57abdd', '#4cb782', '#b7d26a', '#f5a623', '#eb5757', '#6a6a74'];

export function LabelsManager({
  boardId,
  categories,
}: {
  boardId: string;
  categories: Array<{ id: number; name: string; color: string; position: number }>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api(`/api/boards/${boardId}/categories`, { method: 'POST', body: JSON.stringify({ name: name.trim(), color }) });
      setName('');
      toast.success('Label added');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await api(`/api/boards/${boardId}/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name: editName.trim() }) });
      setEditing(null);
      toast.success('Label renamed');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to rename');
    }
  };

  const remove = async (id: number, label: string) => {
    if (!window.confirm(`Delete label "${label}"? Tasks using it will keep the name but lose the color.`)) return;
    try {
      await api(`/api/boards/${boardId}/categories/${id}`, { method: 'DELETE' });
      toast.success('Label deleted');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  return (
    <div className="kb-settings__section">
      <div className="kb-settings__section-head">
        <div>
          <div className="kb-settings__section-title">Labels</div>
          <div className="kb-settings__section-desc">Group tasks by area — System, Access, Network…</div>
        </div>
      </div>
      <div className="kb-settings__section-body">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat =>
            editing === cat.id ? (
              <span key={cat.id} style={{ display: 'inline-flex', gap: 4 }}>
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(cat.id)}
                  style={{ width: 140, height: 26 }}
                  autoFocus
                />
                <Button size="sm" variant="primary" onClick={() => saveEdit(cat.id)}>
                  Save
                </Button>
              </span>
            ) : (
              <span key={cat.id} className="kb-badge" style={{ height: 26, fontSize: 'var(--kb-fs-sm)', cursor: 'default' }} onDoubleClick={() => { setEditing(cat.id); setEditName(cat.name); }}>
                <span className="kb-badge__dot" style={{ background: cat.color }} />
                {cat.name}
                <button aria-label={`Delete ${cat.name}`} onClick={() => remove(cat.id, cat.name)} style={{ display: 'flex', color: 'var(--kb-text-muted)' }}>
                  <X size={11} />
                </button>
              </span>
            )
          )}
        </div>
        <div className="kb-settings__form-row">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="New label name…" onKeyDown={e => e.key === 'Enter' && add()} style={{ width: 200 }} />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: color === c ? '2px solid var(--kb-text-primary)' : '2px solid transparent', cursor: 'pointer' }}
              />
            ))}
          </div>
          <Button size="sm" onClick={add} loading={busy} disabled={!name.trim()}>
            <Plus size={14} /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
