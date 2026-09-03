import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getTasksByBoard, createTaskInBoard } from '@/lib/tasks';
import { getBoardColumns, isColumnOfBoard } from '@/lib/columns';
import crypto from 'crypto';

// GET /api/boards/[id]/tasks - Get board tasks
export const GET = withApi(async (_request: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const tasks = getTasksByBoard(id);
  return NextResponse.json({ tasks });
});

// POST /api/boards/[id]/tasks - Create task in board
export const POST = withApi(async (request: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const body = await request.json();
  const { title, description, priority, columnId, requestedBy, assignee, dueDate, category } = body;

  if (!title || !String(title).trim()) {
    throw new ApiError(400, 'Title is required');
  }
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    throw new ApiError(400, 'Invalid priority');
  }

  // Column: optional — defaults to the board's first column.
  const columns = getBoardColumns(id);
  if (columns.length === 0) throw new ApiError(400, 'Board has no columns');
  let status: string;
  if (columnId) {
    if (!isColumnOfBoard(String(columnId), id)) throw new ApiError(400, 'Invalid column for this board');
    status = String(columnId);
  } else {
    status = columns[0].id;
  }

  const taskId = `task-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const task = createTaskInBoard(
    id,
    {
      id: taskId,
      title: String(title).trim(),
      description: description ? String(description) : '',
      priority: priority || 'medium',
      status,
      requestedBy: requestedBy ? String(requestedBy) : '',
      assignee: assignee ? String(assignee) : '',
      dueDate: dueDate ? String(dueDate) : '',
      category: category ? String(category) : '',
    },
    user.id
  );

  return NextResponse.json({ task }, { status: 201 });
});
