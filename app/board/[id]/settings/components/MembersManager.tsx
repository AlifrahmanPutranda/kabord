'use client';

import { useState } from 'react';
import InviteMemberModal from './InviteMemberModal';

interface Member {
  id: number;
  boardId: string;
  userId: number;
  username: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

interface MembersManagerProps {
  boardId: string;
  members: Member[];
  isOwner: boolean;
  currentUserId: number;
  onMemberRemoved: (userId: number) => void;
}

export default function MembersManager({
  boardId,
  members,
  isOwner,
  currentUserId,
  onMemberRemoved,
}: MembersManagerProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemove = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onMemberRemoved(userId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberInvited = () => {
    setShowInviteModal(false);
    // Refresh members list - parent will handle
    window.location.reload();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="settings-manager">
      {isOwner && (
        <div className="section-actions">
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn btn-primary btn-sm"
          >
            + Invite Member
          </button>
        </div>
      )}

      <div className="members-list">
        {members.map((member) => (
          <div key={member.id} className="settings-item member-item">
            <div className="member-info">
              <div className="member-avatar">
                {member.username.charAt(0).toUpperCase()}
              </div>
              <div className="member-details">
                <span className="member-name">{member.username}</span>
                <span className="member-role-badge">
                  {member.role === 'owner' ? '👑 Owner' : '👤 Member'}
                </span>
              </div>
            </div>
            <div className="member-meta">
              <span className="member-date">Joined {formatDate(member.joinedAt)}</span>
              {isOwner && member.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(member.userId)}
                  disabled={loading}
                  className="btn-icon danger"
                  title="Remove member"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showInviteModal && (
        <InviteMemberModal
          boardId={boardId}
          onClose={() => setShowInviteModal(false)}
          onInvited={handleMemberInvited}
        />
      )}
    </div>
  );
}
