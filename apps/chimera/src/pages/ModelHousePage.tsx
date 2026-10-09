import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CHAT_MODELS, isUsable, replyCost, usableModels, type ChatModel } from '../lib/chatModels';
import { loadIsModelTester, loadModelChoice, saveModelChoice } from '../lib/modelPreference';

function badge(model: ChatModel): { text: string; style: string } {
  if (model.status === 'soon') return { text: 'Coming soon', style: 'border-chimera-mute/40 text-chimera-mute' };
  if (model.testersOnly) return { text: replyCost(model) > 0 ? `Testing · ${replyCost(model)} SHARDS` : 'Testing', style: 'border-chimera-rose/50 text-chimera-rose' };
  return model.tier === 'free'
    ? { text: 'Free', style: 'border-chimera-mint/50 text-chimera-mint' }
    : { text: replyCost(model) > 0 ? `${replyCost(model)} SHARDS / reply` : 'Uses SHARDS', style: 'border-chimera-gold/50 text-chimera-gold' };
}

export default function ModelHousePage() {
  const { user, shardsBalance } = useAuth();
  const { showToast } = useToast();
  const [chosen, setChosen] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [tester, setTester] = useState(false);
  // Models still being tried are not listed at all for other members.
  const visibleModels = CHAT_MODELS.filter((model) => !model.testersOnly || tester);
  const canChoose = usableModels(CHAT_MODELS, tester).length > 1;

  useEffect(() => {
    if (!user) return;
    let active = true;
    loadIsModelTester(user.id)
      .catch(() => false)
      .then((isTester) => {
        if (!active) return undefined;
        setTester(isTester);
        return loadModelChoice(user.id, isTester);
      })
      .then((id) => active && id && setChosen(id))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [user]);

  const choose = async (model: ChatModel) => {
    if (!user || saving || chosen === model.id || !isUsable(model, tester)) return;
    const previous = chosen;
    setSaving(model.id);
    setChosen(model.id);
    try {
      await saveModelChoice(user.id, model.id);
      showToast(`${model.name} will answer in your scenes from the next reply.`, 'success');
    } catch {
      setChosen(previous);
      showToast('We could not save your choice. Please try again.', 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 pb-12 pt-8 sm:px-8">
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">MODEL HOUSE</p>
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Choose the voice behind your characters.</h1>
      <p className="mt-3 max-w-2xl text-chimera-mute">
        Your characters keep their own personality, memory and boundaries whichever model you pick. The model only changes how they write.
      </p>
      {!canChoose && (
        <p role="note" className="mt-5 rounded-xl border border-chimera-gold/25 bg-chimera-panel px-4 py-3 text-sm text-chimera-mute">
          SUPERNOVA is the only model available for now, so every scene uses it. More models are on the way and will appear here.
        </p>
      )}
      {usableModels(CHAT_MODELS, tester).some((model) => model.tier === 'shards') && (
        <p role="note" className="mt-5 rounded-xl border border-chimera-gold/25 bg-chimera-panel px-4 py-3 text-sm text-chimera-mute">
          Paid models take their SHARDS when a reply starts and give them back if no reply arrives. Regenerating a reply costs the same again. SUPERNOVA is always free.
          {shardsBalance !== null && <> Your reserve: <strong className="text-chimera-ink">{new Intl.NumberFormat().format(shardsBalance)} SHARDS</strong>.</>}
        </p>
      )}
      {failed && <p role="note" className="mt-5 text-sm text-amber-200">We could not load your current choice. Scenes keep using SUPERNOVA until it is saved.</p>}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {visibleModels.map((model) => {
          const tag = badge(model);
          const selectable = canChoose && isUsable(model, tester);
          const selected = chosen === model.id;
          return (
            <li key={model.id} className={`flex flex-col rounded-[22px] border bg-chimera-panel p-5 ${selected ? 'border-chimera-gold' : 'border-chimera-gold/20'} ${model.status === 'soon' ? 'opacity-80' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-serif text-2xl font-semibold">{model.name}</h2>
                  <p className="text-sm text-chimera-mute">{model.company} · {model.engineName}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${tag.style}`}>{tag.text}</span>
              </div>
              <p className="mt-3 text-[15px] text-violet-100/90">{model.description}</p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Strengths">
                {model.strengths.map((strength) => (
                  <li key={strength} className="rounded-full border border-chimera-gold/25 px-3 py-1 text-xs text-chimera-mute">{strength}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm"><span className="font-bold">Best for:</span> <span className="text-chimera-mute">{model.bestFor}</span></p>
              <p className="mt-1 text-sm"><span className="font-bold">Keep in mind:</span> <span className="text-chimera-mute">{model.consideration}</span></p>
              <div className="mt-auto pt-4">
                {selected && !canChoose ? (
                  <p className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-chimera-gold"><Check size={16} aria-hidden="true" /> Your model</p>
                ) : selectable ? (
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => void choose(model)}
                    disabled={saving !== null}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-bold disabled:opacity-60 ${selected ? 'bg-chimera-gold text-[#1a1208]' : 'border border-chimera-gold/50 hover:bg-chimera-gold/10'}`}
                  >
                    {selected && <Check size={16} aria-hidden="true" />} {selected ? 'Your model' : `Use ${model.name}`}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
