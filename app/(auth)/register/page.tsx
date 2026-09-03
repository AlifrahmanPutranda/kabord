import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { AuthForm } from '../AuthForm';

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="kb-auth">
      <div className="kb-auth__brand">
        <div className="kb-auth__brand-top">
          <span className="kb-auth__logo">K</span>
          <span className="kb-auth__brand-name">Kabord</span>
        </div>
        <div className="kb-auth__pitch">
          <h2 className="kb-auth__pitch-title">
            Set up your workspace in <em>under a minute</em>.
          </h2>
        </div>
        <div className="kb-auth__brand-foot">No email required — just a username and a strong password.</div>
      </div>
      <div className="kb-auth__form-side">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
