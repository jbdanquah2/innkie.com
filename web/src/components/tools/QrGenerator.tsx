'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { emailPayload, normalizeLink, phonePayload, scanWarning, wifiPayload, type QrKind, type WifiFields } from '@/lib/qr-payload';
import { useToast } from '@/lib/toast';

type Ec = 'L' | 'M' | 'Q' | 'H';

const KINDS: { id: QrKind; label: string }[] = [
  { id: 'link', label: 'Link' },
  { id: 'text', label: 'Text' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
];
const SIZES = [256, 512, 1024, 2048];
const EC_OPTIONS: { id: Ec; label: string }[] = [
  { id: 'L', label: 'Low (7%)' },
  { id: 'M', label: 'Medium (15%)' },
  { id: 'Q', label: 'Quartile (25%)' },
  { id: 'H', label: 'High (30%)' },
];
const EC_HELP: Record<Ec, string> = {
  L: 'The simplest code. Best for clean screens.',
  M: 'A good default for almost everything.',
  Q: 'Reads through more dirt and wear.',
  H: 'Most forgiving, but the densest code. Use it when something will cover part of the code.',
};
const MARGINS = [
  { id: 0, label: 'None' },
  { id: 2, label: 'Small' },
  { id: 4, label: 'Standard' },
];
const SCAN_MESSAGE = {
  inverted: 'Light-on-dark codes fail on some scanners. Make the code darker than its background.',
  'low-contrast': 'These colours are too close together and may not scan. Use a darker code or a lighter background.',
} as const;

const field = 'block w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-base outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';
const card = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6';

export function QrGenerator() {
  const toast = useToast();
  const [kind, setKind] = useState<QrKind>('link');
  const [link, setLink] = useState('');
  const [text, setText] = useState('');
  const [wifi, setWifi] = useState<WifiFields>({ ssid: '', password: '', security: 'WPA', hidden: false });
  const [mail, setMail] = useState({ to: '', subject: '', body: '' });
  const [phone, setPhone] = useState('');
  const [size, setSize] = useState(1024);
  const [ec, setEc] = useState<Ec>('M');
  const [margin, setMargin] = useState(4);
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [preview, setPreview] = useState<{ url: string; version: number } | null>(null);
  const [tooBig, setTooBig] = useState(false);

  // ?data=... prefill (used by links from other tools).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('data');
    if (!q) return;
    if (/^https?:\/\//i.test(q) || normalizeLink(q).added) { setKind('link'); setLink(q); } else { setKind('text'); setText(q); }
  }, []);

  const normalized = useMemo(() => normalizeLink(link), [link]);
  const payload = useMemo(() => {
    switch (kind) {
      case 'link': return normalized.value;
      case 'text': return text.trim();
      case 'wifi': return wifiPayload(wifi);
      case 'email': return emailPayload(mail.to, mail.subject, mail.body);
      case 'phone': return phonePayload(phone);
    }
  }, [kind, normalized, text, wifi, mail, phone]);

  const warning = scanWarning(fg, bg);
  const dense = (preview?.version ?? 0) >= 10;

  const opts = { errorCorrectionLevel: ec, margin, color: { dark: fg, light: bg } } as const;

  // Live preview. Debounced, and a slower earlier result never overwrites a newer one.
  useEffect(() => {
    if (!payload) { setPreview(null); setTooBig(false); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const code = QRCode.create(payload, { errorCorrectionLevel: ec });
        const url = await QRCode.toDataURL(payload, { ...opts, width: 512 });
        if (!cancelled) { setPreview({ url, version: code.version }); setTooBig(false); }
      } catch {
        if (!cancelled) { setPreview(null); setTooBig(true); }
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, ec, margin, fg, bg]);

  const renderPng = async (width: number) => {
    const QRCode = (await import('qrcode')).default;
    return QRCode.toDataURL(payload, { ...opts, width });
  };

  const downloadPng = async () => {
    if (!preview) return;
    downloadBlob(await (await fetch(await renderPng(size))).blob(), `innkie-qr-${size}px-${Date.now()}.png`);
    toast.success(`PNG downloaded (${size} × ${size} px)`);
    void logToolUsage('qr_studio', 'generate');
  };

  const downloadSvg = async () => {
    if (!preview) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const svg = await QRCode.toString(payload, { type: 'svg', ...opts });
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `innkie-qr-${Date.now()}.svg`);
      toast.success('SVG downloaded');
      void logToolUsage('qr_studio', 'generate');
    } catch {
      toast.error('Failed to create the SVG');
    }
  };

  const copyImage = async () => {
    if (!preview) return;
    try {
      const blob = await (await fetch(await renderPng(Math.min(size, 1024)))).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success('QR code copied to clipboard');
    } catch (e) {
      console.error('Copy failed', e);
      toast.error('Could not copy the image. Try downloading it instead.');
    }
  };

  const coloursChanged = fg !== '#000000' || bg !== '#ffffff';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 items-start">
      <div className="min-w-0 space-y-6">
        <section className={card} aria-label="What the code contains">
          <div role="tablist" aria-label="What the code contains" className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 w-fit mb-5">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                role="tab"
                aria-selected={kind === k.id}
                onClick={() => setKind(k.id)}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${kind === k.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {k.label}
              </button>
            ))}
          </div>

          {kind === 'link' && (
            <div>
              <label htmlFor="qr-link" className={label}>Web address</label>
              <input id="qr-link" type="text" inputMode="url" autoComplete="off" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com" className={field} />
              {normalized.added && <p className="mt-1.5 text-xs text-slate-500">We added https:// so phones open it as a link: <span className="font-mono">{normalized.value}</span></p>}
            </div>
          )}

          {kind === 'text' && (
            <div>
              <label htmlFor="qr-text" className={label}>Text</label>
              <textarea id="qr-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Any message, code or note" className={`${field} resize-y`} />
              <p className="mt-1.5 text-xs text-slate-500">{text.trim().length} characters. Shorter text makes a simpler code that scans more easily.</p>
            </div>
          )}

          {kind === 'wifi' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="qr-ssid" className={label}>Network name (SSID)</label>
                <input id="qr-ssid" type="text" autoComplete="off" value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} className={field} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="qr-sec" className={label}>Security</label>
                  <select id="qr-sec" value={wifi.security} onChange={(e) => setWifi({ ...wifi, security: e.target.value as WifiFields['security'] })} className={field}>
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">No password</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="qr-pass" className={label}>Password</label>
                  <input id="qr-pass" type="text" autoComplete="off" disabled={wifi.security === 'nopass'} value={wifi.password} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} className={`${field} disabled:bg-slate-50 disabled:text-slate-400`} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={wifi.hidden} onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-primary-600" />
                This is a hidden network
              </label>
              <p className="text-xs text-slate-500">Phones that scan this code can join the network without typing the password. It is created in your browser and never sent anywhere.</p>
            </div>
          )}

          {kind === 'email' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="qr-to" className={label}>Email address</label>
                <input id="qr-to" type="email" autoComplete="off" value={mail.to} onChange={(e) => setMail({ ...mail, to: e.target.value })} placeholder="hello@example.com" className={field} />
              </div>
              <div>
                <label htmlFor="qr-subject" className={label}>Subject <span className="font-normal text-slate-500">(optional)</span></label>
                <input id="qr-subject" type="text" value={mail.subject} onChange={(e) => setMail({ ...mail, subject: e.target.value })} className={field} />
              </div>
              <div>
                <label htmlFor="qr-body" className={label}>Message <span className="font-normal text-slate-500">(optional)</span></label>
                <textarea id="qr-body" rows={3} value={mail.body} onChange={(e) => setMail({ ...mail, body: e.target.value })} className={`${field} resize-y`} />
              </div>
            </div>
          )}

          {kind === 'phone' && (
            <div>
              <label htmlFor="qr-phone" className={label}>Phone number</label>
              <input id="qr-phone" type="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" className={field} />
              <p className="mt-1.5 text-xs text-slate-500">Include the country code, such as +44, so it works from anywhere.</p>
            </div>
          )}
        </section>

        <section className={card} aria-label="Size and appearance">
          <h2 className="font-semibold text-slate-900 mb-4">Size and appearance</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="qr-size" className={label}>PNG size</label>
              <select id="qr-size" value={size} onChange={(e) => setSize(Number(e.target.value))} className={field}>
                {SIZES.map((s) => <option key={s} value={s}>{s} × {s} px</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qr-ec" className={label}>Error correction</label>
              <select id="qr-ec" value={ec} onChange={(e) => setEc(e.target.value as Ec)} className={field}>
                {EC_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qr-margin" className={label}>Blank border</label>
              <select id="qr-margin" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className={field}>
                {MARGINS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">{EC_HELP[ec]} Keep a border when you print: scanners need blank space around the code.</p>

          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="qr-fg" className={label}>Code colour</label>
              <div className="flex items-center gap-3">
                <input id="qr-fg" type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border border-slate-300 bg-white p-1" />
                <span className="font-mono text-sm text-slate-600">{fg}</span>
              </div>
            </div>
            <div>
              <label htmlFor="qr-bg" className={label}>Background colour</label>
              <div className="flex items-center gap-3">
                <input id="qr-bg" type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border border-slate-300 bg-white p-1" />
                <span className="font-mono text-sm text-slate-600">{bg}</span>
              </div>
            </div>
          </div>
          {warning && (
            <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{SCAN_MESSAGE[warning]}</p>
          )}
          {coloursChanged && (
            <button type="button" onClick={() => { setFg('#000000'); setBg('#ffffff'); }} className="mt-3 text-sm font-medium text-primary-700 hover:underline">Reset to black on white</button>
          )}
        </section>

        <AdSlot slotId="qr_generator_sidebar" minHeight="250px" />
      </div>

      <div className="min-w-0 lg:sticky lg:top-24">
        <section className={card} aria-label="Preview and download">
          <h2 className="font-semibold text-slate-900 mb-4">Preview</h2>
          <div className="flex justify-center">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt="QR code preview" className="w-full max-w-[288px] aspect-square rounded-lg border border-slate-200" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <div className="w-full max-w-[288px] aspect-square rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-center px-6">
                <i className="fas fa-qrcode text-4xl mb-3 opacity-60" aria-hidden="true" />
                <p className="text-sm" role="status">{tooBig ? 'That is too much content for a QR code. Shorten it, or use a short link.' : 'Your QR code appears here as you type.'}</p>
              </div>
            )}
          </div>

          {preview && (
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-slate-600">{payload.length} characters · QR version {preview.version}</p>
              {dense && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">This is a dense code. Print it larger, or shorten the content so it scans more easily.</p>}
              <details className="text-slate-600">
                <summary className="cursor-pointer select-none hover:text-slate-900">What the code contains</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all rounded-lg bg-slate-50 border border-slate-200 p-3 font-mono text-xs text-slate-700">{payload}</pre>
              </details>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3">
            <button type="button" disabled={!preview} onClick={downloadPng} className="px-5 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <i className="fas fa-download" aria-hidden="true" /> Download PNG ({size} px)
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={!preview} onClick={downloadSvg} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:border-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Download SVG</button>
              <button type="button" disabled={!preview} onClick={copyImage} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:border-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Copy image</button>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">SVG stays sharp at any size, so use it for print. Always scan the finished code with a phone before you use it.</p>

          <div className="mt-5 pt-5 border-t border-slate-200 space-y-2 text-sm">
            {kind === 'link' && /^https?:\/\//i.test(payload) && (
              <p className="text-slate-600">
                Want to count scans? <Link href={`/tools/link-shortener/?url=${encodeURIComponent(payload)}`} className="font-medium text-primary-700 hover:underline">Make a short link</Link> first and put that in the code.
              </p>
            )}
            <p className="text-slate-600">
              Need a logo, gradient or custom shapes? <Link href={`/tools/qr-studio/?data=${encodeURIComponent(payload)}`} className="font-medium text-primary-700 hover:underline">Open QR Studio</Link>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
