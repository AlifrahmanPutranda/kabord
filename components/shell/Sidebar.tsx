'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Moon, Plus, Settings, Sun, KanbanSquare } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem, DropdownSep } from '@/components/ui/Dropdown';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import type { BoardDTO, UserDTO } from '@/lib/types';

interface SidebarProps {
  user: UserDTO;
  boards: Pick<BoardDTO, 'id' | 'name'>[];
}

export function Sidebar({ user, boards }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Logout failed');
    }
  };

  return (
    <aside className="kb-sidebar">
      <div className="kb-sidebar__brand">
        <span className="kb-sidebar__logo">K</span>
        <span className="kb-sidebar__name">Kabord</span>
      </div>

      <nav className="kb-sidebar__nav">
        <Link href="/dashboard" className={`kb-sidebar__item ${pathname === '/dashboard' ? 'kb-sidebar__item--active' : ''}`}>
          <span className="kb-sidebar__item-icon">
            <LayoutDashboard size={16} />
          </span>
          <span className="kb-sidebar__item-label">Dashboard</span>
        </Link>
        <Link href="/settings" className={`kb-sidebar__item ${pathname === '/settings' ? 'kb-sidebar__item--active' : ''}`}>
          <span className="kb-sidebar__item-icon">
            <Settings size={16} />
          </span>
          <span className="kb-sidebar__item-label">Settings</span>
        </Link>

        <div className="kb-sidebar__section">
          <span>Boards</span>
          <Link href="/dashboard?new=1" title="New board" aria-label="New board">
            <Plus size={14} />
          </Link>
        </div>

        {boards.length === 0 && (
          <div style={{ padding: '2px 8px', fontSize: 'var(--kb-fs-sm)', color: 'var(--kb-text-muted)' }}>No boards yet</div>
        )}

        {boards.map(board => {
          const active = pathname === `/board/${board.id}` || pathname.startsWith(`/board/${board.id}/`);
          return (
            <Link key={board.id} href={`/board/${board.id}`} className={`kb-sidebar__item ${active ? 'kb-sidebar__item--active' : ''}`}>
              <span className="kb-sidebar__item-icon">
                <KanbanSquare size={16} />
              </span>
              <span className="kb-sidebar__item-label">{board.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="kb-sidebar__footer">
        <Dropdown
          up
          trigger={
            <button className="kb-usermenu">
              <Avatar name={user.username} />
              <span className="kb-usermenu__name">{user.username}</span>
            </button>
          }
        >
          <DropdownItem
            onClick={() => {
              router.push('/settings');
            }}
          >
            Settings
          </DropdownItem>
          <DropdownSep />
          <DropdownItem danger onClick={logout}>
            <LogOut size={14} /> Log out
          </DropdownItem>
        </Dropdown>

        <button
          className="kb-iconbtn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </aside>
  );
}
