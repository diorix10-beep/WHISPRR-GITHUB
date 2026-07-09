import type { ReactNode } from 'react';

type BadgeSize = 'sm' | 'md';

interface MoodBadgeProps {
  mood: string;
  size?: BadgeSize;
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-1.5 text-sm',
};

export function MoodBadge({ mood, size = 'md' }: MoodBadgeProps): ReactNode {
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex rounded-full font-serif font-semibold
        bg-gradient-to-r from-primary-200 to-accent-200
        text-primary-700
        dark:from-primary-600 dark:to-accent-600
        dark:text-warm-50
        ${sizeClass}
      `}
    >
      {mood}
    </span>
  );
}
