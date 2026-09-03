'use client';

type Tone = 'default' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  color?: string; // overrides tone colors (used for label colors)
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = 'default', dot, color, children, className = '' }: BadgeProps) {
  const style = color ? { color, background: color + '22', borderColor: color + '44' } : undefined;
  return (
    <span className={`kb-badge ${tone !== 'default' ? `kb-badge--${tone}` : ''} ${className}`} style={style}>
      {dot && <span className="kb-badge__dot" />}
      {children}
    </span>
  );
}
