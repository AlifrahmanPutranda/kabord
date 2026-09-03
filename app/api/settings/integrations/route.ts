import { NextResponse } from 'next/server';
import { withApi, requireUser } from '@/lib/api-auth';
import { listIntegrations } from '@/lib/integrations/store';

export const GET = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json({ configs: listIntegrations(user.id) });
});
