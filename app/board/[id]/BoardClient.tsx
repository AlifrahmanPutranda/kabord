'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task, Column as ColumnType, Priority, User, Activity } from '../types';
import Header from '../components/Header';
import StatsBar from '../components/StatsBar';
import FilterBar from '../components/FilterBar';
import ColumnComponent from '../components/ColumnComponent';
import TaskDetailModal from '../components/TaskDetailModal';
import TaskEditModal from '../components/TaskEditModal';
import TaskCreateModal from '../components/TaskCreateModal';
import Toast from '../components/Toast';
import { DragDropContextType, DropResult } from '../utils/dragDrop';

interface Board {
  id: string;
  name: string;
  description: string;
  ownerId: number;
}

interface Props {
  user: User;
  board: Board;
  initialTasks: Task[];
  columns: ColumnType[];
  priorities: Priority[];
  statuses: string[];
  categories: string[];
  requesters: string[];
  assignees: string[];
  isOwner: boolean;
}

export default function BoardClient({
  user,
  board,
  initialTasks,
  columns,
  priorities,
  statuses,
  categories,
  requesters,
  assignees,
  isOwner
}: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [dragDropContext, setDragDropContextType] = useState<DragDropContextType | null>(null);

  // Modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<{ show: boolean; columnId?: string }>({ show: false });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRequester, setFilterRequester] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // Toast state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const refreshTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/boards/${board.id}/tasks`);
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (error) {
      addToast('Failed to refresh tasks', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (taskId: string, sourceColumnId: string) => {
    setDragDropContextType({ taskId, sourceColumnId });
  };

  const handleDragEnd = async (result: DropResult) => {
    setDragDropContextType(null);

    const { taskId, sourceColumnId, destinationColumnId, destinationIndex } = result;

    if (!destinationColumnId || destinationIndex === undefined) return;

    if (sourceColumnId === destinationColumnId && result.sourceIndex === destinationIndex) {
      return; // No change
    }

    // Optimistic update
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, status: destinationColumnId };
      }
      return task;
    }));

    addToast('Task updated', 'success');

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: destinationColumnId }),
      });
    } catch (error) {
      // Rollback on error
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
        return { ...task, status: sourceColumnId };
        }
        return task;
      }));
      addToast('Failed to update task', 'error');
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    setShowCreateModal({ show: false });
    addToast('Task created successfully', 'success');
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    setEditingTask(null);
    addToast('Task updated successfully', 'success');
  };

  const handleTaskDeleted = async (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    setSelectedTask(null);
    addToast('Task deleted', 'success');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close modals on Escape
      if (e.key === 'Escape') {
        setSelectedTask(null);
        setEditingTask(null);
        setShowCreateModal({ show: false });
      }

      // Ctrl/Cmd + K to create new task
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCreateModal({ show: true, columnId: 'todo' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (task.archived) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    if (filterRequester !== 'all' && task.requestedBy !== filterRequester) return false;
    if (filterAssignee !== 'all' && task.assignee !== filterAssignee) return false;
    return true;
  });

  return (
    <div className="board-container">
      <Header
        user={user}
        board={board}
        isOwner={isOwner}
        onLogout={handleLogout}
      />
      <StatsBar tasks={filteredTasks} />
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterPriority={filterPriority}
        onPriorityChange={setFilterPriority}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        filterRequester={filterRequester}
        onRequesterChange={setFilterRequester}
        filterAssignee={filterAssignee}
        onAssigneeChange={setFilterAssignee}
        onNewTask={() => setShowCreateModal({ show: true })}
        categories={categories}
        requesters={requesters}
        assignees={assignees}
      />

      <div className="board">
        {columns.map(col => (
          <ColumnComponent
            key={col.id}
            column={col}
            tasks={filteredTasks.filter(t => t.status === col.id)}
            priorities={priorities}
            onTaskClick={setSelectedTask}
            onEditClick={setEditingTask}
            onNewTask={() => setShowCreateModal({ show: true, columnId: col.id })}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            dragDropContext={dragDropContext}
          />
        ))}
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => { setEditingTask(selectedTask); setSelectedTask(null); }}
          onDelete={handleTaskDeleted}
          isOwner={isOwner}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          priorities={priorities}
          statuses={statuses}
          categories={categories}
          requesters={requesters}
          assignees={assignees}
          onClose={() => setEditingTask(null)}
          onSave={handleTaskUpdated}
        />
      )}

      {showCreateModal.show && (
        <TaskCreateModal
          boardId={board.id}
          columnId={showCreateModal.columnId || 'todo'}
          priorities={priorities}
          categories={categories}
          requesters={requesters}
          assignees={assignees}
          onClose={() => setShowCreateModal({ show: false })}
          onSave={handleTaskCreated}
        />
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}
    </div>
  );
}
