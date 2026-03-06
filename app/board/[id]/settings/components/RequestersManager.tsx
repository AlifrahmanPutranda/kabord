'use client';

import { useState } from 'react';

interface Requester {
  id: number;
  boardId: string;
  name: string;
  position: number;
}

interface RequestersManagerProps {
  boardId: string;
  requesters: Requester[];
  onRequesterAdded: (requester: Requester) => void;
  onRequesterUpdated: (requester: Requester) => void;
  onRequesterDeleted: (requesterId: number) => void;
}

export default function RequestersManager({
  boardId,
  requesters,
  onRequesterAdded,
  onRequesterUpdated,
  onRequesterDeleted,
}: RequestersManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/requesters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        onRequesterAdded(data.requester);
        setNewName('');
      } else {
        alert(data.error || 'Failed to add requester');
      }
    } catch (error) {
      console.error('Error adding requester:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (requesterId: number) => {
    if (!editName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/requesters/${requesterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        onRequesterUpdated(data.requester);
        setEditingId(null);
        setEditName('');
      } else {
        alert(data.error || 'Failed to update requester');
      }
    } catch (error) {
      console.error('Error updating requester:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (requesterId: number) => {
    if (!confirm('Are you sure you want to delete this requester?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/requesters/${requesterId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onRequesterDeleted(requesterId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete requester');
      }
    } catch (error) {
      console.error('Error deleting requester:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (requester: Requester) => {
    setEditingId(requester.id);
    setEditName(requester.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="settings-manager">
      <div className="add-form">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add new requester..."
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newName.trim()}
          className="btn btn-primary btn-sm"
        >
          Add
        </button>
      </div>

      <div className="items-list">
        {requesters.map((requester) => (
          <div key={requester.id} className="settings-item">
            {editingId === requester.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(requester.id)}
                  autoFocus
                />
                <button
                  onClick={() => handleUpdate(requester.id)}
                  disabled={loading}
                  className="btn btn-primary btn-sm"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className="item-name">{requester.name}</span>
                <div className="item-actions">
                  <button
                    onClick={() => startEdit(requester)}
                    className="btn-icon"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(requester.id)}
                    className="btn-icon danger"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {requesters.length === 0 && (
          <div className="empty-message">No requesters yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}
