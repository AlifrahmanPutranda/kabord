import { getCredentials } from './store';
import { DEFAULT_AI_MODEL } from '../prefs';

const API_BASE = 'https://openrouter.ai/api/v1';

export class ProviderError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

// Shared fetch helper: timeout + friendly error normalization.
export async function providerFetch(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<any> {
  const { timeoutMs = 30000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(rest.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail =
        body?.error?.message ||
        (typeof body?.error === 'string' ? body.error : null) ||
        body?.message ||
        `Upstream responded ${res.status}`;
      throw new ProviderError(detail, res.status === 401 || res.status === 403 ? 400 : 502);
    }
    return body;
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    if ((e as Error).name === 'AbortError') throw new ProviderError('Upstream request timed out', 504);
    throw new ProviderError(`Cannot reach ${new URL(url).host}`, 502);
  }
}

export function requireOpenRouterKey(userId: number): string {
  const creds = getCredentials<{ apiKey: string }>(userId, 'openrouter');
  if (!creds?.apiKey) {
    throw new ProviderError('Configure your OpenRouter API key in Settings first', 400);
  }
  return creds.apiKey;
}

export async function testOpenRouter(apiKey: string): Promise<{ ok: boolean; detail: string }> {
  const body = await providerFetch(`${API_BASE}/key`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeoutMs: 15000,
  });
  const label = body?.data?.label ? ` (${body.data.label})` : '';
  const usage = body?.data?.usage != null ? ` · used $${body.data.usage}` : '';
  return { ok: true, detail: `Key is valid${label}${usage}` };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Models that reliably support JSON response format.
const JSON_MODE_MODELS = /^(openai\/gpt-4o|openai\/gpt-4o-mini|anthropic\/claude|google\/gemini-flash)/i;

export async function chatCompletion(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  opts: { json?: boolean; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: opts.maxTokens ?? 800,
    temperature: opts.temperature ?? 0.3,
  };
  if (opts.json && JSON_MODE_MODELS.test(model)) {
    body.response_format = { type: 'json_object' };
  }
  const res = await providerFetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'HTTP-Referer': 'http://localhost:3002', 'X-Title': 'Kabord' },
    body: JSON.stringify(body),
  });
  const content = res?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new ProviderError('The model returned an empty response — try again', 502);
  }
  return content;
}

// ---------- Model catalog (cached 1h) ----------

const CURATED_MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'openai/gpt-4.1-mini',
  'anthropic/claude-3.5-haiku',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-sonnet-4',
  'google/gemini-2.0-flash-001',
  'google/gemini-flash-1.5',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-small-latest',
  'deepseek/deepseek-chat',
  'qwen/qwen-2.5-72b-instruct',
];

interface ModelCache {
  at: number;
  models: Array<{ id: string; name: string; context: number }>;
}
let modelCache: ModelCache | null = null;

export async function listModels(apiKey: string): Promise<{ models: Array<{ id: string; name: string; context: number }>; default: string }> {
  if (!modelCache || Date.now() - modelCache.at > 60 * 60 * 1000) {
    try {
      const body = await providerFetch(`${API_BASE}/models`, { timeoutMs: 15000 });
      const all: Array<{ id: string; name: string; context_length?: number; pricing?: { prompt?: string; completion?: string } }> = body?.data || [];
      const free = all.filter(m => {
        const p = parseFloat(m.pricing?.prompt || '1') + parseFloat(m.pricing?.completion || '1');
        return p === 0;
      }).map(m => ({ id: m.id, name: `${m.name} (free)`, context: m.context_length || 0 }));
      const curated = CURATED_MODELS
        .map(id => {
          const found = all.find(m => m.id === id);
          return found ? { id: found.id, name: found.name, context: found.context_length || 0 } : null;
        })
        .filter(Boolean);
      // Curated first, then a few free options.
      const seen = new Set<string>();
      const models = [...(curated as any[]), ...free.slice(0, 8)].filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      modelCache = { at: Date.now(), models };
    } catch {
      // Fall back to the curated list without names.
      modelCache = { at: Date.now(), models: CURATED_MODELS.map(id => ({ id, name: id, context: 0 })) };
    }
  }
  return { models: modelCache.models, default: DEFAULT_AI_MODEL };
}

// Tolerant JSON extraction: strips code fences, slices first {...} or [...].
export function extractJson(text: string): any {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = Math.min(
    ...[cleaned.indexOf('{'), cleaned.indexOf('[')].filter(i => i >= 0).concat([cleaned.length])
  );
  const endCurly = cleaned.lastIndexOf('}');
  const endSquare = cleaned.lastIndexOf(']');
  const end = Math.max(endCurly, endSquare);
  if (start >= cleaned.length || end < 0) throw new Error('No JSON found in response');
  return JSON.parse(cleaned.slice(start, end + 1));
}
