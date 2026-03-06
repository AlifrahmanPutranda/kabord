import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  // Redirect to dashboard since boards are now dynamic
  redirect('/dashboard');
}
