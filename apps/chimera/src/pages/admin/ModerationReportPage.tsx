import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RichMessage } from '../../components/chat/RichMessage';
import { ConfirmDialog } from '../../components/chat/MessageMenu';
import { useToast } from '../../contexts/ToastContext';
import { loadReport, makeCharacterPrivate, setReportStatus, type ReportDetail } from '../../lib/moderation';
import { REPORT_STATUSES, reasonLabel, statusLabel, type ReportStatusId } from '../../lib/reportReasons';
import { AdminCrumbs, AdminGate } from '../../components/admin/AdminParts';
import { STATUS_STYLE, ago } from '../../lib/reportFormat';

const FIELD = 'mt-2 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const ACTION_TEXT: Record<string, (entry: { from_status: string | null; to_status: string | null }) => string> = {
  submitted: () => 'Report filed',
  viewed: () => 'Opened for the first time',
  status_changed: (e) => `Status: ${statusLabel(e.from_status ?? '')} → ${statusLabel(e.to_status ?? '')}`,
  note_added: () => 'Note added',
  character_made_private: () => 'Character made private',
  alert_sent: () => 'Administrators e-mailed (no message content)',
};

export default function ModerationReportPage() {
  return (
    <AdminGate>
      <Detail />
    </AdminGate>
  );
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'failed'>('loading');
  const [status, setStatus] = useState<ReportStatusId>('pending');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [hiding, setHiding] = useState<{ note: string; busy: boolean; problem: string | null } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const loaded = await loadReport(id);
      setReport(loaded);
      setStatus((loaded.status === 'reviewed' ? 'under_review' : loaded.status) as ReportStatusId);
      setState('ready');
    } catch (error) {
      const code = (error as { code?: string })?.code;
      setState(code === 'P0002' || code === '42501' || code === '22P02' ? 'missing' : 'failed');
    }
  }, [id]);

  useEffect(() => {
    setState('loading');
    void load();
  }, [load]);

  if (state === 'loading') return <p className="py-24 text-center text-chimera-mute">Opening the report…</p>;
  if (state === 'missing' || state === 'failed' || !report) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">{state === 'failed' ? 'We could not open it' : 'Report not found'}</h1>
        <p className="mt-3 text-chimera-mute">{state === 'failed' ? 'Please try again in a moment.' : 'It does not exist, or you do not have access to it.'}</p>
        {state === 'failed' && <button type="button" onClick={() => void load()} className="mt-4 min-h-[44px] rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Try again</button>}
        <Link to="/admin/moderation/reports" className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">All reports</Link>
      </div>
    );
  }

  const { snapshot } = report;
  const dirty = status !== (report.status === 'reviewed' ? 'under_review' : report.status) || note.trim() !== '';

  const save = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    try {
      await setReportStatus(report.id, status, note);
      setNote('');
      await load();
      showToast('Report updated.', 'success');
    } catch {
      showToast('We could not update the report. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hide = async () => {
    if (!hiding || hiding.busy) return;
    if (hiding.note.trim().length < 3) {
      setHiding({ ...hiding, problem: 'Write the reason for hiding it.' });
      return;
    }
    setHiding({ ...hiding, busy: true, problem: null });
    try {
      await makeCharacterPrivate(report.id, hiding.note);
      setHiding(null);
      await load();
      showToast('The character is now private.', 'success');
    } catch {
      setHiding({ ...hiding, busy: false, problem: 'We could not do that. Please try again.' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8">
      <Link to="/admin/moderation/reports" className="mb-4 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold"><ArrowLeft size={18} aria-hidden="true" /> All reports</Link>
      <AdminCrumbs last={`#${report.id.slice(0, 8).toUpperCase()}`} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{reasonLabel(report.reason)}</h1>
        <span className={`rounded-full border px-3 py-1 text-sm font-bold ${STATUS_STYLE[report.status] ?? ''}`}>{statusLabel(report.status)}</span>
      </div>
      <p className="mt-1 text-sm text-chimera-mute">Filed {when(report.created_at)} ({ago(report.created_at)}) by {report.reporter.name ?? 'a member'}</p>

      <section aria-labelledby="reported" className="mt-6">
        <h2 id="reported" className="font-serif text-xl font-semibold">Reported message</h2>
        <p className="text-sm text-chimera-mute">{snapshot.character?.name ? `${snapshot.character.name} · ` : ''}{snapshot.character?.content_rating ? `rated ${snapshot.character.content_rating} · ` : ''}scene &quot;{snapshot.scene.title ?? 'Untitled'}&quot; · {when(snapshot.message.created_at)}</p>
        <div className="mt-2 whitespace-pre-wrap break-words rounded-2xl border-2 border-chimera-rose/60 bg-chimera-panel px-4 py-3 text-[17px] leading-relaxed">
          <RichMessage text={snapshot.message.content} />
        </div>
      </section>

      <section aria-labelledby="reason" className="mt-6">
        <h2 id="reason" className="font-serif text-xl font-semibold">What the reporter said</h2>
        {report.details ? <p className="mt-1 whitespace-pre-wrap rounded-xl border border-chimera-gold/20 bg-chimera-panel p-3">{report.details}</p> : <p className="mt-1 text-chimera-mute">No explanation was written.</p>}
      </section>

      <section aria-labelledby="context" className="mt-6">
        <h2 id="context" className="font-serif text-xl font-semibold">Around it</h2>
        <p className="text-sm text-chimera-mute">Only these messages were copied into the report. The rest of the conversation is private.</p>
        <ol className="mt-2 flex flex-col gap-2">
          {snapshot.context.map((message) => {
            const before = new Date(message.created_at) < new Date(snapshot.message.created_at);
            return (
              <li key={message.id} className="rounded-xl border border-chimera-gold/15 bg-chimera-bg px-3 py-2 text-[15px] text-violet-100/80">
                <span className="block text-xs font-bold tracking-[0.1em] text-chimera-mute">{message.sender === 'character' ? (snapshot.character?.name ?? 'Character').toUpperCase() : 'PLAYER'} · {before ? 'before' : 'after'}</span>
                <span className="block whitespace-pre-wrap break-words"><RichMessage text={message.content} /></span>
              </li>
            );
          })}
          {snapshot.context.length === 0 && <li className="text-chimera-mute">Nothing else was in the scene.</li>}
        </ol>
      </section>

      <section aria-labelledby="review" className="mt-8 rounded-2xl border border-chimera-gold/25 bg-chimera-panel p-5">
        <h2 id="review" className="font-serif text-xl font-semibold">Review</h2>
        <label htmlFor="report-status" className="mt-3 block font-bold">Status</label>
        <select id="report-status" value={status} onChange={(event) => setStatus(event.target.value as ReportStatusId)} className={FIELD}>
          {REPORT_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <label htmlFor="report-note" className="mt-4 block font-bold">Note <span className="font-normal text-chimera-mute">(only moderators see it, and it goes in the log)</span></label>
        <textarea id="report-note" value={note} onChange={(event) => setNote(event.target.value.slice(0, 2000))} rows={3} className={FIELD} placeholder="What you checked, and why you decided this." />
        <button type="button" onClick={() => void save()} disabled={!dirty || saving} className="mt-4 min-h-[44px] rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
      </section>

      {snapshot.character && (
        <section aria-labelledby="actions" className="mt-6 rounded-2xl border border-chimera-rose/30 bg-chimera-panel p-5">
          <h2 id="actions" className="font-serif text-xl font-semibold">Action on the character</h2>
          <p className="mt-1 text-sm text-chimera-mute">{snapshot.character.name ?? 'This character'} is currently <strong>{report.character_visibility ?? 'unknown'}</strong>. Setting a status never changes it. This is the only action that does, and it is recorded with your reason.</p>
          <button type="button" disabled={report.character_visibility === 'private'} onClick={() => setHiding({ note: '', busy: false, problem: null })} className="mt-3 min-h-[44px] rounded-full border border-chimera-rose/60 px-5 font-bold text-rose-200 hover:bg-chimera-rose/10 disabled:cursor-not-allowed disabled:opacity-50">
            {report.character_visibility === 'private' ? 'Already private' : 'Make this character private'}
          </button>
        </section>
      )}

      <section aria-labelledby="log" className="mt-8">
        <h2 id="log" className="font-serif text-xl font-semibold">Log</h2>
        <ol className="mt-2 flex flex-col gap-2">
          {report.audit.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-chimera-gold/15 px-3 py-2 text-sm">
              <span className="font-bold">{(ACTION_TEXT[entry.action] ?? (() => entry.action))(entry)}</span>
              <span className="text-chimera-mute"> · {entry.actor ?? 'system'} · {when(entry.created_at)}</span>
              {entry.note && <span className="mt-1 block whitespace-pre-wrap text-violet-100/85">{entry.note}</span>}
            </li>
          ))}
        </ol>
      </section>

      {hiding && (
        <ConfirmDialog
          title="Make this character private?"
          body="It disappears from public pages and Discover for everyone but its creator. Its creator keeps it. Write why; this goes in the log."
          confirmLabel="Make private"
          busyLabel="Saving…"
          busy={hiding.busy}
          onConfirm={() => void hide()}
          onCancel={() => setHiding(null)}
          extra={
            <div className="mt-3">
              <label htmlFor="hide-note" className="block text-sm font-bold">Reason</label>
              <textarea id="hide-note" value={hiding.note} onChange={(event) => setHiding({ ...hiding, note: event.target.value.slice(0, 2000), problem: null })} rows={3} className={FIELD} />
              {hiding.problem && <p role="alert" className="mt-1 text-sm text-chimera-rose">{hiding.problem}</p>}
            </div>
          }
        />
      )}
    </div>
  );
}
