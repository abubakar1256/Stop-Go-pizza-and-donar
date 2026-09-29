import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { api } from '../services/api';
import { useAuth } from '../store/useAuth';
import { useLanguage } from '../store/useLanguage';
import { tr } from '../i18n';

let supabaseBrowserClient: ReturnType<typeof createClient> | null = null;

function browserSupabase() {
  if (supabaseBrowserClient) return supabaseBrowserClient;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  supabaseBrowserClient = createClient(url, key);
  return supabaseBrowserClient;
}

export function AccountPage() {
  const user = useAuth((state) => state.user);
  const login = useAuth((state) => state.login);
  const register = useAuth((state) => state.register);
  const logout = useAuth((state) => state.logout);
  const acceptSession = useAuth((state) => state.acceptSession);
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const googleReady = Boolean(browserSupabase());
  const language = useLanguage((state) => state.language);

  useEffect(() => {
    const client = browserSupabase();
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const recoveryLink = searchParams.get('mode') === 'recovery'
      || searchParams.get('type') === 'recovery'
      || hashParams.get('type') === 'recovery';
    if (recoveryLink) setMode('reset');
    if (!client || (useAuth.getState().token && !recoveryLink)) return;

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        return;
      }
      if (!session || recoveryLink || useAuth.getState().token) return;
      window.setTimeout(async () => {
        try {
          const result = await api.session(session.access_token);
          acceptSession(result.token, result.user);
        } catch {
          // Keep the account page usable if the backend is temporarily offline.
        }
      }, 0);
    });

    client.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken || recoveryLink) return;
      const result = await api.session(accessToken);
      acceptSession(result.token, result.user);
    }).catch(() => undefined);

    return () => authListener.subscription.unsubscribe();
  }, [acceptSession]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else if (mode === 'register') await register(form);
      const dest = (location.state as { from?: string } | null)?.from || '/account';
      navigate(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr(language, 'Could not sign in.'));
    } finally {
      setPending(false);
    }
  }

  async function sendResetEmail(event: FormEvent) {
    event.preventDefault();
    const client = browserSupabase();
    if (!client) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const result = await client.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/account?mode=recovery`,
      });
      if (result.error) throw result.error;
      setNotice('Password reset email sent. Check your inbox and follow the link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : tr(language, 'Could not send the reset email.'));
    } finally {
      setPending(false);
    }
  }

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    const client = browserSupabase();
    if (!client) return;
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setPending(true);
    setError('');
    setNotice('');
    try {
      const result = await client.auth.updateUser({ password: form.password });
      if (result.error) throw result.error;
      await client.auth.signOut();
      logout();
      window.history.replaceState({}, '', '/account');
      setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      setMode('login');
      setNotice('Password updated. You can sign in now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : tr(language, 'Could not update your password.'));
    } finally {
      setPending(false);
    }
  }

  async function google() {
    const client = browserSupabase();
    if (!client) return;
    await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/account` } });
  }

  async function signOut() {
    const client = browserSupabase();
    try {
      // Clear Supabase's persisted browser session as well as the app session.
      await client?.auth.signOut({ scope: 'local' });
    } finally {
      logout();
    }
  }

  function switchMode(next: 'login' | 'register' | 'forgot') {
    setMode(next);
    setError('');
    setNotice('');
  }

  if (mode === 'reset') {
    return (
      <section className="page account">
        <p className="eyebrow">{tr(language, 'Account security')}</p>
        <h1>{tr(language, 'Set a new password')}</h1>
        <form className="form-grid" onSubmit={updatePassword}>
          <label>{tr(language, 'New password')}<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} /></label>
          <label>{tr(language, 'Confirm password')}<input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required minLength={8} /></label>
          {error && <p className="form-error span-2">{tr(language, error)}</p>}
          <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? tr(language, 'Please wait...') : tr(language, 'Update password')}</button>
        </form>
      </section>
    );
  }

  if (user) {
    return (
      <section className="page account">
        <p className="eyebrow">{tr(language, 'Account')}</p>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <p className="fine">{user.role === 'admin' ? tr(language, 'Kitchen admin') : tr(language, 'Guest')}</p>
        <div className="hero-actions account-actions">
          {user.role === 'admin' && <Link className="btn btn-primary" to="/admin">{tr(language, 'Open dashboard')}</Link>}
          <Link className="btn btn-ghost" to="/menu">{tr(language, 'Order again')}</Link>
          <button type="button" className="btn btn-ghost" onClick={signOut}>{tr(language, 'Sign out')}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page account">
      <p className="eyebrow">{mode === 'login' ? tr(language, 'Welcome back') : mode === 'forgot' ? tr(language, 'Account recovery') : tr(language, 'Create an account')}</p>
      <h1>{mode === 'login' ? tr(language, 'Sign in') : mode === 'forgot' ? tr(language, 'Forgot password') : tr(language, 'Join STOP&GO')}</h1>
      <form className="form-grid" onSubmit={mode === 'forgot' ? sendResetEmail : submit}>
        {mode === 'register' && <label>{tr(language, 'Name')}<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>}
        <label>{tr(language, 'Email')}<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
        {mode === 'register' && <label>{tr(language, 'Phone')}<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>}
        {mode !== 'forgot' && <label>{tr(language, 'Password')}<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} /></label>}
        {error && <p className="form-error span-2">{error}</p>}
        {notice && <p className="form-success span-2">{tr(language, notice)}</p>}
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? tr(language, 'Please wait...') : mode === 'forgot' ? tr(language, 'Send reset email') : mode === 'login' ? tr(language, 'Sign in') : tr(language, 'Create account')}</button>
      </form>
      {mode !== 'forgot' && <>
        <button type="button" className="btn btn-ghost" disabled={!googleReady} onClick={google}>{tr(language, 'Continue with Google')}</button>
        {!googleReady && <p className="fine">{tr(language, 'Google sign-in switches on when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')}</p>}
        {mode === 'login' && <button type="button" className="text-btn" onClick={() => switchMode('forgot')}>{tr(language, 'Forgot password?')}</button>}
        <button type="button" className="text-btn" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? tr(language, 'Need an account? Create one') : tr(language, 'Already registered? Sign in')}
        </button>
        <aside className="demo-card">
          <h2>{tr(language, 'Team access')}</h2>
          <p>{tr(language, 'Admin')} · admin@stopandgo.com · StopGo2026!</p>
          <p>{tr(language, 'Guest')} · guest@stopandgo.com · Guest2026!</p>
        </aside>
      </>}
      {mode === 'forgot' && <button type="button" className="text-btn" onClick={() => switchMode('login')}>{tr(language, 'Back to sign in')}</button>}
    </section>
  );
}
