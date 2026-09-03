import { getCredentials } from './store';
import { providerFetch, ProviderError } from './openrouter';

const API = 'https://api.github.com';

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export function requireGithubToken(userId: number): string {
  const creds = getCredentials<{ token: string }>(userId, 'github');
  if (!creds?.token) throw new ProviderError('Connect your GitHub account in Settings first', 400);
  return creds.token;
}

export interface GithubRepo {
  fullName: string;
  updatedAt: string | null;
}

export async function listRepos(token: string, query = ''): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = [];
  for (let page = 1; page <= 3; page++) {
    const body = await providerFetch(`${API}/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator`, {
      headers: ghHeaders(token),
      timeoutMs: 20000,
    });
    const batch = (Array.isArray(body) ? body : []) as any[];
    repos.push(...batch.map(r => ({ fullName: r.full_name, updatedAt: r.updated_at })));
    if (batch.length < 100) break;
  }
  const q = query.trim().toLowerCase();
  return q ? repos.filter(r => r.fullName.toLowerCase().includes(q)) : repos;
}

export interface GithubIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  assignee: string | null;
  updatedAt: string;
  url: string;
}

export async function listIssues(token: string, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GithubIssue[]> {
  const body = await providerFetch(
    `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=${state}&per_page=100`,
    { headers: ghHeaders(token), timeoutMs: 20000 }
  );
  const issues = (Array.isArray(body) ? body : []) as any[];
  return issues
    .filter(i => !i.pull_request) // the issues endpoint also returns PRs
    .map(i => ({
      number: i.number,
      title: i.title,
      body: (i.body || '').slice(0, 8000),
      labels: (i.labels || []).map((l: any) => l.name).slice(0, 10),
      assignee: i.assignee?.login || null,
      updatedAt: i.updated_at,
      url: i.html_url,
    }));
}

export async function createIssue(
  token: string,
  owner: string,
  repo: string,
  data: { title: string; body: string; labels: string[] }
): Promise<{ number: number; url: string }> {
  const body = await providerFetch(`${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`, {
    method: 'POST',
    headers: ghHeaders(token),
    body: JSON.stringify({ title: data.title, body: data.body, labels: data.labels }),
    timeoutMs: 20000,
  });
  return { number: body.number, url: body.html_url };
}

export function parseRepoRef(ref: string): { owner: string; repo: string } | null {
  const match = ref.trim().match(/^([\w.-]+)\/([\w.-]+)$/);
  return match ? { owner: match[1], repo: match[2] } : null;
}
