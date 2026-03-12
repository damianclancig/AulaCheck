'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

export type TrajectoryStatus = 'TEA' | 'TEP' | 'TED';
export type AnnualCondition = 'APPROVED' | 'DECEMBER' | 'FEBRUARY';
export type BadgeType = TrajectoryStatus | AnnualCondition;

interface StatusBadgeProps {
  status: BadgeType;
  isManual?: boolean;
  size?: 'sm' | 'md';
}

const statusStyles: Record<BadgeType, string> = {
  TEA: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  TEP: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  TED: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  APPROVED: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  DECEMBER: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  FEBRUARY: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
};

export const StatusBadge = memo(function StatusBadge({ status, isManual = false, size = 'sm' }: StatusBadgeProps) {
  const t = useTranslations('grades.sheet.status');

  const paddings = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${paddings} ${statusStyles[status]} transition-colors`}
      title={isManual ? 'Modificado manualmente' : undefined}
    >
      {t(status.toLowerCase() as Lowercase<BadgeType>)}
      {isManual && <span className="text-[10px]">✏️</span>}
    </span>
  );
});
