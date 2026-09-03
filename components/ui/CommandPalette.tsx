'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, KanbanSquare, LayoutDashboard, ListChecks, Moon, Plus, Search, Settings } from 'lucide-react';
import { usePalette } from '@/components/providers/PaletteProvider';
import { useTheme } from '@/components/providers/ThemeProvider';

export interface PaletteTask {
  id: string;
  number: number | null;
  title: string;
  boardId: string;
  boardName: string;
}

interface Entry {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

export function CommandPalette({ boards, tasks }: { boards: Array<{ id: string; name: string }>; tasks: PaletteTask[] }) {
  const { isOpen, close } = usePalette();
  const { toggleTheme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const entries = useMemo<Entry[]>(() => {
    const all: Entry[] = [
      {
        id: 'go-dashboard',
        label: 'Go to Dashboard',
        icon: <LayoutDashboard size={15} />,
        run: () => router.push('/dashboard'),
      },
      {
        id: 'go-settings',
        label: 'Open Settings',
        icon: <Settings size={15} />,
        run: () => router.push('/settings'),
      },
      {
        id: 'new-board',
        label: 'Create new board',
        icon: <Plus size={15} />,
        run: () => router.push('/dashboard?new=1'),
      },
      {
        id: 'toggle-theme',
        label: 'Toggle dark / light theme',
        icon: <Moon size={15} />,
        run: () => toggleTheme(),
      },
      ...boards.map(b => ({
        id: `board-${b.id}`,
        label: b.name,
        hint: 'Board',
        icon: <KanbanSquare size={15} />,
        run: () => router.push(`/board/${b.id}`),
      })),
      ...tasks.map(t => ({
        id: `task-${t.id}`,
        label: t.title,
        hint: `${t.number != null ? `KAB-${t.number} · ` : ''}${t.boardName}`,
        icon: <ListChecks size={15} />,
        run: () => router.push(`/board/${t.boardId}?task=${t.id}`),
      })),
    ];

    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 12);
    return all
      .filter(e => {
        const hay = `${e.label} ${e.hint || ''}`.toLowerCase();
        return hay.includes(q) || (q.startsWith('kab-') && e.hint?.toLowerCase().includes(q));
      })
      .slice(0, 20);
  }, [boards, tasks, query, router, toggleTheme]);

  useEffect(() => setSelected(0), [query]);

  // Keep the selected item in view.
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!isOpen) return null;

  const runEntry = (entry: Entry) => {
    close();
    entry.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, entries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (entries[selected]) runEntry(entries[selected]);
    }
  };

  return (
    <div
      className="kb-palette-overlay"
      onMouseDown={e => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="kb-palette" role="dialog" aria-label="Command palette">
        <div className="kb-palette__inputrow">
          <Search size={16} />
          <input
            ref={inputRef}
            className="kb-palette__input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tasks, boards and commands…"
            aria-label="Search"
          />
        </div>
        <div className="kb-palette__list" ref={listRef}>
          {entries.length === 0 && <div className="kb-palette__empty">No results for “{query}”</div>}
          {entries.map((entry, idx) => (
            <button
              key={entry.id}
              data-idx={idx}
              className="kb-palette__item"
              aria-selected={idx === selected}
              onMouseEnter={() => setSelected(idx)}
              onClick={() => runEntry(entry)}
            >
              <span className="kb-palette__item-icon">{entry.icon}</span>
              <span className="kb-palette__item-label">{entry.label}</span>
              {entry.hint && <span className="kb-palette__item-hint">{entry.hint}</span>}
              {idx === selected && <CornerDownLeft size={12} style={{ color: 'var(--kb-text-muted)' }} />}
            </button>
          ))}
        </div>
        <div className="kb-palette__foot">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
