import { NextResponse } from 'next/server';
import { withApi, requireUser, ApiError } from '@/lib/api-auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { listProjects } from '@/lib/integrations/jira';
import { ProviderError } from '@/lib/integrations/openrouter';

export const GET = withApi(async () => {
  const user = await requireUser();
  const rl = rateLimit(`jira:${user.id}`, RATE_LIMITS.integration.limit, RATE_LIMITS.integration.windowMs);
  if (!rl.ok) throw new ApiError(429, `Rate limited — retry in ${rl.retryAfterSec}s`);

  try {
    const projects = await listProjects(user.id);
    return NextResponse.json({ projects });
  } catch (e) {
    if (e instanceof ProviderError) throw new ApiError(e.status === 400 ? 400 : 502, e.message);
    throw e;
  }
});
