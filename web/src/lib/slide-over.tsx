'use client';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

const Ctx = createContext({ isOpen: false, open: () => {}, close: () => {} });

export function SlideOverProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const value = useMemo(() => ({ isOpen, open: () => setOpen(true), close: () => setOpen(false) }), [isOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSlideOver = () => useContext(Ctx);
