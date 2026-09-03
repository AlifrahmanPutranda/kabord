'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckSquare, ExternalLink, GitBranch, Layers, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Dropdown, DropdownItem, DropdownSep } from '@/components/ui/Dropdown';
import { AiActions } from './AiActions';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import { relativeTime } from '@/lib/client/dates';
import type { ColumnDTO, TaskDTO } from '@/lib/types';

interface TaskPanelProps {
  task: TaskDTO;
  columns: ColumnDTO[];
  categories: Array<{ id: number; label: string }>;
  requesters: Array<{ id: number; label: string }>;
  members: Array<{ userId: number; username: string }>;
  currentUsername: string;
  isOwner: boolean;
  onClose: () => void;
  onChanged: () => void; // trigger server refresh
}

export function TaskPanel({
  task,
  columns,
  categories,
  requesters,
  members,
  currentUsername,
  isOwner,
  onClose,
  onChanged,
}: TaskPanelProps) {
  const toast = useToast();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [savingDesc, setSavingDesc] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Reset local edit state when a different task is opened.
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setNewSubtask('');
    setComment('');
    bodyRef.current?.scrollTo({ top: 0 });
  }, [task.id]);

  const saveField = async (patch: Record<string, unknown>, quiet = false) => {
    try {
      await api(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(patch) });
      if (!quiet) onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const commitTitle = async () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === task.title) { setTitle(task.title); return; }
    await saveField({ title: trimmed });
  };

  const commitDescription = async () => {
    setSavingDesc(true);
    await saveField({ description }, true);
    setSavingDesc(false);
    onChanged();
  };

  const toggleSubtask = async (id: number, done: boolean) => {
    try {
      await api(`/api/tasks/${task.id}/subtasks/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) });
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update subtask');
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      await api(`/api/tasks/${task.id}/subtasks`, { method: 'POST', body: JSON.stringify({ title: newSubtask.trim() }) });
      setNewSubtask('');
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add subtask');
    }
  };

  const deleteSubtask = async (id: number) => {
    try {
      await api(`/api/tasks/${task.id}/subtasks/${id}`, { method: 'DELETE' });
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete subtask');
    }
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api(`/api/tasks/${task.id}/comments`, { method: 'POST', body: JSON.stringify({ body: comment.trim() }) });
      setComment('');
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to comment');
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (id: number) => {
    try {
      await api(`/api/tasks/${task.id}/comments/${id}`, { method: 'DELETE' });
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete comment');
    }
  };

  const deleteTask = async () => {
    if (!window.confirm(`Delete task "${task.title}" permanently?`)) return;
    try {
      await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
      toast.success('Task deleted');
      onClose();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete task');
    }
  };

  const removeLink = async (linkId: number) => {
    try {
      await api(`/api/tasks/${task.id}/links/${linkId}`, { method: 'DELETE' });
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to unlink');
    }
  };

  const doneSubtasks = task.subtasks?.filter(s => s.done).length ?? 0;
  const currentColumn = columns.find(c => c.id === task.status);

  return (
    <aside className="kb-panel" role="dialog" aria-label={`Task ${task.title}`}>
      <div className="kb-panel__head">
        <span className="kb-panel__key">{task.number != null ? `KAB-${task.number}` : ''}</span>
        <span style={{ color: 'var(--kb-text-muted)', fontSize: 'var(--kb-fs-sm)' }}>·</span>
        <span style={{ color: 'var(--kb-text-secondary)', fontSize: 'var(--kb-fs-sm)' }}>{currentColumn?.name}</span>
        <span className="kb-panel__spacer" />
        {isOwner && (
          <Button size="sm" variant="danger" onClick={deleteTask}>
            <Trash2 size={13} /> Delete
          </Button>
        )}
        <IconButton label="Close panel" onClick={onClose}>
          <X size={16} />
        </IconButton>
      </div>

      <div className="kb-panel__body" ref={bodyRef}>
        <textarea
          className="kb-panel__title"
          value={title}
          rows={2}
          onChange={e => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
          }}
          aria-label="Task title"
        />

        <div className="kb-panel__section">
          <div className="kb-panel__section-title">Properties</div>
          <div className="kb-props">
            <span className="kb-props__label">Column</span>
            <Select value={task.status} onChange={e => saveField({ columnId: e.target.value, position: 9999 })}>
              {columns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <span className="kb-props__label">Priority</span>
            <Select value={task.priority} onChange={e => saveField({ priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
            <span className="kb-props__label">Assignee</span>
            <Select value={task.assignee || ''} onChange={e => saveField({ assignee: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.userId} value={m.username}>
                  {m.username}
                </option>
              ))}
            </Select>
            <span className="kb-props__label">Requested by</span>
            <Select value={task.requestedBy || ''} onChange={e => saveField({ requestedBy: e.target.value })}>
              <option value="">—</option>
              {requesters.map(r => (
                <option key={r.id} value={r.label}>
                  {r.label}
                </option>
              ))}
            </Select>
            <span className="kb-props__label">Label</span>
            <Select value={task.category || ''} onChange={e => saveField({ category: e.target.value })}>
              <option value="">None</option>
              {categories.map(c => (
                <option key={c.id} value={c.label}>
                  {c.label}
                </option>
              ))}
            </Select>
            <span className="kb-props__label">Due date</span>
            <Input type="date" value={task.dueDate || ''} onChange={e => saveField({ dueDate: e.target.value })} />
          </div>
        </div>

        <AiActions task={task} onChanged={onChanged} />

        <div className="kb-panel__section">
          <div className="kb-panel__section-title">
            <ExternalLink size={12} /> Linked issues
          </div>
          {task.links?.map(link => (
            <div key={link.id} className="kb-settings__row" style={{ padding: 0 }}>
              <a href={link.url} target="_blank" rel="noreferrer" className="kb-linkbadge" style={{ height: 24, fontSize: 'var(--kb-fs-xs)' }}>
                {link.provider === 'github' ? <GitBranch size={11} /> : <Layers size={11} />}
                {link.externalId}
              </a>
              <span style={{ flex: 1 }} />
              <IconButton label="Unlink" small onClick={() => removeLink(link.id)}>
                <X size={13} />
              </IconButton>
            </div>
          ))}
          {(!task.links || task.links.length === 0) && (
            <span style={{ color: 'var(--kb-text-muted)', fontSize: 'var(--kb-fs-sm)' }}>Not linked to GitHub or Jira yet.</span>
          )}
          <PushControls taskId={task.id} onDone={onChanged} />
        </div>

        <div className="kb-panel__section">
          <div className="kb-panel__section-title">Description</div>
          <Textarea
            className="kb-panel__desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add a description…"
            rows={5}
          />
          {description !== (task.description || '') && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button size="sm" onClick={() => setDescription(task.description || '')}>
                Discard
              </Button>
              <Button size="sm" variant="primary" loading={savingDesc} onClick={commitDescription}>
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="kb-panel__section">
          <div className="kb-panel__section-title">
            <CheckSquare size={12} /> Subtasks{' '}
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="kb-subtask-progress">
                {doneSubtasks}/{task.subtasks.length}
              </span>
            )}
          </div>
          {task.subtasks?.map(st => (
            <div key={st.id} className="kb-subtask">
              <label className="kb-checkbox" style={{ flex: 1, fontWeight: 400 }}>
                <input type="checkbox" checked={st.done} onChange={e => toggleSubtask(st.id, e.target.checked)} />
                <span className={`kb-subtask__label ${st.done ? 'kb-subtask__label--done' : ''}`}>{st.title}</span>
              </label>
              <button className="kb-iconbtn kb-iconbtn--sm kb-subtask__del" aria-label="Delete subtask" onClick={() => deleteSubtask(st.id)}>
                <X size={13} />
              </button>
            </div>
          ))}
          <form
            onSubmit={e => {
              e.preventDefault();
              addSubtask();
            }}
          >
            <Input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="Add a subtask…" />
          </form>
        </div>

        <div className="kb-panel__section">
          <div className="kb-panel__section-title">
            <MessageSquare size={12} /> Comments
          </div>
          {task.comments?.map(c => (
            <div key={c.id} className="kb-comment">
              <Avatar name={c.user.username} size="sm" />
              <div className="kb-comment__body">
                <div className="kb-comment__head">
                  <span className="kb-comment__author">{c.user.username}</span>
                  <span className="kb-comment__time">{relativeTime(c.createdAt)}</span>
                  <span style={{ flex: 1 }} />
                  {(c.user.username === currentUsername || isOwner) && (
                    <button className="kb-iconbtn kb-iconbtn--sm kb-comment__del" aria-label="Delete comment" onClick={() => deleteComment(c.id)}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="kb-comment__text">{c.body}</div>
              </div>
            </div>
          ))}
          <div className="kb-commentbox">
            <Avatar name={currentUsername} size="sm" />
            <div style={{ flex: 1 }}>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write a comment…"
                rows={2}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment();
                }}
              />
              {comment.trim() && (
                <div className="kb-commentbox__actions">
                  <Button size="sm" variant="primary" loading={posting} onClick={postComment}>
                    Comment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="kb-panel__section">
          <div className="kb-panel__section-title">Activity</div>
          <div className="kb-activityfeed">
            {task.activity?.slice(0, 20).map((a, i) => (
              <div key={i} className="kb-activity">
                <span className="kb-activity__dot" />
                <span style={{ flex: 1 }}>{a.text}</span>
                <span className="kb-activity__time">{a.time}</span>
              </div>
            ))}
            {(!task.activity || task.activity.length === 0) && (
              <span style={{ color: 'var(--kb-text-muted)', fontSize: 'var(--kb-fs-sm)' }}>No activity yet</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Push-to-GitHub/Jira controls in the task panel.
function PushControls({ taskId, onDone }: { taskId: string; onDone: () => void }) {
  const toast = useToast();
  const [mode, setMode] = useState<'github' | 'jira' | null>(null);
  const [repo, setRepo] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [busy, setBusy] = useState(false);

  const push = async () => {
    setBusy(true);
    try {
      const body =
        mode === 'github'
          ? { provider: 'github', repo: repo.trim() }
          : { provider: 'jira', projectKey: projectKey.trim() };
      const res = await api<{ link: { externalId: string; url: string } }>(`/api/tasks/${taskId}/links`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast.success(`Created ${res.link.externalId}`);
      setMode(null);
      setRepo('');
      setProjectKey('');
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Push failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dropdown
        trigger={
          <Button size="sm">
            <Plus size={13} /> Push to…
          </Button>
        }
      >
        <DropdownItem onClick={() => setMode('github')}>
          <GitBranch size={13} /> GitHub issue
        </DropdownItem>
        <DropdownSep />
        <DropdownItem onClick={() => setMode('jira')}>
          <Layers size={13} /> Jira issue
        </DropdownItem>
      </Dropdown>

      {mode === 'github' && (
        <div className="kb-settings__form-row" style={{ marginTop: 4 }}>
          <Input value={repo} onChange={e => setRepo(e.target.value)} placeholder="owner/repo" style={{ flex: 1 }} autoFocus />
          <Button size="sm" variant="primary" loading={busy} disabled={!repo.trim()} onClick={push}>
            Create issue
          </Button>
        </div>
      )}
      {mode === 'jira' && (
        <div className="kb-settings__form-row" style={{ marginTop: 4 }}>
          <Input value={projectKey} onChange={e => setProjectKey(e.target.value)} placeholder="PROJECTKEY" style={{ flex: 1 }} autoFocus />
          <Button size="sm" variant="primary" loading={busy} disabled={!projectKey.trim()} onClick={push}>
            Create issue
          </Button>
        </div>
      )}
    </>
  );
}
