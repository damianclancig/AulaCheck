'use client';

import { useTranslations } from 'next-intl';
import type { PeriodType } from '@/hooks/useGradeSheet';

interface PeriodTabsProps {
  selected: PeriodType;
  onChange: (period: PeriodType) => void;
  year: number;
  onYearChange: (year: number) => void;
}

export function PeriodTabs({ selected, onChange, year, onYearChange }: PeriodTabsProps) {
  const t = useTranslations('grades.sheet');

  const tabs: { id: PeriodType; label: string }[] = [
    { id: 1, label: t('firstSemester') },
    { id: 2, label: t('secondSemester') },
    { id: 'annual', label: t('annualClose') },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Tabs de periodo */}
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none ${
              selected === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selector de año */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onYearChange(year - 1)}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Año anterior"
        >
          ◀
        </button>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[4rem] text-center">
          {year}
        </span>
        <button
          onClick={() => onYearChange(year + 1)}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Año siguiente"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
