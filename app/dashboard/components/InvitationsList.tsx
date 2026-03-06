'use client';

interface Invitation {
  id: number;
  boardId: string;
  boardName: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface Props {
  invitations: Invitation[];
  onAccept: (invitationId: number) => void;
  onReject: (invitationId: number) => void;
}

export default function InvitationsList({ invitations, onAccept, onReject }: Props) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="invitation-section">
      <div className="invitation-section-title">
        <span className="invitation-icon">📩</span>
        Pending Invitations ({invitations.length})
      </div>
      <div className="invitation-list">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="invitation-card">
            <div className="invitation-info">
              <div className="invitation-board-name">{invitation.boardName}</div>
              <div className="invitation-meta">
                Invited by <strong>{invitation.invitedBy}</strong> • {formatDate(invitation.createdAt)}
              </div>
            </div>
            <div className="invitation-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAccept(invitation.id)}
              >
                Accept
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onReject(invitation.id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
