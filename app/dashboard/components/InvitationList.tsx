'use client';

import { useState, useEffect } from 'react';
import InvitationCard from './InvitationCard';

interface Invitation {
  id: number;
  boardId: string;
  boardName: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface InvitationListProps {
  onInvitationHandled?: () => void;
}

export default function InvitationList({ onInvitationHandled }: InvitationListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/invitations');
      const data = await res.json();
      if (res.ok) {
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (invitationId: number) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'PUT',
      });

      if (res.ok) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        onInvitationHandled?.();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleReject = async (invitationId: number) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/reject`, {
        method: 'PUT',
      });

      if (res.ok) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  if (loading) return null;

  if (invitations.length === 0) return null;

  return (
    <div className="invitation-section">
      <h3 className="invitation-section-title">
        <span className="invitation-icon">📬</span>
        Pending Invitations ({invitations.length})
      </h3>
      <div className="invitation-list">
        {invitations.map((invitation) => (
          <InvitationCard
            key={invitation.id}
            invitation={invitation}
            onAccept={() => handleAccept(invitation.id)}
            onReject={() => handleReject(invitation.id)}
          />
        ))}
      </div>
    </div>
  );
}
