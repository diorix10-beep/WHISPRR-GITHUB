import React, { useEffect } from 'react';
import { sendEvent } from '../lib/analytics';

export function ThankYouPage() {
  useEffect(() => { sendEvent('lead_thank_you_shown'); }, []);
  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>Thank you — you're on the list</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>We sent a confirmation. Expect updates and invites from us.</p>
      <p style={{ marginTop: 18 }}>While you wait, check out our resources or close this window.</p>
    </div>
  );
}
