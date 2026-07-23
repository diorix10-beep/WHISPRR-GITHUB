import { useState } from 'react';
import { X, Send, Share2, Sparkles, Check, Globe } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const whisprrUrl = isLocalhost ? 'http://localhost:5174' : 'https://whisprr.xyz';

interface ShareToWhisprrModalProps {
  isOpen: boolean;
  onClose: () => void;
  character?: {
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    category?: string;
  };
  world?: {
    id: string;
    name: string;
    description?: string;
    coverUrl?: string;
  };
  lorebook?: {
    id: string;
    title: string;
    description?: string;
  };
}

export function ShareToWhisprrModal({ isOpen, onClose, character, world, lorebook }: ShareToWhisprrModalProps) {
  const { showToast } = useToast();
  
  const titleName = character?.name || world?.name || lorebook?.title || 'Creative Item';
  const itemType = character ? 'Character' : world ? 'World' : 'Lorebook';
  
  const [caption, setCaption] = useState(`Check out my ${itemType} "${titleName}" on CHIMERA! ✨`);
  const [sharing, setSharing] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);

  if (!isOpen || (!character && !world && !lorebook)) return null;

  const itemLink = character 
    ? `${window.location.origin}/conversations?characterId=${character.id}`
    : world 
    ? `${window.location.origin}/worlds/${world.id}`
    : `${window.location.origin}/lorebooks/${lorebook?.id}`;

  const handleShare = () => {
    setSharing(true);

    const postText = encodeURIComponent(`${caption}\n\n✨ CHIMERA ${itemType}: ${titleName}\n👉 Explore on CHIMERA: ${itemLink}`);
    const shareUrl = `${whisprrUrl}/feed?newPostText=${postText}`;

    setTimeout(() => {
      setSharing(false);
      setSharedSuccess(true);
      showToast(`Opening WHISPRR to share your ${itemType.toLowerCase()}!`, 'success');
      
      window.open(shareUrl, '_blank');
      
      setTimeout(() => {
        setSharedSuccess(false);
        onClose();
      }, 1200);
    }, 600);
  };

  const previewImage = character?.avatarUrl || world?.coverUrl;

  return (
    <div className="fixed inset-0 z-[9999] bg-warm-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-750 shadow-2xl p-6 relative flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-100 dark:border-warm-800 pb-4">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-base">
            <Globe size={20} />
            <span>Share to WHISPRR Feed</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 rounded-full hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview Card */}
        <div className="bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-800 p-4 rounded-2xl flex items-center gap-3">
          {previewImage ? (
            <img src={previewImage} alt={titleName} className="w-12 h-12 rounded-xl object-cover border border-warm-300 dark:border-warm-700 shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-lg shrink-0">
              {titleName[0]}
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm text-warm-900 dark:text-white truncate">{titleName}</h4>
            <p className="text-xs text-warm-500 truncate">{character?.description || world?.description || lorebook?.description || `CHIMERA ${itemType}`}</p>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-primary-500/10 text-primary-500 rounded-md mt-1">
              CHIMERA {itemType} Showcase
            </span>
          </div>
        </div>

        {/* Post Caption */}
        <div>
          <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1.5">
            Post Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full text-xs bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl p-3 text-warm-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-warm-500 hover:text-warm-700 dark:hover:text-warm-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {sharedSuccess ? (
              <>
                <Check size={16} /> Shared!
              </>
            ) : sharing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={14} /> Publish to WHISPRR
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

