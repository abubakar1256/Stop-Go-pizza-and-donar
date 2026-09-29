import { FormEvent, useState } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../store/useLanguage';
import { tr } from '../i18n';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const language = useLanguage((state) => state.language);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    try {
      await api.contact(form);
      setStatus(tr(language, 'Message received. The kitchen will reply by email.'));
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : tr(language, 'Could not send that.'));
    }
  }

  return (
    <section className="page contact">
      <div>
        <p className="eyebrow">{tr(language, 'Contact')}</p>
        <h1>{tr(language, 'Talk to the pass.')}</h1>
        <p>120 Market Street, Your City<br />{tr(language, 'Open daily, 11:00 – 23:00')}<br />(555) 014-2026<br />hello@stopandgo.restaurant</p>
        <img src="/food/09-pita.jpg" alt={tr(language, 'A pita doner on the pass')} />
      </div>
      <form onSubmit={submit} className="form-grid">
        <label>{tr(language, 'Name')}<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>{tr(language, 'Email')}<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
        <label className="span-2">{tr(language, 'Message')}<textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required minLength={8} /></label>
        {error && <p className="form-error span-2">{error}</p>}
        {status && <p className="fine span-2">{status}</p>}
        <button className="btn btn-primary" type="submit">{tr(language, 'Send')}</button>
      </form>
    </section>
  );
}
