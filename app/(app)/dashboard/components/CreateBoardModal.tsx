'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';

interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (boardId: string) => void;
}

export function CreateBoardModal({ open, onClose, onCreated }: CreateBoardModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await api<{ board: { id: string } }>('/api/boards', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      toast.success(`Board "${name.trim()}" created`);
      onCreated(res.board.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create board');
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New board"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={submit} disabled={!name.trim()}>
            Create board
          </Button>
        </>
      }
    >
      <form onSubmit={submit} id="create-board-form">
        <Field label="Board name">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Infrastructure Upgrades" autoFocus />
        </Field>
        <Field label="Description" hint="Optional — what is this board for?">
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Track migrations, maintenance and improvements…"
            rows={3}
          />
        </Field>
      </form>
    </Modal>
  );
}
