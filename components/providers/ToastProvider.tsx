'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

const TOAST_MS = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId.current++;
      setToasts(prev => [...prev.slice(-3), { id, type, message }]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss]
  );

  const value = {
    toast,
    success: (m: string) => toast(m, 'success'),
    error: (m: string) => toast(m, 'error'),
    info: (m: string) => toast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="kb-toasts" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`kb-toast kb-toast--${t.type}`} role="status">
            <span className="kb-toast__icon">
              {t.type === 'success' && <CheckCircle2 size={16} />}
              {t.type === 'error' && <XCircle size={16} />}
              {t.type === 'info' && <Info size={16} />}
            </span>
            <span className="kb-toast__text">{t.message}</span>
            <button className="kb-iconbtn kb-iconbtn--sm" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
