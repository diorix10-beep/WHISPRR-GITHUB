import { useState } from 'react';
import { X, Gem, Heart, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface CreatorTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  creatorAvatarUrl?: string;
  characterOrStoryName?: string;
}

export function CreatorTipModal({
  isOpen,
  onClose,
  creatorName,
  creatorAvatarUrl,
  characterOrStoryName = 'Character'
}: CreatorTipModalProps) {
  const { shardsBalance, spendShards } = useAuth();
  const { showToast } = useToast();

  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [note, setNote] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSendTip = () => {
    if (shardsBalance < selectedAmount) {
      showToast(`Insufficient Shards! You need ${selectedAmount} 💎 Shards.`, 'error');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      const success = spendShards(selectedAmount, `Tipped ${creatorName} for ${characterOrStoryName}`);
      setIsSending(false);
      if (success) {
        showToast(`💖 Successfully sent ${selectedAmount} Shards to ${creatorName}!`, 'success');
        onClose();
      } else {
        showToast('Failed to process gift transaction.', 'error');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-warm-900 rounded-3xl shadow-2xl border border-warm-200 dark:border-warm-800 overflow-hidden relative animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 rounded-full mx-auto border-2 border-white shadow-lg overflow-hidden bg-warm-800 mb-3 flex items-center justify-center text-2xl font-bold font-serif text-white">
            {creatorAvatarUrl ? (
              <img src={creatorAvatarUrl} alt={creatorName} className="w-full h-full object-cover" />
            ) : (
              creatorName.slice(0, 2).toUpperCase()
            )}
          </div>

          <h3 className="font-serif text-xl font-bold">Support {creatorName}</h3>
          <p className="text-xs text-red-100 mt-1">Show appreciation for {characterOrStoryName}</p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-warm-700 dark:text-warm-300 block">Select Gift Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 25, 50].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedAmount(amt)}
                  className={`py-2.5 rounded-xl font-extrabold text-xs transition-all border flex flex-col items-center gap-1 ${
                    selectedAmount === amt
                      ? 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                      : 'bg-warm-50 dark:bg-warm-800 text-warm-800 dark:text-warm-200 border-warm-200 dark:border-warm-750 hover:border-red-400'
                  }`}
                >
                  <Gem size={14} className={selectedAmount === amt ? 'fill-white' : 'text-amber-500'} />
                  <span>{amt} 💎</span>
                </button>
              ))}
            </div>
          </div>

          {/* Appreciation Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-warm-700 dark:text-warm-300 block">Personal Appreciation Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Amazing character background!"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-950 text-xs text-warm-900 dark:text-white placeholder-warm-400 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* User Balance Check */}
          <div className="flex items-center justify-between text-xs text-warm-500 font-medium pt-2 border-t border-warm-100 dark:border-warm-800">
            <span>Your Balance:</span>
            <span className="font-bold text-warm-900 dark:text-white flex items-center gap-1">
              <Gem size={13} className="text-amber-500 fill-amber-500" />
              {shardsBalance} 💎 Shards
            </span>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSendTip}
            disabled={isSending || shardsBalance < selectedAmount}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSending ? (
              <span>Sending Gift...</span>
            ) : (
              <>
                <Send size={15} />
                <span>Send {selectedAmount} 💎 Shards Gift</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
