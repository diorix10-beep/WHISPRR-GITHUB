import { Sparkles, Plus } from 'lucide-react';

interface RichEmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  categories?: string[];
  onSelectCategory?: (category: string) => void;
  accentColor?: 'red' | 'purple';
}

const DEFAULT_CATEGORIES = [
  'Fantasy', 'Sci-Fi', 'Cyberpunk', 'Slice of Life',
  'Mystery', 'Romance', 'Historical', 'Supernatural'
];

export function RichEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  categories = DEFAULT_CATEGORIES,
  onSelectCategory,
  accentColor = 'red',
}: RichEmptyStateProps) {
  const isPurple = accentColor === 'purple';
  const gradientFrom = isPurple ? 'from-purple-500' : 'from-red-500';
  const gradientTo = isPurple ? 'to-indigo-400' : 'to-rose-400';
  const iconBg = isPurple
    ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20'
    : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20';
  const iconColor = isPurple ? 'text-purple-400' : 'text-red-400';
  const pillHover = isPurple
    ? 'hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-500/30'
    : 'hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30';
  const btnGradient = isPurple
    ? 'from-purple-600 to-indigo-500 shadow-purple-500/25 hover:shadow-purple-500/35'
    : 'from-red-600 to-rose-500 shadow-red-500/25 hover:shadow-red-500/35';

  return (
    <div className="rounded-3xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-900 p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-7 animate-fade-in">

      {/* Icon with glow ring */}
      <div className="flex justify-center">
        <div className={`relative w-16 h-16 rounded-3xl flex items-center justify-center border shadow-inner ${iconBg}`}>
          {Icon && <Icon size={30} className={iconColor} />}
          {/* Ambient ring */}
          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />
        </div>
      </div>

      {/* Text */}
      <div className="space-y-2.5 max-w-md mx-auto">
        <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-warm-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-warm-500 dark:text-warm-400 leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {/* CTA Button */}
      {actionLabel && onAction && (
        <div>
          <button
            onClick={onAction}
            className={`inline-flex items-center gap-2 px-6 py-3 text-white rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isPurple ? 'focus-visible:ring-purple-500' : 'focus-visible:ring-red-500'} bg-gradient-to-r ${btnGradient}`}
          >
            <Plus size={17} />
            {actionLabel}
          </button>
        </div>
      )}

      {/* Category Suggestions */}
      <div className="pt-4 border-t border-warm-50 dark:border-warm-800/80 space-y-3">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-warm-400 dark:text-warm-500 uppercase tracking-widest">
          <Sparkles size={12} className={isPurple ? 'text-purple-400' : 'text-red-400'} />
          <span>{isPurple ? 'Explore Literary Genres' : 'Explore Popular Topics'}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory?.(cat)}
              className={`px-3.5 py-1.5 bg-warm-50 dark:bg-warm-800 text-warm-600 dark:text-warm-400 rounded-full text-xs font-semibold border border-warm-100 dark:border-warm-750 transition-all active:scale-95 ${pillHover}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
