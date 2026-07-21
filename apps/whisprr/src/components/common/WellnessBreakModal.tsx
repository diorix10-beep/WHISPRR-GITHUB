import { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';

interface WellnessBreakModalProps {
  isOpen: boolean;
  message: string;
  onDismiss: () => void;
  onTakeBreak: () => void;
}

export function WellnessBreakModal({ isOpen, message, onDismiss, onTakeBreak }: WellnessBreakModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div
      className={`fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-[9999] max-w-sm w-[calc(100%-2rem)] md:w-80
        transition-all duration-500 ease-spring
        ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
      `}
    >
      <div className="bg-white dark:bg-warm-850 rounded-2xl shadow-2xl border border-primary-100 dark:border-primary-900/30 overflow-hidden">
        
        {/* Soft header gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-400 via-accent-400 to-primary-500" />
        
        <div className="p-5 relative">
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1.5 text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-full transition-colors"
            aria-label="Dismiss wellness reminder"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-start gap-4 mb-4 mt-2">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
              <Heart size={20} className="animate-pulse-slow" fill="currentColor" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-warm-900 dark:text-warm-50 text-lg mb-1">
                Time for a breather
              </h3>
              <p className="text-sm text-warm-600 dark:text-warm-350 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={onTakeBreak}
              className="flex-1 py-2.5 px-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold rounded-xl text-sm hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
            >
              Take a Break
            </button>
            <button
              onClick={onDismiss}
              className="py-2.5 px-4 text-warm-500 dark:text-warm-400 font-medium text-sm hover:text-warm-700 dark:hover:text-warm-200 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
