'use client';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'danger' | 'info' | 'warning';
interface Toast { id: string; message: string; type: ToastType }

interface ToastApi {
  success: (m: string, d?: number) => void;
  error: (m: string, d?: number) => void;
  info: (m: string, d?: number) => void;
  warn: (m: string, d?: number) => void;
}

const noop = () => {};
const ToastContext = createContext<ToastApi>({ success: noop, error: noop, info: noop, warn: noop });

const STYLE: Record<ToastType, { card: string; icon: string; glyph: string }> = {
  success: { card: 'border-emerald-100 text-emerald-900 shadow-emerald-200/40', icon: 'bg-emerald-50 text-emerald-600', glyph: 'fa-check-circle' },
  danger: { card: 'border-rose-100 text-rose-900 shadow-rose-200/40', icon: 'bg-rose-50 text-rose-600', glyph: 'fa-exclamation-circle' },
  info: { card: 'border-primary-100 text-primary-900 shadow-primary-200/40', icon: 'bg-primary-50 text-primary-600', glyph: 'fa-info-circle' },
  warning: { card: 'border-amber-100 text-amber-900 shadow-amber-200/40', icon: 'bg-amber-50 text-amber-600', glyph: 'fa-exclamation-triangle' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (message: string, type: ToastType, duration = 3000) => {
      const id = Math.random().toString(36).slice(2, 11);
      setToasts((t) => [...t, { id, message, type }]);
      if (duration > 0) setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, d) => show(m, 'success', d),
      error: (m, d) => show(m, 'danger', d),
      info: (m, d) => show(m, 'info', d),
      warn: (m, d) => show(m, 'warning', d),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-2xl shadow-2xl border bg-white flex items-center justify-between gap-4 ${STYLE[t.type].card}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${STYLE[t.type].icon}`}>
                <i className={`fas ${STYLE[t.type].glyph}`} />
              </div>
              <p className="text-sm font-bold tracking-tight">{t.message}</p>
            </div>
            <button type="button" aria-label="Dismiss" onClick={() => remove(t.id)} className="text-slate-300 hover:text-slate-600 transition-colors">
              <i className="fas fa-times text-xs" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
