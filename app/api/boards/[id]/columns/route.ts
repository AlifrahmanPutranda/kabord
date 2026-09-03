import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getBoardColumnsWithCounts, createColumn } from '@/lib/columns';

export const GET = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);
  return NextResponse.json({ columns: getBoardColumnsWithCounts(id) });
});

export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const body = await req.json();
  if (!body.name || !String(body.name).trim()) throw new ApiError(400, 'Column name is required');

  const wipLimit =
    body.wipLimit === null || body.wipLimit === undefined || body.wipLimit === ''
      ? null
      : Number(body.wipLimit);
  if (wipLimit !== null && (!Number.isInteger(wipLimit) || wipLimit < 1)) {
    throw new ApiError(400, 'WIP limit must be a positive integer or empty');
  }

  const column = createColumn(id, { name: String(body.name), wipLimit, isDone: !!body.isDone });
  return NextResponse.json({ column }, { status: 201 });
});
