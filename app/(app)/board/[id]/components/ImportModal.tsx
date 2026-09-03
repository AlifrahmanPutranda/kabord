'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Feedback';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/client/api';
import type { ColumnDTO } from '@/lib/types';

interface IssueItem {
  externalId: string;
  title: string;
  description: string;
  labels: string[];
  assignee: string | null;
  url: string;
  imported: boolean;
}

export function ImportModal({
  open,
  onClose,
  boardId,
  columns,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  boardId: string;
  columns: ColumnDTO[];
  onImported: () => void;
}) {
  const toast = useToast();
  const [provider, setProvider] = useState<'github' | 'jira'>('github');
  const [step, setStep] = useState<'source' | 'issues'>('source');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Source state
  const [repos, setRepos] = useState<Array<{ fullName: string }>>([]);
  const [repoQuery, setRepoQuery] = useState('');
  const [repo, setRepo] = useState('');
  const [projects, setProjects] = useState<Array<{ key: string; name: string }>>([]);
  const [project, setProject] = useState('');
  const [jql, setJql] = useState('');

  // Issue state
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [columnId, setColumnId] = useState('');

  useEffect(() => {
    if (!open) return;
    setProvider('github');
    setStep('source');
    setIssues([]);
    setSelected(new Set());
    setColumnId(columns[0]?.id || '');
  }, [open, columns]);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const res = await api<{ repos: Array<{ fullName: string }> }>(
        `/api/integrations/github/repos${repoQuery ? `?query=${encodeURIComponent(repoQuery)}` : ''}`
      );
      setRepos(res.repos);
      if (res.repos.length === 0) toast.info('No repositories found for this token');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load repos');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api<{ projects: Array<{ key: string; name: string }> }>('/api/integrations/jira/projects');
      setProjects(res.projects);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && provider === 'github' && step === 'source' && repos.length === 0 && !loading) loadRepos();
    if (open && provider === 'jira' && step === 'source' && projects.length === 0 && !loading) loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, provider, step]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      if (provider === 'github') {
        const res = await api<{ issues: IssueItem[] }>(
          `/api/integrations/github/issues?repo=${encodeURIComponent(repo)}&state=open&boardId=${boardId}`
        );
        setIssues(res.issues);
      } else {
        const params = new URLSearchParams({ boardId });
        if (project) params.set('project', project);
        if (jql.trim()) params.set('jql', jql.trim());
        const res = await api<{ issues: IssueItem[] }>(`/api/integrations/jira/search?${params}`);
        setIssues(res.issues);
      }
      setSelected(new Set());
      setStep('issues');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (externalId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(externalId)) next.delete(externalId);
      else next.add(externalId);
      return next;
    });
  };

  const importSelected = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const items = issues
        .filter(i => selected.has(i.externalId))
        .map(i => ({
          title: i.title,
          description: i.description,
          labels: i.labels,
          assignee: i.assignee || '',
          providerRef: i.externalId,
          url: i.url,
        }));
      const res = await api<{ tasks: unknown[]; skipped: Array<{ externalId: string }> }>(`/api/boards/${boardId}/import`, {
        method: 'POST',
        body: JSON.stringify({ provider, columnId, items }),
      });
      toast.success(`Imported ${res.tasks.length} task(s)${res.skipped.length ? `, skipped ${res.skipped.length} (already linked)` : ''}`);
      onImported();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Import from GitHub or Jira"
      footer={
        step === 'issues' ? (
          <>
            <Button onClick={() => setStep('source')}>Back</Button>
            <Button variant="primary" loading={importing} disabled={selected.size === 0} onClick={importSelected}>
              <Download size={14} /> Import {selected.size > 0 ? `${selected.size} task(s)` : ''}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Cancel</Button>
        )
      }
    >
      <div className="kb-tabs" style={{ marginBottom: 4 }}>
        <button className={`kb-tab ${provider === 'github' ? 'kb-tab--active' : ''}`} onClick={() => { setProvider('github'); setStep('source'); }}>
          GitHub
        </button>
        <button className={`kb-tab ${provider === 'jira' ? 'kb-tab--active' : ''}`} onClick={() => { setProvider('jira'); setStep('source'); }}>
          Jira
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spinner large />
        </div>
      )}

      {!loading && step === 'source' && provider === 'github' && (
        <>
          <div className="kb-settings__form-row">
            <Input
              value={repoQuery}
              onChange={e => setRepoQuery(e.target.value)}
              placeholder="Filter repositories…"
              style={{ flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && loadRepos()}
            />
            <Button onClick={loadRepos}>
              <RefreshCw size={13} /> Search
            </Button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {repos.map(r => (
              <button
                key={r.fullName}
                className="kb-dropdown__item"
                style={{ border: repo === r.fullName ? '1px solid var(--kb-border-accent)' : '1px solid transparent' }}
                onClick={() => setRepo(r.fullName)}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{r.fullName}</span>
                {repo === r.fullName && <span style={{ color: 'var(--kb-accent)' }}>✓</span>}
              </button>
            ))}
            {repos.length === 0 && <div style={{ color: 'var(--kb-text-muted)', textAlign: 'center', padding: 16 }}>No repositories found.</div>}
          </div>
          <Button variant="primary" disabled={!repo} onClick={loadIssues} style={{ alignSelf: 'flex-end' }}>
            Load open issues
          </Button>
        </>
      )}

      {!loading && step === 'source' && provider === 'jira' && (
        <>
          <Field label="Project">
            <Select value={project} onChange={e => setProject(e.target.value)}>
              <option value="">All projects</option>
              {projects.map(p => (
                <option key={p.key} value={p.key}>
                  {p.key} — {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="JQL (optional)" hint="e.g. assignee = currentUser() AND status != Done">
            <Input value={jql} onChange={e => setJql(e.target.value)} placeholder='project = "ABC" ORDER BY updated DESC' />
          </Field>
          <Button variant="primary" onClick={loadIssues} style={{ alignSelf: 'flex-end' }}>
            Search issues
          </Button>
        </>
      )}

      {!loading && step === 'issues' && (
        <>
          <Field label="Import into column">
            <Select value={columnId} onChange={e => setColumnId(e.target.value)}>
              {columns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {issues.map(issue => (
              <label
                key={issue.externalId}
                className="kb-dropdown__item"
                style={{
                  opacity: issue.imported ? 0.45 : 1,
                  cursor: issue.imported ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--kb-border-base)',
                  borderRadius: 'var(--kb-r-sm)',
                  gap: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(issue.externalId)}
                  disabled={issue.imported}
                  onChange={() => toggle(issue.externalId)}
                />
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {issue.title}
                  </span>
                  <span style={{ fontSize: 'var(--kb-fs-xs)', color: 'var(--kb-text-muted)', fontFamily: 'var(--kb-font-mono)' }}>
                    {issue.externalId}
                    {issue.labels.length > 0 && ` · ${issue.labels.join(', ')}`}
                  </span>
                </span>
                {issue.imported && <span style={{ fontSize: 'var(--kb-fs-xs)', color: 'var(--kb-text-muted)' }}>imported</span>}
              </label>
            ))}
            {issues.length === 0 && <div style={{ color: 'var(--kb-text-muted)', textAlign: 'center', padding: 16 }}>No issues found.</div>}
          </div>
        </>
      )}
    </Modal>
  );
}
