import { useState, useEffect } from 'react';
import { Sparkles, Smile, Frown, Flame, Heart, AlertCircle, RefreshCw } from 'lucide-react';

export type EmotionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'flustered' | 'smirk' | 'blush';

interface CharacterExpressionAvatarProps {
  defaultPhotoUrl?: string | null;
  defaultEmoji?: string;
  expressions?: Record<string, string>; // e.g. { happy: 'url1', sad: 'url2' }
  lastMessageContent?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function detectEmotionFromText(text?: string): EmotionType {
  if (!text) return 'neutral';
  const lower = text.toLowerCase();

  if (lower.includes('*smiles*') || lower.includes('*laughs*') || lower.includes('happy') || lower.includes('joy')) return 'happy';
  if (lower.includes('*frowns*') || lower.includes('*cries*') || lower.includes('sad') || lower.includes('tears')) return 'sad';
  if (lower.includes('*glares*') || lower.includes('*yells*') || lower.includes('angry') || lower.includes('furious')) return 'angry';
  if (lower.includes('*gasp*') || lower.includes('*surprised*') || lower.includes('shocked')) return 'surprised';
  if (lower.includes('*blushes*') || lower.includes('*shy*') || lower.includes('flustered')) return 'flustered';
  if (lower.includes('*smirks*') || lower.includes('*chuckles*')) return 'smirk';

  return 'neutral';
}

export function CharacterExpressionAvatar({
  defaultPhotoUrl,
  defaultEmoji = '🎭',
  expressions = {},
  lastMessageContent,
  size = 'md',
  className = '',
}: CharacterExpressionAvatarProps) {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');

  useEffect(() => {
    if (lastMessageContent) {
      const detected = detectEmotionFromText(lastMessageContent);
      setCurrentEmotion(detected);
    }
  }, [lastMessageContent]);

  // Resolve current active avatar URL
  const activeUrl = expressions[currentEmotion] || defaultPhotoUrl;

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
  }[size];

  const emotionBadges: Record<EmotionType, { emoji: string; color: string }> = {
    neutral: { emoji: '😐', color: 'bg-warm-800 border-warm-700 text-warm-300' },
    happy: { emoji: '😊', color: 'bg-emerald-950 border-emerald-700 text-emerald-400' },
    sad: { emoji: '😢', color: 'bg-blue-950 border-blue-700 text-blue-400' },
    angry: { emoji: '😡', color: 'bg-red-950 border-red-700 text-red-400' },
    surprised: { emoji: '😲', color: 'bg-amber-950 border-amber-700 text-amber-400' },
    flustered: { emoji: '😳', color: 'bg-pink-950 border-pink-700 text-pink-400' },
    smirk: { emoji: '😏', color: 'bg-purple-950 border-purple-700 text-purple-400' },
    blush: { emoji: '😊', color: 'bg-rose-950 border-rose-700 text-rose-400' },
  };

  const badge = emotionBadges[currentEmotion];

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`relative rounded-2xl overflow-hidden border-2 border-warm-700/60 shadow-lg bg-warm-850 flex items-center justify-center transition-all duration-300 ${sizeClasses}`}>
        {activeUrl ? (
          <img
            src={activeUrl}
            alt="Character Expression"
            className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
          />
        ) : (
          <span className="select-none">{defaultEmoji}</span>
        )}
      </div>

      {/* Emotion indicator badge */}
      {currentEmotion !== 'neutral' && (
        <span
          className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border shadow-md flex items-center gap-0.5 animate-in zoom-in-50 duration-200 ${badge.color}`}
          title={`Active Expression: ${currentEmotion}`}
        >
          <span>{badge.emoji}</span>
        </span>
      )}
    </div>
  );
}
