'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Board {
  id: string;
  name: string;
  description: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  role: 'owner' | 'member';
  memberCount: number;
  taskCount: number;
}

interface BoardCardProps {
  board: Board;
  isOwner: boolean;
  onDelete: () => void;
}

export default function BoardCard({ board, isOwner, onDelete }: BoardCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleClick = () => {
    router.push(`/board/${board.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${board.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete board');
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      alert('Failed to delete board');
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="board-card" onClick={handleClick}>
      <div className="board-card-header">
        <h3 className="board-card-title">{board.name}</h3>
        {isOwner && (
          <div className="board-card-menu">
            <button
              className="menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              ⋮
            </button>
            {showMenu && (
              <div className="menu-dropdown">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="menu-item danger"
                >
                  {deleting ? 'Deleting...' : 'Delete Board'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {board.description && (
        <p className="board-card-description">{board.description}</p>
      )}

      <div className="board-card-stats">
        <div className="board-stat">
          <span className="stat-icon">📝</span>
          <span>{board.taskCount} tasks</span>
        </div>
        <div className="board-stat">
          <span className="stat-icon">👥</span>
          <span>{board.memberCount} members</span>
        </div>
      </div>

      <div className="board-card-footer">
        <span className="board-role">
          {board.role === 'owner' ? '👑 Owner' : '👤 Member'}
        </span>
        <span className="board-date">{formatDate(board.updatedAt)}</span>
      </div>
    </div>
  );
}
