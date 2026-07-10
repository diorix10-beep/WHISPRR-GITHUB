import React from 'react';
import { Button } from './Button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconClassName = 'text-primary-500',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl bg-warm-50/50 dark:bg-warm-950/50 border border-warm-100 dark:border-warm-800">
      <div className={`w-16 h-16 mb-6 rounded-full bg-white dark:bg-warm-900 shadow-sm flex items-center justify-center ${iconClassName}`}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-warm-900 dark:text-white mb-2">{title}</h3>
      <p className="text-warm-600 dark:text-warm-400 mb-8 max-w-md">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
