import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'peach' | 'neutral' | 'outline';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-100 text-primary-800 dark:bg-accent-900/40 dark:text-accent-300',
      peach: 'bg-accent-100 text-accent-800 dark:bg-primary-900/40 dark:text-primary-300',
      neutral: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
      outline: 'bg-transparent border border-[var(--border)] text-[var(--text-secondary)]',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
