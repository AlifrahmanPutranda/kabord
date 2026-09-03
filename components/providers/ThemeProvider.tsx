'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Theme } from '@/lib/prefs';
import { api } from '@/lib/client/api';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const THEME_STORAGE_KEY = 'kabord-theme';

export function ThemeProvider({ initialTheme, children }: { initialTheme: Theme; children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // localStorage wins on mount (instant, works pre-login too).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        setThemeState(stored);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, initialTheme);
      }
    } catch {
      /* private mode etc. */
    }
  }, [initialTheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    // Persist to the server; failure is non-fatal (localStorage already has it).
    api('/api/settings/preferences', { method: 'PUT', body: JSON.stringify({ theme: next }) }).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
