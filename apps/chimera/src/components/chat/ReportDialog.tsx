import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Overlay } from './MessageMenu';
import { REPORT_DETAILS_MAX, REPORT_REASONS, type ReportReasonId } from '../../lib/reportReasons';
import type { ReportOutcome } from '../../lib/moderation';

/**
 * Reporting a message: a reason, an optional explanation, then a real submission. The success message only appears once the
 * database has saved the report; a failure keeps what was written so it can be sent again.
 */
export function ReportDialog({ speaker, onSubmit, onClose }: {
  speaker: string;
  onSubmit: (reason: ReportReasonId, details: string) => Promise<ReportOutcome>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReasonId | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<{ duplicate: boolean } | null>(null);

  const submit = async (close: () => void, event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    if (!reason || busy) return;
    setBusy(true);
    setProblem(null);
    const outcome = await onSubmit(reason, details);
    setBusy(false);
    if (outcome.ok) setDone({ duplicate: outcome.duplicate });
    else {
      setProblem(outcome.message);
      // A message that can no longer be reported has nothing left to retry.
      if (outcome.kind === 'unavailable') window.setTimeout(close, 2500);
    }
  };

  return (
    <Overlay label="Report this message" role="dialog" anchor={{ x: 0, y: 0 }} onClose={onClose}>
      {(close) =>
        done ? (
          <div className="px-2 pb-1 pt-1 text-center" role="status">
            <CheckCircle2 className="mx-auto text-chimera-mint" size={36} aria-hidden="true" />
            <h2 className="mt-2 font-serif text-xl font-semibold">{done.duplicate ? 'You already reported this' : 'Thank you. Your report was sent.'}</h2>
            <p className="mt-1 text-sm text-chimera-mute">
              {done.duplicate ? 'The CHIMERA moderators already have your earlier report of this message.' : 'The CHIMERA moderators will review it. A report never punishes anyone automatically: a person looks at it first.'}
            </p>
            <button type="button" onClick={() => close()} className="mt-4 min-h-[44px] rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110">Close</button>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(close, event)} className="px-2 pb-1 pt-1">
            <h2 className="font-serif text-xl font-semibold">Report this message</h2>
            <p className="mt-1 text-sm text-chimera-mute">From {speaker}. Tell us what is wrong, so a moderator can look at it.</p>
            <fieldset className="mt-3">
              <legend className="font-bold">Why are you reporting it?</legend>
              <div className="mt-2 flex flex-col gap-1">
                {REPORT_REASONS.map((item) => (
                  <label key={item.id} className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 ${reason === item.id ? 'border-chimera-gold bg-chimera-gold/10' : 'border-chimera-gold/20 hover:bg-chimera-gold/5'}`}>
                    <input type="radio" name="report-reason" value={item.id} checked={reason === item.id} onChange={() => setReason(item.id)} className="mt-1 h-4 w-4 accent-[#e8c27a]" />
                    <span>
                      <span className="block">{item.label}</span>
                      {'hint' in item && <span className="block text-xs text-chimera-mute">{item.hint}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor="report-details" className="mt-3 block font-bold">More details <span className="font-normal text-chimera-mute">(optional)</span></label>
            <textarea id="report-details" value={details} onChange={(event) => setDetails(event.target.value.slice(0, REPORT_DETAILS_MAX))} rows={3} maxLength={REPORT_DETAILS_MAX} className="mt-1 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none focus:border-chimera-gold" />
            <p className="text-right text-xs text-chimera-mute">{details.length} / {REPORT_DETAILS_MAX}</p>
            <p className="mt-1 text-xs text-chimera-mute">A moderator will see this message, a few messages around it, your reason and what you write here. Not the rest of your conversation.</p>
            {problem && <p role="alert" className="mt-3 rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-3 py-2 text-sm text-rose-100">{problem}</p>}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => close()} disabled={busy} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 font-bold hover:bg-chimera-gold/10 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={!reason || busy} className="min-h-[44px] rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">{busy ? 'Sending…' : 'Send report'}</button>
            </div>
          </form>
        )
      }
    </Overlay>
  );
}
