import React from 'react';

// Assuming you have standard UI components or use specific libraries in WHISPRR.
// For now, I'ar update using simple HTML title as a fallback if no specific Tooltip exists.
// Replace with the actual Tooltip component if one exists in your codebase.

type BadgeType = 'founder' | 'verified' | 'admin';

interface UserBadgesProps {
  badges: BadgeType[];
}

export const UserBadges: React.FC<UserBadgesProps> = ({ badges }) => {
  const badgeStyles: Record<BadgeType, { text: string; classes: string; tooltip: string }> = {
    founder: { 
        text: 'Founder', 
        classes: 'bg-amber-500 text-white font-bold', 
        tooltip: 'The visionary who started it all!' 
    },
    verified: { 
        text: '✓', 
        classes: 'bg-sky-500 text-white', 
        tooltip: 'Account verified for authenticity.' 
    },
    admin: { 
        text: 'Admin', 
        classes: 'bg-slate-700 text-white', 
        tooltip: 'Community administrator.' 
    },
  };

  return (
    <div className="flex gap-2">
      {badges.map((badge) => {
        const style = badgeStyles[badge];
        if (!style) return null;

        return (
          <span
            key={badge}
            title={style.tooltip} // Using HTML title attribute for basic hover text
            className={`flex items-center justify-center rounded-full px-3 py-1 text-xs ${style.classes}`}
          >
            {style.text}
          </span>
        );
      })}
    </div>
  );
};
