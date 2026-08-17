import { useState } from 'react';
import { X, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ShardCrystalImage } from './ShardCrystalImage';

interface GiftShardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName?: string;
  recipientType?: 'character' | 'author' | 'creator';
}

const TIPPING_AMOUNTS = [
  { amount: 5, label: 'Sparks', emoji: '✨' },
  { amount: 10, label: 'Kudos', emoji: '❤️' },
  { amount: 25, label: 'Super Fan', emoji: '🌟' },
  { amount: 50, label: 'Royal Gem', emoji: '💎' },
  { amount: 100, label: 'Legendary', emoji: '👑' },
];

export function GiftShardsModal({
  isOpen,
  onClose,
  recipientName = 'Creator',
  recipientType = 'character',
}: GiftShardsModalProps) {
  const { shardsBalance, spendShards } = useAuth();
  const { showToast } = useToast();
  
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customNote, setCustomNote] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSendTip = () => {
    if (shardsBalance === null || selectedAmount > shardsBalance) {
      showToast(`Your SHARDS balance is still loading. Please try again in a moment.`, 'error');
      window.dispatchEvent(new CustomEvent('open-shards-hub'));
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      const success = spendShards(selectedAmount, `Gift to ${recipientName}`);
      setIsSending(false);

      if (success) {
        showToast(`🎉 Gifted ${selectedAmount} SHARDS to ${recipientName}!`, 'success');
        onClose();
      } else {
        showToast('Failed to send gift. Please check your SHARDS balance.', 'error');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans animate-fade-in">
      <div className="w-full max-w-md bg-warm-900 border border-warm-800 rounded-3xl shadow-2xl overflow-hidden relative animate-scale-in">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-red-600 p-6 text-white text-center relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="inline-flex p-3 rounded-2xl bg-black/30 backdrop-blur-md mb-2 shadow-lg">
            <Heart size={32} className="text-pink-300 fill-current animate-pulse" />
          </div>

          <h3 className="font-serif text-xl font-bold">Gift SHARDS</h3>
          <p className="text-xs text-purple-100 mt-1">
            Support <span className="font-bold underline">{recipientName}</span> with creative sparks
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Balance Display */}
          <div className="flex items-center justify-between p-3.5 bg-warm-850 border border-warm-800 rounded-2xl">
            <span className="text-xs font-bold text-warm-300">Your SHARDS Balance</span>
            <div className="flex items-center gap-1.5 font-serif text-base font-bold text-cyan-400">
              <ShardCrystalImage size={20} showGlow={false} />
              <span>{shardsBalance === null ? 'Loading…' : shardsBalance}</span>
            </div>
          </div>

          {/* Amount Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-warm-400 uppercase tracking-wide">Select Gift Amount</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TIPPING_AMOUNTS.map((item) => (
                <button
                  key={item.amount}
                  type="button"
                  onClick={() => setSelectedAmount(item.amount)}
                  className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedAmount === item.amount
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-lg ring-2 ring-purple-500/30'
                      : 'bg-warm-800/60 border-warm-750 text-warm-300 hover:bg-warm-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-xs font-serif font-bold">{item.amount} 💎</span>
                  <span className="text-[9px] text-warm-400">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-warm-400">Support Note (Optional)</label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={`Send a message to ${recipientName}...`}
              className="w-full bg-warm-800 border border-warm-750 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-warm-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Submit Action */}
          <button
            onClick={handleSendTip}
            disabled={isSending}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-extrabold text-xs shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSending ? (
              <span>Sending Gift...</span>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Send {selectedAmount} SHARDS to {recipientName}</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}
