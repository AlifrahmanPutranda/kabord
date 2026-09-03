import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getUserPreferences, DEFAULT_AI_MODEL } from '@/lib/prefs';
import { listIntegrations } from '@/lib/integrations/store';
import { UserSettingsClient } from './UserSettingsClient';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const prefs = getUserPreferences(user.id);
  const configs = listIntegrations(user.id);

  return (
    <UserSettingsClient
      username={user.username}
      role={user.role}
      initialTheme={prefs.theme}
      initialModel={prefs.aiModel || DEFAULT_AI_MODEL}
      configs={configs}
    />
  );
}
