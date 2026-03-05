'use client';

import { User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: Props) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">
          <span className="logo">📋</span>
          Kabord
        </h1>
        <span className="header-subtitle">IT Task Kanban Board</span>
      </div>
      <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user.username}</span>
            <span className="user-role">{user.role}</span>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-logout" title="Logout">
          <span>🚪</span>
          <span className="btn-text">Logout</span>
        </button>
      </div>
    </header>
  );
}
