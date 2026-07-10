import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const icons = {
    success: <CheckCircle size={18} className="text-success-500 flex-shrink-0" />,
    error: <AlertCircle size={18} className="text-error-500 flex-shrink-0" />,
    info: <Info size={18} className="text-primary-500 flex-shrink-0" />,
  };

  const bgColors = {
    success: 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-700',
    error: 'bg-error-50 dark:bg-error-900/30 border-error-200 dark:border-error-700',
    info: 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-float
              animate-[slideIn_0.3s_ease] ${bgColors[toast.type]}`}
          >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium text-warm-900 dark:text-warm-100">
              {toast.message}
            </p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-warm-400 hover:text-warm-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
