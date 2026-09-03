import { NextRequest, NextResponse } from 'next/server';
import { withApi, requireUser, ApiError } from '@/lib/api-auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { listIssues, requireGithubToken, parseRepoRef } from '@/lib/integrations/github';
import { ProviderError } from '@/lib/integrations/openrouter';
import { getDb } from '@/lib/db';

export const GET = withApi(async (req: NextRequest) => {
  const user = await requireUser();
  const rl = rateLimit(`gh:${user.id}`, RATE_LIMITS.integration.limit, RATE_LIMITS.integration.windowMs);
  if (!rl.ok) throw new ApiError(429, `Rate limited — retry in ${rl.retryAfterSec}s`);

  const ref = parseRepoRef(req.nextUrl.searchParams.get('repo') || '');
  if (!ref) throw new ApiError(400, 'repo query param must be owner/repo');

  try {
    const token = requireGithubToken(user.id);
    const state = (req.nextUrl.searchParams.get('state') as 'open' | 'closed' | 'all') || 'open';
    const issues = await listIssues(token, ref.owner, ref.repo, state);

    // Mark issues that are already linked to a task.
    const db = getDb();
    const findLink = db.prepare("SELECT taskId FROM task_links WHERE provider = 'github' AND externalId = ?");
    const boardId = req.nextUrl.searchParams.get('boardId');
    const withFlags = await Promise.all(
      issues.map(async issue => {
        const externalId = `${ref.owner}/${ref.repo}#${issue.number}`;
        const link = findLink.get(externalId) as { taskId: string } | undefined;
        let imported = !!link;
        if (link && boardId) {
          const t = db.prepare('SELECT boardId FROM tasks WHERE id = ?').get(link.taskId) as { boardId: string } | undefined;
          imported = t?.boardId === boardId;
        }
        return { ...issue, externalId, imported };
      })
    );

    return NextResponse.json({ issues: withFlags, repo: `${ref.owner}/${ref.repo}` });
  } catch (e) {
    if (e instanceof ProviderError) throw new ApiError(e.status === 400 ? 400 : 502, e.message);
    throw e;
  }
});
