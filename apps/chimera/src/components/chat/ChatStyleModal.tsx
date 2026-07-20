import { X, Wand2 } from 'lucide-react';
import type { ChatStyleColor } from '../../hooks/useChatAesthetics';

interface ChatStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: ChatStyleColor;
  onSelect: (style: ChatStyleColor) => void;
}

const STYLES: { id: ChatStyleColor; label: string; bgClass: string; borderClass: string }[] = [
  { id: 'default', label: 'Default', bgClass: 'bg-warm-900', borderClass: 'border-warm-700' },
  { id: 'crimson', label: 'Crimson', bgClass: 'bg-red-950', borderClass: 'border-red-900' },
  { id: 'midnight', label: 'Midnight', bgClass: 'bg-slate-950', borderClass: 'border-slate-800' },
  { id: 'royal', label: 'Royal', bgClass: 'bg-indigo-950', borderClass: 'border-indigo-900' },
  { id: 'imessage', label: 'iMessage', bgClass: 'bg-blue-600', borderClass: 'border-blue-500' }
];

export function ChatStyleModal({ isOpen, onClose, currentStyle, onSelect }: ChatStyleModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-warm-900 z-[70] rounded-3xl border border-warm-800 shadow-2xl overflow-hidden text-warm-50">
        
        <div className="flex items-center justify-between p-6 border-b border-warm-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wand2 size={24} className="text-primary-500" />
            Chat Style
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-warm-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => { onSelect(style.id); onClose(); }}
                className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                  currentStyle === style.id ? 'border-primary-500 scale-105 shadow-lg shadow-primary-500/20 z-10' : 'border-transparent hover:border-warm-600'
                } ${style.bgClass}`}
              >
                {/* Preview Bubble */}
                <div className={`w-16 h-8 rounded-full mb-3 border ${style.borderClass} ${style.bgClass} flex items-center justify-center`}>
                  <div className="w-8 h-1.5 bg-white/20 rounded-full" />
                </div>
                <span className="font-bold text-sm">{style.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
