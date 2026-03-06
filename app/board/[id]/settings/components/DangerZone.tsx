'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DangerZoneProps {
  boardId: string;
  boardName: string;
  onBoardDeleted: () => void;
}

export default function DangerZone({ boardId, boardName, onBoardDeleted }: DangerZoneProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== boardName) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onBoardDeleted();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete board');
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      alert('Failed to delete board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="danger-zone-content">
      {!showConfirm ? (
        <>
          <p className="danger-description">
            Once you delete a board, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            className="btn btn-danger"
          >
            Delete this board
          </button>
        </>
      ) : (
        <div className="confirm-delete">
          <p className="confirm-message">
            Type <strong>{boardName}</strong> to confirm deletion:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={boardName}
            className="confirm-input"
          />
          <div className="confirm-actions">
            <button
              onClick={() => {
                setShowConfirm(false);
                setConfirmText('');
              }}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={loading || confirmText !== boardName}
            >
              {loading ? 'Deleting...' : 'Delete Board'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
