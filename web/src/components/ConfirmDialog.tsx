'use client';
import { useEffect } from 'react';

interface Props {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

const ICON = { danger: 'fa-exclamation-triangle', warning: 'fa-exclamation-circle', info: 'fa-info-circle' } as const;
const BADGE = { danger: 'bg-rose-100 text-rose-600', warning: 'bg-amber-100 text-amber-600', info: 'bg-primary-100 text-primary-600' } as const;
const BTN = { danger: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200', warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200', info: 'bg-primary-600 hover:bg-primary-700 shadow-primary-200' } as const;

export function ConfirmDialog({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', type = 'info', onConfirm, onCancel }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[120] flex items-center justify-center p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${BADGE[type]}`}><i className={`fas ${ICON[type]} text-xl`} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
              <p className="text-slate-500 font-medium text-sm mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" autoFocus onClick={onCancel} className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95">{cancelText}</button>
            <button type="button" onClick={onConfirm} className={`flex-1 px-6 py-3 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 ${BTN[type]}`}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
