import { X, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface ChatWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWallpaper: string | null;
  onSelect: (url: string | null) => void;
}

const PRESETS = [
  { id: 'none', url: null, label: 'Default Dark' },
  { id: 'space', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1000', label: 'Deep Space' },
  { id: 'lofi', url: 'https://images.unsplash.com/photo-1554147090-e1221a04a025?auto=format&fit=crop&q=80&w=1000', label: 'Neon Cyber' },
  { id: 'nature', url: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=1000', label: 'Dark Forest' },
  { id: 'abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000', label: 'Liquid Abstract' }
];

export function ChatWallpaperModal({ isOpen, onClose, currentWallpaper, onSelect }: ChatWallpaperModalProps) {
  const [customUrl, setCustomUrl] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onSelect(customUrl.trim());
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-warm-900 z-[70] rounded-3xl border border-warm-800 shadow-2xl overflow-hidden text-warm-50">
        
        <div className="flex items-center justify-between p-6 border-b border-warm-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon size={24} className="text-primary-500" />
            Chat Wallpaper
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-warm-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onSelect(preset.url);
                  onClose();
                }}
                className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                  currentWallpaper === preset.url ? 'border-primary-500 scale-105 shadow-lg shadow-primary-500/20' : 'border-transparent hover:border-warm-600'
                }`}
              >
                {preset.url ? (
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-warm-950 flex items-center justify-center text-xs text-warm-500 font-medium">
                    {preset.label}
                  </div>
                )}
                {preset.url && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] font-bold text-center">
                    {preset.label}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-warm-800">
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <input
                type="url"
                placeholder="Paste custom image URL..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 bg-warm-950 border border-warm-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
              <button 
                type="submit"
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                Apply
              </button>
            </form>
          </div>
        </div>

      </div>
    </>
  );
}
