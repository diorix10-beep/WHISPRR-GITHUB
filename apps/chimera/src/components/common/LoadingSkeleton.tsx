import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export function LoadingSkeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-warm-200 dark:bg-warm-800';
  
  const variantClasses = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const styles: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : 'auto'),
    height: height || (variant === 'text' ? '1rem' : 'auto'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={styles}
      aria-hidden="true"
    />
  );
}

export function WhisperSkeleton() {
  return (
    <div className="bg-white dark:bg-warm-900 rounded-3xl p-5 mb-4 shadow-sm border border-warm-200 dark:border-warm-800">
      <div className="flex items-start gap-4">
        <LoadingSkeleton variant="circular" width={48} height={48} className="shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="flex items-center gap-2">
            <LoadingSkeleton variant="text" width={120} height={20} />
            <LoadingSkeleton variant="text" width={80} height={16} />
          </div>
          <LoadingSkeleton variant="text" height={16} />
          <LoadingSkeleton variant="text" height={16} width="80%" />
          <LoadingSkeleton variant="text" height={16} width="60%" />
          <div className="flex gap-4 pt-4">
            <LoadingSkeleton variant="rounded" width={60} height={32} />
            <LoadingSkeleton variant="rounded" width={60} height={32} />
          </div>
        </div>
      </div>
    </div>
  );
}
