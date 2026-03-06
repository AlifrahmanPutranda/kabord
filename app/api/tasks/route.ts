import { NextRequest, NextResponse } from 'next/server';
import { isBoardMember } from '@/lib/boards';
import { getCurrentUser } from '@/lib/session';
import { getTasksByBoard, createTaskInBoard } from '@/lib/tasks';

// GET /api/tasks - Legacy endpoint (deprecated - use /api/boards/[id]/tasks)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For backward compatibility, return empty tasks array
  // Use /api/boards/[id]/tasks for board-scoped tasks
  return NextResponse.json({ tasks: [] });
}

// POST /api/tasks - Create task (requires boardId in body)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Require boardId for task creation
    const boardId = data.boardId;

    if (!boardId) {
      return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
    }

    // Check if user is a member of this board
    if (!isBoardMember(boardId, user.id)) {
      return NextResponse.json({ error: 'Access denied - you are not a member of this board' }, { status: 403 });
    }

    const task = createTaskInBoard(boardId, {
      id: `task-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      priority: data.priority || 'medium',
      status: data.status || 'todo',
      requestedBy: data.requestedBy || '',
      assignee: data.assignee || '',
      dueDate: data.dueDate || '',
      category: data.category || 'System'
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
