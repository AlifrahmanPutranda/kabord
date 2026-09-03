'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { usePalette } from '@/components/providers/PaletteProvider';
import { Kbd } from '@/components/ui/Feedback';
import type { BoardDTO } from '@/lib/types';

export function Topbar({ boards }: { boards: Pick<BoardDTO, 'id' | 'name'>[] }) {
  const pathname = usePathname();
  const palette = usePalette();

  // Derive a breadcrumb from the pathname.
  const segments = pathname.split('/').filter(Boolean);
  const boardId = segments[0] === 'board' ? segments[1] : null;
  const boardName = boardId ? boards.find(b => b.id === boardId)?.name : null;

  let crumbs: Array<{ label: string; href?: string; current?: boolean }> = [];
  if (segments[0] === 'dashboard' || segments.length === 0) {
    crumbs = [{ label: 'Dashboard', current: true }];
  } else if (boardId) {
    crumbs = [
      { label: 'Boards', href: '/dashboard' },
      ...(boardName ? [{ label: boardName, href: `/board/${boardId}` }] : [{ label: 'Board' }]),
    ];
    if (segments[2] === 'settings') crumbs.push({ label: 'Settings', current: true });
    else crumbs[crumbs.length - 1].current = true;
  } else if (segments[0] === 'settings') {
    crumbs = [{ label: 'Settings', current: true }];
  }

  return (
    <header className="kb-topbar">
      <nav className="kb-topbar__crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--kb-sp-2)', minWidth: 0 }}>
            {i > 0 && <span>/</span>}
            {c.href && !c.current ? (
              <Link href={c.href} className="kb-topbar__crumb">
                {c.label}
              </Link>
            ) : (
              <span className={`kb-topbar__crumb ${c.current ? 'kb-topbar__crumb--current' : ''}`}>{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="kb-topbar__spacer" />

      <div className="kb-topbar__actions">
        <button className="kb-searchtrigger" onClick={palette.open}>
          <Search size={14} />
          <span className="kb-searchtrigger__text">Search or jump to…</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>
    </header>
  );
}
