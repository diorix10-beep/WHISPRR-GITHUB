import { useRef, useEffect } from 'react';

// Curated emoji list organized by category
const EMOJI_CATEGORIES = [
  {
    label: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲'],
  },
  {
    label: 'Emotions',
    emojis: ['😌','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕'],
  },
  {
    label: 'Hands & People',
    emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','💪','🦾','🦿','🦵','🦶','👂','🦻','👃'],
  },
  {
    label: 'Hearts & Love',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','❤️‍🩹','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️'],
  },
  {
    label: 'Nature',
    emojis: ['🌸','🌺','🌻','🌹','🌷','🌱','🌿','☘️','🍀','🎋','🎍','🍃','🍂','🍁','🍄','🐚','🌾','💐','🌵','🌴','🌳','🌲','🎄','🪵'],
  },
  {
    label: 'Food & Drink',
    emojis: ['☕','🍵','🧋','🥤','🍺','🥂','🍷','🍸','🎂','🍰','🧁','🍩','🍪','🍫','🍭','🍬','🍯','🍕','🌮','🍔','🍟','🍜','🍣'],
  },
  {
    label: 'Activities',
    emojis: ['🎮','🎲','♟️','🎯','🎪','🎭','🎨','🖼️','🎬','🎤','🎵','🎶','🎸','🎹','🎷','🎺','🥁','🎻','🏆','🥇','🎗️','🎟️','🎠'],
  },
  {
    label: 'Symbols',
    emojis: ['✨','⭐','🌟','💫','⚡','🔥','🌈','☀️','🌙','⭐','🌊','💧','❄️','🌀','🌪️','🎆','🎇','🧨','🎉','🎊','🎈','🎁','🎀'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid the button click that opened it
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-600 rounded-2xl shadow-float overflow-hidden"
      style={{ maxHeight: '280px' }}
    >
      <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
        {EMOJI_CATEGORIES.map(cat => (
          <div key={cat.label} className="px-3 py-2">
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-2">{cat.label}</p>
            <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))' }}>
              {cat.emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors text-lg leading-none"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
