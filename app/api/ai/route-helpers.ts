import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { getTaskById } from '@/lib/tasks';
import { getBoardCategories } from '@/lib/board-settings';
import { getSubtasksForTask } from '@/lib/subtasks';
import { ProviderError } from '@/lib/integrations/openrouter';
import { aiGenerateSubtasks, aiWriteDescription, aiSuggest, aiBoardSummary } from '@/lib/ai';

// Shared guard + rate limit for AI endpoints.
async function guard(req: NextRequest) {
  const user = await requireUser();
  const rl = rateLimit(`ai:${user.id}`, RATE_LIMITS.ai.limit, RATE_LIMITS.ai.windowMs);
  if (!rl.ok) throw new ApiError(429, `AI rate limit reached — retry in ${rl.retryAfterSec}s`);
  return user;
}

function wrap(handler: (req: NextRequest, ctx: RouteCtx) => Promise<NextResponse>) {
  return withApi(async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ProviderError) throw new ApiError(e.status === 400 ? 400 : 502, e.message);
      if (e instanceof ApiError) throw e;
      throw new ApiError(502, e instanceof Error ? e.message : 'AI request failed');
    }
  });
}

function taskContext(task: any, existingSubtasks: string[] = []) {
  return {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    labels: task.category ? [task.category] : [],
    dueDate: task.dueDate || '',
    existingSubtasks,
  };
}

async function loadTask(userId: number, taskId: string) {
  const task = await getTaskById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  requireBoardMember(task.boardId, { id: userId, username: '', role: '' });
  return task;
}

export const aiRoutes = {
  subtasks: wrap(async (req) => {
    const user = await guard(req);
    const taskId = await taskIdFromBody(req);
    const task = await loadTask(user.id, taskId);
    const subtasks = await aiGenerateSubtasks(user.id, taskContext(task, getSubtasksForTask(taskId).map(s => s.title)));
    return NextResponse.json({ subtasks });
  }),

  description: wrap(async (req) => {
    const user = await guard(req);
    const taskId = await taskIdFromBody(req);
    const task = await loadTask(user.id, taskId);
    const description = await aiWriteDescription(user.id, {
      title: task.title,
      notes: task.description || '',
      labels: task.category ? [task.category] : [],
    });
    return NextResponse.json({ description });
  }),

  suggest: wrap(async (req) => {
    const user = await guard(req);
    const taskId = await taskIdFromBody(req);
    const task = await loadTask(user.id, taskId);
    const availableLabels = getBoardCategories(task.boardId).map(c => c.name);
    const suggestion = await aiSuggest(user.id, taskContext(task), availableLabels);
    return NextResponse.json({ suggestion });
  }),

  summary: wrap(async (req) => {
    const user = await guard(req);
    const body = await req.json().catch(() => ({}));
    const boardId = String(body?.boardId || '');
    if (!boardId) throw new ApiError(400, 'boardId is required');
    requireBoardMember(boardId, { id: user.id, username: '', role: '' });
    const summary = await aiBoardSummary(user.id, boardId);
    return NextResponse.json(summary);
  }),
};

async function taskIdFromBody(req: NextRequest): Promise<string> {
  const body = await req.json().catch(() => ({}));
  const taskId = String(body?.taskId || '');
  if (!taskId) throw new ApiError(400, 'taskId is required');
  return taskId;
}

