'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface PaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const PaletteContext = createContext<PaletteContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global Cmd/Ctrl+K — ignore while typing in inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(o => !o);
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return <PaletteContext.Provider value={{ isOpen, open, close }}>{children}</PaletteContext.Provider>;
}

export function usePalette() {
  return useContext(PaletteContext);
}
