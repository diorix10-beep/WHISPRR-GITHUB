import { useState } from 'react';
import { X, Sparkles, Image, Check, Plus, Upload, Smile } from 'lucide-react';
import { UniversalImagePicker } from '../common/UniversalImagePicker';

interface CharacterExpressionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  expressions: Record<string, string>; // { happy: 'url', sad: 'url' }
  onSaveExpressions: (updated: Record<string, string>) => void;
}

const EMOTIONS = [
  { id: 'happy', label: 'Happy / Smiling', emoji: '😊' },
  { id: 'sad', label: 'Sad / Crying', emoji: '😢' },
  { id: 'angry', label: 'Angry / Furious', emoji: '😡' },
  { id: 'surprised', label: 'Surprised / Shocked', emoji: '😲' },
  { id: 'flustered', label: 'Flustered / Embarrassed', emoji: '😳' },
  { id: 'smirk', label: 'Smirking / Playful', emoji: '😏' },
  { id: 'blush', label: 'Blushing / Shy', emoji: '😊' },
];

export function CharacterExpressionManagerModal({
  isOpen,
  onClose,
  characterName,
  expressions = {},
  onSaveExpressions,
}: CharacterExpressionManagerModalProps) {
  if (!isOpen) return null;

  const [localExpressions, setLocalExpressions] = useState<Record<string, string>>(expressions);
  const [activeEmotionPicker, setActiveEmotionPicker] = useState<string | null>(null);

  const handleSetImage = (emotionId: string, url: string) => {
    setLocalExpressions(prev => ({ ...prev, [emotionId]: url }));
    setActiveEmotionPicker(null);
  };

  const handleRemoveImage = (emotionId: string) => {
    setLocalExpressions(prev => {
      const next = { ...prev };
      delete next[emotionId];
      return next;
    });
  };

  const handleSave = () => {
    onSaveExpressions(localExpressions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-warm-900 border border-warm-800 shadow-2xl overflow-hidden text-warm-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-warm-800 flex items-center justify-between bg-warm-950/60">
          <div>
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Smile className="text-amber-400" size={20} />
              <span>Emotional Expression Avatars</span>
            </h3>
            <p className="text-xs text-warm-400">
              Set custom expression avatars for <strong className="text-warm-200">{characterName}</strong> that swap dynamically during roleplay!
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-warm-800 hover:bg-warm-700 text-warm-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Emotions Grid */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EMOTIONS.map((emotion) => {
              const currentUrl = localExpressions[emotion.id];

              return (
                <div
                  key={emotion.id}
                  className="p-4 rounded-2xl bg-warm-850 border border-warm-800 space-y-3 flex items-center gap-4"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-warm-700 bg-warm-800 flex items-center justify-center flex-shrink-0">
                    {currentUrl ? (
                      <img src={currentUrl} alt={emotion.label} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{emotion.emoji}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <h4 className="text-xs font-bold text-warm-200 flex items-center gap-1.5 truncate">
                      <span>{emotion.emoji}</span>
                      <span>{emotion.label}</span>
                    </h4>
                    
                    <UniversalImagePicker
                      value={currentUrl || null}
                      onChange={(url: string | null) => {
                        if (url) handleSetImage(emotion.id, url);
                        else handleRemoveImage(emotion.id);
                      }}
                      aspectRatio={1}
                      shape="rectangle"
                      label={`Upload ${emotion.label} Expression`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-warm-950/80 border-t border-warm-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-warm-400 hover:text-white text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Check size={14} />
            <span>Save Expressions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
