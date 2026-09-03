'use client';

import { forwardRef } from 'react';

interface FieldProps {
  label?: string;
  error?: string | null;
  hint?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, error, hint, children, className = '' }: FieldProps) {
  return (
    <div className={`kb-field ${className}`}>
      {label && <label className="kb-field__label">{label}</label>}
      {children}
      {error && <div className="kb-field__error">{error}</div>}
      {!error && hint && <div className="kb-field__hint">{hint}</div>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...rest },
  ref
) {
  return <input ref={ref} className={`kb-input ${className}`} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...rest }, ref) {
    return <textarea ref={ref} className={`kb-textarea ${className}`} {...rest} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...rest },
  ref
) {
  return (
    <select ref={ref} className={`kb-select ${className}`} {...rest}>
      {children}
    </select>
  );
});
