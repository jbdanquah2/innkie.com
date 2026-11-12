'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { useAuth } from '@/lib/auth';
import { QrDesignControls } from '@/components/app/QrDesignControls';
import { DEFAULT_DESIGN, toQrOptions, type QrDesign } from '@/lib/qr-config';
import { useToast } from '@/lib/toast';

const TABS = ['Shapes', 'Colors', 'Logo', 'Background'] as const;
type Tab = (typeof TABS)[number];

const DEFAULT_DATA = 'https://innkie.com/branded-qr';

/**
 * QR Studio editor core (preview + Shapes/Colors/Logo/Background + PNG/SVG export).
 * TODO(phase 4): signed-in extras — saved template library, "Stamper" (apply design to a link) and
 * save/update template — need the workspace + links services and land with the app shell.
 */
export function QrStudio() {
  const toast = useToast();
  const { user } = useAuth();
  const host = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStyling | null>(null);
  const [data, setData] = useState(DEFAULT_DATA);
  const [tab, setTab] = useState<Tab>('Shapes');
  const [d, setD] = useState<QrDesign>(DEFAULT_DESIGN);
  const set = <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => setD((s) => ({ ...s, [k]: v }));

  // ?data=... (set by the QR generator's "Add Logo & Colors" link)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('data');
    if (q) setData(q);
  }, []);

  // Create the qr-code-styling instance once (browser-only library), then update it on every change.
  const latest = useRef({ d, data });
  latest.current = { d, data };
  useEffect(() => {
    let cancelled = false;
    void import('qr-code-styling').then(({ default: QRCodeStyling }) => {
      if (cancelled || !host.current) return;
      const inst = new QRCodeStyling(toQrOptions(latest.current.d, latest.current.data));
      host.current.innerHTML = '';
      inst.append(host.current);
      qr.current = inst;
    });
    return () => { cancelled = true; qr.current = null; if (host.current) host.current.innerHTML = ''; };
  }, []);
  useEffect(() => { qr.current?.update(toQrOptions(d, data)); }, [d, data]);

  const download = (extension: 'png' | 'svg') => qr.current?.download({ name: 'branded-qr-design', extension });

  return (
    <div className="space-y-10 animate-fade-in">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="card p-10 bg-white border border-slate-100 shadow-sm rounded-3xl flex flex-col items-center gap-6 relative overflow-hidden group">
            <div ref={host} className="rounded-3xl shadow-md border border-slate-50 transition-transform duration-500 hover:scale-105 bg-white overflow-hidden flex items-center justify-center" style={{ width: 300, height: 300 }} />
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Brand Preview</p>
            </div>
            <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-6 border-t border-slate-50">
              <button type="button" onClick={() => download('png')} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-colors group/dl">
                <i className="fas fa-file-image text-slate-300 group-hover/dl:text-primary-500 transition-colors mb-2" />
                <span className="text-[10px] font-black uppercase text-slate-500">Download PNG</span>
              </button>
              <button type="button" onClick={() => download('svg')} className="flex flex-col items-center justify-center p-4 bg-primary-50 hover:bg-primary-100 rounded-3xl transition-colors group/dl">
                <i className="fas fa-file-code text-primary-300 group-hover/dl:text-primary-600 transition-colors mb-2" />
                <span className="text-[10px] font-black uppercase text-primary-600">Download SVG</span>
              </button>
            </div>
          </div>

          {!user && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-left">
              <h3 className="font-semibold text-slate-900">Save designs and use them on your links</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">With a free account you can save a design as a template and apply it to your short links from the dashboard.</p>
              <Link href="/login/?signUp=true" className="inline-block mt-3 text-sm font-semibold text-primary-700 hover:underline">Create a free account →</Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="card bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
            <div className="flex border-b border-slate-50 p-2 gap-1 bg-slate-50/30" role="tablist">
              {TABS.map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/60 ${tab === t ? 'bg-white text-primary-600 shadow-sm' : ''}`}>{t}</button>
              ))}
            </div>

            <div className="p-8">
              <QrDesignControls tab={tab} d={d} set={set} />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
