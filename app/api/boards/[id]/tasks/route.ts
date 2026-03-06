import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { isBoardMember, isBoardOwner } from '@/lib/boards';
import { getTasksByBoard, createTaskInBoard } from '@/lib/tasks';

// GET /api/boards/[id]/tasks - Get board tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a member of the board
    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const tasks = getTasksByBoard(id);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/boards/[id]/tasks - Create task in board
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a member of the board
    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, priority, status, requestedBy, assignee, dueDate, category } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task = createTaskInBoard(id, {
      id: taskId,
      title: title.trim(),
      description: description || '',
      priority: priority || 'medium',
      status: status || 'todo',
      requestedBy: requestedBy || '',
      assignee: assignee || '',
      dueDate: dueDate || '',
      category: category || '',
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
