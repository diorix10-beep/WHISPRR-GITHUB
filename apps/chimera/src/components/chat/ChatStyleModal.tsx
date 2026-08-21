import { useEffect, useMemo, useState } from 'react';
import { Check, Cpu, Sparkles, Wand2, X, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { ChatStyleColor } from '../../hooks/useChatAesthetics';
import { AVAILABLE_CHAT_MODELS, DEFAULT_CHIMERA_MODEL_ID, getChimeraModel } from '../../lib/chimeraModels';

interface ChatStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: ChatStyleColor;
  onSelect: (style: ChatStyleColor) => void;
}

const STYLES: {
  id: ChatStyleColor;
  label: string;
  description: string;
  bgClass: string;
  borderClass: string;
  accentClass: string;
}[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Balanced CHIMERA bubbles',
    bgClass: 'bg-warm-900',
    borderClass: 'border-warm-700',
    accentClass: 'bg-warm-500'
  },
  {
    id: 'crimson',
    label: 'Crimson',
    description: 'Dark, dramatic, romantic',
    bgClass: 'bg-red-950',
    borderClass: 'border-red-800',
    accentClass: 'bg-red-500'
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Quiet late-night scenes',
    bgClass: 'bg-slate-950',
    borderClass: 'border-slate-700',
    accentClass: 'bg-slate-400'
  },
  {
    id: 'royal',
    label: 'Royal',
    description: 'Velvet blue intensity',
    bgClass: 'bg-indigo-950',
    borderClass: 'border-indigo-700',
    accentClass: 'bg-indigo-400'
  },
  {
    id: 'imessage',
    label: 'iMessage',
    description: 'Fast phone-message feeling',
    bgClass: 'bg-blue-600',
    borderClass: 'border-blue-400',
    accentClass: 'bg-white/80'
  }
];

export function ChatStyleModal({ isOpen, onClose, currentStyle, onSelect }: ChatStyleModalProps) {
  const { user, chimeraPreferences, updateChimeraPreferences } = useAuth();
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHIMERA_MODEL_ID);
  const [savingModel, setSavingModel] = useState<string | null>(null);
  const selectedModelInfo = useMemo(() => getChimeraModel(selectedModel), [selectedModel]);

  useEffect(() => {
    if (!isOpen) return;

    const storedModel = localStorage.getItem('chimera_default_model');
    setSelectedModel(chimeraPreferences?.default_ai_model || storedModel || DEFAULT_CHIMERA_MODEL_ID);
  }, [chimeraPreferences?.default_ai_model, isOpen]);

  if (!isOpen) return null;

  const handleSelectModel = async (modelId: string) => {
    const nextModel = AVAILABLE_CHAT_MODELS.find((model) => model.id === modelId);
    if (!nextModel) {
      showToast('This CHIMERA model is not ready for chats yet.', 'info');
      return;
    }

    setSavingModel(modelId);

    try {
      if (user) {
        await updateChimeraPreferences({ default_ai_model: modelId });
      }

      localStorage.setItem('chimera_default_model', modelId);
      setSelectedModel(modelId);
      showToast(`${nextModel.name} will guide your next replies.`, 'success');
    } catch {
      showToast('CHIMERA could not save this model choice. Please try again.', 'error');
    } finally {
      setSavingModel(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-warm-800 bg-warm-950 text-warm-50 shadow-2xl md:bottom-6 md:rounded-[2rem]">
        
        <div className="flex justify-center pt-3 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-warm-700" />
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-warm-800 p-5 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Wand2 size={23} className="text-primary-400" />
              Chat style
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-warm-400">
              Choose the CHIMERA engine first, then the visual mood of this conversation.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full bg-warm-900 p-2 transition-colors hover:bg-warm-800" aria-label="Close chat style">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          <section className="rounded-3xl border border-primary-500/25 bg-gradient-to-br from-primary-500/10 via-warm-900 to-accent-500/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-300">Current model</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-white">{selectedModelInfo.codename}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-300">{selectedModelInfo.description}</p>
              </div>
              <div className="rounded-2xl bg-black/25 p-3 text-primary-200">
                {selectedModelInfo.provider === 'gemini' ? <Zap size={24} /> : <Cpu size={24} />}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Model</h3>
                <p className="text-xs text-warm-400">This changes how characters write and reason.</p>
              </div>
              <span className="rounded-full border border-warm-700 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-warm-300">
                {user ? 'Account saved' : 'Device saved'}
              </span>
            </div>

            <div className="space-y-3">
              {AVAILABLE_CHAT_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                const isSaving = savingModel === model.id;

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelectModel(model.id)}
                    disabled={Boolean(savingModel)}
                    className={`w-full rounded-3xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-primary-400 bg-primary-500/10 shadow-[0_0_26px_rgba(239,68,68,0.16)]'
                        : 'border-warm-800 bg-warm-900 hover:border-warm-600 hover:bg-warm-800'
                    } ${savingModel ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
                        isSelected ? 'border-primary-400 bg-primary-500 text-white' : 'border-warm-700 bg-warm-950 text-warm-300'
                      }`}>
                        {model.provider === 'gemini' ? <Zap size={22} /> : <Cpu size={22} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-serif text-lg font-bold text-white">{model.codename}</h4>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-300">{model.tier}</p>
                          </div>
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                            isSelected ? 'border-primary-300 bg-primary-500 text-white' : 'border-warm-700 text-transparent'
                          }`}>
                            {isSaving ? (
                              <Sparkles size={15} className="animate-pulse text-white" />
                            ) : (
                              <Check size={15} />
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-warm-300">{model.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {model.strengths.slice(0, 3).map((strength) => (
                            <span key={strength} className="rounded-full bg-warm-800 px-2.5 py-1 text-[11px] font-medium text-warm-200">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-white">Chat look</h3>
              <p className="text-xs text-warm-400">This only changes the visual style of this conversation.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => onSelect(style.id)}
                className={`relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-3xl border-2 p-4 text-left transition-all ${
                  currentStyle === style.id ? 'border-primary-400 scale-[1.02] shadow-lg shadow-primary-500/20 z-10' : 'border-transparent hover:border-warm-600'
                } ${style.bgClass}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="relative flex items-center justify-between">
                  <div className={`flex h-10 w-16 items-center justify-center rounded-full border ${style.borderClass}`}>
                    <div className={`h-1.5 w-8 rounded-full ${style.accentClass}`} />
                  </div>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                    currentStyle === style.id ? 'border-primary-300 bg-primary-500 text-white' : 'border-white/20 text-transparent'
                  }`}>
                    <Check size={14} />
                  </div>
                </div>
                <div className="relative">
                  <span className="block text-lg font-bold text-white">{style.label}</span>
                  <span className="mt-1 block text-xs leading-snug text-white/65">{style.description}</span>
                </div>
              </button>
            ))}
            </div>
          </section>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-warm-800 px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-warm-700"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
