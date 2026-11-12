'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { downloadBlob } from '@/lib/files';
import { env } from '@/lib/env';
import { createShortUrl, getGuestLinks, type CreatedLink } from '@/lib/links';
import { generateQrDataUrl } from '@/lib/qr';
import { useToast } from '@/lib/toast';

interface Preview { thumbnailUrl?: string; favicon?: string; site?: string; title?: string; description?: string }

const URL_RE = /^https?:\/\/.+/;
const ALIAS_RE = /^[a-zA-Z0-9_-]+$/;
const GUEST_KEY = 'innkie_guest_links';

/** `compact` is for embedding (homepage hero): no preview card, a small result row, no recent-links grid. */
export function LinkShortener({ compact = false }: { compact?: boolean } = {}) {
  const toast = useToast();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [short, setShort] = useState<{ code: string; url: string; original: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [guestLinks, setGuestLinks] = useState<CreatedLink[]>([]);

  const urlValid = URL_RE.test(url.trim());
  const aliasValid = !alias || ALIAS_RE.test(alias);
  const valid = urlValid && aliasValid;

  useEffect(() => setGuestLinks(getGuestLinks()), []);

  // ?url=... prefill (used by links from the UTM builder)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('url');
    if (q) { setUrl(q); void fetchPreview(q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPreview(u: string) {
    if (!URL_RE.test(u.trim())) {
      if (u.trim()) toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }
    try {
      const res = await apiFetch(`${env.endpoints.previewLongUrl}?longUrl=${encodeURIComponent(u.trim())}`);
      if (res.ok) setPreview(await res.json());
    } catch (e) {
      console.error('Preview failed', e);
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return toast.error('Please enter a valid URL and custom alias (alphanumeric only).');
    setLoading(true);
    try {
      const result = await createShortUrl(url.trim(), { customAlias: alias.trim() });
      setGuestLinks(getGuestLinks());
      setQr(await generateQrDataUrl(String(result.originalUrl ?? url.trim())));
      setShort({ code: result.shortCode, url: `${env.appUrl}/${result.shortCode}`, original: url.trim() });
      toast.success('URL successfully shortened!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('URL copied to clipboard!'); }
    catch { toast.error('Failed to copy URL.'); }
  };

  const share = () => {
    if (!short) return;
    if (navigator.share) navigator.share({ title: 'Check out my shortened link', text: 'Here’s a link I shortened:', url: short.url }).catch(() => {});
    else toast.info('Sharing not supported on this browser.');
  };

  const downloadQr = async () => {
    if (!qr || !short) return;
    downloadBlob(await (await fetch(qr)).blob(), `qr-code-${short.code}.png`);
  };

  const removeGuest = (code: string) => {
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(getGuestLinks().filter((l) => l.shortCode !== code))); } catch {}
    setGuestLinks(getGuestLinks());
    toast.success('Guest link removed.');
  };

  const showRecent = !compact && !user && guestLinks.length > 0;

  return (
    <>
      <div className="w-full">
        <form onSubmit={submit} noValidate className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <label htmlFor="long-url" className="sr-only">Long URL</label>
              <input
                id="long-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => void fetchPreview(url)}
                placeholder="Paste a long URL, https://..."
                aria-invalid={!!url && !urlValid}
                className="block w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-base outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200 aria-[invalid=true]:border-rose-400"
              />
            </div>
            <button
              type="submit"
              disabled={!valid || loading}
              className="px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:min-w-[130px]"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin" aria-label="Shortening" /> : 'Shorten'}
            </button>
          </div>
          <div>
            <label htmlFor="custom-alias" className="block text-sm font-medium text-slate-700 mb-1.5">Custom ending <span className="font-normal text-slate-500">(optional)</span></label>
            <div className="flex max-w-md">
              <span className="inline-flex shrink-0 items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">innkie.com/</span>
              <input
                id="custom-alias"
                type="text"
                autoComplete="off"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="spring-sale"
                aria-invalid={!aliasValid}
                className="flex-1 min-w-0 px-3 py-2 rounded-r-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200 aria-[invalid=true]:border-rose-400"
              />
            </div>
            <p className={`mt-1.5 text-xs ${aliasValid ? 'text-slate-500' : 'text-rose-600'}`} role={aliasValid ? undefined : 'alert'}>
              {aliasValid ? 'Letters, numbers, - and _ only.' : 'Use only letters, numbers, - and _.'}
            </p>
          </div>
        </form>

        {preview && (
          <div className="mt-4 text-left rounded-xl border border-slate-200 bg-white p-3 flex gap-4 items-center">
            <div className="h-20 w-20 sm:h-24 sm:w-32 shrink-0 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
              {(preview.thumbnailUrl || preview.favicon) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.thumbnailUrl || preview.favicon} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} className="h-full w-full object-cover" />
              ) : (
                <i className="fas fa-link text-slate-300 text-2xl" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs text-slate-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {preview.favicon && <img src={preview.favicon} className="h-4 w-4 rounded-sm" alt="" />}
                <span className="truncate">{preview.site}</span>
              </p>
              <h3 className="mt-1 font-semibold text-slate-900 leading-snug line-clamp-1">{preview.title || preview.site}</h3>
              {preview.description && <p className="mt-1 text-sm text-slate-600 line-clamp-2 leading-snug">{preview.description}</p>}
            </div>
          </div>
        )}

        {short && (
          <div className="mt-4 text-left rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 space-y-4" role="status" aria-live="polite">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-grow">
                <p className="text-xs font-medium text-emerald-800">Your short link is ready</p>
                <a href={short.url} target="_blank" rel="noopener noreferrer" className="block text-lg font-semibold text-slate-900 truncate hover:underline select-all">{short.url}</a>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => copy(short.url)} className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                  <i className="far fa-copy" aria-hidden="true" /> Copy
                </button>
                <button type="button" onClick={share} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-800 font-semibold rounded-lg hover:border-slate-500 transition-colors">Share</button>
              </div>
            </div>
            {qr && (
              <div className="flex items-center gap-4 border-t border-emerald-200/70 pt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR code for your short link" className="h-20 w-20 rounded-md border border-slate-200 p-1 bg-white shrink-0" />
                <div className="text-sm text-slate-600 min-w-0">
                  <p>QR code for this link.</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <button type="button" onClick={downloadQr} className="font-medium text-primary-700 hover:underline">Download PNG</button>
                    <Link href="/tools/qr-studio/" className="font-medium text-primary-700 hover:underline">Design a branded QR</Link>
                    <a href={short.original} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-700 hover:underline">Open destination</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showRecent && (
        <section className="mt-12" aria-label="Recent links">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Your recent links</h2>
              <p className="text-sm text-slate-500 mt-1">The last 10 are kept in this browser only. <Link href="/login/" className="text-primary-700 font-medium hover:underline">Create a free account</Link> to keep them and see their clicks.</p>
            </div>
          </div>
          <ul className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
            {guestLinks.map((l) => {
              const full = `${env.appUrl}/${l.shortCode}`;
              return (
                <li key={l.shortCode} className="py-3 px-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <a href={full} target="_blank" rel="noopener noreferrer" className="block font-semibold text-primary-700 truncate hover:underline">{full}</a>
                    <p className="text-sm text-slate-500 truncate">{String(l.originalUrl ?? '')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => copy(full)} className="px-3 py-1.5 rounded-md border border-slate-300 text-sm font-medium text-slate-700 hover:border-slate-500">Copy</button>
                    <button type="button" aria-label={`Remove ${full}`} onClick={() => removeGuest(l.shortCode)} className="px-3 py-1.5 rounded-md text-sm font-medium text-rose-700 hover:bg-rose-50">Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
