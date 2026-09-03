'use client';

import Link from 'next/link';
import { MoreHorizontal, ListChecks, Users } from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { relativeTime } from '@/lib/client/dates';

export interface DashBoardCardData {
  id: string;
  name: string;
  description: string;
  role?: 'owner' | 'member';
  memberCount?: number;
  taskCount?: number;
  updatedAt: string;
}

export function BoardCard({ board, onDelete }: { board: DashBoardCardData; onDelete: (b: DashBoardCardData) => void }) {
  return (
    <Link href={`/board/${board.id}`} className="kb-boardcard">
      <div className="kb-boardcard__top">
        <span className="kb-boardcard__name">{board.name}</span>
        {board.role === 'owner' && (
          <span className="kb-boardcard__menu" onClick={e => e.preventDefault()}>
            <Dropdown
              trigger={
                <span className="kb-iconbtn" role="button" aria-label="Board menu">
                  <MoreHorizontal size={15} />
                </span>
              }
            >
              <DropdownItem danger onClick={() => onDelete(board)}>
                Delete board
              </DropdownItem>
            </Dropdown>
          </span>
        )}
      </div>
      {board.description && <p className="kb-boardcard__desc">{board.description}</p>}
      <div style={{ flex: 1 }} />
      <div className="kb-boardcard__meta">
        <span className="kb-boardcard__meta-item">
          <ListChecks size={13} /> {board.taskCount ?? 0} tasks
        </span>
        <span className="kb-boardcard__meta-item">
          <Users size={13} /> {board.memberCount ?? 1}
        </span>
        {board.role && (
          <Badge tone={board.role === 'owner' ? 'accent' : 'default'}>{board.role}</Badge>
        )}
        <span style={{ marginLeft: 'auto' }}>{relativeTime(board.updatedAt)}</span>
      </div>
    </Link>
  );
}
