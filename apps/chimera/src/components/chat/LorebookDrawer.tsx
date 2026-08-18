import { useState } from 'react';
import { BookOpen, Search, Sparkles, X, ArrowRight, LockKeyhole, Tag } from 'lucide-react';
import type { LorebookEntry } from '../../types';

interface LorebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LorebookEntry[];
  matchedKeywordsMap: Record<string, string[]>;
  onManageLorebooks: () => void;
}

/**
 * A transparent read-only inspector for the lore that is safe to reveal to a
 * player. Editing and importing remain creator actions in the real Lorebooks
 * workspace, never a browser-only chat draft.
 */
export function LorebookDrawer({
  isOpen,
  onClose,
  entries,
  matchedKeywordsMap,
  onManageLorebooks,
}: LorebookDrawerProps) {
  const [activeTab, setActiveTab] = useState<'triggered' | 'linked'>('triggered');
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const triggered = entries.filter((entry) => matchedKeywordsMap[entry.id] !== undefined);
  const filtered = entries.filter((entry) => {
    const needle = query.trim().toLowerCase();
    return !needle || entry.title.toLowerCase().includes(needle) || entry.keywords.some((keyword) => keyword.toLowerCase().includes(needle));
  });
  const shown = activeTab === 'triggered' ? triggered : filtered;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-warm-200 bg-white shadow-2xl dark:border-warm-800 dark:bg-warm-900 animate-slide-left">
        <header className="flex items-start justify-between border-b border-warm-200 bg-warm-50/50 p-4 dark:border-warm-800 dark:bg-warm-950/50">
          <div className="flex gap-2.5">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-300"><BookOpen size={20} /></div>
            <div>
              <h2 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">Linked lore</h2>
              <p className="mt-0.5 text-xs text-warm-500">Established character and world facts for this roleplay.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-warm-500 transition hover:bg-warm-200 dark:hover:bg-warm-800" aria-label="Close lorebook inspector"><X size={20} /></button>
        </header>

        <div className="border-b border-warm-200 px-4 pt-3 dark:border-warm-800">
          <div className="flex gap-4 text-xs font-semibold">
            <button onClick={() => setActiveTab('triggered')} className={`border-b-2 pb-3 ${activeTab === 'triggered' ? 'border-amber-500 text-amber-700 dark:text-amber-300' : 'border-transparent text-warm-500'}`}>
              <Sparkles className="mr-1 inline" size={13} />Triggered ({triggered.length})
            </button>
            <button onClick={() => setActiveTab('linked')} className={`border-b-2 pb-3 ${activeTab === 'linked' ? 'border-amber-500 text-amber-700 dark:text-amber-300' : 'border-transparent text-warm-500'}`}>
              <BookOpen className="mr-1 inline" size={13} />Shared with this chat ({entries.length})
            </button>
          </div>
        </div>

        {activeTab === 'linked' && (
          <div className="relative mx-4 mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search linked lore..." className="w-full rounded-xl border border-warm-200 bg-warm-50 py-2.5 pl-9 pr-3 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-warm-700 dark:bg-warm-850 dark:text-warm-50" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {shown.length === 0 ? (
            <div className="px-5 py-16 text-center text-warm-400">
              <BookOpen size={38} className="mx-auto mb-3 opacity-30" />
              <p className="font-serif text-base">{activeTab === 'triggered' ? 'Nothing has been called into this scene yet.' : 'No shareable lore is linked to this character or world yet.'}</p>
              <p className="mt-2 text-xs leading-relaxed text-warm-500">{activeTab === 'triggered' ? 'Relevant linked entries appear here when their keywords are present in the recent scene.' : 'A creator can link a lorebook to a character or their world from the Lorebooks workspace.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/15">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-warm-900 dark:text-warm-50">{entry.title}</h3>
                    {entry.is_constant && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">Always held</span>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-warm-700 dark:text-warm-300">{entry.content}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(matchedKeywordsMap[entry.id] || entry.keywords).map((keyword) => <span key={keyword} className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-warm-500 dark:bg-warm-800"><Tag size={9} />{keyword}</span>)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-warm-200 p-4 dark:border-warm-800">
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-warm-100 p-3 text-[11px] leading-relaxed text-warm-500 dark:bg-warm-850">
            <LockKeyhole size={14} className="mt-0.5 shrink-0" />
            This inspector only shows lore the creator has chosen to share with this roleplay. Private creator notes can still guide the character without being exposed here.
          </div>
          <button onClick={onManageLorebooks} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-warm-950 transition hover:bg-amber-400">
            Manage Lorebooks <ArrowRight size={15} />
          </button>
        </footer>
      </aside>
    </div>
  );
}
