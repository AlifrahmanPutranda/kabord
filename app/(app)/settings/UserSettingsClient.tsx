'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Moon, Sun, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Feedback';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import { relativeTime } from '@/lib/client/dates';

type Tab = 'appearance' | 'ai' | 'integrations' | 'account';

interface ConfigMeta {
  provider: 'github' | 'jira' | 'openrouter';
  status: 'untested' | 'ok' | 'error';
  lastTestedAt: string | null;
  mask: string | null;
}

export function UserSettingsClient({
  username,
  role,
  initialTheme,
  initialModel,
  configs,
}: {
  username: string;
  role: string;
  initialTheme: 'dark' | 'light';
  initialModel: string;
  configs: ConfigMeta[];
}) {
  const [tab, setTab] = useState<Tab>('appearance');
  const [integrationConfigs, setIntegrationConfigs] = useState(configs);

  const configFor = (p: ConfigMeta['provider']) => integrationConfigs.find(c => c.provider === p);

  return (
    <div className="kb-settings">
      <div>
        <h1 className="kb-settings__title">Settings</h1>
        <p className="kb-settings__sub">Personal preferences, integrations and account.</p>
      </div>

      <div className="kb-tabs">
        {(['appearance', 'ai', 'integrations', 'account'] as Tab[]).map(t => (
          <button key={t} className={`kb-tab ${tab === t ? 'kb-tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'ai' ? 'AI (OpenRouter)' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'appearance' && <AppearanceTab initialTheme={initialTheme} />}
      {tab === 'ai' && <AiTab initialModel={initialModel} openRouterConfig={configFor('openrouter')} />}
      {tab === 'integrations' && (
        <IntegrationsTab
          githubConfig={configFor('github')}
          jiraConfig={configFor('jira')}
          onSaved={() => api('/api/settings/integrations').then(r => setIntegrationConfigs(r.configs)).catch(() => {})}
        />
      )}
      {tab === 'account' && <AccountTab username={username} role={role} />}
    </div>
  );
}

function AppearanceTab({ initialTheme }: { initialTheme: 'dark' | 'light' }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="kb-settings__section">
      <div className="kb-settings__section-head">
        <div>
          <div className="kb-settings__section-title">Theme</div>
          <div className="kb-settings__section-desc">Kabord defaults to dark. Both themes are fully supported.</div>
        </div>
      </div>
      <div className="kb-settings__section-body">
        <div style={{ display: 'flex', gap: 12 }}>
          {(['dark', 'light'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="kb-provider"
              style={{
                cursor: 'pointer',
                width: 180,
                borderColor: theme === t ? 'var(--kb-accent)' : 'var(--kb-border-base)',
                borderWidth: 2,
                alignItems: 'center',
              }}
            >
              {t === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <span style={{ fontWeight: 600 }}>{t === 'dark' ? 'Dark' : 'Light'}</span>
              {theme === t && <Badge tone="accent">Active</Badge>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AiTab({ initialModel, openRouterConfig }: { initialModel: string; openRouterConfig?: ConfigMeta }) {
  const toast = useToast();
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(initialModel);
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([]);
  const [testing, setTesting] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [savingModel, setSavingModel] = useState(false);

  const loadModels = async () => {
    try {
      const res = await api<{ models: Array<{ id: string; name: string }>; default: string }>('/api/integrations/openrouter/models');
      setModels(res.models);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load models');
      return false;
    }
  };

  useEffect(() => {
    if (openRouterConfig?.status === 'ok') loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    try {
      await api('/api/settings/integrations/openrouter', { method: 'PUT', body: JSON.stringify({ apiKey: apiKey.trim() }) });
      toast.success('OpenRouter key saved (encrypted)');
      setApiKey('');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save key');
    } finally {
      setSavingKey(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const res = await api<{ ok: boolean; detail: string }>('/api/settings/integrations/openrouter/test', { method: 'POST' });
      if (res.ok) {
        toast.success(res.detail);
        await loadModels();
      } else {
        toast.error(res.detail);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const saveModel = async () => {
    setSavingModel(true);
    try {
      await api('/api/settings/preferences', { method: 'PUT', body: JSON.stringify({ aiModel: model }) });
      toast.success(`AI model set to ${model}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save model');
    } finally {
      setSavingModel(false);
    }
  };

  return (
    <>
      <div className="kb-settings__section">
        <div className="kb-settings__section-head">
          <div>
            <div className="kb-settings__section-title">OpenRouter API key</div>
            <div className="kb-settings__section-desc">
              Powers AI subtasks, descriptions, suggestions and board summaries. Get a key at openrouter.ai.
            </div>
          </div>
          {openRouterConfig && (
            <StatusBadge status={openRouterConfig.status} lastTestedAt={openRouterConfig.lastTestedAt} mask={openRouterConfig.mask} />
          )}
        </div>
        <div className="kb-settings__section-body">
          {openRouterConfig?.mask && (
            <div style={{ fontSize: 'var(--kb-fs-sm)', color: 'var(--kb-text-secondary)' }}>
              Current key: <code style={{ fontFamily: 'var(--kb-font-mono)' }}>{openRouterConfig.mask}</code>
            </div>
          )}
          <div className="kb-settings__form-row">
            <Input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={openRouterConfig ? 'Enter a new key to replace…' : 'sk-or-…'}
              style={{ flex: 1 }}
            />
            <Button variant="primary" loading={savingKey} disabled={!apiKey.trim()} onClick={saveKey}>
              Save key
            </Button>
            {openRouterConfig && (
              <Button loading={testing} onClick={test}>
                Test connection
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="kb-settings__section">
        <div className="kb-settings__section-head">
          <div>
            <div className="kb-settings__section-title">AI model</div>
            <div className="kb-settings__section-desc">Used for all AI features. Test the connection above to load the model list.</div>
          </div>
        </div>
        <div className="kb-settings__section-body">
          {models.length > 0 ? (
            <div className="kb-settings__form-row">
              <Select value={model} onChange={e => setModel(e.target.value)} style={{ flex: 1 }}>
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <Button variant="primary" loading={savingModel} onClick={saveModel}>
                Save model
              </Button>
            </div>
          ) : (
            <Field label="Model id" hint="e.g. openai/gpt-4o-mini — or test your connection to pick from a list.">
              <div className="kb-settings__form-row">
                <Input value={model} onChange={e => setModel(e.target.value)} style={{ flex: 1 }} />
                <Button variant="primary" loading={savingModel} onClick={saveModel}>
                  Save model
                </Button>
              </div>
            </Field>
          )}
        </div>
      </div>
    </>
  );
}

function IntegrationsTab({
  githubConfig,
  jiraConfig,
  onSaved,
}: {
  githubConfig?: ConfigMeta;
  jiraConfig?: ConfigMeta;
  onSaved: () => void;
}) {
  return (
    <>
      <GithubCard config={githubConfig} onSaved={onSaved} />
      <JiraCard config={jiraConfig} onSaved={onSaved} />
    </>
  );
}

function StatusBadge({ status, lastTestedAt, mask }: { status: string; lastTestedAt: string | null; mask: string | null }) {
  if (status === 'ok') {
    return (
      <span className="kb-provider__status kb-provider__status--ok">
        <CheckCircle2 size={13} /> Connected{mask ? ` · ${mask}` : ''}
        {lastTestedAt ? ` · ${relativeTime(lastTestedAt)}` : ''}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="kb-provider__status kb-provider__status--error">
        <XCircle size={13} /> Error{lastTestedAt ? ` · ${relativeTime(lastTestedAt)}` : ''}
      </span>
    );
  }
  return (
    <span className="kb-provider__status kb-provider__status--untested">
      {mask ? `${mask} · untested` : 'Not configured'}
    </span>
  );
}

function GithubCard({ config, onSaved }: { config?: ConfigMeta; onSaved: () => void }) {
  const toast = useToast();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);

  const save = async () => {
    setBusy('save');
    try {
      await api('/api/settings/integrations/github', { method: 'PUT', body: JSON.stringify({ token: token.trim() }) });
      toast.success('GitHub token saved (encrypted)');
      setToken('');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    try {
      const res = await api<{ ok: boolean; detail: string }>('/api/settings/integrations/github/test', { method: 'POST' });
      res.ok ? toast.success(res.detail) : toast.error(res.detail);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Test failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="kb-settings__section">
      <div className="kb-settings__section-head">
        <div>
          <div className="kb-settings__section-title">GitHub</div>
          <div className="kb-settings__section-desc">Import issues into boards and push tasks as issues. Needs a Personal Access Token with repo scope.</div>
        </div>
        {config && <StatusBadge status={config.status} lastTestedAt={config.lastTestedAt} mask={config.mask} />}
      </div>
      <div className="kb-settings__section-body">
        <div className="kb-settings__form-row">
          <Input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder={config ? 'Enter a new token to replace…' : 'ghp_… or github_pat_…'}
            style={{ flex: 1 }}
          />
          <Button variant="primary" loading={busy === 'save'} disabled={!token.trim()} onClick={save}>
            Save token
          </Button>
          {config && (
            <Button loading={busy === 'test'} onClick={test}>
              Test connection
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function JiraCard({ config, onSaved }: { config?: ConfigMeta; onSaved: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);

  const save = async () => {
    setBusy('save');
    try {
      await api('/api/settings/integrations/jira', {
        method: 'PUT',
        body: JSON.stringify({ email: email.trim(), domain: domain.trim(), token: token.trim() }),
      });
      toast.success('Jira credentials saved (encrypted)');
      setEmail('');
      setDomain('');
      setToken('');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    try {
      const res = await api<{ ok: boolean; detail: string }>('/api/settings/integrations/jira/test', { method: 'POST' });
      res.ok ? toast.success(res.detail) : toast.error(res.detail);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Test failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="kb-settings__section">
      <div className="kb-settings__section-head">
        <div>
          <div className="kb-settings__section-title">Jira Cloud</div>
          <div className="kb-settings__section-desc">Import issues via JQL and push tasks to your Atlassian site. Create an API token at id.atlassian.com.</div>
        </div>
        {config && <StatusBadge status={config.status} lastTestedAt={config.lastTestedAt} mask={config.mask} />}
      </div>
      <div className="kb-settings__section-body">
        <Field label="Atlassian email">
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Field label="Site domain">
          <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="myteam.atlassian.net" />
        </Field>
        <Field label="API token">
          <Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder={config ? 'Enter a new token to replace…' : 'ATATT…'} />
        </Field>
        <div className="kb-settings__form-row" style={{ justifyContent: 'flex-end' }}>
          {config && (
            <Button loading={busy === 'test'} onClick={test}>
              Test connection
            </Button>
          )}
          <Button
            variant="primary"
            loading={busy === 'save'}
            disabled={!email.trim() || !domain.trim() || !token.trim()}
            onClick={save}
          >
            Save credentials
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccountTab({ username, role }: { username: string; role: string }) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const change = async () => {
    if (next !== confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await api('/api/settings/account/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      toast.success('Password changed');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kb-settings__section">
      <div className="kb-settings__section-head">
        <div>
          <div className="kb-settings__section-title">Account</div>
          <div className="kb-settings__section-desc">
            Signed in as <strong>{username}</strong> · role: {role}
          </div>
        </div>
      </div>
      <div className="kb-settings__section-body">
        <Field label="Current password">
          <Input type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New password" hint="8+ chars with uppercase, lowercase and number.">
          <Input type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" loading={busy} disabled={!current || !next || next !== confirm} onClick={change}>
            Change password
          </Button>
        </div>
      </div>
    </div>
  );
}
