import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { MIGRATIONS } from './migrations';

const DB_PATH = path.join(process.cwd(), 'kabord.db');

// Singleton on globalThis so dev-mode HMR (module re-evaluation) doesn't leak handles.
declare global {
  // eslint-disable-next-line no-var
  var __kabordDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (globalThis.__kabordDb) return globalThis.__kabordDb;

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  initializeTables(db);
  bootstrapDefaultBoard(db);
  runMigrations(db);

  globalThis.__kabordDb = db;
  return db;
}

function initializeTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      requestedBy TEXT,
      assignee TEXT,
      dueDate TEXT,
      category TEXT,
      createdAt TEXT,
      archived INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId TEXT,
      boardId TEXT,
      time TEXT,
      text TEXT,
      FOREIGN KEY(taskId) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      ownerId INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS board_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boardId TEXT NOT NULL,
      userId INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(boardId, userId)
    );

    CREATE TABLE IF NOT EXISTS board_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boardId TEXT NOT NULL,
      invitedUserId INTEGER NOT NULL,
      invitedByUserId INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      respondedAt TEXT,
      FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY(invitedUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(invitedByUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS board_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boardId TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#64748b',
      position INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
      UNIQUE(boardId, name)
    );

    CREATE TABLE IF NOT EXISTS board_requesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boardId TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
      UNIQUE(boardId, name)
    );
  `);

  // tasks.boardId (added by the original single-board -> multi-board migration)
  try {
    db.exec('ALTER TABLE tasks ADD COLUMN boardId TEXT REFERENCES boards(id)');
  } catch {
    // Column already exists
  }

  // Seed admin user if not exists
  const adminCheck = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!adminCheck) {
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || crypto.randomBytes(16).toString('hex');
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
  }
}

// Legacy "version 0" behavior: give a fresh DB a default board so the app is usable immediately.
function bootstrapDefaultBoard(db: Database.Database): void {
  const defaultBoard = db.prepare("SELECT id FROM boards WHERE id = 'default-board'").get();
  if (defaultBoard) return;

  const adminUser = db.prepare("SELECT id FROM users WHERE username = 'admin'").get() as { id: number } | undefined;
  const ownerId = adminUser?.id || 1;

  db.prepare(`
    INSERT INTO boards (id, name, description, ownerId, createdAt, updatedAt)
    VALUES ('default-board', 'Default Board', 'Migrated from single-board system', ?, datetime('now'), datetime('now'))
  `).run(ownerId);

  const users = db.prepare('SELECT id FROM users').all() as { id: number }[];
  for (const user of users) {
    try {
      db.prepare(`
        INSERT INTO board_members (boardId, userId, role, joinedAt)
        VALUES ('default-board', ?, 'member', datetime('now'))
      `).run(user.id);
    } catch {
      // Ignore duplicate
    }
  }
}

function runMigrations(db: Database.Database): void {
  const version = db.pragma('user_version', { simple: true }) as number;
  for (const migration of MIGRATIONS) {
    if (migration.to <= version) continue;
    try {
      db.transaction(migration.up)(db);
      db.pragma(`user_version = ${migration.to}`);
      console.log(`[kabord] migration applied: v${migration.to} (${migration.name})`);
    } catch (e) {
      // Close and drop the handle so the next getDb() retry starts clean.
      try { db.close(); } catch { /* ignore */ }
      globalThis.__kabordDb = undefined;
      throw new Error(`Migration v${migration.to} (${migration.name}) failed: ${e}`);
    }
  }
}

export function closeDb(): void {
  if (globalThis.__kabordDb) {
    globalThis.__kabordDb.close();
    globalThis.__kabordDb = undefined;
  }
}
