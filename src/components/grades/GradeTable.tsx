'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, Loader2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useModal } from '@/hooks/useModal';
import { useGradeSheet } from '@/hooks/useGradeSheet';
import type { PeriodType } from '@/hooks/useGradeSheet';
import { ActivityHeader } from './ActivityHeader';
import { GradeCell } from './GradeCell';
import { StatusBadge } from './StatusBadge';
import { OverrideMenu } from './OverrideMenu';
import { BehavioralBadge } from './BehavioralBadge';
import { BehavioralStepperSheet } from './BehavioralStepperSheet';
import { useLongPress } from '@/hooks/useLongPress';
import { calculateTrajectoryStatus } from '@/lib/calculations/trajectoryUtils';
import type { BadgeType } from './StatusBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StudentAvatar } from '../students/StudentAvatar';

interface GradeTableProps {
  period: 1 | 2;
  year: number;
}

export function GradeTable({ period, year }: GradeTableProps) {
  const t = useTranslations('grades.sheet');
  const tCommon = useTranslations('common');
  const { showAlert } = useModal();
  
  const [newActivityName, setNewActivityName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    isLoading,
    error,
    activities,
    rows,
    addActivity,
    renameActivity,
    removeActivity,
    updateScore,
    saveChanges,
    isSaving,
    pendingChanges,
    overrideStatus,
    getLocalAverage,
    hasEmptyActivity,
    updateBehavioralPoints,
  } = useGradeSheet(period as PeriodType, year);

  // Estado para el stepper conductual
  const [behavioralStudent, setBehavioralStudent] = useState<{ id: string, name: string, points: number } | null>(null);

  const { isPressing, ...longPressHandlers } = useLongPress((student: any) => {
    setBehavioralStudent({
      id: student.studentId,
      name: `${student.lastName}, ${student.firstName}`,
      points: student.behavioralPoints
    });
  });

  // Auto-colapsar texto después de 2 segundos cuando hay cambios pendientes
  useEffect(() => {
    if (pendingChanges && !isSaving && !showSuccess) {
      setIsExpanded(true);
      const timer = setTimeout(() => setIsExpanded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [pendingChanges, isSaving, showSuccess]);

  const handleAddActivity = async () => {
    const name = newActivityName.trim();
    if (!name) return;
    await addActivity(name);
    setNewActivityName('');
    setShowAddInput(false);
  };

  const handleSave = async () => {
    try {
      setIsExpanded(true); // Asegurar que se vea el texto al guardar
      await saveChanges();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      await showAlert({
        title: tCommon('error'),
        description: t('alerts.saveError'),
        variant: 'danger',
      });
    }
  };

  const handleOverride = async (studentId: string, value: string | null) => {
    const overrideKey = period === 1 ? 'semester1Override' : 'semester2Override';
    try {
      await overrideStatus(studentId, { [overrideKey]: value });
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
      <div className="text-center py-12 text-red-500 dark:text-red-400">
        {t('error')}
      </div>
    );
  }

  // ─── Vista mobile: cards por alumno ────────────────────────────────────────
  const mobileView = (
    <div className="md:hidden space-y-3 pb-24">
      {rows.length === 0 ? (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          {t('noStudents')}
        </p>
      ) : (
        rows.map((row) => {
          const avg = getLocalAverage(row.studentId);
          const empty = hasEmptyActivity(row.studentId);
          const allEmpty = activities.length > 0 && activities.every(a => row.scores[a.id] === null || row.scores[a.id] === undefined);
          const status = row.statusOverride || calculateTrajectoryStatus(
            avg, 
            row.absencePercent, 
            empty,
            allEmpty,
            row.attendancePercent,
            (row.attendancePresent + row.attendanceAbsent) > 0
          );

          return (
            <Card
              key={row.studentId}
              variant="interactive"
              className="p-2.5 space-y-3"
            >
              {/* Encabezado: Nombre + Puntos (Consistencia con Asistencia) */}
              <div className="bg-gray-50 dark:bg-gray-800 -mx-2.5 -mt-2.5 px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl flex items-center gap-3">
                <StudentAvatar firstName={row.firstName} lastName={row.lastName} />
                <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {row.lastName}, {row.firstName}
                </h4>
                <div className="flex-shrink-0 scale-90 origin-left">
                  <BehavioralBadge 
                    points={row.behavioralPoints} 
                    onClick={() => setBehavioralStudent({
                      id: row.studentId,
                      name: `${row.lastName}, ${row.firstName}`,
                      points: row.behavioralPoints
                    })}
                  />
                </div>
              </div>

              {/* Fila 1: Asistencia (Izq) y Promedio/Trayectoria (Der) */}
              <div className="flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/30 p-2 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                    {t('attendance')}
                  </p>
                  <p className="text-xs font-semibold">
                    <span className={row.absencePercent > 30 ? 'text-red-500' : 'text-green-500'}>
                      {row.attendancePercent.toFixed(0)}%
                    </span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-red-500">{row.absencePercent.toFixed(0)}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                      {t('average')}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {avg !== null && (
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {avg.toFixed(1)}
                        </span>
                      )}
                      <OverrideMenu
                        target={period === 1 ? 'semester1' : 'semester2'}
                        currentStatus={status}
                        isManual={!!row.statusOverride}
                        onSelect={(val) => handleOverride(row.studentId, val)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actividades: 3 columnas */}
              {activities.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {activities.map((act) => (
                    <div key={act.id} className="space-y-1">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate px-0.5">
                        {act.name}
                      </p>
                      <GradeCell
                        id={`grade-${row.studentId}-${act.id}`}
                        value={row.scores[act.id] ?? null}
                        onChange={(score) => updateScore(row.studentId, act.id, score)}
                        onNext={() => {
                          const currentIndex = rows.findIndex(r => r.studentId === row.studentId);
                          if (currentIndex < rows.length - 1) {
                            const nextStudent = rows[currentIndex + 1];
                            const nextInput = document.getElementById(`grade-${nextStudent.studentId}-${act.id}`) as HTMLElement;
                            if (nextInput) {
                              nextInput.click();
                            }
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );

  // ─── Vista desktop: tabla ──────────────────────────────────────────────────
  const desktopView = (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 pb-16">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            {/* Columna fija: nombre */}
            <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800/50 text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 min-w-[180px]">
              {t('student')}
            </th>
            {/* Columnas de actividades */}
            {activities.map((act) => (
              <th
                key={act.id}
                className="px-2 py-3 border-b border-gray-200 dark:border-gray-700 min-w-[90px]"
              >
                <ActivityHeader
                  activity={act}
                  onRename={renameActivity}
                  onRemove={removeActivity}
                />
              </th>
            ))}
            {/* Botón + agregar actividad */}
            <th className="px-2 py-3 border-b border-gray-200 dark:border-gray-700 min-w-[80px]">
              {showAddInput ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddActivity();
                      if (e.key === 'Escape') setShowAddInput(false);
                    }}
                    placeholder="Nombre"
                    className="w-full text-xs px-1 py-0.5 border border-indigo-400 rounded outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    maxLength={30}
                  />
                  <button onClick={handleAddActivity} className="text-green-500 flex-shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddInput(true)}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('addActivity')}
                </button>
              )}
            </th>
            {/* Columnas de resultado */}
            <th className="px-3 py-3 border-b border-l border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-700 dark:text-gray-300 min-w-[80px] bg-gray-100 dark:bg-gray-800">
              {t('average')}
            </th>
            <th className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-700 dark:text-gray-300 min-w-[90px] bg-gray-100 dark:bg-gray-800">
              {t('attendanceHeader')}
            </th>
            <th className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-700 dark:text-gray-300 min-w-[80px] bg-gray-100 dark:bg-gray-800">
              {t('statusHeader')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={activities.length + 4}
                className="text-center py-12 text-gray-400 dark:text-gray-500"
              >
                {t('noStudents')}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const avg = getLocalAverage(row.studentId);
              const empty = hasEmptyActivity(row.studentId);
              const allEmpty = activities.length > 0 && activities.every(a => row.scores[a.id] === null || row.scores[a.id] === undefined);
              const calcStatus = calculateTrajectoryStatus(
                avg, 
                row.absencePercent, 
                empty,
                allEmpty,
                row.attendancePercent,
                (row.attendancePresent + row.attendanceAbsent) > 0
              );
              const effectiveStatus = (row.statusOverride || calcStatus) as BadgeType;

              return (
                <tr
                  key={row.studentId}
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                    idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'
                  }`}
                >
                  {/* Nombre (columna fija) */}
                  <td 
                    className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-4 py-2 font-medium text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-800 cursor-context-menu"
                    {...longPressHandlers}
                    onMouseDown={() => longPressHandlers.onMouseDown(row)}
                    onTouchStart={() => longPressHandlers.onTouchStart(row)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <StudentAvatar firstName={row.firstName} lastName={row.lastName} />
                        <span className="text-base font-medium">{row.lastName}, {row.firstName}</span>
                      </div>
                      <BehavioralBadge 
                        points={row.behavioralPoints} 
                        onClick={() => setBehavioralStudent({
                          id: row.studentId,
                          name: `${row.lastName}, ${row.firstName}`,
                          points: row.behavioralPoints
                        })}
                      />
                    </div>
                  </td>
                  {/* Celdas de notas */}
                  {activities.map((act) => (
                    <td key={act.id} className="px-1.5 py-1.5">
                      <GradeCell
                        id={`grade-desktop-${row.studentId}-${act.id}`}
                        value={row.scores[act.id] ?? null}
                        onChange={(score) => updateScore(row.studentId, act.id, score)}
                        onNext={() => {
                          const currentIndex = rows.findIndex(r => r.studentId === row.studentId);
                          if (currentIndex < rows.length - 1) {
                            const nextStudent = rows[currentIndex + 1];
                            const nextInput = document.getElementById(`grade-desktop-${nextStudent.studentId}-${act.id}`) as HTMLElement;
                            if (nextInput) {
                              nextInput.click();
                            }
                          }
                        }}
                      />
                    </td>
                  ))}
                  {/* Celda vacía bajo el + */}
                  <td />
                  {/* Promedio */}
                  <td className="px-3 py-2 text-center bg-gray-50 dark:bg-gray-800/30 border-l border-gray-100 dark:border-gray-800">
                    {avg !== null ? (
                      <span
                        className={`font-bold text-sm ${
                          avg >= 7
                            ? 'text-green-600 dark:text-green-400'
                            : avg >= 4
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {avg.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">-</span>
                    )}
                  </td>
                  {/* Asistencia */}
                  <td className="px-3 py-2 text-center bg-gray-50 dark:bg-gray-800/30 text-xs whitespace-nowrap">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {row.attendancePercent.toFixed(0)}%
                    </span>
                    {' / '}
                    <span className="text-red-500 dark:text-red-400 font-medium">
                      {row.absencePercent.toFixed(0)}%
                    </span>
                  </td>
                  {/* Informe / Estado */}
                  <td className="px-3 py-2 text-center bg-gray-50 dark:bg-gray-800/30">
                    <OverrideMenu
                      target={period === 1 ? 'semester1' : 'semester2'}
                      currentStatus={effectiveStatus}
                      isManual={!!row.statusOverride}
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
  );

  return (
    <div className="p-0 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
      {/* Barra de acciones (sólo para agregar actividad en móvil) */}
      <div className="md:hidden">
        {showAddInput ? (
          <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
            <input
              autoFocus
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddActivity();
                if (e.key === 'Escape') setShowAddInput(false);
              }}
              placeholder={t('activityNamePlaceholder')}
              className="flex-1 px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-900/50 rounded-xl outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <button
              onClick={handleAddActivity}
              className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddInput(false)}
              className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setShowAddInput(true)}
            className="w-full"
          >
            <Plus className="w-5 h-5 mr-1" />
            {t('addActivity')}
          </Button>
        )}
      </div>

      {mobileView}
      {desktopView}

      {/* Floating Save Button */}
      {(pendingChanges || showSuccess) && (
        <div className="fixed bottom-8 right-8 z-[60] flex items-center justify-end animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out">
          <button
            onClick={handleSave}
            disabled={(!pendingChanges && !showSuccess) || isSaving}
            onMouseEnter={() => !isSaving && !showSuccess && setIsExpanded(true)}
            onMouseLeave={() => !isSaving && !showSuccess && setIsExpanded(false)}
            className={`
              flex items-center gap-3 px-4 py-3.5 rounded-full shadow-2xl transition-all duration-700 overflow-hidden group
              ${showSuccess 
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20' 
                : isExpanded || isSaving
                  ? 'bg-indigo-600 text-white shadow-indigo-500/50' 
                  : 'bg-indigo-600 text-white shadow-indigo-500/30'
              }
              ${isSaving ? 'cursor-not-allowed opacity-90' : 'hover:scale-110 active:scale-95'}
            `}
            style={{ 
              maxWidth: isExpanded || isSaving || showSuccess ? '220px' : '58px',
              minWidth: isExpanded || isSaving || showSuccess ? '140px' : '58px',
            }}
          >
            <div className={`flex-shrink-0 transition-transform duration-500 ${!isExpanded && !isSaving && !showSuccess ? 'mx-auto' : ''}`}>
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : showSuccess ? (
                <Check className="w-6 h-6" />
              ) : (
                <Save className="w-6 h-6" />
              )}
            </div>
            
            {(isExpanded || isSaving || showSuccess) && (
              <span className="whitespace-nowrap font-bold text-sm tracking-tight animate-in fade-in slide-in-from-left-4 duration-500">
                {isSaving ? t('saving') : 
                 showSuccess ? t('savedShort') :
                 t('save')}
              </span>
            )}
            
            {pendingChanges && !isSaving && !showSuccess && (
              <span className="absolute top-2.5 right-2.5 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-indigo-600 animate-pulse shadow-sm" />
            )}
          </button>
        </div>
      )}

      {/* Behavioral Stepper Sheet */}
      <BehavioralStepperSheet
        isOpen={!!behavioralStudent}
        onClose={() => setBehavioralStudent(null)}
        studentName={behavioralStudent?.name || ''}
        initialPoints={behavioralStudent?.points || 0}
        onUpdate={(points) => {
          if (behavioralStudent) {
            updateBehavioralPoints(behavioralStudent.id, points);
            // Actualizar estado local para que el stepper refleje el cambio si sigue abierto
            setBehavioralStudent({ ...behavioralStudent, points });
          }
        }}
      />
    </div>
  );
}
