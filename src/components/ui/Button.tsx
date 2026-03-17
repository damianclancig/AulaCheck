import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gradient' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-50 text-primary-900 border border-primary-100 hover:bg-primary-100 dark:bg-accent-500 dark:text-primary-900 dark:hover:bg-accent-300 shadow-sm',
      gradient: 'bg-gradient-primary hover:opacity-90 shadow-sm border border-transparent text-white',
      secondary: 'bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--border)] border border-transparent',
      ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-primary-50 hover:text-primary-900',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm border border-transparent',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
