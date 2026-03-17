'use client';

import { cn } from '@/lib/utils';

interface BehavioralBadgeProps {
  points: number;
  className?: string;
  onClick?: () => void;
}

/**
 * Badge que muestra el puntaje conductual con colores dinámicos.
 * Valor 0: Gris.
 * +1, +2: Verde Claro.
 * +3 a +5: Verde Intenso.
 * -1, -2: Rojo Claro.
 * -3 a -5: Rojo Intenso.
 */
export function BehavioralBadge({ points, className, onClick }: BehavioralBadgeProps) {
  const getStyles = (val: number) => {
    if (val === 0) {
      return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
    
    if (val > 0) {
      if (val <= 2) {
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      }
      return 'bg-green-600 dark:bg-green-600/90 text-white border-green-500';
    }
    
    if (val < 0) {
      if (val >= -2) {
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      }
      return 'bg-red-600 dark:bg-red-600/90 text-white border-red-500';
    }
    
    return '';
  };

  const formattedValue = points > 0 ? `+${points}` : points.toString();

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all active:scale-95',
        getStyles(points),
        className
      )}
    >
      {formattedValue}
    </button>
  );
}
