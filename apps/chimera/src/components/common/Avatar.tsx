import type { ReactNode } from 'react';
import { Camera, User } from 'lucide-react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  emoji: string;
  photoUrl?: string | null;
  size?: AvatarSize;
  onClick?: () => void;
  editable?: boolean;
  onPhotoClick?: () => void;
  uploading?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-lg',
  lg: 'w-14 h-14 text-2xl',
  xl: 'w-20 h-20 text-4xl',
};

const cameraSizeClasses: Record<AvatarSize, string> = {
  xs: 'w-2 h-2',
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const overlaySizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

export function Avatar({
  emoji,
  photoUrl = null,
  size = 'md',
  onClick,
  editable = false,
  onPhotoClick,
  uploading = false,
}: AvatarProps): ReactNode {
  const baseClasses = `flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-200 ${
    onClick ? 'cursor-pointer hover:shadow-warm' : ''
  }`;

  const sizeClass = sizeClasses[size];

  if (photoUrl) {
    return (
      <div className="relative group" onClick={editable ? onPhotoClick : onClick}>
        <img
          src={photoUrl}
          alt="avatar"
          className={`${baseClasses} ${sizeClass} object-cover shadow-soft`}
        />
        {uploading && (
          <div className={`absolute inset-0 ${overlaySizeClasses[size]} rounded-full bg-black/40 flex items-center justify-center`}>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          </div>
        )}
        {editable && !uploading && (
          <div
            className={`absolute inset-0 ${overlaySizeClasses[size]} rounded-full
              bg-black/0 group-hover:bg-black/30
              flex items-center justify-center
              transition-all duration-200 cursor-pointer`}
          >
            <Camera
              className={`${cameraSizeClasses[size]} text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative group" onClick={editable ? onPhotoClick : onClick}>
      <div
        className={`${baseClasses} ${sizeClass} bg-gradient-to-br from-warm-200 to-warm-300 dark:from-warm-800 dark:to-warm-700 text-warm-600 dark:text-warm-300 shadow-soft overflow-hidden`}
      >
        <User className="w-1/2 h-1/2" />
      </div>
      {uploading && (
        <div className={`absolute inset-0 ${overlaySizeClasses[size]} rounded-full bg-black/40 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
        </div>
      )}
      {editable && !uploading && (
        <div
          className={`absolute inset-0 ${overlaySizeClasses[size]} rounded-full
            bg-black/0 group-hover:bg-black/30
            flex items-center justify-center
            transition-all duration-200 cursor-pointer`}
        >
          <Camera
            className={`${cameraSizeClasses[size]} text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
          />
        </div>
      )}
    </div>
  );
}
