'use client';

import { Task, Priority } from '../types';

interface Props {
  task: Task;
  priorities: Priority[];
  onClick: () => void;
  onEdit: () => void;
  onDragStart: () => void;
  draggable: boolean;
  isDragging: boolean;
  isOver: boolean;
  index: number;
}

export default function TaskCard({
  task,
  priorities,
  onClick,
  onEdit,
  onDragStart,
  draggable,
  isDragging,
  isOver,
  index,
}: Props) {
  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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

  const priorityConfig = priorities.find(p => p.id === task.priority);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart();
  };

  return (
    <div
      className={`task-card priority-${task.priority} ${isDragging ? 'task-dragging' : ''}`}
      data-task-id={task.id}
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={onClick}
      style={{
        borderLeftColor: priorityConfig?.color || '#64748b',
      }}
    >
      <div className="task-card-header">
        <h4 className="task-title">{task.title}</h4>
        <button
          className="task-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit task"
        >
          ⋮
        </button>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-badges">
        <span
          className="badge priority-badge"
          style={{
            backgroundColor: `${priorityConfig?.color}20`,
            color: priorityConfig?.color,
          }}
        >
          {task.priority}
        </span>
        {task.category && (
          <span className="badge category-badge">{task.category}</span>
        )}
      </div>

      <div className="task-footer">
        <div className="task-avatars">
          {task.requestedBy && (
            <div
              className="avatar avatar-requester"
              title={`Requester: ${task.requestedBy}`}
            >
              {getInitials(task.requestedBy)}
            </div>
          )}
          {task.assignee && (
            <div
              className="avatar avatar-assignee"
              title={`Assignee: ${task.assignee}`}
            >
              {getInitials(task.assignee)}
            </div>
          )}
          {!task.assignee && (
            <span className="unassigned-label">Unassigned</span>
          )}
        </div>

        {task.dueDate && (
          <div
            className={`task-due-date ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}
            title={isOverdue(task.dueDate, task.status) ? 'Overdue' : 'Due date'}
          >
            <span className="due-date-icon">📅</span>
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>

      {task.activity && task.activity.length > 0 && (
        <div className="task-activity-preview">
          <span className="activity-dot">●</span>
          <span className="activity-count">{task.activity.length} updates</span>
        </div>
      )}
    </div>
  );
}
