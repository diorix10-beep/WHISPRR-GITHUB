import React from 'react';

export function WhisperSkeleton() {
  return (
    <div className="bg-white dark:bg-warm-850 p-4 sm:p-5 rounded-3xl border border-warm-100 dark:border-warm-800 shadow-soft animate-pulse">
      {/* Header section (Avatar + Username) */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar Skeleton */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warm-200 dark:bg-warm-700 flex-shrink-0" />
          
          <div className="space-y-2">
            {/* Display Name Skeleton */}
            <div className="h-4 w-32 bg-warm-200 dark:bg-warm-700 rounded-md" />
            {/* Username/Time Skeleton */}
            <div className="h-3 w-24 bg-warm-100 dark:bg-warm-800 rounded-md" />
          </div>
        </div>
        
        {/* Top right icon/button skeleton */}
        <div className="w-6 h-6 rounded-full bg-warm-100 dark:bg-warm-800 flex-shrink-0" />
      </div>

      {/* Content section */}
      <div className="space-y-3 mt-4 ml-13 sm:ml-15">
        <div className="h-4 w-full bg-warm-200 dark:bg-warm-700 rounded-md" />
        <div className="h-4 w-5/6 bg-warm-200 dark:bg-warm-700 rounded-md" />
        <div className="h-4 w-4/6 bg-warm-200 dark:bg-warm-700 rounded-md" />
        
        {/* Optional Media Skeleton */}
        <div className="h-40 w-full bg-warm-100 dark:bg-warm-800 rounded-2xl mt-4" />
      </div>

      {/* Footer / Actions section */}
      <div className="flex items-center gap-6 mt-5 ml-13 sm:ml-15 pt-3 border-t border-warm-100 dark:border-warm-800">
        <div className="w-12 h-6 bg-warm-200 dark:bg-warm-700 rounded-full" />
        <div className="w-12 h-6 bg-warm-200 dark:bg-warm-700 rounded-full" />
        <div className="w-12 h-6 bg-warm-200 dark:bg-warm-700 rounded-full" />
      </div>
    </div>
  );
}
