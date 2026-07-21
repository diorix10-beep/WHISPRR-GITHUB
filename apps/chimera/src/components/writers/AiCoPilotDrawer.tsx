import { useState } from 'react';
import { X, Sparkles, Wand2, Sliders, Check, Copy, RefreshCw, BookOpen } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface AiCoPilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterContent: string;
  onInsertText: (text: string) => void;
}

export function AiCoPilotDrawer({ isOpen, onClose, chapterContent, onInsertText }: AiCoPilotDrawerProps) {
  const { showToast } = useToast();
  const [tone, setTone] = useState<'dramatic' | 'suspenseful' | 'dark' | 'romantic' | 'poetic'>('dramatic');
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = (action: 'continue' | 'hooks' | 'polish') => {
    setGenerating(true);
    setActiveAction(action);
    setSuggestion(null);

    setTimeout(() => {
      setGenerating(false);
      if (action === 'continue') {
        setSuggestion(
          `The silence hung heavy between them, thick as smoke before the storm. A faint chime resonated from the far end of the sanctuary—a warning that time was slipping away.`
        );
      } else if (action === 'hooks') {
        setSuggestion(
          `1. A forgotten artifact on the desk suddenly glows with an ancient crimson crest.\n2. An unexpected message arrives from someone presumed lost years ago.\n3. The lights flicker as a hidden passage opens behind the bookshelf.`
        );
      } else {
        setSuggestion(
          `Shadows danced softly across the stone walls as the cold mountain wind whispered through the high arches.`
        );
      }
      showToast('AI Co-Pilot suggestion ready!', 'success');
    }, 800);
  };

  const handleInsert = () => {
    if (!suggestion) return;
    onInsertText(suggestion);
    showToast('Inserted into chapter text!', 'success');
    setSuggestion(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[999] w-full max-w-md bg-white dark:bg-warm-900 border-l border-warm-200 dark:border-warm-800 shadow-2xl p-6 flex flex-col gap-5 animate-slide-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-warm-100 dark:border-warm-800 pb-4">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-base">
          <Sparkles size={20} />
          <span>AI Co-Pilot (Optional)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 rounded-full hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <p className="text-xs text-warm-500 leading-relaxed">
        Use optional AI suggestions to spark ideas, polish prose, or brainstorm plot hooks. You remain in 100% control of your story.
      </p>

      {/* Tone Selection */}
      <div>
        <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-2 flex items-center gap-1.5">
          <Sliders size={14} /> Tone & Atmosphere
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(['dramatic', 'suspenseful', 'dark', 'romantic', 'poetic'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                tone === t
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-warm-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleGenerate('continue')}
          disabled={generating}
          className="p-3 bg-warm-50 dark:bg-warm-850 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-warm-200 dark:border-warm-800 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all disabled:opacity-50"
        >
          <Wand2 size={18} className="text-purple-500" />
          <span className="text-[11px] font-bold text-warm-900 dark:text-white">Continue</span>
        </button>
        <button
          onClick={() => handleGenerate('hooks')}
          disabled={generating}
          className="p-3 bg-warm-50 dark:bg-warm-850 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-warm-200 dark:border-warm-800 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all disabled:opacity-50"
        >
          <BookOpen size={18} className="text-amber-500" />
          <span className="text-[11px] font-bold text-warm-900 dark:text-white">Plot Hooks</span>
        </button>
        <button
          onClick={() => handleGenerate('polish')}
          disabled={generating}
          className="p-3 bg-warm-50 dark:bg-warm-850 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-warm-200 dark:border-warm-800 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className="text-blue-500" />
          <span className="text-[11px] font-bold text-warm-900 dark:text-white">Polish Prose</span>
        </button>
      </div>

      {/* Suggestion Output Area */}
      <div className="flex-1 bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto">
        {generating ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-warm-400">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Crafting suggestion in {tone} tone...</span>
          </div>
        ) : suggestion ? (
          <div className="space-y-3">
            <p className="text-xs text-warm-800 dark:text-warm-200 whitespace-pre-wrap leading-relaxed font-serif">
              {suggestion}
            </p>
            <div className="flex gap-2 justify-end pt-2 border-t border-warm-200 dark:border-warm-800">
              <button
                onClick={handleInsert}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Check size={14} /> Insert into Text
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-xs text-warm-400">
            Click an action above to generate AI prose suggestions or plot hooks.
          </div>
        )}
      </div>
    </div>
  );
}
