'use client';

import { Task } from '../types';

interface Props {
  tasks: Task[];
}

export default function StatsBar({ tasks }: Props) {
  const stats = {
    total: tasks.length,
    highPriority: tasks.filter(t => t.priority === 'high').length,
    inProgress: tasks.filter(t => t.status === 'inprogress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < new Date();
    }).length,
  };

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-icon">📊</span>
        <div className="stat-content">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
      </div>
      <div className="stat-item">
        <span className="stat-icon" style={{ color: '#ef4444' }}>⚠️</span>
        <div className="stat-content">
          <span className="stat-value" style={{ color: '#ef4444' }}>{stats.highPriority}</span>
          <span className="stat-label">High Priority</span>
        </div>
      </div>
      <div className="stat-item">
        <span className="stat-icon" style={{ color: '#3b82f6' }}>🔄</span>
        <div className="stat-content">
          <span className="stat-value" style={{ color: '#3b82f6' }}>{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
      </div>
      <div className="stat-item">
        <span className="stat-icon" style={{ color: '#22c55e' }}>✅</span>
        <div className="stat-content">
          <span className="stat-value" style={{ color: '#22c55e' }}>{stats.done}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>
      {stats.overdue > 0 && (
        <div className="stat-item stat-alert">
          <span className="stat-icon">🔴</span>
          <div className="stat-content">
            <span className="stat-value" style={{ color: '#ef4444' }}>{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      )}
    </div>
  );
}
