'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/Logo';
import { env } from '@/lib/env';
import { APP_PATHS } from '@/lib/utils/urls';

type State = 'loading' | 'password' | 'notfound' | 'disabled' | 'error';

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
      setBusy(false);
      // A protected link keeps its password form (with the message under the field); anything else gets a retry screen.
      setState((s) => (s === 'password' ? s : 'error'));
      setError('Something went wrong. Please try again.');
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
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-10 pb-10 sm:pt-16">
      <div className="w-full max-w-sm"><Logo size="32px" showText /></div>

      <main className="w-full max-w-sm mt-10 flex-1">
        {state === 'loading' && (
          <div role="status" aria-live="polite">
            <div className="w-8 h-8 border-[3px] border-slate-200 border-t-primary-600 rounded-full animate-spin mb-5" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-slate-900">Taking you there&hellip;</h1>
            <p className="mt-2 text-slate-600">One moment while we check the link.</p>
          </div>
        )}

        {state === 'password' && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">This link is password protected</h1>
            <p className="mt-2 text-slate-600">Enter the password the sender gave you to continue.</p>
            <form onSubmit={submit} className="mt-6 space-y-1" noValidate>
              <label htmlFor="link-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="link-password" type={hide ? 'password' : 'text'} autoComplete="current-password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} aria-invalid={!!error} aria-describedby="link-password-err" className={`block w-full px-3 py-2.5 pr-16 rounded-lg border bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary-200 ${error ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-primary-600'}`} />
                <button type="button" aria-pressed={!hide} onClick={() => setHide((h) => !h)} className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-slate-600 hover:text-slate-900">{hide ? 'Show' : 'Hide'}</button>
              </div>
              <p id="link-password-err" className="mt-1.5 min-h-5 text-sm text-rose-700" role={error ? 'alert' : undefined}>{error}</p>
              <button type="submit" disabled={busy} className="mt-3 w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {busy && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
                {busy ? 'Checking…' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {state === 'error' && (
          <div role="alert">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-slate-600 leading-relaxed">We could not check this link just now. Check your connection and try again.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-6 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-semibold transition-colors">Try again</button>
          </div>
        )}

        {state === 'notfound' && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">We can&apos;t find that link</h1>
            <p className="mt-2 text-slate-600 leading-relaxed">It may have been deleted, or the address may have a typo. Check it and try again.</p>
            <Link href="/" className="inline-block mt-6 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-semibold transition-colors">Go to iNNkie</Link>
          </div>
        )}

        {state === 'disabled' && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">This link has expired</h1>
            <p className="mt-2 text-slate-600 leading-relaxed">Its owner set a time or click limit, and it has been reached, so it no longer redirects.</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/tools/link-shortener/" className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-semibold transition-colors">Make your own short link</Link>
              <Link href="/contact/" className="text-sm font-medium text-primary-700 hover:underline">Think this is a mistake?</Link>
            </div>
          </div>
        )}
      </main>

      <p className="w-full max-w-sm mt-12 text-sm text-slate-500">
        Short link by <Link href="/" className="font-medium text-slate-700 hover:underline">iNNkie</Link> &middot;{' '}
        <Link href="/terms/" className="hover:text-slate-800">Terms</Link> &middot;{' '}
        <Link href="/privacy/" className="hover:text-slate-800">Privacy</Link> &middot;{' '}
        <Link href="/report-abuse/" className="hover:text-slate-800">Report this link</Link>
      </p>
    </div>
  );
}
