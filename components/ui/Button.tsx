'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'kb-btn--primary',
  secondary: 'kb-btn--secondary',
  ghost: 'kb-btn--ghost',
  danger: 'kb-btn--danger',
  'danger-solid': 'kb-btn--danger-solid',
};

const sizeClass: Record<Size, string> = {
  sm: 'kb-btn--sm',
  md: '',
  lg: 'kb-btn--lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, disabled, className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`kb-btn ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={14} className="kb-btn__spinner" />}
      {children}
    </button>
  );
});

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // accessible name
  small?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, small, className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`kb-iconbtn ${small ? 'kb-iconbtn--sm' : ''} ${className}`}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
});
