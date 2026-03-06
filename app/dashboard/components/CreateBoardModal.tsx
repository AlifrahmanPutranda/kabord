'use client';

import { useState, useEffect, useRef } from 'react';

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

interface CreateBoardModalProps {
  onClose: () => void;
  onCreated: (board: Board) => void;
}

export default function CreateBoardModal({ onClose, onCreated }: CreateBoardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Board name is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create board');
        setLoading(false);
        return;
      }

      onCreated(data.board);
    } catch (err) {
      setError('Failed to create board');
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal modal-form">
        <div className="modal-header">
          <h2 className="modal-title">Create New Board</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Board Name *</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter board name"
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter board description (optional)"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
