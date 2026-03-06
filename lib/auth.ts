import bcrypt from 'bcryptjs';
import { getDb } from './db';

export interface User {
  id: number;
  username: string;
  role: string;
}

export async function verifyUser(username: string, password: string): Promise<User | null> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username) as any;

  if (!user) return null;

  if (bcrypt.compareSync(password, user.password)) {
    return { id: user.id, username: user.username, role: user.role };
  }
  return null;
}

export async function createUser(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (!username || username.trim().length < 3) {
    return { success: false, error: 'Username must be at least 3 characters' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber) {
    return { success: false, error: 'Password must contain uppercase, lowercase, and number' };
  }

  try {
    const db = getDb();

    // Check if username already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return { success: false, error: 'Username already exists' };
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username.trim(), hashedPassword);
    return { success: true };
  } catch (e: any) {
    console.error('Registration error:', e);
    return { success: false, error: 'Failed to create user: ' + (e.message || 'Unknown error') };
  }
}

export async function getAllUsers(): Promise<User[]> {
  const db = getDb();
  const stmt = db.prepare('SELECT id, username, role FROM users');
  const rows = stmt.all() as any[];

  return rows.map(row => ({
    id: row.id,
    username: row.username,
    role: row.role
  }));
}
