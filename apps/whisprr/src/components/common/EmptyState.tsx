import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconClassName?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconClassName = 'text-primary-500',
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-3xl bg-white/60 dark:bg-warm-900/40 backdrop-blur-xl border border-warm-200/50 dark:border-warm-800/60 shadow-soft"
    >
      <div
        className={`w-14 h-14 mb-4 rounded-2xl bg-gradient-to-tr from-warm-100 to-white dark:from-warm-850 dark:to-warm-800 border border-warm-200/60 dark:border-warm-750/70 shadow-sm flex items-center justify-center ${iconClassName}`}
      >
        <Icon size={26} strokeWidth={1.75} />
      </div>

      <h3 className="text-lg font-bold tracking-tight text-warm-900 dark:text-warm-50 mb-1.5">
        {title}
      </h3>

      <p className="text-xs text-warm-500 dark:text-warm-400 mb-6 max-w-sm leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <Button onClick={onAction} size="md">
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 text-xs font-semibold text-warm-700 dark:text-warm-300 hover:text-warm-900 dark:hover:text-white hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl transition-all"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
