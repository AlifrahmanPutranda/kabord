import '@/app/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kabord - IT Task Kanban Board',
  description: 'IT Task Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}