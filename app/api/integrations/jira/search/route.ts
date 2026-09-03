import { NextRequest, NextResponse } from 'next/server';
import { withApi, requireUser, ApiError } from '@/lib/api-auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { searchIssues } from '@/lib/integrations/jira';
import { ProviderError } from '@/lib/integrations/openrouter';
import { getDb } from '@/lib/db';

export const GET = withApi(async (req: NextRequest) => {
  const user = await requireUser();
  const rl = rateLimit(`jira:${user.id}`, RATE_LIMITS.integration.limit, RATE_LIMITS.integration.windowMs);
  if (!rl.ok) throw new ApiError(429, `Rate limited — retry in ${rl.retryAfterSec}s`);

  const project = req.nextUrl.searchParams.get('project') || '';
  const jqlParam = req.nextUrl.searchParams.get('jql') || '';
  const boardId = req.nextUrl.searchParams.get('boardId') || '';

  const jql = jqlParam.trim() || (project ? `project = "${project}" ORDER BY updated DESC` : 'ORDER BY updated DESC');

  try {
    const issues = await searchIssues(user.id, jql);

    const db = getDb();
    const findLink = db.prepare("SELECT taskId FROM task_links WHERE provider = 'jira' AND externalId = ?");
    const withFlags = issues.map(issue => {
      const link = findLink.get(issue.key) as { taskId: string } | undefined;
      let imported = !!link;
      if (link && boardId) {
        const t = db.prepare('SELECT boardId FROM tasks WHERE id = ?').get(link.taskId) as { boardId: string } | undefined;
        imported = t?.boardId === boardId;
      }
      return { ...issue, imported };
    });

    return NextResponse.json({ issues: withFlags, jql });
  } catch (e) {
    if (e instanceof ProviderError) throw new ApiError(e.status === 400 ? 400 : 502, e.message);
    throw e;
  }
});
