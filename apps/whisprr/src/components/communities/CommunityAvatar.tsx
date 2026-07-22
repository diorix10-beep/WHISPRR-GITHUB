import * as Icons from 'lucide-react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CommunityAvatarProps {
  photoUrl?: string | null;
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

export function CommunityAvatar({ photoUrl, size = 'md', className = '' }: CommunityAvatarProps) {
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  if (!photoUrl || (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://'))) {
    const DefaultIcon = Icons.Globe;
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-warm-100 to-warm-200 dark:from-warm-800 dark:to-warm-900 border border-warm-200 dark:border-warm-700 text-warm-500 dark:text-warm-400 shrink-0 shadow-soft ${sizeClass} ${className}`}>
        <DefaultIcon size={iconSize} className="opacity-60" />
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt="Community Avatar"
      className={`object-cover shrink-0 ${sizeClass} ${className}`}
    />
  );
}
