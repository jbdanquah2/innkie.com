'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { generateQrDataUrl } from '@/lib/qr';
import { useToast } from '@/lib/toast';

export function QrGenerator() {
  const toast = useToast();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);

  // Regenerate as the user types; a stale (slower) result never overwrites a newer one.
  useEffect(() => {
    const text = input.trim();
    if (!text) { setResult(null); return; }
    let cancelled = false;
    void generateQrDataUrl(text).then((r) => { if (!cancelled) setResult(r); });
    return () => { cancelled = true; };
  }, [input]);

  const isUrl = /^https?:\/\//.test(input.trim());

  const downloadPng = async () => {
    if (!result) return;
    downloadBlob(await (await fetch(result)).blob(), `innkie-qr-${Date.now()}.png`);
    toast.success('QR Code download started!');
    void logToolUsage('qr_studio', 'generate');
  };

  const downloadSvg = async () => {
    const text = input.trim();
    if (!text) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const svg = await QRCode.toString(text, { type: 'svg', margin: 2, color: { dark: '#000000', light: '#ffffff' } });
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `innkie-qr-${Date.now()}.svg`);
      toast.success('SVG Vector download started!');
      void logToolUsage('qr_studio', 'generate');
    } catch {
      toast.error('Failed to generate SVG');
    }
  };

  const copyImage = async () => {
    if (!result) return;
    try {
      const blob = await (await fetch(result)).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success('QR Code copied to clipboard!');
    } catch (e) {
      console.error('Copy failed', e);
      toast.error('Failed to copy image. Try downloading instead.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <label htmlFor="qr-input" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target URL or Text</label>
            <textarea id="qr-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://example.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700 min-h-[120px] resize-none" />
          </div>

          {isUrl && (
            <div className="p-5 bg-primary-50 rounded-2xl border border-primary-100">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 text-primary-600"><i className="fas fa-magic" /></div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Make it a Dynamic Link?</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">A short link lets you track scan analytics, and you can set an expiry or switch the link off after printing.</p>
                  </div>
                  <Link href={`/tools/link-shortener/?url=${encodeURIComponent(input.trim())}`} className="inline-flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors">
                    Try for Free <i className="fas fa-arrow-right" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
        <AdSlot slotId="qr_generator_sidebar" minHeight="250px" />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
        <span className="w-full text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Live Preview</span>
        <div className="relative group">
          {!result ? (
            <div className="w-64 h-64 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
              <i className="fas fa-qrcode text-5xl mb-4 opacity-50" />
              <p className="text-sm font-bold">Awaiting input...</p>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-3xl shadow-2xl border border-slate-100 transition-transform duration-500 group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="Generated QR Code" className="w-64 h-64 rounded-xl" />
            </div>
          )}
        </div>

        <div className="w-full mt-10 space-y-3">
          <button type="button" disabled={!result} onClick={downloadPng} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none">
            <i className="fas fa-download" /> Download PNG
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={!result} onClick={downloadSvg} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"><i className="fas fa-file-code" /> SVG Vector</button>
            <button type="button" disabled={!result} onClick={copyImage} className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"><i className="far fa-copy" /> Copy Image</button>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link href={`/tools/qr-studio/?data=${encodeURIComponent(input)}`} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-100 transition-all group">
              <i className="fas fa-palette group-hover:rotate-12 transition-transform" /> Add Logo &amp; Colors
            </Link>
          </div>
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest pt-2">High Resolution • Print Ready</p>
        </div>
      </div>
    </div>
  );
}
