'use client';

import { useEffect, useRef, useState } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  up?: boolean;
  width?: number;
  children: React.ReactNode;
}

export function Dropdown({ trigger, up, width, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="kb-dropdown" ref={rootRef} data-state={open ? 'open' : 'closed'}>
      <span
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(o => !o);
        }}
        style={{ display: 'inline-flex' }}
      >
        {trigger}
      </span>
      {open && (
        <div className={`kb-dropdown__menu ${up ? 'kb-dropdown__menu--up' : ''}`} style={width ? { minWidth: width } : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
}

export function DropdownItem({ danger, className = '', children, ...rest }: DropdownItemProps) {
  return (
    <button className={`kb-dropdown__item ${danger ? 'kb-dropdown__item--danger' : ''} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function DropdownSep() {
  return <div className="kb-dropdown__sep" />;
}
