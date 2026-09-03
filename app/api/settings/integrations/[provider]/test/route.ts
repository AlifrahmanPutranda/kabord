import { NextResponse } from 'next/server';
import { withApi, requireUser, ApiError, type RouteCtx } from '@/lib/api-auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { getCredentials, updateStatus } from '@/lib/integrations/store';
import { testOpenRouter, providerFetch } from '@/lib/integrations/openrouter';

export const POST = withApi(async (_req, ctx: RouteCtx) => {
  const user = await requireUser();
  const provider = (await ctx.params).provider as 'github' | 'jira' | 'openrouter';

  const rl = rateLimit(`itest:${user.id}:${provider}`, RATE_LIMITS.integration.limit, RATE_LIMITS.integration.windowMs);
  if (!rl.ok) throw new ApiError(429, `Too many tests — retry in ${rl.retryAfterSec}s`);

  try {
    if (provider === 'github') {
      const creds = getCredentials<{ token: string }>(user.id, 'github');
      if (!creds) throw new ApiError(400, 'Save your GitHub token first');
      const body = await providerFetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${creds.token}`, Accept: 'application/vnd.github+json' },
        timeoutMs: 15000,
      });
      updateStatus(user.id, 'github', 'ok');
      return NextResponse.json({ ok: true, detail: `Authenticated as @${body?.login}` });
    }

    if (provider === 'jira') {
      const creds = getCredentials<{ email: string; domain: string; token: string }>(user.id, 'jira');
      if (!creds) throw new ApiError(400, 'Save your Jira credentials first');
      const basic = Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
      const body = await providerFetch(`https://${creds.domain}/rest/api/3/myself`, {
        headers: { Authorization: `Basic ${basic}` },
        timeoutMs: 15000,
      });
      updateStatus(user.id, 'jira', 'ok');
      return NextResponse.json({ ok: true, detail: `Authenticated as ${body?.displayName || creds.email}` });
    }

    if (provider === 'openrouter') {
      const creds = getCredentials<{ apiKey: string }>(user.id, 'openrouter');
      if (!creds) throw new ApiError(400, 'Save your OpenRouter key first');
      const result = await testOpenRouter(creds.apiKey);
      updateStatus(user.id, 'openrouter', 'ok');
      return NextResponse.json({ ok: true, detail: result.detail });
    }

    throw new ApiError(404, 'Unknown provider');
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const message = e instanceof Error ? e.message : 'Test failed';
    updateStatus(user.id, provider as any, 'error');
    return NextResponse.json({ ok: false, detail: message }, { status: 200 });
  }
});
