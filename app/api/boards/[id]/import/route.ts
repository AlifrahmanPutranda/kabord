import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { importTasksToBoard, type ImportItem } from '@/lib/tasks';
import { isColumnOfBoard, getBoardColumns } from '@/lib/columns';

// POST /api/boards/[id]/import — batch import issues as tasks.
export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const body = await req.json();
  const provider = body.provider as 'github' | 'jira';
  if (provider !== 'github' && provider !== 'jira') throw new ApiError(400, 'provider must be github or jira');
  if (!Array.isArray(body.items) || body.items.length === 0) throw new ApiError(400, 'items array is required');
  if (body.items.length > 100) throw new ApiError(400, 'Max 100 items per import');

  let columnId = String(body.columnId || '');
  if (!columnId || !isColumnOfBoard(columnId, id)) {
    const columns = getBoardColumns(id);
    if (columns.length === 0) throw new ApiError(400, 'Board has no columns');
    columnId = columns[0].id;
  }

  const items: ImportItem[] = body.items.map((item: any) => ({
    title: String(item.title || ''),
    description: item.description ? String(item.description).slice(0, 8000) : '',
    labels: Array.isArray(item.labels) ? item.labels.map(String).slice(0, 10) : [],
    priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
    assignee: item.assignee ? String(item.assignee) : '',
    provider,
    externalId: String(item.providerRef || ''),
    url: String(item.url || ''),
  }));
  if (items.some(i => !i.externalId || !i.url)) throw new ApiError(400, 'Each item needs providerRef and url');

  const result = importTasksToBoard(id, columnId, items, user.id);
  return NextResponse.json({ tasks: result.tasks, skipped: result.skipped }, { status: 201 });
});
