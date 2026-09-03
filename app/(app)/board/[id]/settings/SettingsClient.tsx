'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ColumnsManager } from './components/ColumnsManager';
import { LabelsManager } from './components/LabelsManager';
import { RequestersManager } from './components/RequestersManager';
import { MembersManager } from './components/MembersManager';
import { DangerZone } from './components/DangerZone';
import type { ColumnDTO } from '@/lib/types';

interface SettingsClientProps {
  board: { id: string; name: string; description: string };
  columns: (ColumnDTO & { taskCount: number })[];
  categories: Array<{ id: number; name: string; color: string; position: number }>;
  requesters: Array<{ id: number; name: string; position: number }>;
  members: Array<{ id: number; userId: number; username: string; role: 'owner' | 'member'; joinedAt: string }>;
  isOwner: boolean;
}

export function SettingsClient({ board, columns, categories, requesters, members, isOwner }: SettingsClientProps) {
  return (
    <div className="kb-settings">
      <div>
        <Link href={`/board/${board.id}`} className="kb-btn kb-btn--ghost kb-btn--sm" style={{ paddingLeft: 0 }}>
          <ArrowLeft size={14} /> Back to board
        </Link>
        <h1 className="kb-settings__title" style={{ marginTop: 8 }}>
          Board settings
        </h1>
        <p className="kb-settings__sub">{board.name}</p>
      </div>

      <ColumnsManager boardId={board.id} columns={columns} isOwner={isOwner} />
      <LabelsManager boardId={board.id} categories={categories} />
      <RequestersManager boardId={board.id} requesters={requesters} />
      <MembersManager boardId={board.id} members={members} isOwner={isOwner} />
      {isOwner && <DangerZone boardId={board.id} boardName={board.name} />}
    </div>
  );
}
