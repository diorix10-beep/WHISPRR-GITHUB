import * as Icons from 'lucide-react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CommunityAvatarProps {
  emoji?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 rounded-lg text-xs',
  sm: 'w-8 h-8 rounded-xl text-sm',
  md: 'w-10 h-10 rounded-2xl text-lg',
  lg: 'w-14 h-14 rounded-3xl text-2xl',
  xl: 'w-20 h-20 rounded-[2rem] text-4xl',
};

const iconSizes: Record<AvatarSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 40,
};

export function CommunityAvatar({ emoji, size = 'md', className = '' }: CommunityAvatarProps) {
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  if (!emoji) {
    const DefaultIcon = Icons.Globe;
    return (
      <div className={`flex items-center justify-center bg-warm-100 dark:bg-warm-800 text-warm-500 dark:text-warm-400 shrink-0 ${sizeClass} ${className}`}>
        <DefaultIcon size={iconSize} />
      </div>
    );
  }

  // Check if it is a custom uploaded image URL
  if (emoji.startsWith('http://') || emoji.startsWith('https://')) {
    return (
      <img
        src={emoji}
        alt="Community Avatar"
        className={`object-cover shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  // Check if it is a Lucide icon
  const IconComponent = (Icons as any)[emoji];
  if (IconComponent) {
    return (
      <div className={`flex items-center justify-center bg-primary-50 dark:bg-primary-950/30 text-primary-500 dark:text-primary-400 shrink-0 ${sizeClass} ${className}`}>
        <IconComponent size={iconSize} />
      </div>
    );
  }

  // Fallback to text (emoji)
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-950/20 dark:to-accent-950/20 text-warm-800 dark:text-warm-200 shrink-0 ${sizeClass} ${className}`}
    >
      <span style={{ fontSize: `${iconSize * 0.9}px` }}>{emoji}</span>
    </div>
  );
}
