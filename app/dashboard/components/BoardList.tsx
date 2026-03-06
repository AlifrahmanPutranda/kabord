'use client';

import BoardCard from './BoardCard';

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

interface BoardListProps {
  boards: Board[];
  userId: number;
  onBoardDeleted: (boardId: string) => void;
}

export default function BoardList({ boards, userId, onBoardDeleted }: BoardListProps) {
  return (
    <div className="board-grid">
      {boards.map((board) => (
        <BoardCard
          key={board.id}
          board={board}
          isOwner={board.ownerId === userId}
          onDelete={() => onBoardDeleted(board.id)}
        />
      ))}
    </div>
  );
}
