import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, createTask } from '@/lib/tasks';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tasks = await getAllTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const task = await createTask({
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
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}