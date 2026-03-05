'use client';

import { useState } from 'react';

interface Props {
  status: string;
  priorities: string[];
  categories: string[];
  requesters: string[];
  assignees: string[];
  onTaskCreated: () => void;
}

export default function TaskForm({ status, priorities, categories, requesters, assignees, onTaskCreated }: Props) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [requestedBy, setRequestedBy] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('System');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        priority,
        status,
        requestedBy,
        assignee,
        dueDate,
        category,
      }),
    });

    setTitle('');
    setDescription('');
    setRequestedBy('');
    setAssignee('');
    setDueDate('');
    setShow(false);
    onTaskCreated();
  };

  if (!show) {
    return (
      <button className="add-btn" onClick={() => setShow(true)}>
        + Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
      <div className="form-group">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          required
          style={{ width: '100%' }}
        />
      </div>
      <div className="form-group">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description..."
          style={{ width: '100%', minHeight: '60px', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', padding: '0.5rem' }}
        />
      </div>
      <div className="form-row">
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%' }}>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} style={{ width: '100%' }}>
          <option value="">Requester</option>
          {requesters.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="form-row">
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ width: '100%' }}>
          <option value="">Assignee</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
        <button type="button" className="btn btn-secondary" onClick={() => setShow(false)}>Cancel</button>
      </div>
    </form>
  );
}