import { NextRequest, NextResponse } from 'next/server';
import { withApi, requireUser, ApiError, type RouteCtx } from '@/lib/api-auth';
import {
  saveCredentials,
  deleteIntegration,
  maskGithub,
  maskJira,
  maskOpenRouter,
  normalizeJiraDomain,
  type Provider,
} from '@/lib/integrations/store';

const PROVIDERS: Provider[] = ['github', 'jira', 'openrouter'];

function parseProvider(raw: string): Provider {
  if (!PROVIDERS.includes(raw as Provider)) throw new ApiError(404, 'Unknown provider');
  return raw as Provider;
}

export const PUT = withApi(async (req: NextRequest, ctx: RouteCtx) => {
  const user = await requireUser();
  const provider = parseProvider((await ctx.params).provider);
  const body = await req.json();

  switch (provider) {
    case 'github': {
      const token = String(body.token || '').trim();
      if (!token) throw new ApiError(400, 'GitHub token is required');
      const config = saveCredentials(user.id, provider, { token }, maskGithub(token));
      return NextResponse.json({ config });
    }
    case 'jira': {
      const email = String(body.email || '').trim();
      const domain = normalizeJiraDomain(String(body.domain || ''));
      const token = String(body.token || '').trim();
      if (!email || !email.includes('@')) throw new ApiError(400, 'A valid Atlassian email is required');
      if (!domain || domain.includes(' ') || !domain.includes('.')) throw new ApiError(400, 'A valid Jira domain is required (e.g. myteam.atlassian.net)');
      if (!token) throw new ApiError(400, 'Jira API token is required');
      const config = saveCredentials(user.id, provider, { email, domain, token }, maskJira(email, domain));
      return NextResponse.json({ config });
    }
    case 'openrouter': {
      const apiKey = String(body.apiKey || '').trim();
      if (!apiKey) throw new ApiError(400, 'OpenRouter API key is required');
      const config = saveCredentials(user.id, provider, { apiKey }, maskOpenRouter(apiKey));
      return NextResponse.json({ config });
    }
  }
});

export const DELETE = withApi(async (_req: NextRequest, ctx: RouteCtx) => {
  const user = await requireUser();
  const provider = parseProvider((await ctx.params).provider);
  deleteIntegration(user.id, provider);
  return NextResponse.json({ success: true });
});
