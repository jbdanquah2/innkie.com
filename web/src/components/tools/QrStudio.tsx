'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { useAuth } from '@/lib/auth';
import { QrDesignControls } from '@/components/app/QrDesignControls';
import { DEFAULT_DESIGN, toQrOptions, type QrDesign } from '@/lib/qr-config';
import { designIssues, ISSUE_TEXT, qrFileName } from '@/lib/qr-design-check';
import { normalizeLink } from '@/lib/qr-payload';
import { downloadBlob } from '@/lib/files';
import { useToast } from '@/lib/toast';

const TABS = ['Shapes', 'Colors', 'Logo', 'Background'] as const;
type Tab = (typeof TABS)[number];
const SIZES = [512, 1024, 2048];
const PREVIEW = 300;

const card = 'rounded-xl border border-slate-200 bg-white p-4 sm:p-5';
const field = 'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

/** Public QR Studio: type what the code should hold, style it, download PNG or SVG. Runs in the browser. */
export function QrStudio() {
  const toast = useToast();
  const { user } = useAuth();
  const host = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStyling | null>(null);
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Tab>('Shapes');
  const [d, setD] = useState<QrDesign>(DEFAULT_DESIGN);
  const [size, setSize] = useState(1024);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => setD((s) => ({ ...s, [k]: v }));

  // ?data=... (set by the QR generator's "Open QR Studio" link)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('data');
    if (q) setInput(q);
  }, []);

  const { value: data, added } = useMemo(() => normalizeLink(input), [input]);
  const issues = useMemo(() => designIssues(d, data), [d, data]);
  const blocked = !data.trim() || issues.includes('too-long');
  // The preview shows a stand-in while there is nothing valid to encode, so the styling can still be explored.
  const shown = blocked ? 'https://innkie.com' : data;

  const latest = useRef({ d, shown });
  latest.current = { d, shown };
  useEffect(() => {
    let cancelled = false;
    void import('qr-code-styling').then(({ default: QRCodeStyling }) => {
      if (cancelled || !host.current) return;
      const inst = new QRCodeStyling(toQrOptions(latest.current.d, latest.current.shown));
      host.current.innerHTML = '';
      inst.append(host.current);
      qr.current = inst;
    });
    return () => { cancelled = true; qr.current = null; if (host.current) host.current.innerHTML = ''; };
  }, []);
  useEffect(() => { qr.current?.update(toQrOptions(d, shown)); }, [d, shown]);

  const download = async (extension: 'png' | 'svg') => {
    if (blocked || busy) return;
    setBusy(true);
    try {
      const { default: QRCodeStyling } = await import('qr-code-styling');
      const px = extension === 'png' ? size : 1024;
      const inst = new QRCodeStyling({ ...toQrOptions(d, data), width: px, height: px, type: extension === 'png' ? 'canvas' : 'svg' });
      const blob = (await inst.getRawData(extension)) as Blob | null;
      if (!blob) throw new Error('empty');
      downloadBlob(blob, `${qrFileName(data)}.${extension}`);
    } catch {
      toast.error('Could not create the file. Try a smaller size or a smaller logo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
        <section className={card} aria-label="Preview and download">
          <div className="mx-auto relative" style={{ width: PREVIEW, height: PREVIEW, maxWidth: '100%' }}>
            <div ref={host} className={`rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center transition-opacity ${blocked ? 'opacity-30' : ''}`} style={{ width: PREVIEW, height: PREVIEW }} aria-label="QR code preview" role="img" />
            {!data.trim() && (
              <p className="absolute inset-0 flex items-center justify-center text-center px-10 text-sm font-medium text-slate-700 pointer-events-none">Enter a link or text to make your code</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="w-32">
              <label htmlFor="qr-size" className="block text-sm font-medium text-slate-700 mb-1.5">PNG size</label>
              <select id="qr-size" value={size} onChange={(e) => setSize(Number(e.target.value))} className={field}>
                {SIZES.map((s) => <option key={s} value={s}>{s} px</option>)}
              </select>
            </div>
            <button type="button" onClick={() => download('png')} disabled={blocked || busy} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40">Download PNG</button>
            <button type="button" onClick={() => download('svg')} disabled={blocked || busy} className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:border-slate-500 transition-colors disabled:opacity-40">Download SVG</button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Use SVG for print: it stays sharp at any size. The code is static, so it keeps working forever, but it cannot count scans.</p>
        </section>

        {!user && (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-900">Save designs and use them on your links</h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">With a free account you can save a design as a template and apply it to your short links from the dashboard.</p>
            <Link href="/login/?signUp=true" className="inline-block mt-2 text-sm font-semibold text-primary-700 hover:underline">Create a free account</Link>
          </section>
        )}
      </div>

      <div className="lg:col-span-7 space-y-4">
        <section className={card} aria-label="Content">
          <label htmlFor="qr-content" className="block text-sm font-medium text-slate-700 mb-1.5">What should the code open?</label>
          <input id="qr-content" type="text" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoComplete="off" placeholder="https://example.com, or any text" className={field} />
          <p className="mt-1.5 text-xs text-slate-500" role="status">
            {added ? <>We added https:// so phones treat it as a link. </> : null}
            For Wi-Fi, email or phone codes, use the <Link href="/tools/qr-generator/" className="text-primary-700 hover:underline">QR code generator</Link>.
          </p>
          {issues.length > 0 && (
            <ul className="mt-3 space-y-2" aria-label="Scanning warnings">
              {issues.map((i) => (
                <li key={i} role="alert" className={`rounded-lg border px-3 py-2 text-sm ${i === 'too-long' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>{ISSUE_TEXT[i]}</li>
              ))}
            </ul>
          )}
        </section>

        <section className={card} aria-label="Design">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="inline-flex p-1 rounded-lg bg-slate-100" role="tablist" aria-label="Design options">
              {TABS.map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{t}</button>
              ))}
            </div>
            <button type="button" onClick={() => setD(DEFAULT_DESIGN)} className="text-sm font-medium text-primary-700 hover:underline">Reset design</button>
          </div>
          <QrDesignControls tab={tab} d={d} set={set} />
        </section>
      </div>
    </div>
  );
}
