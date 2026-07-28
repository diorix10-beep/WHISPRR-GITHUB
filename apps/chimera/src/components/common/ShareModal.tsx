import { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles, MessageCircle, Twitter } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  url: string;
  type?: 'character' | 'story' | 'world' | 'referral';
}

export function ShareModal({ isOpen, onClose, title, description, url, type = 'character' }: ShareModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`Check out "${title}" on CHIMERA! ${description ? description.slice(0, 100) : ''}`);

  const shareLinks = [
    {
      name: 'X (Twitter)',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: 'bg-black hover:bg-neutral-800 text-white',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-warm-900 border border-warm-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-warm-400 hover:text-white hover:bg-warm-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Share2 size={20} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-white">Share {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            <p className="text-xs text-warm-400">Invite creators & friends to explore.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-warm-850 border border-warm-800 mb-6">
          <h4 className="font-bold text-sm text-white line-clamp-1 mb-1">{title}</h4>
          {description && <p className="text-xs text-warm-400 line-clamp-2">{description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md ${link.color}`}
            >
              <link.icon size={16} />
              <span>{link.name}</span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-warm-800 border border-warm-750">
          <input
            type="text"
            readOnly
            value={url}
            className="w-full bg-transparent px-3 py-1.5 text-xs text-warm-200 focus:outline-none select-all"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
