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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100">
          <div className="p-8 md:p-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-slate-50 shadow-xl shadow-slate-100 mb-6">
                <Logo size="50px" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{registering ? 'Create Account' : 'Welcome Back'}</h1>
              <p className="mt-3 text-slate-500 font-medium">{registering ? 'Join thousands of users tracking their links' : 'Sign in to manage your shortened links'}</p>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors"><i className="fas fa-envelope" /></div>
                  <input id="login-email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} placeholder="you@example.com" className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200" />
                </div>
                {touched.email && emailErr && <div className="ml-1 text-xs font-bold text-rose-500" role="alert">{emailErr}</div>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="login-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  {!registering && <button type="button" onClick={forgot} className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">Forgot?</button>}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors"><i className="fas fa-lock" /></div>
                  <input id="login-password" type={showPw ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} placeholder="••••••••" className="block w-full pl-11 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200" />
                  <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((s) => !s)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                    <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
                {touched.password && pwErr && <div className="ml-1 text-xs font-bold text-rose-500" role="alert">{pwErr}</div>}

                {registering && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password Requirements</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {RULES.map((r) => {
                        const ok = r.test(password);
                        return (
                          <div key={r.label} className={`flex items-center gap-2 text-[10px] font-bold transition-all ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <i className={`fas ${ok ? 'fa-check-circle' : 'fa-circle'}`} /> {r.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-black rounded-2xl transition-all duration-200 shadow-xl shadow-primary-200 flex items-center justify-center gap-3 group relative overflow-hidden">
                {pwLoading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span className={pwLoading ? 'opacity-0' : ''}>{registering ? 'Create Account' : 'Sign In'}</span>
                {!pwLoading && <i className="fas fa-arrow-right text-sm transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <div className="relative my-10 text-center">
              <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-100" /></div>
              <div className="relative"><span className="px-4 bg-white text-xs font-black text-slate-400 uppercase tracking-widest">Or continue with</span></div>
            </div>

            <button type="button" onClick={onGoogle} disabled={loading} className="w-full py-4 bg-white border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 text-slate-700 font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 group shadow-sm relative overflow-hidden">
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/assets/google-logo.svg" alt="" className="w-5 h-5 transition-transform group-hover:scale-110" />
              )}
              <span className={googleLoading ? 'opacity-50' : ''}>{googleLoading ? 'Connecting...' : 'Google Account'}</span>
            </button>

            <div className="mt-10 text-center">
              <p className="text-sm font-medium text-slate-500">
                {registering ? 'Already have an account?' : "Don't have an account?"}
                <button type="button" onClick={() => setRegistering((r) => !r)} className="ml-1 text-primary-600 font-black hover:text-primary-700 transition-colors">{registering ? 'Sign In' : 'Sign Up'}</button>
              </p>
            </div>
          </div>

          <div className="bg-slate-50/50 p-6 border-t border-slate-100 text-center">
            <Link href="/" className="text-xs font-bold text-slate-500 hover:text-primary-600 flex items-center justify-center gap-2 transition-colors">
              <i className="fas fa-arrow-left" /> Back to iNNkie.com
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
