import { getDb } from './db';

export type Theme = 'dark' | 'light';

export interface UserPreferences {
  theme: Theme;
  aiModel: string | null;
}

export const DEFAULT_AI_MODEL = 'openai/gpt-4o-mini';

export function getUserPreferences(userId: number): UserPreferences {
  const db = getDb();
  let row = db.prepare('SELECT theme, aiModel FROM user_preferences WHERE userId = ?').get(userId) as
    | { theme: string; aiModel: string | null }
    | undefined;

  if (!row) {
    db.prepare('INSERT OR IGNORE INTO user_preferences (userId, theme) VALUES (?, ?)').run(userId, 'dark');
    row = { theme: 'dark', aiModel: null };
  }

  return {
    theme: row.theme === 'light' ? 'light' : 'dark',
    aiModel: row.aiModel || null,
  };
}

export function setUserPreferences(userId: number, patch: Partial<Pick<UserPreferences, 'theme' | 'aiModel'>>): UserPreferences {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO user_preferences (userId, theme) VALUES (?, ?)').run(userId, 'dark');

  if (patch.theme !== undefined) {
    const theme = patch.theme === 'light' ? 'light' : 'dark';
    db.prepare('UPDATE user_preferences SET theme = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?').run(theme, userId);
  }
  if (patch.aiModel !== undefined) {
    db.prepare('UPDATE user_preferences SET aiModel = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?').run(
      patch.aiModel || null,
      userId
    );
  }

  return getUserPreferences(userId);
}
