import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'standard' | 'interactive' | 'highlight';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'standard', ...props }, ref) => {
    const variants = {
      standard: 'bg-[var(--bg-card)] border border-[var(--border)] shadow-sm',
      interactive: 'bg-[var(--bg-card)] border border-[var(--border)] shadow-sm hover:shadow-md hover:scale-[1.01] dark:hover:border-accent-500/40 transition-all cursor-pointer',
      highlight: 'bg-gradient-soft border border-[var(--border)] shadow-sm',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
