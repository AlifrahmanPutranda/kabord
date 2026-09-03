'use client';

import { useState } from 'react';
import { Loader2, Plus, Sparkles, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import type { TaskDTO } from '@/lib/types';

// AI helpers in the task panel: subtask generation, description writer,
// priority/label suggestions. Nothing is persisted until the user applies it.
export function AiActions({ task, onChanged }: { task: TaskDTO; onChanged: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState<'subtasks' | 'description' | 'suggest' | null>(null);

  const [subtaskIdeas, setSubtaskIdeas] = useState<string[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [descPreview, setDescPreview] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{
    priority: { value: string; reason: string };
    labels: Array<{ name: string; reason: string }>;
  } | null>(null);

  const genSubtasks = async () => {
    setBusy('subtasks');
    try {
      const res = await api<{ subtasks: string[] }>(`/api/ai/subtasks`, { method: 'POST', body: JSON.stringify({ taskId: task.id }) });
      setSubtaskIdeas(res.subtasks);
      setPicked(new Set(res.subtasks.map((_, i) => i)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI failed');
    } finally {
      setBusy(null);
    }
  };

  const applySubtasks = async () => {
    const titles = subtaskIdeas.filter((_, i) => picked.has(i));
    if (titles.length === 0) return;
    setBusy('subtasks');
    try {
      await api(`/api/tasks/${task.id}/subtasks/bulk`, { method: 'POST', body: JSON.stringify({ titles }) });
      toast.success(`Added ${titles.length} subtask(s)`);
      setSubtaskIdeas([]);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add subtasks');
    } finally {
      setBusy(null);
    }
  };

  const writeDescription = async () => {
    setBusy('description');
    try {
      const res = await api<{ description: string }>('/api/ai/description', { method: 'POST', body: JSON.stringify({ taskId: task.id }) });
      setDescPreview(res.description);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI failed');
    } finally {
      setBusy(null);
    }
  };

  const suggest = async () => {
    setBusy('suggest');
    try {
      const res = await api<{ suggestion: typeof suggestion }>('/api/ai/suggest', { method: 'POST', body: JSON.stringify({ taskId: task.id }) });
      setSuggestion(res.suggestion);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI failed');
    } finally {
      setBusy(null);
    }
  };

  const applySuggestion = async (patch: Record<string, unknown>) => {
    try {
      await api(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(patch) });
      toast.success('Applied');
      setSuggestion(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to apply');
    }
  };

  return (
    <div className="kb-panel__section">
      <div className="kb-panel__section-title">
        <Sparkles size={12} /> AI assist
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button size="sm" onClick={genSubtasks} disabled={busy !== null}>
          {busy === 'subtasks' ? <Loader2 size={13} className="kb-btn__spinner" /> : <Wand2 size={13} />} Subtasks
        </Button>
        <Button size="sm" onClick={writeDescription} disabled={busy !== null}>
          {busy === 'description' ? <Loader2 size={13} className="kb-btn__spinner" /> : <Wand2 size={13} />} Write description
        </Button>
        <Button size="sm" onClick={suggest} disabled={busy !== null}>
          {busy === 'suggest' ? <Loader2 size={13} className="kb-btn__spinner" /> : <Wand2 size={13} />} Suggest
        </Button>
      </div>

      {subtaskIdeas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {subtaskIdeas.map((idea, i) => (
            <label key={i} className="kb-checkbox" style={{ fontWeight: 400, background: 'var(--kb-bg-inset)', borderRadius: 'var(--kb-r-sm)', padding: '4px 8px' }}>
              <input
                type="checkbox"
                checked={picked.has(i)}
                onChange={() => {
                  const next = new Set(picked);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  setPicked(next);
                }}
              />
              <span style={{ flex: 1 }}>{idea}</span>
              <button
                type="button"
                aria-label="Remove suggestion"
                onClick={e => {
                  e.preventDefault();
                  setSubtaskIdeas(prev => prev.filter((_, j) => j !== i));
                  setPicked(prev => {
                    const next = new Set<number>();
                    picked.forEach(p => (p < i ? next.add(p) : p > i && next.add(p - 1)));
                    return next;
                  });
                }}
              >
                <X size={12} />
              </button>
            </label>
          ))}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="sm" onClick={() => setSubtaskIdeas([])}>
              Discard
            </Button>
            <Button size="sm" variant="primary" loading={busy === 'subtasks'} disabled={picked.size === 0} onClick={applySubtasks}>
              <Plus size={13} /> Add {picked.size} subtask(s)
            </Button>
          </div>
        </div>
      )}

      {descPreview !== null && (
        <div style={{ marginTop: 4 }}>
          <div className="kb-panel__desc-preview">{descPreview}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button size="sm" onClick={() => setDescPreview(null)}>
              Discard
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                try {
                  await api(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ description: descPreview }) });
                  toast.success('Description updated');
                  setDescPreview(null);
                  onChanged();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Failed');
                }
              }}
            >
              Use this
            </Button>
          </div>
        </div>
      )}

      {suggestion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--kb-fs-sm)', color: 'var(--kb-text-muted)' }}>Priority:</span>
            {(['low', 'medium', 'high'] as const).map(p => (
              <button
                key={p}
                className={`kb-badge ${suggestion.priority.value === p ? 'kb-badge--accent' : ''}`}
                style={{ height: 24, cursor: 'pointer', textTransform: 'capitalize' }}
                title={suggestion.priority.reason}
                onClick={() => applySuggestion({ priority: p })}
              >
                {p}
              </button>
            ))}
          </div>
          {suggestion.labels.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--kb-fs-sm)', color: 'var(--kb-text-muted)' }}>Labels:</span>
              {suggestion.labels.map(l => (
                <button
                  key={l.name}
                  className="kb-badge"
                  style={{ height: 24, cursor: 'pointer' }}
                  title={l.reason}
                  onClick={() => applySuggestion({ category: l.name })}
                >
                  <span className="kb-badge__dot" /> {l.name}
                </button>
              ))}
            </div>
          )}
          <div style={{ fontSize: 'var(--kb-fs-xs)', color: 'var(--kb-text-muted)', fontStyle: 'italic' }}>
            {suggestion.priority.reason}
          </div>
          <Button size="sm" onClick={() => setSuggestion(null)} style={{ alignSelf: 'flex-start' }}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
