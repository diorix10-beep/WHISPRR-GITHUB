import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 border border-transparent shadow-sm',
    secondary: 'bg-warm-100 text-warm-900 hover:bg-warm-200 dark:bg-warm-800 dark:text-white dark:hover:bg-warm-700 focus-visible:ring-warm-500 border border-transparent',
    outline: 'bg-transparent text-warm-700 dark:text-warm-300 border border-warm-200 dark:border-warm-700 hover:border-primary-500 hover:text-primary-500 focus-visible:ring-primary-500',
    ghost: 'bg-transparent text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 focus-visible:ring-warm-500 border border-transparent',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 border border-transparent shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const finalDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={finalDisabled}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : 18} />}
      {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}
