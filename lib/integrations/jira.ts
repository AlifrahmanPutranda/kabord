import { getCredentials } from './store';
import { providerFetch, ProviderError } from './openrouter';

function requireJira(userId: number): { email: string; domain: string; token: string; base: string } {
  const creds = getCredentials<{ email: string; domain: string; token: string }>(userId, 'jira');
  if (!creds?.token || !creds?.email || !creds?.domain) {
    throw new ProviderError('Connect your Jira site in Settings first', 400);
  }
  return { ...creds, base: `https://${creds.domain}` };
}

function jiraHeaders(creds: { email: string; token: string }, write = false): Record<string, string> {
  const basic = Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
  return {
    Authorization: `Basic ${basic}`,
    Accept: 'application/json',
    ...(write ? { 'X-Atlassian-Token': 'no-check' } : {}),
  };
}

// ---------- ADF helpers (Jira REST v3 requires Atlassian Document Format) ----------

export function textToAdf(text: string): unknown {
  const paragraphs = (text || '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
  const content = (paragraphs.length ? paragraphs : ['']).map(
    p => ({ type: 'paragraph', content: [{ type: 'text', text: p }] })
  );
  return { type: 'doc', version: 1, content };
}

export function adfToText(adf: unknown): string {
  const walk = (node: any): string => {
    if (!node || typeof node !== 'object') return '';
    if (node.type === 'text') return node.text || '';
    if (Array.isArray(node.content)) return node.content.map(walk).join(node.type === 'paragraph' ? '\n' : '');
    return '';
  };
  const doc = adf as any;
  if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content)) return '';
  return doc.content.map(walk).join('\n\n').trim();
}

// ---------- API ----------

export interface JiraProject {
  key: string;
  name: string;
}

export async function listProjects(userId: number): Promise<JiraProject[]> {
  const creds = requireJira(userId);
  const body = await providerFetch(`${creds.base}/rest/api/3/project/search?maxResults=50`, {
    headers: jiraHeaders(creds),
    timeoutMs: 20000,
  });
  const values = (body?.values || []) as any[];
  return values.map(p => ({ key: p.key, name: p.name }));
}

export interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  status: string;
  assignee: string | null;
  labels: string[];
  priority: string | null;
  updated: string;
  url: string;
}

export async function searchIssues(userId: number, jql: string): Promise<JiraIssue[]> {
  const creds = requireJira(userId);
  const fields = 'summary,description,status,assignee,labels,priority,updated';
  const limit = 50;

  // Current endpoint: POST /rest/api/3/search/jql. Fall back to the legacy
  // GET /search for sites that predate it.
  try {
    const body = await providerFetch(`${creds.base}/rest/api/3/search/jql?maxResults=${limit}&fields=${fields}`, {
      method: 'POST',
      headers: { ...jiraHeaders(creds, true), 'Content-Type': 'application/json' },
      body: JSON.stringify({ jql }),
      timeoutMs: 25000,
    });
    return mapJiraIssues(body, creds.base);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (/404|410|Not Found|Gone/i.test(msg)) {
      const body = await providerFetch(
        `${creds.base}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${limit}&fields=${fields}`,
        { headers: jiraHeaders(creds), timeoutMs: 25000 }
      );
      return mapJiraIssues(body, creds.base);
    }
    throw e;
  }
}

function mapJiraIssues(body: any, base: string): JiraIssue[] {
  const issues = (body?.issues || []) as any[];
  return issues.map(i => ({
    key: i.key,
    summary: i.fields?.summary || '',
    description: adfToText(i.fields?.description).slice(0, 8000),
    status: i.fields?.status?.name || '',
    assignee: i.fields?.assignee?.displayName || null,
    labels: (i.fields?.labels || []).slice(0, 10),
    priority: i.fields?.priority?.name || null,
    updated: i.fields?.updated || '',
    url: `${base}/browse/${i.key}`,
  }));
}

export async function createIssue(
  userId: number,
  projectKey: string,
  data: { summary: string; description: string; labels: string[]; issueType?: string }
): Promise<{ key: string; url: string }> {
  const creds = requireJira(userId);
  const body = await providerFetch(`${creds.base}/rest/api/3/issue`, {
    method: 'POST',
    headers: { ...jiraHeaders(creds, true), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey.toUpperCase() },
        issuetype: { name: data.issueType || 'Task' },
        summary: data.summary,
        description: textToAdf(data.description),
        ...(data.labels.length ? { labels: data.labels } : {}),
      },
    }),
    timeoutMs: 25000,
  });
  return { key: body.key, url: `${creds.base}/browse/${body.key}` };
}
