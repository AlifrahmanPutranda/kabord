import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, deleteTask, archiveTask } from '@/lib/tasks';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json({ task });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    // Handle archive separately
    if (data.archived === true && data.status === 'archived') {
      await archiveTask(id);
      const task = await getTaskById(id);
      return NextResponse.json({ task });
    }

    const task = await updateTask(id, data);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const success = await deleteTask(id);
  if (!success) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
