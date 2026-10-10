import { supabase } from './supabase';
import type { ReportReasonId, ReportStatusId } from './reportReasons';

/**
 * Reports and likes need the database part (supabase/migrations/20261010090000 and 20261010100000). Until that is applied they
 * stay off: no Report, Like or Dislike in the message menu, and no Admin page. Switch them on with
 * VITE_CHIMERA_FEEDBACK_LIVE=true and VITE_CHIMERA_MODERATION_LIVE=true. Who may moderate is decided by the database, never by these.
 */
export const FEEDBACK_LIVE: boolean = import.meta.env.VITE_CHIMERA_FEEDBACK_LIVE === 'true';
export const MODERATION_LIVE: boolean = import.meta.env.VITE_CHIMERA_MODERATION_LIVE === 'true';

// ── Filing a report ──────────────────────────────────────────────────────────────────────────────

export type ReportOutcome =
  | { ok: true; id: string; duplicate: boolean }
  | { ok: false; kind: 'rate_limited' | 'unavailable' | 'invalid' | 'failed'; message: string };

interface RpcError { code?: string; message?: string; hint?: string }

/** Turns what the database said into something a member can act on. Never shows raw database text. */
export function reportFailure(error: RpcError | null | undefined): Extract<ReportOutcome, { ok: false }> {
  if (error?.hint === 'rate_limited' || error?.code === '54000') {
    return { ok: false, kind: 'rate_limited', message: 'You have sent a lot of reports recently. Please try again a little later.' };
  }
  if (error?.code === '42501') return { ok: false, kind: 'unavailable', message: 'This message can no longer be reported.' };
  if (error?.code === '22023') return { ok: false, kind: 'invalid', message: 'Please check the reason and your explanation, then try again.' };
  return { ok: false, kind: 'failed', message: 'We could not send your report. Please try again.' };
}

export async function submitMessageReport(messageId: string, reason: ReportReasonId, details: string): Promise<ReportOutcome> {
  try {
    const { data, error } = await supabase.rpc('submit_chimera_message_report', { p_message_id: messageId, p_reason: reason, p_details: details.trim() });
    if (error) return reportFailure(error);
    const result = (Array.isArray(data) ? data[0] : data) as { id?: string; duplicate?: boolean } | null;
    if (!result?.id) return reportFailure(null);
    // A courtesy e-mail to the administrators, if that is set up. The report is saved either way.
    if (!result.duplicate) void notifyAdministrators(result.id);
    return { ok: true, id: result.id, duplicate: result.duplicate === true };
  } catch {
    return reportFailure(null);
  }
}

async function notifyAdministrators(reportId: string): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    await fetch('/api/report-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      body: JSON.stringify({ report_id: reportId }),
    });
  } catch {
    // Not being able to e-mail never matters to the member.
  }
}

// ── The moderators' side ─────────────────────────────────────────────────────────────────────────

export interface ReportListItem {
  id: string;
  status: string;
  reason: string;
  created_at: string;
  updated_at: string;
  unread: boolean;
  excerpt: string | null;
  character_name: string | null;
}

export interface ReportList {
  total: number;
  unread: number;
  items: ReportListItem[];
}

export interface ReportContextMessage {
  id: string;
  sender: 'player' | 'character';
  content: string;
  created_at: string;
}

export interface ReportAuditEntry {
  id: number;
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
  actor: string | null;
}

export interface ReportDetail {
  id: string;
  status: string;
  reason: string;
  details: string;
  created_at: string;
  updated_at: string;
  first_viewed_at: string | null;
  reporter: { id: string; name: string | null };
  snapshot: {
    message: { id: string; sender: 'player' | 'character'; content: string; created_at: string };
    character: { id: string; name: string | null; content_rating: string | null; visibility: string | null } | null;
    scene: { id: string; title: string | null };
    context: ReportContextMessage[];
  };
  character_visibility: string | null;
  audit: ReportAuditEntry[];
}

export async function loadReports(status: ReportStatusId | null, offset = 0, limit = 30): Promise<ReportList> {
  const { data, error } = await supabase.rpc('list_chimera_reports', { p_status: status, p_limit: limit, p_offset: offset });
  if (error) throw error;
  return data as ReportList;
}

export async function loadReport(id: string): Promise<ReportDetail> {
  const { data, error } = await supabase.rpc('get_chimera_report', { p_id: id });
  if (error) throw error;
  return data as ReportDetail;
}

export async function setReportStatus(id: string, status: ReportStatusId, note: string): Promise<void> {
  const { error } = await supabase.rpc('update_chimera_report', { p_id: id, p_status: status, p_note: note.trim() || null });
  if (error) throw error;
}

export async function makeCharacterPrivate(reportId: string, note: string): Promise<void> {
  const { error } = await supabase.rpc('moderator_make_chimera_character_private', { p_report_id: reportId, p_note: note.trim() });
  if (error) throw error;
}

/** The number of reports nobody has opened yet. 0 for everyone who is not a moderator. */
export async function countUnreadReports(): Promise<number> {
  const { data, error } = await supabase.rpc('count_unread_chimera_reports');
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}
