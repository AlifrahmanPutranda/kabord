'use client';

import { User } from '../types';

interface Props {
  user: User;
  board?: {
    id: string;
    name: string;
  };
  isOwner?: boolean;
  onLogout: () => void;
}

export default function Header({ user, board, isOwner, onLogout }: Props) {
  return (
    <header className="header">
      <div className="header-left">
        <a href="/dashboard" className="header-back">
          ← Dashboard
        </a>
        <h1 className="header-title">
          <span className="logo">📋</span>
          {board ? (
            <span className="header-subtitle">{board.name}</span>
          ) : (
            <span className="header-subtitle">IT Task Kanban Board</span>
          )}
        </h1>

        <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user.username}</span>
            <span className="user-role">{user.role}</span>
          </div>
        </div>

        <div className="header-actions">
          {board && (
            <a href={`/board/${board.id}/settings`} className="btn btn-settings" title="Settings">
              ⚙️
            </a>
          )}
          <button onClick={onLogout} className="btn btn-logout" title="Logout">
            <span>🚪</span>
            <span className="btn-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
