import { Loader2, Sparkles, Waypoints } from 'lucide-react';

export type GuidedTurningPoint = {
  id: string;
  title: string;
  scene_prompt: string;
  choices: Array<{ id: string; key: string; label: string }>;
  reward_shards: number;
  status: 'active' | 'resolved';
  selected_choice_id: string | null;
};

export function GuidedTurningPointCard({ point, loading, onOpen, onChoose }: { point: GuidedTurningPoint | null; loading: boolean; onOpen: () => void; onChoose: (choice: GuidedTurningPoint['choices'][number]) => void }) {
  if (!point) return <section className="my-3 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-warm-900 via-purple-950 to-warm-950 p-4 text-white shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-200">Guided Story Path</p><h3 className="mt-1 font-serif text-lg font-bold">Open a turning point</h3><p className="mt-1 max-w-xl text-xs leading-relaxed text-warm-300">When the scene is ready, CHIMERA will shape meaningful choices from this roleplay. Free chat stays free.</p></div><Waypoints className="shrink-0 text-amber-300" size={22} /></div><button onClick={onOpen} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-extrabold transition hover:bg-purple-500 disabled:opacity-60">{loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {loading ? 'Shaping the moment…' : 'Create turning point'}</button></section>;

  return <section className="my-3 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-warm-900 via-purple-950 to-warm-950 p-4 text-white shadow-xl"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-200">Turning point</p><h3 className="mt-1 font-serif text-xl font-bold">{point.title}</h3><p className="mt-2 text-sm leading-relaxed text-warm-200">{point.scene_prompt}</p><p className="mt-3 text-[11px] font-bold text-amber-200">Choose a path · +{point.reward_shards} SHARDS once</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{point.choices.map((choice) => <button key={choice.id} onClick={() => onChoose(choice)} disabled={loading || point.status !== 'active'} className="flex items-start gap-2 rounded-2xl border border-purple-400/30 bg-white/10 px-3 py-3 text-left text-xs font-semibold transition hover:border-purple-300 hover:bg-purple-600/30 disabled:opacity-60"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-[10px] font-bold">{choice.key}</span><span>{choice.label}</span></button>)}</div></section>;
}
