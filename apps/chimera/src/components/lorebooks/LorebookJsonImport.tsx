import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { LorebookJsonError, MAX_JSON_FILE_BYTES, parseLorebookJson, type ImportedLorebook } from '../../lib/lorebookJson';

interface Props {
  /** Label of the button that opens the file chooser. */
  label?: string;
  /** What pressing the confirm button does with the lorebook read from the file. It throws to report a failure. */
  confirmLabel: (read: ImportedLorebook) => string;
  onConfirm: (read: ImportedLorebook) => Promise<void>;
  /** Show the name found in the file (for a new lorebook). */
  showName?: boolean;
}

/**
 * Chooses a JSON file (a lorebook from Janitor AI, SillyTavern or a character card), shows what was found, and lets
 * the member confirm before anything is saved.
 */
export function LorebookJsonImport({ label = 'Import JSON', confirmLabel, onConfirm, showName = false }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [read, setRead] = useState<ImportedLorebook | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    setRead(null);
    if (file.size > MAX_JSON_FILE_BYTES) {
      setProblem('This file is too large. A lorebook is usually well under 10 MB.');
    } else {
      try {
        setRead(parseLorebookJson(await file.text()));
      } catch (error) {
        setProblem(error instanceof LorebookJsonError ? error.message : 'We could not read this file. Please try another one.');
      }
    }
    if (input.current) input.current.value = '';
  };

  const confirm = async () => {
    if (!read || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      await onConfirm(read);
      setRead(null);
    } catch {
      setProblem('We could not save the lorebook. Nothing was changed. Please try again.');
    }
    setBusy(false);
  };

  return (
    <div>
      <input ref={input} type="file" accept=".json,application/json" className="sr-only" aria-label="Choose a lorebook JSON file" onChange={(e) => void choose(e.target.files?.[0])} />
      <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">
        <FileUp size={18} aria-hidden="true" /> {label}
      </button>
      {problem && <p role="alert" className="mt-3 rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-[15px] text-rose-100">{problem}</p>}
      {read && (
        <section aria-label="What was found in the file" className="mt-3 rounded-2xl border border-chimera-gold/40 bg-chimera-panel2 p-4">
          <p className="font-bold">
            {read.entries.length.toLocaleString()} {read.entries.length === 1 ? 'entry' : 'entries'} found
            {showName && read.name ? <> in &quot;{read.name}&quot;</> : null}.
          </p>
          <p className="mt-1 text-sm text-chimera-mute">
            {read.entries.filter((e) => e.isConstant).length} always sent · {read.entries.filter((e) => !e.enabled).length} switched off
            {read.scanDepth ? ` · checks the last ${read.scanDepth} messages` : ''}
          </p>
          {read.notes.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200">
              {read.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void confirm()} disabled={busy} className="inline-flex min-h-[44px] items-center rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">
              {busy ? 'Saving…' : confirmLabel(read)}
            </button>
            <button type="button" onClick={() => setRead(null)} disabled={busy} className="min-h-[44px] rounded-full px-4 text-chimera-mute hover:text-chimera-ink disabled:opacity-50">Cancel</button>
          </div>
        </section>
      )}
    </div>
  );
}
