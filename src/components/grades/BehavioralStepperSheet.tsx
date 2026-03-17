'use client';

import { useState, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BehavioralBadge } from './BehavioralBadge';
import { cn } from '@/lib/utils';

interface BehavioralStepperSheetProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  initialPoints: number;
  onUpdate: (points: number) => void;
}

/**
 * Componente que se muestra como Bottom Sheet en móvil y Modal en desktop.
 * Permite ajustar el puntaje conductual de un alumno.
 */
export function BehavioralStepperSheet({
  isOpen,
  onClose,
  studentName,
  initialPoints,
  onUpdate,
}: BehavioralStepperSheetProps) {
  const t = useTranslations('grades.behavior');
  const tCommon = useTranslations('common');
  const [points, setPoints] = useState(initialPoints);

  // Sincronizar el estado local cuando cambia initialPoints (ej: al abrir para otro alumno)
  useEffect(() => {
    if (isOpen) {
      setPoints(initialPoints);
    }
  }, [isOpen, initialPoints]);

  if (!isOpen) return null;

  const handleIncrement = () => {
    if (points < 5) {
      const newVal = points + 1;
      setPoints(newVal);
      onUpdate(newVal);
    }
  };

  const handleDecrement = () => {
    if (points > -5) {
      const newVal = points - 1;
      setPoints(newVal);
      onUpdate(newVal);
    }
  };

  const getValueColor = (val: number) => {
    if (val === 0) return 'text-gray-400 dark:text-gray-600';
    if (val > 0) {
      if (val <= 2) return 'text-green-800 dark:text-green-300'; // Verde más profundo/oscuro
      return 'text-green-500 dark:text-green-400'; // Verde más vibrante/intenso
    }
    if (val < 0) {
      if (val >= -2) return 'text-red-800 dark:text-red-300'; // Rojo más profundo/oscuro
      return 'text-red-500 dark:text-red-400'; // Rojo más vibrante/intenso
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Sheet / Modal Content */}
      <div 
        className={cn(
          "relative w-full bg-white dark:bg-gray-900 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300",
          "rounded-t-3xl md:rounded-2xl md:max-w-sm md:m-4"
        )}
      >
        {/* Handle for mobile */}
        <div className="md:hidden flex justify-center py-3">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>

        <div className="px-6 pb-10 pt-4 md:pt-6 md:pb-8 text-center space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {studentName}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('description')}
          </p>

          {/* Stepper Control */}
          <div className="flex items-center justify-center gap-8 py-4">
            <button
              onClick={handleDecrement}
              disabled={points <= -5}
              className={cn(
                "w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all active:scale-90",
                points <= -5 
                  ? "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed" 
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-red-500 hover:text-red-500"
              )}
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center gap-2">
              <span className={cn(
                "text-6xl font-black min-w-[3.5rem] tabular-nums transition-colors duration-300",
                getValueColor(points)
              )}>
                {points > 0 ? `+${points}` : points}
              </span>
            </div>

            <button
              onClick={handleIncrement}
              disabled={points >= 5}
              className={cn(
                "w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all active:scale-90",
                points >= 5 
                  ? "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed" 
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-green-500 hover:text-green-500"
              )}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            {tCommon('done')}
          </button>
        </div>
      </div>
    </div>
  );
}
