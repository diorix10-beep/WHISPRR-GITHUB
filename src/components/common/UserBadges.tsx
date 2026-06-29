import { useState } from 'react';
import type { BadgeType } from '../../types';

interface BadgeConfig {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  className: string;
}

const BADGE_CONFIG: Record<BadgeType, BadgeConfig> = {
  founder: {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
        <path d="M8 1L10 5L14 5.5L11 8.5L12 13L8 11L4 13L5 8.5L2 5.5L6 5L8 1Z" fill="currentColor" />
        <path d="M4.5 2L5.5 4L3 4.5L4.5 6L4 8L5.5 7L6 5L4.5 2Z" fill="currentColor" opacity="0.6" />
        <path d="M11.5 2L10.5 4L13 4.5L11.5 6L12 8L10.5 7L10 5L11.5 2Z" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    label: 'Founder',
    tooltip: 'Creator of WHISPRR',
    className: 'text-amber-500',
  },
  verified: {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
        <path d="M8 1L9.5 3.5L12.5 2.5L12 5.5L15 7L12.5 9L13.5 12L10.5 11.5L9 14L8 11.5L7 14L5.5 11.5L2.5 12L3.5 9L1 7L4 5.5L3.5 2.5L6.5 3.5L8 1Z" fill="currentColor" />
        <path d="M6 8L7.5 9.5L10.5 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Verified',
    tooltip: 'Verified account',
    className: 'text-blue-500',
  },
};

interface UserBadgesProps {
  badges?: BadgeType[];
  size?: 'sm' | 'md' | 'lg';
}

export function UserBadges({ badges, size = 'sm' }: UserBadgesProps) {
  if (!badges || badges.length === 0) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {badges.map(badge => (
        <BadgeIcon key={badge} type={badge} sizeClass={sizeClasses[size]} />
      ))}
    </span>
  );
}

function BadgeIcon({ type, sizeClass }: { type: BadgeType; sizeClass: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = BADGE_CONFIG[type];

  return (
    <span
      className={`relative inline-flex items-center ${config.className} cursor-help`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setTimeout(() => setShowTooltip(false), 2000)}
      role="img"
      aria-label={config.tooltip}
    >
      <span className={`${sizeClass} inline-block`}>
        {config.icon}
      </span>

      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 text-xs font-medium text-white bg-warm-900 dark:bg-warm-700 rounded-lg whitespace-nowrap shadow-lg z-50 pointer-events-none animate-in fade-in duration-150">
          {config.tooltip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-warm-900 dark:border-t-warm-700" />
        </span>
      )}
    </span>
  );
}
