import { reasonLabel } from '../../src/lib/reportReasons.js';

/**
 * The e-mail that tells an administrator a report was filed. It is only a nudge to open the dashboard: it carries the
 * category of the report, the time and a link, and NEVER the reported message, the conversation or what the reporter wrote.
 * Nothing here talks to the network except `sendReportAlert`, which takes the fetch function it should use.
 */

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

/** The administrators' addresses from a comma- or semicolon-separated setting: valid ones only, no repeats, at most 10. */
export function alertRecipients(setting: string | undefined): string[] {
  const seen = new Set<string>();
  for (const part of (setting ?? '').split(/[,;\n]/)) {
    const address = part.trim();
    if (address.length <= 254 && EMAIL.test(address)) seen.add(address.toLowerCase());
  }
  return Array.from(seen).slice(0, 10);
}

export function buildReportAlert(report: { id: string; reason: string; created_at: string }, baseUrl: string): { subject: string; text: string } {
  const base = baseUrl.replace(/\/+$/, '');
  return {
    subject: 'New CHIMERA report to review',
    text: [
      'A message was reported on CHIMERA.',
      '',
      `Category: ${reasonLabel(report.reason)}`,
      `Filed: ${new Date(report.created_at).toISOString().replace('T', ' ').slice(0, 16)} UTC`,
      `Report: ${report.id.slice(0, 8)}`,
      '',
      `Review it (administrators only): ${base}/admin/moderation/reports/${report.id}`,
      '',
      'For privacy, this e-mail never contains the message or the conversation. Sign in as an administrator to read them.',
      'A report never punishes anyone by itself.',
    ].join('\n'),
  };
}

/** Sends one e-mail through Resend's HTTP API. Returns false instead of throwing, so a failed e-mail never fails a report. */
export async function sendReportAlert(
  send: typeof fetch,
  options: { apiKey: string; from: string; to: string[]; subject: string; text: string },
): Promise<boolean> {
  try {
    const response = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: options.from, to: options.to, subject: options.subject, text: options.text }),
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
