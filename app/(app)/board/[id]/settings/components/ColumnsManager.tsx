'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import type { ColumnDTO } from '@/lib/types';

export function ColumnsManager({
  boardId,
  columns,
  isOwner,
}: {
  boardId: string;
  columns: (ColumnDTO & { taskCount: number })[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [modal, setModal] = useState<null | { mode: 'create' } | { mode: 'edit'; column: ColumnDTO } | { mode: 'delete'; column: ColumnDTO & { taskCount?: number } }>(null);
  const [name, setName] = useState('');
  const [wip, setWip] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [moveTo, setMoveTo] = useState('');
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setName('');
    setWip('');
    setIsDone(false);
    setModal({ mode: 'create' });
  };

  const openEdit = (col: ColumnDTO) => {
    setName(col.name);
    setWip(col.wipLimit != null ? String(col.wipLimit) : '');
    setIsDone(col.isDone);
    setModal({ mode: 'edit', column: col });
  };

  const openDelete = (col: ColumnDTO) => {
    const other = columns.find(c => c.id !== col.id);
    setMoveTo(other?.id || '');
    setModal({ mode: 'delete', column: col });
  };

  const save = async () => {
    if (!modal || !name.trim()) return;
    setBusy(true);
    try {
      const body = JSON.stringify({ name: name.trim(), wipLimit: wip ? Number(wip) : null, isDone });
      if (modal.mode === 'create') {
        await api(`/api/boards/${boardId}/columns`, { method: 'POST', body });
        toast.success('Column added');
      } else {
        await api(`/api/boards/${boardId}/columns/${modal.column.id}`, { method: 'PATCH', body });
        toast.success('Column updated');
      }
      setModal(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (modal?.mode !== 'delete') return;
    setBusy(true);
    try {
      await api(`/api/boards/${boardId}/columns/${modal.column.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ moveToColumnId: moveTo }),
      });
      toast.success('Column deleted');
      setModal(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kb-settings__section">
      <div className="kb-settings__section-head">
        <div>
          <div className="kb-settings__section-title">Columns</div>
          <div className="kb-settings__section-desc">The stages tasks flow through on this board.</div>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> Add
        </Button>
      </div>
      <div className="kb-settings__section-body">
        {columns.map(col => (
          <div key={col.id} className="kb-settings__row">
            <div className="kb-settings__row-text">
              <div className="kb-settings__row-title">
                {col.name}
                {col.isDone && <span style={{ color: 'var(--kb-success)', fontWeight: 400, marginLeft: 6, fontSize: 'var(--kb-fs-sm)' }}>· completion</span>}
              </div>
              <div className="kb-settings__row-sub">
                {col.taskCount} task{col.taskCount === 1 ? '' : 's'}
                {col.wipLimit != null && ` · WIP limit ${col.wipLimit}`}
              </div>
            </div>
            <Button size="sm" onClick={() => openEdit(col)}>
              Edit
            </Button>
            {isOwner && columns.length > 1 && (
              <Button size="sm" variant="danger" onClick={() => openDelete(col)}>
                Delete
              </Button>
            )}
          </div>
        ))}
      </div>

      {modal && modal.mode !== 'delete' && (
        <Modal
          open
          onClose={() => setModal(null)}
          title={modal.mode === 'create' ? 'Add column' : 'Edit column'}
          footer={
            <>
              <Button onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" loading={busy} disabled={!name.trim()} onClick={save}>
                {modal.mode === 'create' ? 'Add column' : 'Save'}
              </Button>
            </>
          }
        >
          <Field label="Name">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. In QA" autoFocus />
          </Field>
          <Field label="WIP limit" hint="Max tasks at once. Empty = unlimited.">
            <Input type="number" min={1} value={wip} onChange={e => setWip(e.target.value)} placeholder="No limit" />
          </Field>
          <label className="kb-checkbox">
            <input type="checkbox" checked={isDone} onChange={e => setIsDone(e.target.checked)} />
            Completion column
          </label>
        </Modal>
      )}

      {modal?.mode === 'delete' && (
        <Modal
          open
          onClose={() => setModal(null)}
          title={`Delete "${modal.column.name}"?`}
          footer={
            <>
              <Button onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger-solid" loading={busy} onClick={remove}>
                Delete column
              </Button>
            </>
          }
        >
          <p style={{ color: 'var(--kb-text-secondary)' }}>
            {(modal.column.taskCount || 0) > 0
              ? `${modal.column.taskCount || 0} task(s) will be moved to the column you pick below.`
              : 'This column is empty.'}
          </p>
          {(modal.column.taskCount || 0) > 0 && (
            <Field label="Move its tasks to">
              <select className="kb-select" value={moveTo} onChange={e => setMoveTo(e.target.value)}>
                {columns
                  .filter(c => c.id !== modal.column.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
          )}
        </Modal>
      )}
    </div>
  );
}
