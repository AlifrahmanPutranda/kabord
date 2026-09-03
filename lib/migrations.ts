import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { DEFAULT_COLUMNS } from './columns';

// Versioned schema migrations. Each entry runs once, inside a transaction,
// with PRAGMA user_version bumped after commit. Additive only — existing
// data must survive every step.

export interface Migration {
  to: number;
  name: string;
  up: (db: Database.Database) => void;
}

function generateColumnId(): string {
  return `col-${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * v1 — Revamp foundation:
 *  - new tables: board_columns, subtasks, comments, task_links,
 *    integration_configs, user_preferences
 *  - additive columns: tasks.number, tasks.position, boards.taskSeq, activity.actorId
 *  - orphan cleanup, default columns seeded per board,
 *    per-board task numbering (KAB-n) and initial positions,
 *    theme preference defaults to dark.
 */
function migrateV1(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS board_columns (
      id TEXT PRIMARY KEY,
      boardId TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      wipLimit INTEGER,
      isDone INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId TEXT NOT NULL,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(taskId) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId TEXT NOT NULL,
      userId INTEGER NOT NULL,
      body TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId TEXT NOT NULL,
      provider TEXT NOT NULL CHECK(provider IN ('github','jira')),
      externalId TEXT NOT NULL,
      url TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      UNIQUE(taskId, provider, externalId)
    );

    CREATE TABLE IF NOT EXISTS integration_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      provider TEXT NOT NULL CHECK(provider IN ('github','jira','openrouter')),
      encrypted TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'untested',
      lastTestedAt TEXT,
      mask TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, provider)
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      userId INTEGER PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'dark',
      aiModel TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  for (const stmt of [
    'ALTER TABLE tasks ADD COLUMN number INTEGER',
    'ALTER TABLE tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE boards ADD COLUMN taskSeq INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE activity ADD COLUMN actorId INTEGER',
  ]) {
    try {
      db.exec(stmt);
    } catch (e: any) {
      if (!String(e?.message || '').includes('duplicate column')) throw e;
    }
  }

  // Orphan hygiene — must run before FK-enforced writes bite.
  db.exec(`
    DELETE FROM tasks WHERE boardId IS NULL OR boardId NOT IN (SELECT id FROM boards);
    DELETE FROM activity WHERE (boardId IS NOT NULL AND boardId NOT IN (SELECT id FROM boards))
      OR (taskId IS NOT NULL AND taskId NOT IN (SELECT id FROM tasks));
    DELETE FROM board_members WHERE boardId NOT IN (SELECT id FROM boards);
    DELETE FROM board_categories WHERE boardId NOT IN (SELECT id FROM boards);
    DELETE FROM board_requesters WHERE boardId NOT IN (SELECT id FROM boards);
    DELETE FROM board_invitations WHERE boardId NOT IN (SELECT id FROM boards);
  `);

  // Seed default columns for every board that has none.
  const boards = db.prepare('SELECT id FROM boards').all() as Array<{ id: string }>;
  const insertColumn = db.prepare(
    'INSERT INTO board_columns (id, boardId, name, position, wipLimit, isDone, createdAt) VALUES (?, ?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)'
  );
  for (const board of boards) {
    const existing = db.prepare('SELECT COUNT(*) AS n FROM board_columns WHERE boardId = ?').get(board.id) as { n: number };
    if (existing.n > 0) continue;
    DEFAULT_COLUMNS.forEach((col, index) => {
      insertColumn.run(generateColumnId(), board.id, col.name, index, col.isDone ? 1 : 0);
    });
  }

  // Per-board task numbering (KAB-<n>) — stable order: createdAt, rowid.
  db.exec(`
    UPDATE boards SET taskSeq = (SELECT COUNT(*) FROM tasks WHERE boardId = boards.id);
    UPDATE tasks SET number = t.rn FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY boardId ORDER BY createdAt IS NULL, createdAt, rowid) AS rn
      FROM tasks
    ) t WHERE tasks.id = t.id;
  `);

  // Initial dense positions per (boardId, status).
  db.exec(`
    UPDATE tasks SET position = t.rn FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY boardId, status ORDER BY createdAt, rowid) - 1 AS rn
      FROM tasks
    ) t WHERE tasks.id = t.id;
  `);

  // Theme defaults.
  db.prepare('INSERT OR IGNORE INTO user_preferences (userId, theme) SELECT id, ? FROM users').run('dark');
}

/**
 * v2 — Column-id cutover: tasks.status stores the board_column id instead of
 * the legacy literals (todo/inprogress/review/done). Runs together with the
 * revamped board UI.
 */
function migrateV2(db: Database.Database): void {
  const NAME_TO_LEGACY: Record<string, string> = {
    'to do': 'todo',
    'todo': 'todo',
    'in progress': 'inprogress',
    'review': 'review',
    'done': 'done',
  };

  const boards = db.prepare('SELECT id FROM boards').all() as Array<{ id: string }>;
  const updateStatus = db.prepare('UPDATE tasks SET status = ? WHERE id = ?');

  for (const board of boards) {
    const cols = db
      .prepare('SELECT id, name, position FROM board_columns WHERE boardId = ? ORDER BY position ASC, createdAt ASC')
      .all(board.id) as Array<{ id: string; name: string; position: number }>;
    if (cols.length === 0) continue;

    const legacyToId: Record<string, string> = {};
    cols.forEach((col, index) => {
      const legacy = NAME_TO_LEGACY[col.name.toLowerCase()];
      if (legacy && !legacyToId[legacy]) legacyToId[legacy] = col.id;
    });
    const fallback = cols[0].id;

    const rows = db.prepare('SELECT id, status FROM tasks WHERE boardId = ?').all(board.id) as Array<{
      id: string;
      status: string;
    }>;
    for (const row of rows) {
      const isColumnId = cols.some(c => c.id === row.status);
      if (isColumnId) continue;
      const target = legacyToId[row.status] || fallback;
      updateStatus.run(target, row.id);
    }
  }

  // Post-assert: every task status must be a column of its board.
  const orphans = db
    .prepare(
      `SELECT COUNT(*) AS n FROM tasks t
       WHERE t.status NOT IN (SELECT id FROM board_columns WHERE boardId = t.boardId)`
    )
    .get() as { n: number };
  if (orphans.n > 0) {
    throw new Error(`v2 post-assert failed: ${orphans.n} task(s) not mapped to a board column`);
  }
}

export const MIGRATIONS: Migration[] = [
  { to: 1, name: 'revamp-foundation', up: migrateV1 },
  { to: 2, name: 'column-id-cutover', up: migrateV2 },
];
