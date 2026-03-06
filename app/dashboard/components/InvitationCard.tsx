'use client';

import { useState } from 'react';

interface Invitation {
  id: number;
  boardId: string;
  boardName: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface InvitationCardProps {
  invitation: Invitation;
  onAccept: () => void;
  onReject: () => void;
}

export default function InvitationCard({ invitation, onAccept, onReject }: InvitationCardProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'accept' | 'reject' | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    setAction('accept');
    await onAccept();
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    setAction('reject');
    await onReject();
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="invitation-card">
      <div className="invitation-content">
        <div className="invitation-info">
          <h4 className="invitation-board-name">{invitation.boardName}</h4>
          <p className="invitation-meta">
            Invited by <strong>{invitation.invitedBy}</strong> • {formatDate(invitation.createdAt)}
          </p>
        </div>
        <div className="invitation-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading && action === 'accept' ? 'Accepting...' : 'Accept'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleReject}
            disabled={loading}
          >
            {loading && action === 'reject' ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
