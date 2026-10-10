import { authenticate, jsonResponse, readPayload, requestFailure, RequestError, serverClient, uuid } from './_lib/requestProtection.js';
import { alertRecipients, buildReportAlert, sendReportAlert } from './_lib/reportAlert.js';

export const config = { runtime: 'edge' };

/** At most this many alert e-mails in this many minutes, however many reports come in. The dashboard has them all. */
const MAX_ALERTS = 5;
const WINDOW_MINUTES = 10;

/**
 * Optional e-mail to the administrators after a member files a report. The report itself is already saved (and is what
 * counts); this only nudges. It does nothing unless three settings exist: CHIMERA_REPORT_ALERT_EMAILS (the
 * administrators' addresses), RESEND_API_KEY and CHIMERA_REPORT_ALERT_FROM. Only the member who filed the report can
 * trigger it, once per report, and the e-mail never contains the message (see api/_lib/reportAlert.ts).
 */
export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const { user } = await authenticate(req);
    const payload = await readPayload(req, 2_000);
    if (!uuid(payload.report_id)) throw new RequestError(400, 'Missing report.');

    const to = alertRecipients(process.env.CHIMERA_REPORT_ALERT_EMAILS);
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CHIMERA_REPORT_ALERT_FROM;
    if (to.length === 0 || !apiKey || !from) return jsonResponse({ sent: false, reason: 'not_configured' });

    const admin = serverClient();
    const { data: report, error } = await admin
      .from('reports')
      .select('id, reporter_id, reason, created_at, content_type')
      .eq('id', payload.report_id)
      .maybeSingle();
    // Someone else's report looks exactly like a missing one.
    if (error || !report || report.reporter_id !== user.id || report.content_type !== 'chimera_message') throw new RequestError(404, 'Report not found.');

    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const recent = await admin.from('reports').select('id', { count: 'exact', head: true }).gte('alert_sent_at', since);
    if ((recent.count ?? 0) >= MAX_ALERTS) return jsonResponse({ sent: false, reason: 'throttled' });

    // Claim it first, so two requests cannot send two e-mails.
    const claim = await admin.from('reports').update({ alert_sent_at: new Date().toISOString() }).eq('id', report.id).is('alert_sent_at', null).select('id');
    if (claim.error || !claim.data?.length) return jsonResponse({ sent: false, reason: 'already_sent' });

    // The link points at the site that served this request, unless a public address is set.
    const message = buildReportAlert(report, process.env.CHIMERA_PUBLIC_URL || new URL(req.url).origin);
    const delivered = await sendReportAlert(fetch, { apiKey, from, to, ...message });
    if (!delivered) {
      await admin.from('reports').update({ alert_sent_at: null }).eq('id', report.id);
      return jsonResponse({ sent: false, reason: 'provider_failed' });
    }
    await admin.from('chimera_report_audit').insert({ report_id: report.id, actor_id: null, action: 'alert_sent' });
    return jsonResponse({ sent: true });
  } catch (error) {
    return requestFailure(error);
  }
}
