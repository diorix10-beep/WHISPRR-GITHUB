import { X, Layout } from 'lucide-react';
import type { ChatLayout } from '../../hooks/useChatAesthetics';

interface ChatLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: ChatLayout;
  onSelect: (layout: ChatLayout) => void;
}

export function ChatLayoutModal({ isOpen, onClose, currentLayout, onSelect }: ChatLayoutModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-warm-900 z-[70] rounded-3xl border border-warm-800 shadow-2xl overflow-hidden text-warm-50">
        
        <div className="flex items-center justify-between p-6 border-b border-warm-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layout size={24} className="text-primary-500" />
            Chat Layout
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-warm-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          <button
            onClick={() => { onSelect('classic'); onClose(); }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              currentLayout === 'classic' ? 'border-primary-500 bg-primary-900/10' : 'border-warm-800 hover:border-warm-600 bg-warm-950/50'
            }`}
          >
            <div className="flex-1 space-y-2">
              <h3 className="font-bold">Classic (C.AI Style)</h3>
              <p className="text-xs text-warm-400">All messages aligned left with avatars next to bubbles. Best for reading stories.</p>
            </div>
            {/* Visual preview */}
            <div className="w-16 h-12 flex flex-col gap-1 opacity-80">
              <div className="flex gap-1 items-start">
                <div className="w-3 h-3 rounded-full bg-warm-600 shrink-0" />
                <div className="w-10 h-3 bg-warm-700 rounded-md" />
              </div>
              <div className="flex gap-1 items-start">
                <div className="w-3 h-3 rounded-full bg-primary-500 shrink-0" />
                <div className="w-8 h-3 bg-primary-900/50 rounded-md" />
              </div>
            </div>
          </button>

          <button
            onClick={() => { onSelect('modern'); onClose(); }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              currentLayout === 'modern' ? 'border-primary-500 bg-primary-900/10' : 'border-warm-800 hover:border-warm-600 bg-warm-950/50'
            }`}
          >
            <div className="flex-1 space-y-2">
              <h3 className="font-bold">Modern (iMessage Style)</h3>
              <p className="text-xs text-warm-400">Your messages on the right, AI messages on the left. Best for texting feel.</p>
            </div>
            {/* Visual preview */}
            <div className="w-16 h-12 flex flex-col gap-1 opacity-80">
              <div className="flex gap-1 items-start">
                <div className="w-3 h-3 rounded-full bg-warm-600 shrink-0" />
                <div className="w-8 h-3 bg-warm-700 rounded-md" />
              </div>
              <div className="flex gap-1 items-start justify-end w-full">
                <div className="w-8 h-3 bg-primary-500 rounded-md" />
              </div>
            </div>
          </button>

          <button
            onClick={() => { onSelect('phone'); onClose(); }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              currentLayout === 'phone' ? 'border-primary-500 bg-primary-900/10' : 'border-warm-800 hover:border-warm-600 bg-warm-950/50'
            }`}
          >
            <div className="flex-1 space-y-2">
              <h3 className="font-bold">Mock Phone (Simulator)</h3>
              <p className="text-xs text-warm-400">Renders the chat inside an authentic iPhone bezel on your desktop.</p>
            </div>
            {/* Visual preview */}
            <div className="w-16 h-20 rounded-xl border-2 border-warm-700 bg-warm-900 flex flex-col p-1 gap-1 opacity-80 items-center justify-center relative shadow-inner">
              <div className="w-6 h-1 rounded-full bg-warm-800 absolute top-1" />
              <div className="w-12 flex flex-col gap-1 mt-2">
                <div className="flex gap-1 items-start">
                  <div className="w-8 h-2 bg-warm-700 rounded-md" />
                </div>
                <div className="flex gap-1 items-start justify-end w-full">
                  <div className="w-6 h-2 bg-primary-500 rounded-md" />
                </div>
              </div>
            </div>
          </button>

        </div>
      </div>
    </>
  );
}
