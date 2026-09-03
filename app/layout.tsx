import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { PaletteProvider } from '@/components/providers/PaletteProvider';
import { getCurrentUser } from '@/lib/session';
import { getUserPreferences } from '@/lib/prefs';
import type { Theme } from '@/lib/prefs';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Kabord — IT Kanban Board',
  description: 'Professional kanban for IT teams, with Jira, GitHub and AI superpowers.',
};

// Set data-theme before first paint to avoid a flash of the wrong theme.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('kabord-theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const prefs = user ? getUserPreferences(user.id) : null;
  const initialTheme: Theme = prefs?.theme ?? 'dark';

  return (
    <html lang="en" className={inter.variable} data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <ThemeProvider initialTheme={initialTheme}>
          <ToastProvider>
            <PaletteProvider>{children}</PaletteProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
