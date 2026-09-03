'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, wide, footer, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Focus the dialog for immediate keyboard interaction.
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="kb-modal-overlay"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`kb-modal ${wide ? 'kb-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        ref={ref}
        tabIndex={-1}
      >
        {title !== undefined && (
          <div className="kb-modal__header">
            <div className="kb-modal__title">{title}</div>
            <IconButton label="Close" onClick={onClose}>
              <X size={16} />
            </IconButton>
          </div>
        )}
        <div className="kb-modal__body">{children}</div>
        {footer && <div className="kb-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
