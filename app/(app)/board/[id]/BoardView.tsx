'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Download, Plus, Settings2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AvatarStack } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import type { ColumnDTO, TaskDTO, UserDTO } from '@/lib/types';
import { Column } from './components/Column';
import { TaskCard } from './components/TaskCard';
import { TaskPanel } from './components/TaskPanel';
import { TaskCreateModal } from './components/TaskCreateModal';
import { ImportModal } from './components/ImportModal';

interface BoardViewProps {
  user: UserDTO;
  board: { id: string; name: string; description: string };
  columns: (ColumnDTO & { taskCount?: number })[];
  tasks: TaskDTO[];
  categories: Array<{ id: number; name: string; color?: string }>;
  requesters: Array<{ id: number; name: string }>;
  members: Array<{ userId: number; username: string; role: string }>;
  isOwner: boolean;
}

type ColumnModalState =
  | null
  | { mode: 'create' }
  | { mode: 'edit'; column: ColumnDTO }
  | { mode: 'delete'; column: ColumnDTO };

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function BoardView({ user, board, columns, tasks, categories, requesters, members, isOwner }: BoardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [localTasks, setLocalTasks] = useState<TaskDTO[]>(tasks);
  const [localColumns, setLocalColumns] = useState(columns);
  useEffect(() => setLocalTasks(tasks), [tasks]);
  useEffect(() => setLocalColumns(columns), [columns]);

  // Filters
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [requester, setRequester] = useState('');
  const [assignee, setAssignee] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string | undefined>();
  const [columnModal, setColumnModal] = useState<ColumnModalState>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<{ summary: string; wins: string[]; risks: string[] } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const runSummary = async () => {
    setAiBusy(true);
    try {
      const res = await api<{ summary: string; wins: string[]; risks: string[] }>('/api/ai/summary', {
        method: 'POST',
        body: JSON.stringify({ boardId: board.id }),
      });
      setAiSummary(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI summary failed');
    } finally {
      setAiBusy(false);
    }
  };

  // DnD
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const refresh = () => router.refresh();

  // Esc closes the task panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedId) setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  // Deep link: /board/[id]?task=<taskId> opens that task's panel.
  useEffect(() => {
    const taskParam = searchParams.get('task');
    if (taskParam) setSelectedId(taskParam);
  }, [searchParams]);

  // Board hotkeys: N = new task, / = focus filter. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setCreateColumnId(undefined);
        setCreateOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Sort tasks within each column by position.
  const tasksByColumn = useMemo(() => {
    const map = new Map<string, TaskDTO[]>();
    for (const col of localColumns) map.set(col.id, []);
    for (const t of [...localTasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
      if (!map.has(t.status)) map.set(t.status, []);
      map.get(t.status)!.push(t);
    }
    return map;
  }, [localTasks, localColumns]);

  const matchesFilters = (t: TaskDTO) => {
    if (search && !(`${t.title} ${t.description}`.toLowerCase().includes(search.toLowerCase()))) return false;
    if (priority && t.priority !== priority) return false;
    if (category && t.category !== category) return false;
    if (requester && t.requestedBy !== requester) return false;
    if (assignee && (t.assignee || '') !== assignee) return false;
    if (onlyMine && (t.assignee || '') !== user.username) return false;
    return true;
  };

  const filteredByColumn = useMemo(() => {
    const map = new Map<string, TaskDTO[]>();
    for (const [colId, list] of tasksByColumn) map.set(colId, list.filter(matchesFilters));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksByColumn, search, priority, category, requester, assignee, onlyMine, user.username]);

  const onDragStart = (e: DragStartEvent) => setActiveTaskId(String(e.active.id));

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveTaskId(null);
    const { active, over: overTarget } = e;
    if (!overTarget) return;
    const taskId = String(active.id);
    const overId = String(overTarget.id);

    const task = localTasks.find(t => t.id === taskId);
    if (!task) return;

    // Resolve target column + index against the UNFILTERED lists so positions stay correct.
    let targetColumnId: string;
    let targetIndex: number;
    const overTask = localTasks.find(t => t.id === overId);
    if (overTask) {
      targetColumnId = overTask.status;
      const colList = tasksByColumn.get(targetColumnId) || [];
      targetIndex = colList.findIndex(t => t.id === overId);
      if (targetIndex < 0) targetIndex = colList.length;
    } else {
      targetColumnId = overId;
      const colList = tasksByColumn.get(targetColumnId) || [];
      targetIndex = colList.length;
    }

    const sameColumn = task.status === targetColumnId;
    const currentList = tasksByColumn.get(targetColumnId) || [];
    const fromIndex = currentList.findIndex(t => t.id === taskId);
    if (sameColumn && (fromIndex === targetIndex || fromIndex === -1)) return; // no-op

    // Optimistic reorder.
    let newList: TaskDTO[];
    if (sameColumn) {
      newList = arrayMove(currentList, fromIndex, targetIndex);
    } else {
      newList = currentList.filter(t => t.id !== taskId);
      newList.splice(Math.min(targetIndex, newList.length), 0, task);
    }
    const reordered = newList.map((t, i) => ({ ...t, status: targetColumnId, position: i }));

    setLocalTasks(prev =>
      prev.map(t => {
        if (t.status !== targetColumnId) return t;
        const found = reordered.find(r => r.id === t.id);
        return found || t;
      })
    );

    try {
      await api(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ columnId: targetColumnId, position: targetIndex }),
      });
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Move failed');
      refresh();
    }
  };

  // ---- Column management ----
  const submitColumnModal = async (data: { name: string; wipLimit: number | null; isDone: boolean }) => {
    if (!columnModal) return;
    try {
      if (columnModal.mode === 'create') {
        await api(`/api/boards/${board.id}/columns`, { method: 'POST', body: JSON.stringify(data) });
        toast.success(`Column "${data.name}" added`);
      } else if (columnModal.mode === 'edit') {
        await api(`/api/boards/${board.id}/columns/${columnModal.column.id}`, { method: 'PATCH', body: JSON.stringify(data) });
        toast.success('Column updated');
      }
      setColumnModal(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save column');
    }
  };

  const submitDeleteColumn = async (moveToColumnId?: string) => {
    if (columnModal?.mode !== 'delete') return;
    try {
      await api(`/api/boards/${board.id}/columns/${columnModal.column.id}`, {
        method: 'DELETE',
        body: JSON.stringify(moveToColumnId ? { moveToColumnId } : {}),
      });
      toast.success('Column deleted');
      setColumnModal(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete column');
    }
  };

  const selectedTask = selectedId ? localTasks.find(t => t.id === selectedId) || null : null;
  const activeTask = activeTaskId ? localTasks.find(t => t.id === activeTaskId) : null;
  const catOptions = categories.map(c => ({ id: c.id, label: c.name }));
  const reqOptions = requesters.map(r => ({ id: r.id, label: r.name }));
  const memberOptions = members.map(m => ({ userId: m.userId, username: m.username }));
  const hasActiveFilters = !!(search || priority || category || requester || assignee || onlyMine);

  return (
    <div className="kb-boardwrap">
      <div className="kb-boardheader">
        <div>
          <h1 className="kb-boardheader__title">{board.name}</h1>
        </div>
        <div className="kb-boardheader__members" title={members.map(m => m.username).join(', ')}>
          <AvatarStack names={members.map(m => m.username)} />
        </div>
        <div className="kb-boardheader__spacer" />
        <div className="kb-boardheader__actions">
          <div className="kb-dropdown">
            <Button onClick={runSummary} loading={aiBusy}>
              <Sparkles size={15} /> AI summary
            </Button>
            {aiSummary && (
              <div className="kb-dropdown__menu" style={{ right: 0, left: 'auto', minWidth: 340, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Standup summary</div>
                <p style={{ fontSize: 'var(--kb-fs-sm)', lineHeight: 1.6, color: 'var(--kb-text-secondary)' }}>{aiSummary.summary}</p>
                {aiSummary.wins.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 'var(--kb-fs-xs)', fontWeight: 600, color: 'var(--kb-success)', marginBottom: 4 }}>WINS</div>
                    {aiSummary.wins.map((w, i) => (
                      <div key={i} style={{ fontSize: 'var(--kb-fs-sm)', color: 'var(--kb-text-secondary)' }}>• {w}</div>
                    ))}
                  </div>
                )}
                {aiSummary.risks.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 'var(--kb-fs-xs)', fontWeight: 600, color: 'var(--kb-warning)', marginBottom: 4 }}>RISKS</div>
                    {aiSummary.risks.map((r, i) => (
                      <div key={i} style={{ fontSize: 'var(--kb-fs-sm)', color: 'var(--kb-text-secondary)' }}>• {r}</div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <Button size="sm" onClick={() => setAiSummary(null)}>Close</Button>
                </div>
              </div>
            )}
          </div>
          <Button onClick={() => setImportOpen(true)}>
            <Download size={15} /> Import
          </Button>
          <Link href={`/board/${board.id}/settings`} className="kb-iconbtn" title="Board settings" aria-label="Board settings">
            <Settings2 size={16} />
          </Link>
          <Button
            variant="primary"
            onClick={() => {
              setCreateColumnId(undefined);
              setCreateOpen(true);
            }}
          >
            <Plus size={15} /> New task
          </Button>
        </div>
      </div>

      <div className="kb-filterbar">
        <div className="kb-filterbar__search">
          <span className="kb-filterbar__search-icon">
            <SlidersHorizontal size={13} />
          </span>
          <Input ref={searchInputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by title or description… (press /)" />
        </div>
        <Select className="kb-filterbar__select" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="">Priority: all</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select className="kb-filterbar__select" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Label: all</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select className="kb-filterbar__select" value={requester} onChange={e => setRequester(e.target.value)}>
          <option value="">Requester: all</option>
          {requesters.map(r => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </Select>
        <Select className="kb-filterbar__select" value={assignee} onChange={e => setAssignee(e.target.value)}>
          <option value="">Assignee: all</option>
          {members.map(m => (
            <option key={m.userId} value={m.username}>
              {m.username}
            </option>
          ))}
        </Select>
        <label className="kb-checkbox">
          <input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} />
          Only my tasks
        </label>
        {hasActiveFilters && (
          <button
            className="kb-filterbar__active"
            onClick={() => {
              setSearch('');
              setPriority('');
              setCategory('');
              setRequester('');
              setAssignee('');
              setOnlyMine(false);
            }}
          >
            Clear filters ×
          </button>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--kb-fs-sm)', color: 'var(--kb-text-muted)' }}>
          {localTasks.length} task{localTasks.length === 1 ? '' : 's'}
        </span>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="kb-boardcols">
          {localColumns.map(column => (
            <Column
              key={column.id}
              column={column}
              tasks={filteredByColumn.get(column.id) || []}
              selectedTaskId={selectedId}
              isOwner={isOwner}
              onSelectTask={t => setSelectedId(t.id)}
              onAddTask={colId => {
                setCreateColumnId(colId);
                setCreateOpen(true);
              }}
              onEditColumn={col => setColumnModal({ mode: 'edit', column: col })}
              onDeleteColumn={col => setColumnModal({ mode: 'delete', column: col })}
            />
          ))}
          <button className="kb-addcolumn" onClick={() => setColumnModal({ mode: 'create' })}>
            <Plus size={15} /> Add column
          </button>
        </div>

        <DragOverlay>{activeTask && <TaskCard task={activeTask} overlay />}</DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          columns={localColumns}
          categories={catOptions}
          requesters={reqOptions}
          members={memberOptions}
          currentUsername={user.username}
          isOwner={isOwner}
          onClose={() => setSelectedId(null)}
          onChanged={refresh}
        />
      )}

      <TaskCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        boardId={board.id}
        columns={localColumns}
        categories={catOptions}
        requesters={reqOptions}
        members={memberOptions}
        defaultColumnId={createColumnId}
        onCreated={refresh}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        boardId={board.id}
        columns={localColumns}
        onImported={refresh}
      />

      <ColumnModals
        state={columnModal}
        columns={localColumns}
        onClose={() => setColumnModal(null)}
        onSubmit={submitColumnModal}
        onDelete={submitDeleteColumn}
      />
    </div>
  );
}

function ColumnModals({
  state,
  columns,
  onClose,
  onSubmit,
  onDelete,
}: {
  state: ColumnModalState;
  columns: ColumnDTO[];
  onClose: () => void;
  onSubmit: (data: { name: string; wipLimit: number | null; isDone: boolean }) => void;
  onDelete: (moveToColumnId?: string) => void;
}) {
  const [name, setName] = useState('');
  const [wip, setWip] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [moveTo, setMoveTo] = useState('');

  useEffect(() => {
    if (state?.mode === 'edit') {
      setName(state.column.name);
      setWip(state.column.wipLimit != null ? String(state.column.wipLimit) : '');
      setIsDone(state.column.isDone);
    } else if (state?.mode === 'create') {
      setName('');
      setWip('');
      setIsDone(false);
    } else if (state?.mode === 'delete') {
      const firstOther = columns.find(c => c.id !== state.column.id);
      setMoveTo(firstOther?.id || '');
    }
  }, [state, columns]);

  if (!state) return null;

  if (state.mode === 'delete') {
    return (
      <Modal open onClose={onClose} title={`Delete "${state.column.name}"?`}>
        <p style={{ color: 'var(--kb-text-secondary)' }}>
          Tasks in this column will be moved to the column you choose. This cannot be undone.
        </p>
        <Field label="Move its tasks to">
          <Select value={moveTo} onChange={e => setMoveTo(e.target.value)}>
            {columns
              .filter(c => c.id !== state.column.id)
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </Field>
        <div className="kb-modal__footer" style={{ padding: 0, border: 'none' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger-solid" onClick={() => onDelete(moveTo)}>
            Delete column
          </Button>
        </div>
      </Modal>
    );
  }

  const editing = state.mode === 'edit';
  return (
    <Modal open onClose={onClose} title={editing ? 'Edit column' : 'Add column'}>
      <Field label="Column name">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. In QA" autoFocus />
      </Field>
      <Field label="WIP limit" hint="Maximum tasks allowed in this column at once. Leave empty for no limit.">
        <Input type="number" min={1} value={wip} onChange={e => setWip(e.target.value)} placeholder="No limit" />
      </Field>
      <label className="kb-checkbox">
        <input type="checkbox" checked={isDone} onChange={e => setIsDone(e.target.checked)} />
        This is a completion column (tasks here count as done)
      </label>
      <div className="kb-modal__footer" style={{ padding: 0, border: 'none' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!name.trim()} onClick={() => onSubmit({ name: name.trim(), wipLimit: wip ? Number(wip) : null, isDone })}>
          {editing ? 'Save changes' : 'Add column'}
        </Button>
      </div>
    </Modal>
  );
}
