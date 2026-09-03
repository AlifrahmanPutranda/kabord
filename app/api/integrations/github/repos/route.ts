import { NextRequest, NextResponse } from 'next/server';
import { withApi, requireUser, ApiError } from '@/lib/api-auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { listRepos, requireGithubToken } from '@/lib/integrations/github';
import { ProviderError } from '@/lib/integrations/openrouter';

export const GET = withApi(async (req: NextRequest) => {
  const user = await requireUser();
  const rl = rateLimit(`gh:${user.id}`, RATE_LIMITS.integration.limit, RATE_LIMITS.integration.windowMs);
  if (!rl.ok) throw new ApiError(429, `Rate limited — retry in ${rl.retryAfterSec}s`);

  try {
    const token = requireGithubToken(user.id);
    const query = req.nextUrl.searchParams.get('query') || '';
    const repos = await listRepos(token, query);
    return NextResponse.json({ repos });
  } catch (e) {
    if (e instanceof ProviderError) throw new ApiError(e.status === 400 ? 400 : 502, e.message);
    throw e;
  }
});
