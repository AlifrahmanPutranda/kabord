'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BoardList from './components/BoardList';
import CreateBoardModal from './components/CreateBoardModal';
import InvitationsList from './components/InvitationsList';

interface User {
  id: number;
  username: string;
  role: string;
}

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

interface Invitation {
  id: number;
  boardId: string;
  boardName: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface DashboardClientProps {
  user: User;
  initialBoards: Board[];
}

export default function DashboardClient({ user, initialBoards }: DashboardClientProps) {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch invitations on mount
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const res = await fetch('/api/invitations');
        const data = await res.json();
        if (res.ok) {
          setInvitations(data.invitations || []);
        }
      } catch (error) {
        console.error('Error fetching invitations:', error);
      }
    };
    fetchInvitations();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const refreshBoards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      if (res.ok) {
        setBoards(data.boards);
      }
    } catch (error) {
      console.error('Error refreshing boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardCreated = (newBoard: Board) => {
    setBoards((prev) => [newBoard, ...prev]);
    setShowCreateModal(false);
  };

  const handleBoardDeleted = (boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
  };

  const handleInvitationAccepted = async (invitationId: number) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        // Remove invitation from list
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
        // Refresh boards to include the new one
        refreshBoards();
      } else {
        alert(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleInvitationRejected = async (invitationId: number) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/reject`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      } else {
        alert(data.error || 'Failed to reject invitation');
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowCreateModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-left">
            <span className="dashboard-logo">📋</span>
            <div className="dashboard-header-title">
              <h1>Kabord</h1>
              <span className="dashboard-subtitle">IT Task Management</span>
            </div>
          </div>
          <div className="dashboard-header-right">
            <div className="user-info">
              <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{user.username}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              <span>🚪</span>
              <span className="btn-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <InvitationsList
            invitations={invitations}
            onAccept={handleInvitationAccepted}
            onReject={handleInvitationRejected}
          />
        )}

        <div className="dashboard-section-header">
          <h2>My Boards</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <span>+</span> New Board
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading boards...</div>
        ) : (
          <BoardList
            boards={boards}
            userId={user.id}
            onBoardDeleted={handleBoardDeleted}
          />
        )}

        {boards.length === 0 && !loading && (
          <div className="empty-state-dashboard">
            <span className="empty-icon">📋</span>
            <h3>No boards yet</h3>
            <p>Create your first board to start managing tasks</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <span>+</span> Create Board
            </button>
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBoardCreated}
        />
      )}
    </div>
  );
}
