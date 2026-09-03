'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { api } from '@/lib/client/api';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      } else {
        await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="kb-auth__card">
      <div>
        <h1 className="kb-auth__card-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="kb-auth__card-sub" style={{ color: 'var(--kb-text-secondary)', marginTop: 6 }}>
          {mode === 'login' ? 'Log in to your Kabord workspace.' : 'Start managing your IT tasks like a pro.'}
        </p>
      </div>

      {error && (
        <div className="kb-auth__alert kb-auth__alert--error">
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {success && (
        <div className="kb-auth__alert kb-auth__alert--success">
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      <form className="kb-auth__form" onSubmit={submit}>
        <Field label="Username">
          <Input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. battousai"
            autoComplete="username"
            autoFocus
            required
          />
        </Field>
        <Field label="Password" hint={mode === 'register' ? 'Min 8 chars with upper, lower and number.' : undefined}>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </Field>
        {mode === 'register' && (
          <Field label="Confirm password">
            <Input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </Field>
        )}

        <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%' }}>
          {mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </form>

      <div className="kb-auth__footer">
        {mode === 'login' ? (
          <>
            No account yet? <Link href="/register">Create one</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/">Log in</Link>
          </>
        )}
      </div>
    </div>
  );
}
