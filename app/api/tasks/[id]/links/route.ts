import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError, requireUser, requireBoardMember, type RouteCtx } from '@/lib/api-auth';
import { getTaskById, updateTask } from '@/lib/tasks';
import { getLinksForTask, addLink } from '@/lib/links';
import { createIssue as createGithubIssue, requireGithubToken, parseRepoRef } from '@/lib/integrations/github';
import { createIssue as createJiraIssue } from '@/lib/integrations/jira';
import { ProviderError } from '@/lib/integrations/openrouter';

async function requireTaskMember(taskId: string) {
  const user = await requireUser();
  const task = await getTaskById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  requireBoardMember(task.boardId, user);
  return { user, task };
}

export const GET = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  await requireTaskMember(id);
  return NextResponse.json({ links: getLinksForTask(id) });
});

// POST — push this task upstream as a GitHub issue / Jira issue and link it.
export const POST = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const { id } = await ctx.params;
  const { user, task } = await requireTaskMember(id);

  const body = await req.json();
  const provider = body.provider as 'github' | 'jira';
  if (provider !== 'github' && provider !== 'jira') throw new ApiError(400, 'provider must be github or jira');

  const labels = task.category ? [task.category] : [];
  const description =
    (task.description || '') +
    (task.description ? '\n\n' : '') +
    `—\nCreated from Kabord${task.number != null ? ` (KAB-${task.number})` : ''}`;

  try {
    if (provider === 'github') {
      const repoRef = String(body.repo || '');
      const ref = parseRepoRef(repoRef);
      if (!ref) throw new ApiError(400, 'repo must be "owner/repo"');
      const token = requireGithubToken(user.id);
      const created = await createGithubIssue(token, ref.owner, ref.repo, {
        title: task.title,
        body: description,
        labels,
      });
      const link = addLink(id, 'github', `${ref.owner}/${ref.repo}#${created.number}`, created.url);
      await updateTask(id, {}, user.id).catch(() => {});
      return NextResponse.json({ link }, { status: 201 });
    }

    const projectKey = String(body.projectKey || '').trim();
    if (!projectKey) throw new ApiError(400, 'projectKey is required');
    const created = await createJiraIssue(user.id, projectKey, {
      summary: task.title,
      description,
      labels,
    });
    const link = addLink(id, 'jira', created.key, created.url);
    return NextResponse.json({ link }, { status: 201 });
  } catch (e) {
    if (e instanceof ProviderError) throw new ApiError(e.status === 400 ? 400 : 502, e.message);
    throw e;
  }
});
