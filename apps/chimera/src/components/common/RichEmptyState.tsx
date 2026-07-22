import { Sparkles, Compass, Plus, Search, Layers, BookOpen, Bot } from 'lucide-react';

interface RichEmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  categories?: string[];
  onSelectCategory?: (category: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Fantasy',
  'Sci-Fi',
  'Cyberpunk',
  'Slice of Life',
  'Mystery',
  'Romance',
  'Historical',
  'Supernatural'
];

export function RichEmptyState({
  icon: Icon = Compass,
  title,
  description,
  actionLabel,
  onAction,
  categories = DEFAULT_CATEGORIES,
  onSelectCategory,
}: RichEmptyStateProps) {
  return (
    <div className="bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-6 animate-fade-in">
      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
        <Icon size={32} />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-warm-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Primary Action CTA */}
      {actionLabel && onAction && (
        <div className="pt-1">
          <button
            onClick={onAction}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center gap-2 mx-auto"
          >
            <Plus size={18} />
            <span>{actionLabel}</span>
          </button>
        </div>
      )}

      {/* Popular Categories & Exploration Suggestions */}
      <div className="pt-6 border-t border-warm-100 dark:border-warm-800/80 space-y-3">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-warm-500 uppercase tracking-wider">
          <Sparkles size={14} className="text-red-500" />
          <span>Explore Popular Topics</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory?.(cat)}
              className="px-3.5 py-1.5 bg-warm-100 dark:bg-warm-800 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20 text-warm-700 dark:text-warm-300 rounded-full text-xs font-medium border border-warm-200 dark:border-warm-750 transition-all"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
