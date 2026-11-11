'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/Logo';
import { env } from '@/lib/env';
import { APP_PATHS } from '@/lib/utils/urls';

type State = 'loading' | 'password' | 'notfound' | 'disabled';

interface RedirectResponse { redirect?: boolean; originalUrl?: string; message?: string }

/** Only ever navigate to web URLs, whatever the API returns. */
const isWebUrl = (u: string) => /^https?:\/\//i.test(u);

/** `/r/<code>/` (Firebase serves this page for every /r/** path); `?code=` also works for local dev. */
function readCode(): string {
  const fromPath = window.location.pathname.replace(/^\/r\/?/, '').split('/')[0];
  return decodeURIComponent(fromPath || new URLSearchParams(window.location.search).get('code') || '');
}

export function RedirectClient() {
  const [state, setState] = useState<State>('loading');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [hide, setHide] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const call = async (shortCode: string, pw = ''): Promise<void> => {
    try {
      const res = await fetch(env.endpoints.redirectUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortCode, password: pw }),
      });
      const body: RedirectResponse = await res.json().catch(() => ({}));

      if (body.redirect && body.originalUrl) {
        if (isWebUrl(body.originalUrl)) return void window.location.assign(body.originalUrl);
        return setState('notfound');
      }
      if (body.message === 'Password is required' || body.message === 'Password is invalid') {
        setState('password');
        setError(body.message === 'Password is invalid' ? 'Invalid password' : '');
        return setBusy(false);
      }
      if (body.message === 'This URL is no longer active.' || body.message === 'URL is disabled or inactive') return setState('disabled');
      if (res.status >= 500) throw new Error(body.message || `HTTP ${res.status}`);
      setState('notfound');
    } catch (e) {
      console.error('Redirect failed:', e);
      setError('Something went wrong. Please try again.');
      setBusy(false);
      setState((s) => (s === 'loading' ? 'password' : s));
    }
  };

  useEffect(() => {
    if (started.current) return; // dev StrictMode runs effects twice; a redirect call counts a click
    started.current = true;
    const c = readCode();
    if (!c) return setState('notfound');
    if (APP_PATHS.includes(c)) return void window.location.replace('/');
    setCode(c);
    // The backend sends protected links here with ?pw=true so we don't count a click before the password is known.
    if (new URLSearchParams(window.location.search).get('pw') === 'true') return setState('password');
    void call(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return setError('Password required');
    setBusy(true);
    await call(code, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 selection:bg-primary-100 selection:text-primary-900">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-10"><Logo size="56px" showText /></div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {state === 'loading' && (
            <div className="p-12 flex flex-col items-center text-center" role="status">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center"><i className="fa-solid fa-link text-primary-600 animate-pulse" /></div>
              </div>
              <h1 className="text-xl font-bold text-slate-800 mb-2">Redirecting you...</h1>
              <p className="text-slate-500 text-sm">One moment while we verify the link and transport you to your destination.</p>
            </div>
          )}

          {state === 'password' && (
            <div className="p-8 md:p-10">
              <div className="bg-primary-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto"><i className="fa-solid fa-lock text-primary-600 text-2xl" /></div>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Protected Link</h1>
                <p className="text-slate-500 leading-relaxed">This link is guarded. Enter the password below to reveal the destination.</p>
              </div>
              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-1">
                  <label htmlFor="link-password" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <input id="link-password" type={hide ? 'password' : 'text'} autoComplete="current-password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-300" />
                    <button type="button" aria-label={hide ? 'Show password' : 'Hide password'} onClick={() => setHide((h) => !h)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors px-2">
                      <i className={`fa-solid ${hide ? 'fa-eye' : 'fa-eye-slash'}`} />
                    </button>
                  </div>
                  <div className="h-6 mt-1" aria-live="polite">
                    {error && <p className="text-red-500 text-sm font-semibold flex items-center gap-2"><i className="fa-solid fa-circle-exclamation text-xs" /> {error}</p>}
                  </div>
                </div>
                <button type="submit" disabled={busy} className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  {busy && <i className="fa-solid fa-circle-notch animate-spin" />}
                  <span>{busy ? 'Unlocking...' : 'Unlock Link'}</span>
                </button>
              </form>
            </div>
          )}

          {state === 'notfound' && (
            <div className="p-10 md:p-12 text-center">
              <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto rotate-3"><i className="fa-solid fa-ghost text-red-500 text-4xl" /></div>
              <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Ghost Link!</h1>
              <p className="text-slate-500 leading-relaxed mb-10">We searched everywhere, but this link seems to have vanished into thin air or never existed at all.</p>
              <Link href="/" className="inline-flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-[0.98]"><i className="fa-solid fa-arrow-left" /> Return Home</Link>
            </div>
          )}

          {state === 'disabled' && (
            <div className="p-10 md:p-12 text-center">
              <div className="bg-amber-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto -rotate-3"><i className="fa-solid fa-hourglass-end text-amber-500 text-4xl" /></div>
              <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Link Expired</h1>
              <p className="text-slate-500 leading-relaxed mb-10">This link has reached its limit or its time has run out. It is no longer accepting visitors.</p>
              <div className="space-y-4">
                <Link href="/tools/link-shortener/" className="block w-full bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-[0.98]">Create Your Own Link</Link>
                <Link href="/contact/" className="block text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm">Contact support if you think this is a mistake</Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-12 text-slate-400 text-sm font-medium">
          Powered by <span className="text-slate-600 font-bold">iNNkie</span> &bull;{' '}
          <Link href="/terms/" className="hover:text-primary-600 transition-colors">Terms</Link> &bull;{' '}
          <Link href="/privacy/" className="hover:text-primary-600 transition-colors">Privacy</Link>
        </p>
      </div>
    </div>
  );
}
