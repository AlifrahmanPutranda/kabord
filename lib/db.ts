import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;

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
      time TEXT,
      text TEXT,
      FOREIGN KEY(taskId) REFERENCES tasks(id)
    )
  `);

  // Create default admin user if not exists
  const adminCheck = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!adminCheck) {
    const hashedPassword = bcrypt.hashSync('Admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
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
  }
}
