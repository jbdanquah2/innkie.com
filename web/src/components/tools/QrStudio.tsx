'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { useAuth } from '@/lib/auth';
import { QrDesignControls } from '@/components/app/QrDesignControls';
import { DEFAULT_DESIGN, toQrOptions, type QrDesign } from '@/lib/qr-config';
import { useToast } from '@/lib/toast';

const TABS = ['Shapes', 'Colors', 'Logo', 'Background', 'Stamper'] as const;
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
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 pt-10 px-4 sm:px-6 lg:px-8">
      <nav className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {user && (<><Link href="/dashboard/" className="hover:text-primary-600 transition-colors">Dashboard</Link><span className="opacity-30">/</span></>)}
          <Link href="/tools/" className="hover:text-primary-600 transition-colors">Tools</Link>
          <span className="opacity-30">/</span>
          <Link href="/tools/qr-generator/" className="hover:text-primary-600 transition-colors">Generator</Link>
          <span className="opacity-30">/</span>
          <span className="text-slate-900">Studio</span>
        </div>
        <Link href={user ? '/dashboard/' : '/tools/qr-generator/'} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-primary-600 transition-all group">
          <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1" />
          {user ? 'Back to Dashboard' : 'Back to Generator'}
        </Link>
      </nav>

      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">QR Studio</h1>
        <p className="text-slate-500 font-medium mt-1">Design your brand&apos;s unique QR style.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="card p-10 bg-white border border-slate-100 shadow-sm rounded-3xl flex flex-col items-center gap-6 relative overflow-hidden group">
            <div ref={host} className="rounded-3xl shadow-md border border-slate-50 transition-transform duration-500 hover:scale-105 bg-white overflow-hidden flex items-center justify-center" style={{ width: 300, height: 300 }} />
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Brand Preview</p>
              <p className="text-sm font-bold text-slate-600">Apply this style to any link</p>
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
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl border border-slate-800 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="font-black text-lg mb-2 flex items-center gap-2"><i className="fas fa-unlock text-primary-400" /> Save Your Designs</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">Create a free account to save your custom QR templates and apply them to any link with one click.</p>
                <Link href="/login/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-500/20">
                  Sign Up Free <i className="fas fa-arrow-right" />
                </Link>
              </div>
              <i className="fas fa-magic absolute -bottom-4 -right-4 text-white/5 text-8xl -rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-0" />
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
              {(tab === 'Shapes' || tab === 'Colors' || tab === 'Logo' || tab === 'Background') && <QrDesignControls tab={tab} d={d} set={set} />}

              {tab === 'Stamper' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300"><i className="fas fa-link text-2xl" /></div>
                    <h4 className="text-slate-900 font-black text-sm mb-2">Connect Your Links</h4>
                    <p className="text-slate-500 text-xs font-medium max-w-[240px] mx-auto mb-6">{user ? 'Applying a design to your links is coming to this page soon.' : 'Login to see your shortened URLs and apply this design to them instantly.'}</p>
                    {!user && <Link href="/login/" className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors">Sign in to continue</Link>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
