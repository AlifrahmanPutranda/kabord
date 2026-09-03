import { NextResponse } from 'next/server';
import { withApi, requireUser, ApiError } from '@/lib/api-auth';
import { requireOpenRouterKey, listModels, ProviderError } from '@/lib/integrations/openrouter';

export const GET = withApi(async () => {
  const user = await requireUser();
  try {
    const apiKey = requireOpenRouterKey(user.id);
    const result = await listModels(apiKey);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ProviderError) throw new ApiError(e.status === 400 ? 400 : 502, e.message);
    throw e;
  }
});
