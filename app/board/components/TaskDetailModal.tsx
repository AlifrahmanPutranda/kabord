'use client';

import { Task } from '../types';

interface Props {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (taskId: string) => void;
}

export default function TaskDetailModal({ task, onClose, onEdit, onDelete }: Props) {
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === 'done') return false;
    return new Date(dueDate) < new Date();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to archive this task?')) {
      onDelete(task.id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <span className={`status-indicator status-${task.status}`}></span>
            <h2 className="modal-title">{task.title}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="task-grid">
            <div className="task-field">
              <label>Requester</label>
              <div className="field-value with-avatar">
                {task.requestedBy && (
                  <div className="avatar avatar-small avatar-requester">
                    {getInitials(task.requestedBy)}
                  </div>
                )}
                <span>{task.requestedBy || '-'}</span>
              </div>
            </div>

            <div className="task-field">
              <label>Assignee</label>
              <div className="field-value with-avatar">
                {task.assignee && (
                  <div className="avatar avatar-small avatar-assignee">
                    {getInitials(task.assignee)}
                  </div>
                )}
                <span>{task.assignee || 'Unassigned'}</span>
              </div>
            </div>

            <div className="task-field">
              <label>Priority</label>
              <div className="field-value">
                <span className={`badge priority-badge priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
            </div>

            <div className="task-field">
              <label>Status</label>
              <div className="field-value">
                <span className={`badge status-badge status-${task.status}`}>
                  {task.status}
                </span>
              </div>
            </div>

            <div className="task-field">
              <label>Category</label>
              <div className="field-value">{task.category || '-'}</div>
            </div>

            <div className="task-field">
              <label>Due Date</label>
              <div className={`field-value ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}>
                {task.dueDate ? formatDate(task.dueDate) : '-'}
                {isOverdue(task.dueDate, task.status) && (
                  <span className="overdue-badge">Overdue</span>
                )}
              </div>
            </div>

            <div className="task-field">
              <label>Created</label>
              <div className="field-value">{formatDate(task.createdAt)}</div>
            </div>
          </div>

          <div className="task-section">
            <h3>Description</h3>
            <p className="task-description-full">
              {task.description || 'No description provided.'}
            </p>
          </div>

          <div className="task-section">
            <h3>Activity Log</h3>
            <div className="activity-log">
              {task.activity && task.activity.length > 0 ? (
                task.activity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-dot"></div>
                    <div className="activity-content">
                      <span className="activity-time">{activity.time}</span>
                      <span className="activity-text">{activity.text}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-activity">No activity yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={handleDelete}>
            Archive Task
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={onEdit}>
            Edit Task
          </button>
        </div>
      </div>
    </div>
  );
}
