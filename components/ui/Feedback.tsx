'use client';

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`kb-skeleton ${className}`} style={style} />;
}

export function Spinner({ large }: { large?: boolean }) {
  return <div className={`kb-spinner ${large ? 'kb-spinner--lg' : ''}`} />;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="kb-empty">
      {icon && <div className="kb-empty__icon">{icon}</div>}
      <div className="kb-empty__title">{title}</div>
      {description && <div className="kb-empty__desc">{description}</div>}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="kb-kbd">{children}</kbd>;
}
