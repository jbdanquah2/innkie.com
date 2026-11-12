'use client';
import { useEffect, useRef } from 'react';

interface Props {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

const BTN = { danger: 'bg-rose-700 hover:bg-rose-800 text-white', warning: 'bg-amber-700 hover:bg-amber-800 text-white', info: 'bg-primary-600 hover:bg-primary-700 text-on-primary' } as const;

export function ConfirmDialog({ title = 'Confirm', message = 'Are you sure you want to continue?', confirmText = 'Confirm', cancelText = 'Cancel', type = 'info', onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', h);
    cancelRef.current?.focus();
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[120] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg" onClick={onCancel}>
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl border border-slate-200 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-900">{title}</h2>
        <p id="confirm-msg" className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" ref={cancelRef} onClick={onCancel} className="px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-500 transition-colors">{cancelText}</button>
          <button type="button" onClick={onConfirm} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${BTN[type]}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
