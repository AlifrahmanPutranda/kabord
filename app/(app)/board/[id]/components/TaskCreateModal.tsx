'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import type { ColumnDTO, TaskDTO } from '@/lib/types';

interface Option {
  id: string | number;
  label: string;
}

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  columns: ColumnDTO[];
  categories: Option[];
  requesters: Option[];
  members: Array<{ userId: number; username: string }>;
  defaultColumnId?: string;
  onCreated: (task: TaskDTO) => void;
}

export function TaskCreateModal({
  open,
  onClose,
  boardId,
  columns,
  categories,
  requesters,
  members,
  defaultColumnId,
  onCreated,
}: TaskCreateModalProps) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setColumnId(defaultColumnId || columns[0]?.id || '');
      setPriority('medium');
      setAssignee('');
      setRequestedBy('');
      setCategory('');
      setDueDate('');
    }
  }, [open, defaultColumnId, columns]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || !columnId) return;
    setLoading(true);
    try {
      const res = await api<{ task: TaskDTO }>(`/api/boards/${boardId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          columnId,
          priority,
          assignee,
          requestedBy,
          category,
          dueDate,
        }),
      });
      toast.success(`Task KAB-${res.task.number} created`);
      onCreated(res.task);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => submit()} loading={loading} disabled={!title.trim()}>
            Create task
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <Field label="Title">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Short, action-oriented summary" autoFocus />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Context, requirements, acceptance criteria…" rows={4} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Column">
            <Select value={columnId} onChange={e => setColumnId(e.target.value)}>
              {columns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <Field label="Assignee">
            <Select value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.userId} value={m.username}>
                  {m.username}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Requested by">
            <Select value={requestedBy} onChange={e => setRequestedBy(e.target.value)}>
              <option value="">—</option>
              {requesters.map(r => (
                <option key={r.id} value={r.label}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Label">
            <Select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">None</option>
              {categories.map(c => (
                <option key={c.id} value={c.label}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
