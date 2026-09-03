import { getDb } from './db';
import { getUserPreferences, DEFAULT_AI_MODEL } from './prefs';
import { chatCompletion, extractJson, requireOpenRouterKey, type ChatMessage } from './integrations/openrouter';

const SYSTEM_JSON = 'You are a helpful assistant for an IT kanban board. Respond ONLY with JSON matching the requested schema. No markdown fences, no commentary.';

async function callAIJson(userId: number, messages: ChatMessage[]): Promise<any> {
  const apiKey = requireOpenRouterKey(userId);
  const prefs = getUserPreferences(userId);
  const model = prefs.aiModel || DEFAULT_AI_MODEL;

  let raw: string;
  try {
    raw = await chatCompletion(apiKey, model, [{ role: 'system', content: SYSTEM_JSON }, ...messages], { json: true });
  } catch (e) {
    throw e;
  }

  try {
    return extractJson(raw);
  } catch {
    // One retry, stricter.
    raw = await chatCompletion(
      apiKey,
      model,
      [
        { role: 'system', content: SYSTEM_JSON },
        ...messages,
        { role: 'assistant', content: raw.slice(0, 2000) },
        { role: 'user', content: 'That was not valid JSON. Respond again with ONLY valid JSON matching the schema.' },
      ],
      { json: true }
    );
    return extractJson(raw);
  }
}

export interface AiTaskContext {
  title: string;
  description: string;
  priority: string;
  labels: string[];
  dueDate: string;
  existingSubtasks: string[];
}

export async function aiGenerateSubtasks(userId: number, task: AiTaskContext): Promise<string[]> {
  const result = await callAIJson(userId, [
    {
      role: 'user',
      content: `Break this IT task into 3-6 concrete subtasks.

Task: ${JSON.stringify({ title: task.title, description: task.description, priority: task.priority, labels: task.labels, dueDate: task.dueDate })}
Existing subtasks (do not duplicate): ${JSON.stringify(task.existingSubtasks)}

Rules: each subtask is imperative, at most 10 words, a concrete verifiable step.
Schema: {"subtasks": ["...", "..."]}`,
    },
  ]);
  const subtasks = Array.isArray(result?.subtasks)
    ? (result.subtasks as unknown[]).map(String).filter((s: string) => s.trim()).slice(0, 6)
    : [];
  if (subtasks.length === 0) throw new Error('AI returned no subtasks — try again');
  return subtasks;
}

export async function aiWriteDescription(userId: number, task: { title: string; notes: string; labels: string[] }): Promise<string> {
  const result = await callAIJson(userId, [
    {
      role: 'user',
      content: `Write a task description for an IT kanban board.

Task title: ${task.title}
Existing notes: ${task.notes || '(none)'}
Labels: ${task.labels.join(', ') || '(none)'}

Rules: Markdown, max 200 words, sections "## Context", "## Requirements", "## Acceptance criteria" (acceptance criteria as - [ ] checkboxes). Stay factual, expand only on what the title/notes imply.
Schema: {"description": "..."}`,
    },
  ]);
  const description = typeof result?.description === 'string' ? result.description.trim() : '';
  if (!description) throw new Error('AI returned no description — try again');
  return description;
}

export interface AiSuggestion {
  priority: { value: 'low' | 'medium' | 'high'; reason: string };
  labels: Array<{ name: string; reason: string }>;
}

export async function aiSuggest(userId: number, task: AiTaskContext, availableLabels: string[]): Promise<AiSuggestion> {
  const result = await callAIJson(userId, [
    {
      role: 'user',
      content: `Suggest a priority and 0-2 labels for this IT task.

Task: ${JSON.stringify({ title: task.title, description: task.description, dueDate: task.dueDate })}
Available labels (choose ONLY from this list): ${JSON.stringify(availableLabels)}

Schema: {"priority":{"value":"low|medium|high","reason":"..."},"labels":[{"name":"...","reason":"..."}]}`,
    },
  ]);

  const priorityValue = ['low', 'medium', 'high'].includes(result?.priority?.value) ? result.priority.value : 'medium';
  const labels = (Array.isArray(result?.labels) ? result.labels : [])
    .filter((l: any) => l?.name && availableLabels.includes(l.name))
    .slice(0, 2)
    .map((l: any) => ({ name: String(l.name), reason: String(l.reason || '') }));

  return { priority: { value: priorityValue, reason: String(result?.priority?.reason || '') }, labels };
}

export async function aiBoardSummary(userId: number, boardId: string): Promise<{ summary: string; wins: string[]; risks: string[] }> {
  const db = getDb();
  const board = db.prepare('SELECT name FROM boards WHERE id = ?').get(boardId) as { name: string } | undefined;
  if (!board) throw new Error('Board not found');

  const columns = (db
    .prepare('SELECT name, isDone FROM board_columns WHERE boardId = ? ORDER BY position')
    .all(boardId) || []) as Array<{ name: string; isDone: number }>;

  const tasks = (db
    .prepare(
      `SELECT t.number, t.title, t.priority, t.dueDate, c.name AS column, t.assignee
       FROM tasks t JOIN board_columns c ON c.id = t.status
       WHERE t.boardId = ? AND t.archived = 0
       ORDER BY t.createdAt DESC LIMIT 100`
    )
    .all(boardId) || []) as Array<{ number: number; title: string; priority: string; dueDate: string; column: string; assignee: string }>;

  if (tasks.length === 0) throw new Error('Nothing to summarize — the board has no tasks');

  const doneColumns = columns.filter(c => c.isDone === 1).map(c => c.name);
  const list = tasks.map(t => ({
    key: `KAB-${t.number}`,
    title: t.title,
    priority: t.priority,
    column: t.column,
    assignee: t.assignee || null,
    due: t.dueDate || null,
    overdue: t.dueDate && !doneColumns.includes(t.column) && t.dueDate < new Date().toISOString().slice(0, 10),
  }));

  const result = await callAIJson(userId, [
    {
      role: 'user',
      content: `Summarize this kanban board for a standup meeting.

Board: ${board.name}
Columns: ${columns.map(c => c.name).join(' → ')}
Completion columns: ${doneColumns.join(', ') || 'none marked'}
Tasks (latest ${list.length}): ${JSON.stringify(list)}

Rules: reference tasks as KAB-<n>. summary is 2-3 sentences. wins: 0-3 items. risks: 0-3 items (overdue, WIP pile-ups, single-owner risks).
Schema: {"summary":"...","wins":["..."],"risks":["..."]}`,
    },
  ]);

  return {
    summary: String(result?.summary || '').trim(),
    wins: (Array.isArray(result?.wins) ? result.wins : []).map(String).slice(0, 3),
    risks: (Array.isArray(result?.risks) ? result.risks : []).map(String).slice(0, 3),
  };
}
