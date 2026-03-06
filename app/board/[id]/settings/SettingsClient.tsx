'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategoriesManager from './components/CategoriesManager';
import RequestersManager from './components/RequestersManager';
import MembersManager from './components/MembersManager';
import DangerZone from './components/DangerZone';

interface Board {
  id: string;
  name: string;
  description: string;
  ownerId: number;
}

interface Member {
  id: number;
  boardId: string;
  userId: number;
  username: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

interface Category {
  id: number;
  boardId: string;
  name: string;
  color: string;
  position: number;
}

interface Requester {
  id: number;
  boardId: string;
  name: string;
  position: number;
}

interface SettingsClientProps {
  board: Board;
  members: Member[];
  categories: Category[];
  requesters: Requester[];
  isOwner: boolean;
  currentUserId: number;
}

export default function SettingsClient({
  board,
  members,
  categories: initialCategories,
  requesters: initialRequesters,
  isOwner,
  currentUserId,
}: SettingsClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [requesters, setRequesters] = useState(initialRequesters);
  const [membersList, setMembersList] = useState(members);

  const handleCategoryAdded = (category: Category) => {
    setCategories((prev) => [...prev, category]);
  };

  const handleCategoryUpdated = (updated: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleCategoryDeleted = (categoryId: number) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const handleRequesterAdded = (requester: Requester) => {
    setRequesters((prev) => [...prev, requester]);
  };

  const handleRequesterUpdated = (updated: Requester) => {
    setRequesters((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleRequesterDeleted = (requesterId: number) => {
    setRequesters((prev) => prev.filter((r) => r.id !== requesterId));
  };

  const handleMemberRemoved = (userId: number) => {
    setMembersList((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleBoardDeleted = () => {
    router.push('/dashboard');
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="settings-header-content">
          <a href="/dashboard" className="back-link">
            ← Back to Dashboard
          </a>
          <h1 className="settings-title">{board.name} Settings</h1>
        </div>
      </header>

      <main className="settings-content">
        <section className="settings-section">
          <h2 className="section-title">Members ({membersList.length})</h2>
          <MembersManager
            boardId={board.id}
            members={membersList}
            isOwner={isOwner}
            currentUserId={currentUserId}
            onMemberRemoved={handleMemberRemoved}
          />
        </section>

        <section className="settings-section">
          <h2 className="section-title">Categories ({categories.length})</h2>
          <CategoriesManager
            boardId={board.id}
            categories={categories}
            onCategoryAdded={handleCategoryAdded}
            onCategoryUpdated={handleCategoryUpdated}
            onCategoryDeleted={handleCategoryDeleted}
          />
        </section>

        <section className="settings-section">
          <h2 className="section-title">Requesters ({requesters.length})</h2>
          <RequestersManager
            boardId={board.id}
            requesters={requesters}
            onRequesterAdded={handleRequesterAdded}
            onRequesterUpdated={handleRequesterUpdated}
            onRequesterDeleted={handleRequesterDeleted}
          />
        </section>

        {isOwner && (
          <section className="settings-section danger-zone">
            <h2 className="section-title">Danger Zone</h2>
            <DangerZone
              boardId={board.id}
              boardName={board.name}
              onBoardDeleted={handleBoardDeleted}
            />
          </section>
        )}
      </main>
    </div>
  );
}
