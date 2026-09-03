// Single source of truth for date formatting (en-US throughout).

export function formatDate(input: string | null | undefined): string {
  if (!input) return '';
  const d = new Date(input.length <= 10 ? input + 'T00:00:00' : input);
  if (isNaN(d.getTime())) return input;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(input: string | null | undefined): string {
  if (!input) return '';
  const d = new Date(input.length <= 10 ? input + 'T00:00:00' : input);
  if (isNaN(d.getTime())) return input;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function relativeTime(input: string | null | undefined): string {
  if (!input) return '';
  const d = new Date(input.includes('T') ? input : input.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return input;

  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatShortDate(input);
}

// Due-date status for card styling.
export type DueStatus = 'none' | 'overdue' | 'today' | 'soon' | 'later';

export function dueStatus(dueDate: string | null | undefined, done = false): DueStatus {
  if (!dueDate || done) return 'none';
  const d = new Date(dueDate.length <= 10 ? dueDate + 'T00:00:00' : dueDate);
  if (isNaN(d.getTime())) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'later';
}
