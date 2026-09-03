import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { AuthForm } from './AuthForm';
import { GitBranch, Layers, Sparkles, KanbanSquare } from 'lucide-react';

export default async function LoginPage() {
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
            The kanban board your <em>IT team</em> actually enjoys using.
          </h2>
          <div className="kb-auth__pitch-features">
            <div className="kb-auth__feature">
              <span className="kb-auth__feature-icon">
                <KanbanSquare size={16} />
              </span>
              Fast boards with custom columns, WIP limits and keyboard-first UX
            </div>
            <div className="kb-auth__feature">
              <span className="kb-auth__feature-icon">
                <GitBranch size={16} />
              </span>
              Two-way sync with GitHub issues and Jira Cloud
            </div>
            <div className="kb-auth__feature">
              <span className="kb-auth__feature-icon">
                <Layers size={16} />
              </span>
              Import existing backlogs in a couple of clicks
            </div>
            <div className="kb-auth__feature">
              <span className="kb-auth__feature-icon">
                <Sparkles size={16} />
              </span>
              AI subtasks, descriptions and standup summaries via OpenRouter
            </div>
          </div>
        </div>
        <div className="kb-auth__brand-foot">Self-hosted. Your data stays on your machine.</div>
      </div>
      <div className="kb-auth__form-side">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
