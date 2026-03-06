import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;
let migrationRun = false;

const DB_PATH = path.join(process.cwd(), 'kabord.db');

export function getDb(): Database.Database {
  if (db) return db;

  // Create database directory if not exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
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
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId TEXT,
      boardId TEXT,
      time TEXT,
      text TEXT,
      FOREIGN KEY(taskId) REFERENCES tasks(id)
    )
  `);

  // ========================================
  // MULTI-BOARD TABLES
  // ========================================

  // Boards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      ownerId INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Board Members
  db.exec(`
    CREATE TABLE IF NOT EXISTS board_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boardId TEXT NOT NULL,
      userId INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(boardId, userId)
    )
  `);

  // Board Invitations
  db.exec(`
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
    )
  `);

  // Board Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS board_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boardId TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#64748b',
      position INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
      UNIQUE(boardId, name)
    )
  `);

  // Board Requesters
  db.exec(`
    CREATE TABLE IF NOT EXISTS board_requesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boardId TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
      UNIQUE(boardId, name)
    )
  `);

  // Add boardId column to tasks if not exists
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN boardId TEXT REFERENCES boards(id)`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Create default admin user if not exists
  const adminCheck = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!adminCheck) {
    const hashedPassword = bcrypt.hashSync('Admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
  }

  // Run migration once
  if (!migrationRun) {
    migrationRun = true;
    runMigrationInternal(db);
  }

  return db;
}

export function saveDb() {
  // better-sqlite3 auto-saves, no need to do anything
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
    migrationRun = false;
  }
}

// ========================================
// MIGRATION FUNCTION
// ========================================

function runMigrationInternal(database: Database.Database) {
  // Check if migration already done
  const migrationCheck = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='boards'").get();
  if (!migrationCheck) return; // Tables don't exist yet

  // Check if default board already exists
  const defaultBoard = database.prepare("SELECT id FROM boards WHERE id = 'default-board'").get();
  if (defaultBoard) return; // Migration already done

  console.log('Running migration: Creating default board...');

  // Create default board (owner is admin user with id=1)
  const adminUser = database.prepare("SELECT id FROM users WHERE username = 'admin'").get() as { id: number } | undefined;
  const ownerId = adminUser?.id || 1;

  database.prepare(`
    INSERT INTO boards (id, name, description, ownerId, createdAt, updatedAt)
    VALUES ('default-board', 'Default Board', 'Migrated from single-board system', ?, datetime('now'), datetime('now'))
  `).run(ownerId);

  // Add all users as members of default board
  const users = database.prepare("SELECT id FROM users").all() as { id: number }[];
  for (const user of users) {
    try {
      database.prepare(`
        INSERT INTO board_members (boardId, userId, role, joinedAt)
        VALUES ('default-board', ?, 'member', datetime('now'))
      `).run(user.id);
    } catch (e) {
      // Ignore duplicate
    }
  }

  // Migrate default categories
  const defaultCategories = ['System', 'Infrastructure', 'HR', 'Access', 'Finance', 'Marketing', 'CRM', 'Estate', 'Other'];
  defaultCategories.forEach((name, index) => {
    try {
      database.prepare(`
        INSERT INTO board_categories (boardId, name, position, createdAt)
        VALUES ('default-board', ?, ?, datetime('now'))
      `).run(name, index);
    } catch (e) {
      // Ignore duplicate
    }
  });

  // Migrate default requesters
  const defaultRequesters = ['Pak Fiki', 'Pak Vic', 'Pak Victor', 'HR', 'Finance', 'Marketing', 'CRM Team', 'Estate', 'Other'];
  defaultRequesters.forEach((name, index) => {
    try {
      database.prepare(`
        INSERT INTO board_requesters (boardId, name, position, createdAt)
        VALUES ('default-board', ?, ?, datetime('now'))
      `).run(name, index);
    } catch (e) {
      // Ignore duplicate
    }
  });

  // Update all existing tasks to belong to default board
  database.prepare(`UPDATE tasks SET boardId = 'default-board' WHERE boardId IS NULL`).run();

  // Update all existing activities to have boardId
  database.prepare(`
    UPDATE activity SET boardId = 'default-board'
    WHERE boardId IS NULL AND taskId IN (SELECT id FROM tasks WHERE boardId = 'default-board')
  `).run();

  console.log('Migration completed successfully!');
}

export function runMigration() {
  const database = getDb();
  runMigrationInternal(database);
}
