import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { reorderColumns } from '@/lib/columns';

export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  requireBoardMember(id, user);

  const body = await req.json();
  if (!Array.isArray(body.columnIds) || (body.columnIds as unknown[]).some(x => typeof x !== 'string')) {
    throw new ApiError(400, 'columnIds must be an array of column ids');
  }

  try {
    const columns = reorderColumns(id, body.columnIds);
    return NextResponse.json({ columns });
  } catch (e) {
    throw new ApiError(400, e instanceof Error ? e.message : 'Invalid column order');
  }
});
