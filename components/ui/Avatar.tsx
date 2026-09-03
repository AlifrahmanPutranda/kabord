'use client';

// Deterministic pleasant color per name — no backend avatar needed.
const PALETTE = ['#5e6ad2', '#8f6ad2', '#d2699a', '#d2836a', '#6ab0d2', '#6ad2a8', '#b7d26a', '#d2b26a'];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  overlap?: boolean;
  title?: string;
}

export function Avatar({ name, size = 'md', overlap, title }: AvatarProps) {
  const initial = (name || '?').trim().charAt(0) || '?';
  return (
    <span
      className={`kb-avatar kb-avatar--${size} ${overlap ? 'kb-avatar--overlap' : ''}`}
      style={{ background: colorFor(name || '?') }}
      title={title || name}
    >
      {initial}
    </span>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {shown.map((n, i) => (
        <Avatar key={n + i} name={n} size="sm" overlap title={n} />
      ))}
      {extra > 0 && (
        <span className="kb-avatar kb-avatar--sm kb-avatar--overlap" title={`+${extra} more`}>
          +{extra}
        </span>
      )}
    </span>
  );
}
