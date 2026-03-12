'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import type {
  GradeSheetData,
  GradeSheetActivity,
  GradeSheetStudentRow,
  AnnualConditionRow,
} from '@/types/models';

export type PeriodType = 1 | 2 | 'annual';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al cargar la planilla');
  return res.json();
};

/**
 * Hook encargado de toda la lógica del módulo de calificaciones dinámicas.
 * Gestiona: carga de datos, edición optimista de celdas, manejo de actividades
 * y overrides manuales del docente.
 */
export function useGradeSheet(period: PeriodType, year: number) {
  const params = useParams();
  const courseId = params.id as string;

  // Estado local de la planilla (para edición optimista)
  const [localActivities, setLocalActivities] = useState<GradeSheetActivity[] | null>(null);
  const [localScores, setLocalScores] = useState<
    Map<string, Record<string, number | null>>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);

  const apiUrl =
    period === 'annual'
      ? `/api/courses/${courseId}/grade-sheets?period=annual&year=${year}`
      : `/api/courses/${courseId}/grade-sheets?period=${period}&year=${year}`;

  const {
    data: serverData,
    error,
    isLoading,
    mutate,
  } = useSWR<GradeSheetData | { type: 'annual'; year: number; rows: AnnualConditionRow[] }>(
    courseId ? apiUrl : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        // Sincronizar estado local con datos del servidor sólo si no hay cambios pendientes
        if (!pendingChanges && 'activities' in data) {
          setLocalActivities(data.activities);
          const scoreMap = new Map<string, Record<string, number | null>>();
          data.rows.forEach((row) => {
            scoreMap.set(row.studentId, { ...row.scores });
          });
          setLocalScores(scoreMap);
        }
      },
    }
  );

  // Derived state: actividades y rows con scores locales
  const isAnnualView = period === 'annual';
  const sheetData = !isAnnualView && serverData && 'activities' in serverData
    ? serverData as GradeSheetData
    : null;

  const annualData = isAnnualView && serverData && 'rows' in serverData && 'type' in serverData
    ? serverData as { type: 'annual'; year: number; rows: AnnualConditionRow[] }
    : null;

  // Actividades actuales (local override > servidor)
  const activities = localActivities ?? sheetData?.activities ?? [];

  // Rows con scores locales aplicados (memorizado para evitar re-renders innecesarios)
  const rows: GradeSheetStudentRow[] = useMemo(() => {
    return (sheetData?.rows ?? []).map((row) => ({
      ...row,
      scores: localScores.get(row.studentId) ?? row.scores,
    }));
  }, [sheetData, localScores]);

  // ─── Acciones de Actividades ───────────────────────────────────────────────

  /** Agrega una nueva actividad a la planilla */
  const addActivity = useCallback(
    async (name: string) => {
      const newActivity: GradeSheetActivity = {
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        order: activities.length,
      };
      const newActivities = [...activities, newActivity];
      setLocalActivities(newActivities);

      // Inicializar scores de la nueva actividad en null para todos los alumnos
      setLocalScores((prev) => {
        const next = new Map(prev);
        for (const [studentId, scores] of next) {
          next.set(studentId, { ...scores, [newActivity.id]: null });
        }
        return next;
      });

      setPendingChanges(true);
      return newActivity;
    },
    [activities]
  );

  /** Renombra una actividad existente */
  const renameActivity = useCallback(
    (activityId: string, newName: string) => {
      setLocalActivities((prev) =>
        (prev ?? activities).map((a) =>
          a.id === activityId ? { ...a, name: newName } : a
        )
      );
      setPendingChanges(true);
    },
    [activities]
  );

  /** Elimina una actividad y sus scores */
  const removeActivity = useCallback(
    (activityId: string) => {
      setLocalActivities((prev) =>
        (prev ?? activities).filter((a) => a.id !== activityId)
      );
      setLocalScores((prev) => {
        const next = new Map(prev);
        for (const [studentId, scores] of next) {
          const { [activityId]: _, ...rest } = scores;
          next.set(studentId, rest);
        }
        return next;
      });
      setPendingChanges(true);
    },
    [activities]
  );

  // ─── Acciones de Notas ─────────────────────────────────────────────────────

  /** Actualiza la nota de un alumno en una actividad (actualización optimista) */
  const updateScore = useCallback(
    (studentId: string, activityId: string, score: number | null) => {
      setLocalScores((prev) => {
        const next = new Map(prev);
        const current = next.get(studentId) ?? {};
        next.set(studentId, { ...current, [activityId]: score });
        return next;
      });
      setPendingChanges(true);
    },
    []
  );

  // ─── Persistencia ──────────────────────────────────────────────────────────

  /** Guarda todos los cambios pendientes en el servidor */
  const saveChanges = useCallback(async () => {
    if (!pendingChanges || period === 'annual') return;
    setIsSaving(true);

    try {
      const allScores: { studentId: string; activityId: string; score: number | null }[] = [];
      for (const [studentId, scores] of localScores) {
        for (const [activityId, score] of Object.entries(scores)) {
          allScores.push({ studentId, activityId, score });
        }
      }

      const res = await fetch(`/api/courses/${courseId}/grade-sheets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          year,
          activities,
          scores: allScores,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar');

      setPendingChanges(false);
      await mutate();
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, period, localScores, activities, courseId, year, mutate]);

  // ─── Override Manual ───────────────────────────────────────────────────────

  /** Guarda un override manual de estado para un alumno */
  const overrideStatus = useCallback(
    async (
      studentId: string,
      options: {
        semester1Override?: string | null;
        semester2Override?: string | null;
        annualForcedCondition?: string | null;
      }
    ) => {
      const res = await fetch(`/api/courses/${courseId}/grade-sheets/override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, year, ...options }),
      });

      if (!res.ok) throw new Error('Error al guardar override');
      await mutate();
    },
    [courseId, year, mutate]
  );

  // ─── Helpers de cálculo local ──────────────────────────────────────────────

  /** Calcula el promedio local de un alumno con los scores actuales */
  const getLocalAverage = useCallback(
    (studentId: string): number | null => {
      const scores = localScores.get(studentId) ?? {};
      const filled = Object.values(scores).filter((s): s is number => s !== null);
      if (filled.length === 0 || activities.length === 0) return null;
      return filled.reduce((a, b) => a + b, 0) / filled.length;
    },
    [localScores, activities]
  );

  /** Calcula si el alumno tiene alguna actividad vacía */
  const hasEmptyActivity = useCallback(
    (studentId: string): boolean => {
      if (activities.length === 0) return false;
      const scores = localScores.get(studentId) ?? {};
      return activities.some((a) => scores[a.id] === null || scores[a.id] === undefined);
    },
    [localScores, activities]
  );

  return {
    // Estado del servidor
    isLoading,
    error,
    sheetData,
    annualData,
    // Estado derivado con edición local
    activities,
    rows,
    // Acciones de actividades
    addActivity,
    renameActivity,
    removeActivity,
    // Acciones de notas
    updateScore,
    // Persistencia
    saveChanges,
    isSaving,
    pendingChanges,
    // Override manual
    overrideStatus,
    // Helpers
    getLocalAverage,
    hasEmptyActivity,
    mutate,
  };
}
