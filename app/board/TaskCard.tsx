'use client';

import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  requestedBy: string;
  assignee: string;
  dueDate: string;
  category: string;
  createdAt: string;
  archived: boolean;
  activity: { time: string; text: string }[];
}

interface Props {
  task: Task;
  priorities: string[];
  statuses: string[];
  categories: string[];
  requesters: string[];
  assignees: string[];
  onTaskUpdated: () => void;
}

export default function TaskCard({ task, priorities, statuses, categories, requesters, assignees, onTaskUpdated }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === 'done') return false;
    return new Date(dueDate) < new Date();
  };

  const handleArchive = async () => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true, status: 'archived' }),
    });
    setShowMenu(false);
    onTaskUpdated();
  };

  return (
    <>
      <div
        className={`task-card priority-${task.priority}`}
        style={{ position: 'relative' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span
            className="task-title"
            style={{ flex: 1, cursor: 'pointer' }}
            onClick={() => setShowDetail(true)}
          >
            {task.title}
          </span>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            ⋮
          </button>
        </div>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '2rem',
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 10,
              minWidth: '120px'
            }}
          >
            <button
              onClick={() => { setShowDetail(true); setShowMenu(false); }}
              style={{ display: 'block', width: '100%', padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              View
            </button>
            <button
              onClick={() => { setShowEdit(true); setShowMenu(false); }}
              style={{ display: 'block', width: '100%', padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              Edit
            </button>
            <button
              onClick={handleArchive}
              style={{ display: 'block', width: '100%', padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--danger)' }}
            >
              Archive
            </button>
          </div>
        )}

        <div className="task-meta">
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          <span className={`badge badge-${task.status}`}>{task.status}</span>
        </div>
        <p className="task-description">{task.description}</p>
        <div className="task-footer">
          <div className="task-assignee">
            <div className="assignee-avatar" title={`Requester: ${task.requestedBy || '-'}`}>
              {getInitials(task.requestedBy)}
            </div>
            <div className="assignee-avatar" title={`Assignee: ${task.assignee || 'Unassigned'}`}>
              {getInitials(task.assignee)}
            </div>
            <span style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.requestedBy || '-'} → {task.assignee || '?'}
            </span>
          </div>
          <div className={`task-due-date ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}>
            {formatDate(task.dueDate) || 'No date'}
          </div>
        </div>
      </div>

      {showDetail && (
        <DetailModal task={task} onClose={() => setShowDetail(false)} />
      )}

      {showEdit && (
        <EditTaskModal
          task={task}
          priorities={priorities}
          statuses={statuses}
          categories={categories}
          requesters={requesters}
          assignees={assignees}
          onClose={() => setShowEdit(false)}
          onSaved={onTaskUpdated}
        />
      )}
    </>
  );
}

function DetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task.title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-meta">
            <div className="detail-meta-item">
              <label>Requester</label>
              <span>{task.requestedBy || '-'}</span>
            </div>
            <div className="detail-meta-item">
              <label>Assignee</label>
              <span>{task.assignee || 'Unassigned'}</span>
            </div>
            <div className="detail-meta-item">
              <label>Priority</label>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            </div>
            <div className="detail-meta-item">
              <label>Status</label>
              <span className={`badge badge-${task.status}`}>{task.status}</span>
            </div>
            <div className="detail-meta-item">
              <label>Due Date</label>
              <span>{task.dueDate || 'No date'}</span>
            </div>
            <div className="detail-meta-item">
              <label>Category</label>
              <span>{task.category}</span>
            </div>
          </div>
          <div className="detail-section">
            <h3>Description</h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>{task.description || 'No description'}</p>
          </div>
          <div className="detail-section">
            <h3>Activity</h3>
            {task.activity?.map((a, i) => (
              <div key={i} className="activity-item">
                <span className="activity-time">{a.time}</span>
                <span className="activity-text">{a.text}</span>
              </div>
            ))}
            {(!task.activity || task.activity.length === 0) && (
              <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditTaskModal({
  task,
  priorities,
  statuses,
  categories,
  requesters,
  assignees,
  onClose,
  onSaved
}: {
  task: Task;
  priorities: string[];
  statuses: string[];
  categories: string[];
  requesters: string[];
  assignees: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [requestedBy, setRequestedBy] = useState(task.requestedBy || '');
  const [assignee, setAssignee] = useState(task.assignee || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [category, setCategory] = useState(task.category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, status, requestedBy, assignee, dueDate, category }),
    });
    onClose();
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Task</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', minHeight: '80px', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', padding: '0.5rem' }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Requester</label>
                <select value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)}>
                  <option value="">-</option>
                  {requesters.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Assignee</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {assignees.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}