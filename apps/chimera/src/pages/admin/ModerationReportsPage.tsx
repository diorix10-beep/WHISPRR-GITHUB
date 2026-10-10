import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { AdminCrumbs, AdminGate } from '../../components/admin/AdminParts';
import { loadReports, type ReportList } from '../../lib/moderation';
import { STATUS_STYLE, ago } from '../../lib/reportFormat';
import { REPORT_STATUSES, reasonLabel, statusLabel, type ReportStatusId } from '../../lib/reportReasons';
import { plainText } from '../../lib/richText';

const PAGE = 30;

export default function ModerationReportsPage() {
  return (
    <AdminGate>
      <ReportsList />
    </AdminGate>
  );
}

function ReportsList() {
  const [status, setStatus] = useState<ReportStatusId | null>(null);
  const [data, setData] = useState<ReportList | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed' | 'denied'>('loading');
  const [more, setMore] = useState(false);

  const load = useCallback(async (filter: ReportStatusId | null, append: boolean, offset: number) => {
    if (append) setMore(true);
    else setState('loading');
    try {
      const next = await loadReports(filter, offset, PAGE);
      setData((current) => (append && current ? { ...next, items: [...current.items, ...next.items] } : next));
      setState('ready');
    } catch (error) {
      setState((error as { code?: string })?.code === '42501' ? 'denied' : 'failed');
    } finally {
      setMore(false);
    }
  }, []);

  useEffect(() => {
    void load(status, false, 0);
  }, [status, load]);

  if (state === 'denied') {
    return <div className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="font-serif text-4xl font-semibold">Page not found</h1><p className="mt-3 text-chimera-mute">You do not have access to this page.</p></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pb-12 pt-8 sm:px-8">
      <AdminCrumbs last="REPORTS" />
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Reports</h1>
      <p className="mt-2 max-w-2xl text-chimera-mute">Messages that members reported. You see the reported message and a few around it, never the rest of a private conversation. A report never punishes anyone by itself.</p>

      <div role="group" aria-label="Filter by status" className="mt-5 flex flex-wrap gap-2">
        {[{ id: null, label: 'All' }, ...REPORT_STATUSES].map((item) => (
          <button
            key={item.id ?? 'all'}
            type="button"
            aria-pressed={status === item.id}
            onClick={() => setStatus(item.id as ReportStatusId | null)}
            className={`min-h-[40px] rounded-full border px-4 text-sm font-bold ${status === item.id ? 'border-chimera-gold bg-chimera-gold text-[#1a1208]' : 'border-chimera-gold/35 hover:border-chimera-gold'}`}
          >
            {item.label}
          </button>
        ))}
        {data && <span className="ml-auto self-center text-sm text-chimera-mute" aria-live="polite">{data.unread} unread · {data.total} shown</span>}
      </div>

      <section className="mt-5" aria-live="polite">
        {state === 'loading' && <p className="py-12 text-center text-chimera-mute">Loading reports…</p>}
        {state === 'failed' && (
          <div role="alert" className="rounded-2xl border border-chimera-rose/40 bg-chimera-rose/10 p-5 text-center">
            <p>We could not load the reports.</p>
            <button type="button" onClick={() => void load(status, false, 0)} className="mt-3 min-h-[44px] rounded-full border border-chimera-rose/50 px-5 font-bold hover:bg-chimera-rose/15">Try again</button>
          </div>
        )}
        {state === 'ready' && data && data.items.length === 0 && (
          <div className="rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-8 text-center">
            <Flag className="mx-auto text-chimera-gold" size={28} aria-hidden="true" />
            <p className="mt-3 text-lg text-violet-100/85">{status ? `No ${statusLabel(status).toLowerCase()} report.` : 'No report yet.'}</p>
          </div>
        )}
        {state === 'ready' && data && data.items.length > 0 && (
          <ul className="flex flex-col gap-3">
            {data.items.map((item) => (
              <li key={item.id}>
                <Link to={`/admin/moderation/reports/${item.id}`} className={`block rounded-2xl border p-4 hover:border-chimera-gold ${item.unread ? 'border-chimera-gold/60 bg-chimera-gold/5' : 'border-chimera-gold/20 bg-chimera-panel'}`}>
                  <span className="flex flex-wrap items-center gap-2">
                    {item.unread && <span className="rounded-full bg-chimera-gold px-2 py-0.5 text-[11px] font-bold tracking-wider text-[#1a1208]">NEW</span>}
                    <span className="font-serif text-xl font-semibold">{reasonLabel(item.reason)}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[item.status] ?? ''}`}>{statusLabel(item.status)}</span>
                    <span className="ml-auto text-sm text-chimera-mute">{ago(item.created_at)}</span>
                  </span>
                  <span className="mt-1 block text-sm text-chimera-mute">{item.character_name ? `A message from ${item.character_name}` : 'A message'}</span>
                  {item.excerpt && <span className="mt-1 block truncate text-[15px] text-violet-100/85">{plainText(item.excerpt)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {state === 'ready' && data && data.items.length < data.total && (
          <button type="button" disabled={more} onClick={() => void load(status, true, data.items.length)} className="mt-4 min-h-[44px] rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10 disabled:opacity-50">
            {more ? 'Loading…' : `Show more (${data.total - data.items.length} left)`}
          </button>
        )}
      </section>
    </div>
  );
}
