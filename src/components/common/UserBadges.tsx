import { useState } from 'react';
import type { BadgeType } from '../../types';

interface BadgeConfig {
  icon: string;
  label: string;
  tooltip: string;
  className: string;
}

const BADGE_CONFIG: Record<BadgeType, BadgeConfig> = {
  founder: {
    icon: '👑',
    label: 'Founder',
    tooltip: 'The creator of WHISPRR.',
    className: 'text-amber-500',
  },
  admin: {
    icon: '🛡️',
    label: 'Admin',
    tooltip: 'Platform Administrator.',
    className: 'text-primary-500',
  },
  early_supporter: {
    icon: '🌱',
    label: 'Early Supporter',
    tooltip: 'One of the first members of WHISPRR who helped shape the platform before its public launch.',
    className: 'text-emerald-500',
  },
  community_creator: {
    icon: '🧩',
    label: 'Community Creator',
    tooltip: 'The creator of this community.',
    className: 'text-indigo-500',
  },
  community_moderator: {
    icon: '⭐',
    label: 'Moderator',
    tooltip: 'Helps maintain a safe and welcoming community.',
    className: 'text-amber-400',
  },
  verified: {
    icon: '✨',
    label: 'Verified',
    tooltip: 'Verified account',
    className: 'text-blue-500',
  },
  top_contributor: {
    icon: '🏆',
    label: 'Top Contributor',
    tooltip: 'Awarded for high-quality contributions and discussions.',
    className: 'text-yellow-500',
  },
  verified_org: {
    icon: '💜',
    label: 'Verified Organization',
    tooltip: 'Official verified organization.',
    className: 'text-purple-500',
  },
  verified_creator: {
    icon: '🎨',
    label: 'Verified Creator',
    tooltip: 'Verified artist or content creator.',
    className: 'text-pink-500',
  },
  ambassador: {
    icon: '🤝',
    label: 'Ambassador',
    tooltip: 'Official WHISPRR community ambassador.',
    className: 'text-teal-500',
  },
  beta_tester: {
    icon: '🧪',
    label: 'Beta Tester',
    tooltip: 'Helped test experimental features during early releases.',
    className: 'text-cyan-500',
  },
  event_host: {
    icon: '🎉',
    label: 'Event Host',
    tooltip: 'Hosts events and activities within the community.',
    className: 'text-orange-500',
  },
  community_champion: {
    icon: '🎖',
    label: 'Community Champion',
    tooltip: 'Recognized for exceptional help and friendliness.',
    className: 'text-rose-500',
  },
  mentor: {
    icon: '📚',
    label: 'Mentor',
    tooltip: 'Guides and helps new users onboard the platform.',
    className: 'text-lime-500',
  },
  translator: {
    icon: '🌍',
    label: 'Translator',
    tooltip: 'Helped localize WHISPRR into multiple languages.',
    className: 'text-blue-400',
  },
  volunteer: {
    icon: '❤️',
    label: 'Volunteer',
    tooltip: 'Contributed time to keep the platform clean and safe.',
    className: 'text-red-500',
  },
  featured_creator: {
    icon: '✨',
    label: 'Featured Creator',
    tooltip: 'Highlighted by the community for outstanding work.',
    className: 'text-yellow-400',
  },
};

interface UserBadgesProps {
  badges?: string[];
  role?: 'founder' | 'admin' | 'moderator' | 'user';
  size?: 'sm' | 'md' | 'lg';
  badgeDates?: Record<string, string>; // e.g. { 'founder': '2026-06-29T18:15:00Z' }
}

export function UserBadges({ badges = [], role, size = 'sm', badgeDates }: UserBadgesProps) {
  // Deduplicate and process badges
  const activeBadges = [...badges] as BadgeType[];

  // Automatically insert founder / admin badges based on profile role if not already present
  if (role === 'founder' && !activeBadges.includes('founder')) {
    activeBadges.unshift('founder');
  }
  if (role === 'admin' && !activeBadges.includes('admin')) {
    activeBadges.unshift('admin');
  }

  if (activeBadges.length === 0) return null;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <span className="inline-flex items-center gap-1 ml-1.5 align-middle select-none">
      {activeBadges.map((badge, idx) => {
        // Skip unknown badges
        if (!BADGE_CONFIG[badge]) return null;
        return (
          <BadgeIcon 
            key={`${badge}-${idx}`} 
            type={badge} 
            sizeClass={sizeClasses[size]} 
            earnedDate={badgeDates?.[badge]} 
          />
        );
      })}
    </span>
  );
}

function BadgeIcon({ type, sizeClass, earnedDate }: { type: BadgeType; sizeClass: string; earnedDate?: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = BADGE_CONFIG[type];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    } catch {
      return dateStr;
    }
  };

  return (
    <span
      className={`relative inline-flex items-center justify-center cursor-help transition-transform hover:scale-110 active:scale-95 ${sizeClass}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setTimeout(() => setShowTooltip(false), 2000)}
      role="img"
      aria-label={config.tooltip}
    >
      <span className="leading-none">
        {config.icon}
      </span>

      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-semibold text-white bg-warm-950 dark:bg-warm-800 border border-warm-800 dark:border-warm-700 rounded-xl whitespace-nowrap shadow-xl z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-150 flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 font-bold text-warm-100">
            {config.icon} {config.label}
          </span>
          <span className="text-[10px] text-warm-300 dark:text-warm-400 font-normal">
            {config.tooltip}
          </span>
          {earnedDate && (
            <span className="text-[9px] text-primary-400 dark:text-primary-300 font-semibold border-t border-warm-850 dark:border-warm-750 mt-1 pt-0.5 w-full text-center">
              Earned {formatDate(earnedDate)}
            </span>
          )}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-warm-950 dark:border-t-warm-800" />
        </span>
      )}
    </span>
  );
}
