import React, { useState } from 'react';
import { sendEvent } from '../lib/analytics';

export function LeadCapturePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return setStatus('error');
    setStatus('sending');
    try {
      // store locally for now; in real app post to backend / crm
      await fetch('/api/lead', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
      await sendEvent('lead_captured', { email });
      setStatus('done');
      // redirect to thank you after a short delay
      setTimeout(() => { window.location.hash = '#/thank-you'; }, 600);
    } catch (err) {
      setStatus('error');
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>Join our early access</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>Get product updates and exclusive invites.</p>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'white' }} />
        <button type="submit" disabled={status==='sending'} style={{ padding: '10px 16px', borderRadius: 8, background: '#10b981', color: '#000', fontWeight: 800, border: 'none' }}>Get early access</button>
      </form>
      {status === 'error' && <div style={{ marginTop: 10, color: '#f87171' }}>Please enter a valid email and try again.</div>}
      {status === 'done' && <div style={{ marginTop: 10, color: '#34d399' }}>Thanks — redirecting…</div>}
    </div>
  );
}
