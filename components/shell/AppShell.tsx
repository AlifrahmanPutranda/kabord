'use client';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import type { BoardDTO, UserDTO } from '@/lib/types';
import type { PaletteTask } from '@/components/ui/CommandPalette';

interface AppShellProps {
  user: UserDTO;
  boards: Pick<BoardDTO, 'id' | 'name'>[];
  taskIndex: PaletteTask[];
  children: React.ReactNode;
}

export function AppShell({ user, boards, taskIndex, children }: AppShellProps) {
  return (
    <div className="kb-shell">
      <Sidebar user={user} boards={boards} />
      <div className="kb-shell__main">
        <Topbar boards={boards} />
        <div className="kb-shell__content">{children}</div>
      </div>
      <CommandPalette boards={boards} tasks={taskIndex} />
    </div>
  );
}
