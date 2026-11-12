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

  return (
    <>
      <div className="max-w-3xl mx-auto mb-16">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-2 md:p-3 relative group transition-all hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400"><i className="fas fa-link text-lg" /></div>
                <input
                  type="url"
                  aria-label="Long URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => void fetchPreview(url)}
                  placeholder="Paste your long URL here..."
                  className="block w-full pl-14 pr-4 py-5 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-transparent rounded-[2rem] text-slate-900 placeholder-slate-400 transition-all font-bold text-lg shadow-sm"
                />
              </div>
              <button type="submit" disabled={!valid || loading} className="px-10 py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-[2rem] shadow-xl shadow-primary-200 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg flex items-center justify-center min-w-[180px]">
                {loading ? <i className="fas fa-circle-notch fa-spin" /> : <span className="flex items-center gap-3">Shorten <i className="fas fa-magic text-xs opacity-70" /></span>}
              </button>
            </div>
            <div className="flex max-w-md mx-auto md:mx-0">
              <span className="inline-flex shrink-0 items-center px-3 sm:px-5 rounded-l-2xl border border-r-0 border-slate-100 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest">innkie.com/</span>
              <input
                type="text"
                aria-label="Custom alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="custom-alias (optional)"
                aria-invalid={!aliasValid}
                className={`flex-1 min-w-0 px-5 py-3 bg-white border rounded-r-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-slate-700 text-sm ${aliasValid ? 'border-slate-100' : 'border-rose-300'}`}
              />
            </div>
          </form>
        </div>

        {!compact && preview && (
          <div className="mt-12 max-w-xl mx-auto">
            <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-2xl text-left transition-all group">
              <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {(preview.thumbnailUrl || preview.favicon) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.thumbnailUrl || preview.favicon} alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 -z-10"><i className="fas fa-link text-slate-200 text-4xl" /></div>
                <div className="absolute top-4 left-4">
                  <div className="bg-white/90 px-3 py-1.5 rounded-xl border border-white/20 shadow-sm flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {preview.favicon && <img src={preview.favicon} className="h-4 w-4 rounded-md" alt="" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{preview.site}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-2">
                <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-1">{preview.title || preview.site}</h4>
                <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">{preview.description}</p>
              </div>
            </div>
          </div>
        )}

        {short && compact && (
          <div className="mt-4 text-left rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-grow">
                <p className="text-xs text-slate-500">Your short link</p>
                <a href={short.url} target="_blank" rel="noopener noreferrer" className="block font-semibold text-slate-900 truncate hover:underline select-all">{short.url}</a>
              </div>
              <button type="button" onClick={() => copy(short.url)} className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shrink-0">
                <i className="far fa-copy" /> Copy
              </button>
            </div>
            {qr && (
              <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR code for your short link" className="h-16 w-16 rounded-md border border-slate-200 p-1 bg-white shrink-0" />
                <div className="text-sm text-slate-600 min-w-0">
                  <p>QR code for the same link.</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <button type="button" onClick={downloadQr} className="font-medium text-primary-700 hover:underline">Download PNG</button>
                    <Link href="/tools/qr-studio/" className="font-medium text-primary-700 hover:underline">Branded QR</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {short && !compact && (
          <div className="mt-12 text-left">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-600/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                  <h3 className="text-2xl font-black tracking-tight leading-none">Your link is ready!</h3>
                  <div className="flex items-center gap-2">
                    <a href={short.original} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-white/5 flex items-center gap-2">
                      Visit <i className="fas fa-external-link-alt text-[10px]" />
                    </a>
                    <button type="button" onClick={share} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-500/20">
                      Share <i className="fas fa-share-alt text-[10px]" />
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 border border-white/5">
                  <div className="flex-grow min-w-0">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Shortened Link</p>
                    <span className="text-white font-bold truncate block text-2xl select-all tracking-tight">{short.url}</span>
                  </div>
                  <button type="button" onClick={() => copy(short.url)} className="w-full md:w-auto px-8 py-4 bg-white text-slate-900 font-black rounded-xl hover:bg-primary-50 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl">
                    <i className="far fa-copy" /> Copy Link
                  </button>
                </div>

                {qr && (
                  <div className="mt-10 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-white p-3 rounded-2xl shadow-inner shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qr} alt="QR Code" className="h-28 w-28" />
                    </div>
                    <div className="flex-grow space-y-4">
                      <div>
                        <h4 className="font-black text-lg text-white tracking-tight">QR Code Ready</h4>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">Instantly generated for your link. Customize colors and add your logo with a Pro account.</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={downloadQr} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/5">Download</button>
                        <Link href="/tools/qr-studio/" className="px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Branded QR</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {!compact && !user && guestLinks.length > 0 && (
        <section className="mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Recent Links</h2>
              <p className="text-slate-500 mt-2 font-medium">Your last 10 links are stored securely in your browser.</p>
            </div>
            <Link href="/login/" className="px-8 py-3.5 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm text-xs uppercase tracking-[0.2em] active:scale-95">Save them forever →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guestLinks.map((l) => {
              const full = `${env.appUrl}/${l.shortCode}`;
              return (
                <div key={l.shortCode} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Short link</p>
                    <a href={full} target="_blank" rel="noopener noreferrer" className="block font-black text-primary-600 truncate hover:underline">{full}</a>
                    <p className="text-xs text-slate-400 font-medium truncate mt-1">{String(l.originalUrl ?? '')}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <button type="button" onClick={() => copy(full)} className="flex-1 py-2.5 bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"><i className="far fa-copy mr-1.5" />Copy</button>
                    <Link href="/tools/qr-studio/" className="px-4 py-2.5 bg-slate-50 hover:bg-primary-50 text-slate-500 hover:text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">QR</Link>
                    <button type="button" aria-label="Remove link" onClick={() => removeGuest(l.shortCode)} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all"><i className="fas fa-trash-alt text-xs" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
