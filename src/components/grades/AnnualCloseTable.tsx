'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useGradeSheet } from '@/hooks/useGradeSheet';
import { StatusBadge } from './StatusBadge';
import { OverrideMenu } from './OverrideMenu';
import { useModal } from '@/hooks/useModal';
import type { BadgeType } from './StatusBadge';
import { Card } from '@/components/ui/Card';

interface AnnualCloseTableProps {
  year: number;
}

export function AnnualCloseTable({ year }: AnnualCloseTableProps) {
  const t = useTranslations('grades.sheet');
  const tCommon = useTranslations('common');
  const { showAlert } = useModal();

  const { isLoading, error, annualData, overrideStatus } = useGradeSheet('annual', year);

  const handleOverride = async (studentId: string, value: string | null) => {
    try {
      await overrideStatus(studentId, { annualForcedCondition: value });
    } catch {
      await showAlert({
        title: tCommon('error'),
        description: t('alerts.overrideError'),
        variant: 'danger',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500 dark:text-red-400">{t('error')}</div>
    );
  }

  const rows = annualData?.rows ?? [];

  return (
    <div className="space-y-4">
      {/* ──── Vista desktop: tabla ──── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[180px]">
                {t('student')}
              </th>
              <th className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                {t('semester1Short')}
              </th>
              <th className="px-3 py-3 border-b border-r-2 border-gray-200 border-r-gray-200 dark:border-gray-700 dark:border-r-gray-700/50 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                {t('semStatus1')}
              </th>
              <th className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                {t('semester2Short')}
              </th>
              <th className="px-3 py-3 border-b border-r-2 border-gray-200 border-r-gray-200 dark:border-gray-700 dark:border-r-gray-700/50 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                {t('semStatus2')}
              </th>
              <th className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-700 dark:text-gray-300 bg-indigo-50 dark:bg-indigo-900/20">
                {t('finalAverage')}
              </th>
              <th className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                {t('annualAttendance')}
              </th>
              <th className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-700 dark:text-gray-300 bg-indigo-50 dark:bg-indigo-900/20">
                {t('finalCondition')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 dark:text-gray-500">
                  {t('noStudents')}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const effectiveCondition = (row.forcedCondition || row.calculatedCondition) as BadgeType;

                return (
                  <tr
                    key={row.studentId}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                      idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {row.lastName}, {row.firstName}
                    </td>
                    {/* Promedio C1 */}
                    <td className="px-3 py-3 text-center">
                      {row.semester1Average !== null ? (
                        <span className={`font-semibold text-sm ${
                          row.semester1Average >= 7 ? 'text-green-600 dark:text-green-400'
                          : row.semester1Average >= 4 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                          {row.semester1Average.toFixed(2)}
                        </span>
                      ) : '—'}
                    </td>
                    {/* Estado C1 */}
                    <td className="px-3 py-3 text-center border-r-2 border-r-gray-100 dark:border-r-gray-800">
                      <StatusBadge status={row.semester1Status as BadgeType} />
                    </td>
                    {/* Promedio C2 */}
                    <td className="px-3 py-3 text-center">
                      {row.semester2Average !== null ? (
                        <span className={`font-semibold text-sm ${
                          row.semester2Average >= 7 ? 'text-green-600 dark:text-green-400'
                          : row.semester2Average >= 4 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                          {row.semester2Average.toFixed(2)}
                        </span>
                      ) : '—'}
                    </td>
                    {/* Estado C2 */}
                    <td className="px-3 py-3 text-center border-r-2 border-r-gray-100 dark:border-r-gray-800">
                      <StatusBadge status={row.semester2Status as BadgeType} />
                    </td>
                    {/* Promedio Final */}
                    <td className="px-3 py-3 text-center bg-indigo-50/50 dark:bg-indigo-900/10">
                      {row.finalAverage !== null ? (
                        <span className={`font-bold text-base ${
                          row.finalAverage >= 7 ? 'text-emerald-600 dark:text-emerald-400'
                          : row.finalAverage >= 4 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                          {row.finalAverage.toFixed(2)}
                        </span>
                      ) : '—'}
                    </td>
                    {/* Asistencia anual */}
                    <td className="px-3 py-3 text-center text-xs">
                      <span className={row.annualAttendancePercent < 60 ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                        {row.annualAttendancePercent.toFixed(0)}%
                      </span>
                    </td>
                    {/* Condición final (con override) */}
                    <td className="px-3 py-3 text-center bg-indigo-50/50 dark:bg-indigo-900/10">
                      <OverrideMenu
                        target="annual"
                        currentStatus={effectiveCondition}
                        isManual={row.isManual}
                        onSelect={(val) => handleOverride(row.studentId, val)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ──── Vista mobile: cards ──── */}
      <div className="md:hidden space-y-3">
        {rows.map((row) => {
          const effectiveCondition = (row.forcedCondition || row.calculatedCondition) as BadgeType;
          return (
            <Card
              key={row.studentId}
              variant="interactive"
              className="p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {row.lastName}, {row.firstName}
                </p>
                <OverrideMenu
                  target="annual"
                  currentStatus={effectiveCondition}
                  isManual={row.isManual}
                  onSelect={(val) => handleOverride(row.studentId, val)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex flex-col items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-500 mb-1">{t('semester1Short')}</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {row.semester1Average?.toFixed(2) ?? '—'}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={row.semester1Status as BadgeType} size="sm" />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex flex-col items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-500 mb-1">{t('semester2Short')}</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {row.semester2Average?.toFixed(2) ?? '—'}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={row.semester2Status as BadgeType} size="sm" />
                  </div>
                </div>
                <Card variant="highlight" className="p-2 flex flex-col items-center justify-center rounded-lg shadow-none">
                  <p className="text-white/80 mb-1">{t('finalAverage')}</p>
                  <p className="font-bold text-base text-white">
                    {row.finalAverage?.toFixed(2) ?? '—'}
                  </p>
                </Card>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {t('annualAttendance')}: <span className={row.annualAttendancePercent < 60 ? 'text-red-500 font-semibold' : ''}>{row.annualAttendancePercent.toFixed(0)}%</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
