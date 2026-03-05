'use client';

import { useState } from 'react';
import { Column as ColumnType, Task, Priority } from '../types';
import TaskCard from './TaskCard';

interface Props {
  column: ColumnType;
  tasks: Task[];
  priorities: Priority[];
  onTaskClick: (task: Task) => void;
  onEditClick: (task: Task) => void;
  onNewTask: () => void;
  onDragStart: (taskId: string, columnId: string) => void;
  onDragEnd: (result: { taskId: string; sourceColumnId: string; sourceIndex?: number; destinationColumnId?: string; destinationIndex?: number }) => void;
  dragDropContext: { taskId: string; sourceColumnId: string } | null;
}

export default function ColumnComponent({
  column,
  tasks,
  priorities,
  onTaskClick,
  onEditClick,
  onNewTask,
  onDragStart,
  onDragEnd,
  dragDropContext,
}: Props) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    if (dragDropContext) {
      // Calculate drop index
      const columnEl = e.currentTarget as HTMLElement;
      const taskCards = columnEl.querySelectorAll('[data-task-id]');
      let dropIndex = tasks.length;

      for (let i = 0; i < taskCards.length; i++) {
        const card = taskCards[i];
        const rect = card.getBoundingClientRect();
        const midPoint = rect.top + rect.height / 2;
        if (e.clientY < midPoint) {
          dropIndex = i;
          break;
        }
      }

      // Find source index
      const sourceIndex = tasks.findIndex(t => t.id === dragDropContext.taskId);

      onDragEnd({
        taskId: dragDropContext.taskId,
        sourceColumnId: dragDropContext.sourceColumnId,
        sourceIndex: sourceIndex >= 0 ? sourceIndex : undefined,
        destinationColumnId: column.id,
        destinationIndex: dropIndex,
      });
    }
  };

  return (
    <div
      className={`column ${isOver ? 'column-over' : ''}`}
      style={{ '--column-color': column.color } as React.CSSProperties}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="column-header-left">
          <span className="column-icon">{column.icon}</span>
          <span className="column-title">{column.title}</span>
        </div>
        <div className="column-header-right">
          <span className="column-count">{tasks.length}</span>
          <button className="btn btn-icon btn-add-task" onClick={onNewTask} title="Add task">
            +
          </button>
        </div>
      </div>

      <div className="column-content">
        <button className="btn btn-quick-add" onClick={onNewTask}>
          <span className="btn-icon">+</span>
          <span>Add Task</span>
        </button>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <p>No tasks in this column</p>
            <button className="btn btn-link" onClick={onNewTask}>Create one</button>
          </div>
        ) : (
          tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              priorities={priorities}
              onClick={() => onTaskClick(task)}
              onEdit={() => onEditClick(task)}
              onDragStart={() => onDragStart(task.id, column.id)}
              draggable={!dragDropContext || dragDropContext.taskId === task.id}
              isDragging={dragDropContext?.taskId === task.id}
              isOver={isOver}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}
