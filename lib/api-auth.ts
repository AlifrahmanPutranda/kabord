import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './session';
import type { User } from './auth';
import { isBoardMember, isBoardOwner } from './boards';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type RouteCtx = { params: Promise<Record<string, string>> };

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, 'Unauthorized');
  return user;
}

export function requireBoardMember(boardId: string, user: User): void {
  if (!isBoardMember(boardId, user.id)) {
    throw new ApiError(403, 'You are not a member of this board');
  }
}

export function requireBoardOwner(boardId: string, user: User): void {
  if (!isBoardOwner(boardId, user.id)) {
    throw new ApiError(403, 'Board owner permission required');
  }
}

// CSRF defense-in-depth: reject cross-origin mutating requests (sameSite=lax is the primary layer).
export function assertSameOrigin(req: NextRequest): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return;
  const origin = req.headers.get('origin');
  if (!origin) return; // non-browser clients (curl) — session cookie still required
  try {
    if (new URL(origin).host !== req.nextUrl.host) {
      throw new ApiError(403, 'Cross-origin request rejected');
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(403, 'Invalid origin header');
  }
}

// Wrap a route handler: origin check + uniform error responses.
export function withApi(handler: (req: NextRequest, ctx: RouteCtx) => Promise<NextResponse>) {
  return async (req: NextRequest, ctx: RouteCtx): Promise<NextResponse> => {
    try {
      assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      console.error('API error:', e);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
