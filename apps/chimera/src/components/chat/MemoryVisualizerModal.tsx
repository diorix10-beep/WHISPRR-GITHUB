import { useEffect, useMemo, useState } from 'react';
import {
  BookHeart,
  Brain,
  Edit3,
  Heart,
  Loader2,
  Pin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CharacterMemory, MemoryType } from '../../types';

interface CharacterMemoryCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string | null;
  characterName: string;
  userId: string | null | undefined;
  onMemoryCountChange?: (count: number) => void;
}

const MEMORY_TYPES: Array<{ id: MemoryType; label: string; description: string }> = [
  { id: 'long_term', label: 'Long term', description: 'Lasting facts that should travel between scenes.' },
  { id: 'relationship', label: 'Bond', description: 'What this character understands about your relationship.' },
  { id: 'personality', label: 'Character', description: 'How they should understand you in this roleplay.' },
  { id: 'lore', label: 'Lore', description: 'Established private world details for this bond.' },
  { id: 'short_term', label: 'For now', description: 'A detail that can be changed or removed later.' },
];

const emptyDraft = (memoryType: MemoryType = 'long_term') => ({
  content: '',
  memory_type: memoryType,
  importance: 6,
});

/**
 * A private, durable memory editor for one player-character bond.
 * Every operation is performed under Supabase's user-owned RLS policies.
 */
export function CharacterMemoryCabinetModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  userId,
  onMemoryCountChange,
}: CharacterMemoryCabinetModalProps) {
  const [memories, setMemories] = useState<CharacterMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<MemoryType | 'all'>('all');
  const [editingMemory, setEditingMemory] = useState<CharacterMemory | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMemories = async () => {
    if (!characterId || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('character_memories')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false });

      if (queryError) throw queryError;
      const nextMemories = (data || []) as CharacterMemory[];
      setMemories(nextMemories);
      onMemoryCountChange?.(nextMemories.length);
    } catch (loadError) {
      console.error('Could not load character memories:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'CHIMERA could not open this memory cabinet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadMemories();
  }, [isOpen, characterId, userId]);

  const visibleMemories = useMemo(
    () => activeType === 'all' ? memories : memories.filter((memory) => memory.memory_type === activeType),
    [activeType, memories],
  );

  const beginCreate = (type: MemoryType = activeType === 'all' ? 'long_term' : activeType) => {
    setEditingMemory(null);
    setDraft(emptyDraft(type));
  };

  const beginEdit = (memory: CharacterMemory) => {
    setEditingMemory(memory);
    setDraft({
      content: memory.content,
      memory_type: memory.memory_type,
      importance: memory.importance,
    });
  };

  const saveMemory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!characterId || !userId || !draft.content.trim()) return;

    setSaving(true);
    setError(null);
    try {
      if (editingMemory) {
        const { error: updateError } = await supabase
          .from('character_memories')
          .update({
            content: draft.content.trim(),
            memory_type: draft.memory_type,
            importance: draft.importance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMemory.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('character_memories')
          .insert({
            character_id: characterId,
            user_id: userId,
            content: draft.content.trim(),
            memory_type: draft.memory_type,
            importance: draft.importance,
          });
        if (insertError) throw insertError;
      }

      setEditingMemory(null);
      setDraft(emptyDraft(activeType === 'all' ? 'long_term' : activeType));
      await loadMemories();
    } catch (saveError) {
      console.error('Could not save character memory:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'CHIMERA could not save this memory. Your text is still here.');
    } finally {
      setSaving(false);
    }
  };

  const togglePinned = async (memory: CharacterMemory) => {
    setError(null);
    const nextImportance = memory.importance >= 10 ? 6 : 10;
    try {
      const { error: updateError } = await supabase
        .from('character_memories')
        .update({ importance: nextImportance, updated_at: new Date().toISOString() })
        .eq('id', memory.id);
      if (updateError) throw updateError;
      await loadMemories();
    } catch (pinError) {
      console.error('Could not update memory priority:', pinError);
      setError(pinError instanceof Error ? pinError.message : 'CHIMERA could not update this memory priority.');
    }
  };

  const deleteMemory = async (memory: CharacterMemory) => {
    const confirmed = window.confirm(`Forget this memory for ${characterName}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(memory.id);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('character_memories')
        .delete()
        .eq('id', memory.id);
      if (deleteError) throw deleteError;
      if (editingMemory?.id === memory.id) {
        setEditingMemory(null);
        setDraft(emptyDraft(activeType === 'all' ? 'long_term' : activeType));
      }
      await loadMemories();
    } catch (deleteError) {
      console.error('Could not delete character memory:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'CHIMERA could not forget this memory.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  const noCharacterAvailable = !characterId || !userId;

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-memory-cabinet-title"
        className="w-full max-w-5xl max-h-[92vh] sm:max-h-[86vh] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border border-amber-300/20 bg-[#171313] text-white shadow-2xl flex flex-col"
      >
        <header className="shrink-0 border-b border-amber-100/10 bg-gradient-to-r from-[#241b24] via-[#1b1717] to-[#171313] px-5 py-4 sm:px-7 sm:py-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-2.5 text-amber-200">
              <BookHeart size={21} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/70">Private character bond</p>
              <h2 id="character-memory-cabinet-title" className="truncate font-serif text-xl sm:text-2xl text-amber-50">
                What {characterName || 'this character'} remembers
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-400">
                These are private to you and this character. CHIMERA prioritizes them in future replies; scene-specific canon stays in the chat itself.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close character memories" className="shrink-0 rounded-xl p-2 text-stone-400 transition-colors hover:bg-white/10 hover:text-white">
            <X size={21} />
          </button>
        </header>

        {noCharacterAvailable ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center">
            <Brain size={34} className="text-amber-200/50" />
            <h3 className="font-serif text-xl text-amber-50">This scene has no character memory yet</h3>
            <p className="max-w-md text-sm leading-relaxed text-stone-400">Open a one-to-one AI character roleplay first. Then their private memory cabinet will be available here.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <section className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2" aria-label="Filter memories by type">
                    <button onClick={() => setActiveType('all')} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeType === 'all' ? 'bg-amber-300 text-[#24150b]' : 'border border-white/10 bg-white/[0.03] text-stone-300 hover:bg-white/[0.08]'}`}>All ({memories.length})</button>
                    {MEMORY_TYPES.map((type) => (
                      <button key={type.id} onClick={() => setActiveType(type.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeType === type.id ? 'bg-amber-300 text-[#24150b]' : 'border border-white/10 bg-white/[0.03] text-stone-300 hover:bg-white/[0.08]'}`}>{type.label}</button>
                    ))}
                  </div>
                  <button onClick={() => beginCreate()} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-300 px-3.5 py-2 text-xs font-bold text-[#24150b] shadow-[0_0_18px_rgba(251,191,36,0.16)] transition hover:bg-amber-200">
                    <Plus size={15} /> Remember something
                  </button>
                </div>

                {error && (
                  <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100">
                    <span>{error}</span>
                    <button onClick={() => void loadMemories()} className="shrink-0 font-bold underline underline-offset-2">Try again</button>
                  </div>
                )}

                {loading ? (
                  <div className="flex min-h-60 items-center justify-center text-sm text-stone-400"><Loader2 className="mr-2 animate-spin" size={18} /> Opening their memory cabinet…</div>
                ) : visibleMemories.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-amber-200/20 bg-[radial-gradient(circle_at_top,rgba(129,92,133,.16),transparent_55%)] px-6 py-12 text-center">
                    <Sparkles className="mx-auto mb-3 text-amber-200/60" size={30} />
                    <h3 className="font-serif text-xl text-amber-50">Nothing is written here yet</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-400">Add a meaningful fact, boundary, relationship truth, or piece of lore that this character should carry between conversations.</p>
                    <button onClick={() => beginCreate()} className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-amber-300/35 px-4 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-300/10"><Plus size={14} /> Write the first memory</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleMemories.map((memory) => {
                      const type = MEMORY_TYPES.find((item) => item.id === memory.memory_type);
                      const isPinned = memory.importance >= 10;
                      return (
                        <article key={memory.id} className={`rounded-2xl border p-4 transition-colors ${isPinned ? 'border-amber-300/35 bg-amber-300/[0.06]' : 'border-white/10 bg-white/[0.025] hover:border-amber-100/20'}`}>
                          <div className="flex gap-3">
                            <div className={`mt-0.5 shrink-0 rounded-xl p-2 ${isPinned ? 'bg-amber-300/15 text-amber-200' : 'bg-violet-400/10 text-violet-200'}`}>{isPinned ? <Pin size={15} /> : <Brain size={15} />}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-white/10 bg-black/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-300">{type?.label || memory.memory_type}</span>
                                {isPinned && <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">Held close</span>}
                                <span className="text-[10px] text-stone-500">Importance {memory.importance}/10</span>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-100">{memory.content}</p>
                              <p className="mt-3 text-[10px] text-stone-500">Last shaped {new Date(memory.updated_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex shrink-0 flex-col gap-1">
                              <button onClick={() => void togglePinned(memory)} title={isPinned ? 'Remove held-close priority' : 'Hold close for priority recall'} className={`rounded-lg p-2 transition ${isPinned ? 'text-amber-200 hover:bg-amber-300/10' : 'text-stone-500 hover:bg-white/10 hover:text-stone-200'}`}><Pin size={15} /></button>
                              <button onClick={() => beginEdit(memory)} title="Edit memory" className="rounded-lg p-2 text-stone-500 transition hover:bg-white/10 hover:text-stone-200"><Edit3 size={15} /></button>
                              <button disabled={deletingId === memory.id} onClick={() => void deleteMemory(memory)} title="Forget memory" className="rounded-lg p-2 text-stone-500 transition hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50">{deletingId === memory.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside className="rounded-[1.5rem] border border-amber-100/15 bg-[#20191b] p-4 sm:p-5 lg:sticky lg:top-0 lg:self-start">
                <div className="mb-4 flex items-center gap-2 text-amber-100"><Heart size={16} className="text-rose-300" /><h3 className="font-serif text-lg">{editingMemory ? 'Shape this memory' : 'Add to their memory'}</h3></div>
                <form onSubmit={saveMemory} className="space-y-4">
                  <label className="block text-xs font-semibold text-stone-300">What should {characterName || 'they'} remember?
                    <textarea autoFocus value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} rows={6} maxLength={1000} placeholder="A clear, lasting truth in your own words…" className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-stone-600 focus:border-amber-300/45" />
                    <span className="mt-1 block text-right text-[10px] font-normal text-stone-500">{draft.content.length}/1000</span>
                  </label>
                  <label className="block text-xs font-semibold text-stone-300">Kind of memory
                    <select value={draft.memory_type} onChange={(event) => setDraft((current) => ({ ...current, memory_type: event.target.value as MemoryType }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171313] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300/45">
                      {MEMORY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label} — {type.description}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-stone-300">How central is it? <span className="float-right text-amber-200">{draft.importance}/10</span>
                    <input type="range" min="1" max="10" value={draft.importance} onChange={(event) => setDraft((current) => ({ ...current, importance: Number(event.target.value) }))} className="mt-3 w-full accent-amber-300" />
                    <span className="mt-1 block font-normal text-stone-500">10 is held close and prioritized. You can always revise or forget it.</span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    {editingMemory && <button type="button" onClick={() => { setEditingMemory(null); setDraft(emptyDraft(activeType === 'all' ? 'long_term' : activeType)); }} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-stone-300 transition hover:bg-white/10">Cancel</button>}
                    <button disabled={saving || !draft.content.trim()} type="submit" className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-300 px-3 py-2 text-xs font-bold text-[#24150b] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{editingMemory ? 'Save memory' : 'Remember this'}</button>
                  </div>
                </form>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
