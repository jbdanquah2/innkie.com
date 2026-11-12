'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { authErrorMessage, registerWithPassword, safeReturnUrl, sendReset, signInWithGoogle, signInWithPassword, type AuthOutcome } from '@/lib/auth-actions';
import { useToast } from '@/lib/toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RULES = [
  { label: '8+ Characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function passwordError(p: string, registering: boolean): string {
  if (!p) return 'Password is required';
  if (p.length < 8) return 'Password must be at least 8 characters long';
  if (registering && !RULES.every((r) => r.test(p))) return 'Password must contain uppercase, lowercase, number, and special character';
  return '';
}

export function LoginForm() {
  const toast = useToast();
  const { user, ready } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [returnUrl, setReturnUrl] = useState('/dashboard/');
  const loading = pwLoading || googleLoading;

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setRegistering(q.get('signUp') === 'true');
    setReturnUrl(safeReturnUrl(q.get('returnUrl')));
  }, []);

  // Already signed in (e.g. opened /login in a second tab): go straight on.
  useEffect(() => {
    if (ready && user) window.location.replace(returnUrl);
  }, [ready, user, returnUrl]);

  const emailErr = !email ? 'Email is required' : !EMAIL_RE.test(email) ? 'Enter a valid email address' : '';
  const pwErr = passwordError(password, registering);

  const finish = (message: string, out: AuthOutcome) => {
    toast.success(message);
    out.warnings.forEach((w) => toast.warn(w, 7000));
    window.location.assign(returnUrl);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailErr || pwErr) return;
    setPwLoading(true);
    try {
      const out = registering ? await registerWithPassword(email.trim(), password) : await signInWithPassword(email.trim(), password);
      finish(registering ? 'Account successfully created!' : 'Successfully logged in!', out);
    } catch (err: any) {
      console.error('Authentication error:', err);
      toast.error(authErrorMessage(err, registering ? 'register' : 'login'));
      setPwLoading(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      finish('Successfully logged in with Google!', await signInWithGoogle());
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      toast.error(authErrorMessage(err, 'google'));
      setGoogleLoading(false);
    }
  };

  const forgot = async () => {
    setTouched((t) => ({ ...t, email: true }));
    if (!email || emailErr) return toast.warn('Please enter a valid email address first.');
    setPwLoading(true);
    try {
      await sendReset(email.trim());
    } catch (err: any) {
      // Do not reveal whether the address is registered; only surface errors the user can act on.
      if (err?.code !== 'auth/user-not-found') console.error(err);
      if (err?.code === 'auth/too-many-requests' || err?.code === 'auth/network-request-failed') {
        setPwLoading(false);
        return toast.error(authErrorMessage(err, 'login'));
      }
    }
    toast.info('If an account exists for that email, a password reset link is on its way.');
    setPwLoading(false);
  };

  const switchMode = () => {
    const next = !registering;
    setRegistering(next);
    setTouched({ email: false, password: false });
    const q = new URLSearchParams(window.location.search);
    if (next) q.set('signUp', 'true'); else q.delete('signUp');
    const qs = q.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  };

  const input = 'block w-full px-3 py-2.5 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-200';
  const border = (bad: boolean) => (bad ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-primary-600');
  const showEmailErr = touched.email && !!emailErr;
  const showPwErr = touched.password && !!pwErr;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-10 pb-12 sm:pt-16">
      <div className="w-full max-w-sm"><Logo showText size="36px" /></div>

      <main className="w-full max-w-sm mt-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{registering ? 'Create your account' : 'Sign in'}</h1>
        <p className="mt-2 text-slate-600">
          {registering ? 'Free. Save your short links, see their clicks and keep QR designs.' : 'Manage your short links and see how they perform.'}
        </p>

        <button type="button" onClick={onGoogle} disabled={loading} className="mt-8 w-full py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium hover:border-slate-500 transition-colors flex items-center justify-center gap-3 disabled:opacity-60">
          {googleLoading ? (
            <span className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" aria-hidden="true" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/assets/google-logo.svg" alt="" className="w-5 h-5" />
          )}
          {googleLoading ? 'Connecting…' : 'Continue with Google'}
        </button>

        <div className="relative my-6 text-center text-sm text-slate-500">
          <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-200" /></div>
          <span className="relative bg-white px-3">or use your email</span>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-1">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input id="login-email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} aria-invalid={showEmailErr} aria-describedby="login-email-err" placeholder="you@example.com" className={`${input} ${border(showEmailErr)}`} />
            <p id="login-email-err" className="mt-1.5 min-h-5 text-sm text-rose-700" role={showEmailErr ? 'alert' : undefined}>{showEmailErr ? emailErr : ''}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">Password</label>
              {!registering && <button type="button" onClick={forgot} disabled={loading} className="text-sm font-medium text-primary-700 hover:underline disabled:opacity-60">Forgot password?</button>}
            </div>
            <div className="relative">
              <input id="login-password" type={showPw ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} aria-invalid={showPwErr} aria-describedby={registering ? 'pw-rules' : 'login-pw-err'} className={`${input} pr-16 ${border(showPwErr)}`} />
              <button type="button" aria-pressed={showPw} onClick={() => setShowPw((v) => !v)} className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-slate-600 hover:text-slate-900">{showPw ? 'Hide' : 'Show'}</button>
            </div>
            {!registering && <p id="login-pw-err" className="mt-1.5 min-h-5 text-sm text-rose-700" role={showPwErr ? 'alert' : undefined}>{showPwErr ? pwErr : ''}</p>}

            {registering && (
              <ul id="pw-rules" className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm" aria-label="Password requirements">
                {RULES.map((r) => {
                  const ok = r.test(password);
                  return (
                    <li key={r.label} className={ok ? 'text-emerald-700' : touched.password ? 'text-rose-700' : 'text-slate-500'}>
                      <span aria-hidden="true" className="inline-block w-4">{ok ? '✓' : '•'}</span>
                      {r.label}<span className="sr-only">{ok ? ' (met)' : ' (not met yet)'}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button type="submit" disabled={loading} className="mt-3 w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {pwLoading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
            {pwLoading ? (registering ? 'Creating account…' : 'Signing in…') : registering ? 'Create account' : 'Sign in'}
          </button>

          {registering && (
            <p className="pt-3 text-xs text-slate-500 leading-relaxed">
              By creating an account you agree to the <Link href="/terms/" className="underline hover:text-slate-800">Terms of Service</Link> and
              acknowledge the <Link href="/privacy/" className="underline hover:text-slate-800">Privacy Policy</Link>.
            </p>
          )}
        </form>

        <p className="mt-8 text-sm text-slate-600">
          {registering ? 'Already have an account?' : 'New to iNNkie?'}{' '}
          <button type="button" onClick={switchMode} className="font-semibold text-primary-700 hover:underline">{registering ? 'Sign in' : 'Create an account'}</button>
        </p>
        <p className="mt-3 text-sm"><Link href="/" className="text-slate-500 hover:text-slate-800">Back to the tools</Link></p>
      </main>
    </div>
  );
}
