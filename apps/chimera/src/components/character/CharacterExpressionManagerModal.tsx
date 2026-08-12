import { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Check, Upload, Trash2, Smile } from 'lucide-react';
import { UniversalImagePicker } from '../common/UniversalImagePicker';
import type { EmotionType } from './CharacterExpressionAvatar';

interface CharacterExpressionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  defaultPhotoUrl?: string | null;
  expressions?: Record<string, string>;
  onSaveExpressions: (expressions: Record<string, string>) => void;
}

const EMOTION_SLOTS: Array<{ key: EmotionType; label: string; emoji: string; desc: string }> = [
  { key: 'happy', label: 'Happy / Joyful', emoji: '😊', desc: 'Triggered when the character smiles, laughs, or expresses delight.' },
  { key: 'sad', label: 'Sad / Sorrowful', emoji: '😢', desc: 'Triggered when the character frowns, cries, or feels down.' },
  { key: 'angry', label: 'Angry / Furious', emoji: '😡', desc: 'Triggered when the character glares, yells, or gets heated.' },
  { key: 'surprised', label: 'Surprised / Shocked', emoji: '😲', desc: 'Triggered when the character gasps or experiences a surprise.' },
  { key: 'flustered', label: 'Flustered / Shy', emoji: '😳', desc: 'Triggered when the character blushes or acts timid.' },
  { key: 'smirk', label: 'Smirk / Playful', emoji: '😏', desc: 'Triggered when the character smirks, teases, or chuckles.' },
  { key: 'blush', label: 'Blushing / Tender', emoji: '😊', desc: 'Triggered when the character feels romantic or warm.' },
];

export function CharacterExpressionManagerModal({
  isOpen,
  onClose,
  characterName,
  defaultPhotoUrl,
  expressions = {},
  onSaveExpressions,
}: CharacterExpressionManagerModalProps) {
  const [localExpressions, setLocalExpressions] = useState<Record<string, string>>(expressions);
  const [activePickerSlot, setActivePickerSlot] = useState<EmotionType | null>(null);

  if (!isOpen) return null;

  const handleSetUrl = (slot: EmotionType, url: string) => {
    setLocalExpressions(prev => ({ ...prev, [slot]: url }));
    setActivePickerSlot(null);
  };

  const handleRemoveSlot = (slot: EmotionType) => {
    setLocalExpressions(prev => {
      const copy = { ...prev };
      delete copy[slot];
      return copy;
    });
  };

  const handleSave = () => {
    onSaveExpressions(localExpressions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-warm-900 border border-warm-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-warm-800 flex items-center justify-between bg-warm-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Smile size={20} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white">
                Expression Sprites — {characterName || 'AI Character'}
              </h2>
              <p className="text-xs text-warm-400">
                Set custom avatar expressions that dynamically activate based on character dialogue emotions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-warm-800 text-warm-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EMOTION_SLOTS.map(slot => {
              const currentUrl = localExpressions[slot.key];

              return (
                <div
                  key={slot.key}
                  className="p-4 rounded-2xl bg-warm-850 border border-warm-750/80 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{slot.emoji}</span>
                      <div>
                        <h4 className="font-bold text-xs text-white">{slot.label}</h4>
                        <p className="text-[10px] text-warm-400 leading-tight">{slot.desc}</p>
                      </div>
                    </div>

                    {currentUrl && (
                      <button
                        onClick={() => handleRemoveSlot(slot.key)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-warm-400 hover:text-red-400 transition-colors"
                        title="Remove Expression"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Image Preview & Upload Button */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-warm-800 border border-warm-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {currentUrl ? (
                        <img src={currentUrl} alt={slot.label} className="w-full h-full object-cover" />
                      ) : defaultPhotoUrl ? (
                        <img src={defaultPhotoUrl} alt="Default Fallback" className="w-full h-full object-cover opacity-40 grayscale" />
                      ) : (
                        <span className="text-lg opacity-40">{slot.emoji}</span>
                      )}
                    </div>

                    <button
                      onClick={() => setActivePickerSlot(slot.key)}
                      className="flex-1 py-2 px-3 rounded-xl bg-warm-800 hover:bg-purple-600/20 border border-warm-700 hover:border-purple-500/40 text-xs font-bold text-warm-200 hover:text-purple-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ImageIcon size={14} />
                      <span>{currentUrl ? 'Replace Sprite' : 'Assign Sprite'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-warm-800 bg-warm-900/90 flex items-center justify-between">
          <span className="text-xs text-warm-400 font-bold">
            {Object.keys(localExpressions).length} / {EMOTION_SLOTS.length} Expressions Configured
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-warm-800 hover:bg-warm-750 text-xs font-bold text-warm-300 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-extrabold text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
            >
              <Check size={15} />
              <span>Save Expressions</span>
            </button>
          </div>
        </div>

        {/* Nested Image Picker Modal */}
        {activePickerSlot && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-warm-900 border border-warm-750 p-6 rounded-3xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">
                  Select {EMOTION_SLOTS.find(s => s.key === activePickerSlot)?.label} Sprite
                </h3>
                <button onClick={() => setActivePickerSlot(null)} className="p-1 text-warm-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <UniversalImagePicker
                value={localExpressions[activePickerSlot] || null}
                onChange={(url: string | null) => {
                  if (url) {
                    handleSetUrl(activePickerSlot, url);
                  }
                  setActivePickerSlot(null);
                }}
                label={`Upload ${activePickerSlot} avatar sprite`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
