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
  const [localBehavioralPoints, setLocalBehavioralPoints] = useState<
    Map<string, number>
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
          const behaviorMap = new Map<string, number>();
          data.rows.forEach((row) => {
            scoreMap.set(row.studentId, { ...row.scores });
            behaviorMap.set(row.studentId, row.behavioralPoints || 0);
          });
          setLocalScores(scoreMap);
          setLocalBehavioralPoints(behaviorMap);
        }
      },
    }
  );

  // Derived state: actividades y rows con scores locales
  const isAnnualView = period === 'annual';
  const sheetData = !isAnnualView && serverData && 'activities' in serverData
    ? serverData as GradeSheetData
    : null;

  const annualData = useMemo(() => {
    if (!isAnnualView || !serverData || !('rows' in serverData) || !('type' in serverData)) return null;
    const data = serverData as { type: 'annual'; year: number; rows: AnnualConditionRow[] };
    return {
      ...data,
      rows: [...data.rows].sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      })
    };
  }, [isAnnualView, serverData]);

  // Actividades actuales (local override > servidor)
  const activities = localActivities ?? sheetData?.activities ?? [];

  // Rows con scores locales aplicados (memorizado para evitar re-renders innecesarios)
  const rows: GradeSheetStudentRow[] = useMemo(() => {
    const rawRows = sheetData?.rows ?? [];
    // Ordenar por Apellido y Nombre
    return [...rawRows].sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    }).map((row) => ({
      ...row,
      scores: localScores.get(row.studentId) ?? row.scores,
      behavioralPoints: localBehavioralPoints.get(row.studentId) ?? row.behavioralPoints ?? 0,
    }));
  }, [sheetData, localScores, localBehavioralPoints]);

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

  /** Actualiza los puntos conductuales (actualización optimista) */
  const updateBehavioralPoints = useCallback(
    async (studentId: string, points: number) => {
      // Optimistic update
      setLocalBehavioralPoints((prev) => {
        const next = new Map(prev);
        next.set(studentId, points);
        return next;
      });

      // No marcamos pendingChanges porque esto se guarda con Debounce
      // pero para simplificar por ahora, lo tratamos como cambio pendiente que se guarda al clickear Save
      // O usamos el debounce aquí mismo. Vamos a usar el debounce para persistencia inmediata.
      try {
        const res = await fetch(`/api/courses/${courseId}/grade-sheets/behavioral-points`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, period, year, points }),
        });
        if (!res.ok) throw new Error();
      } catch (err) {
        // Rollback si falla (opcional, para MVP el usuario lo notará al recargar)
        console.error('Error saving points', err);
      }
    },
    [courseId, period, year]
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
      const behavioralPoints = localBehavioralPoints.get(studentId) ?? 0;
      const filled = Object.values(scores).filter((s): s is number => s !== null);
      if (filled.length === 0 || activities.length === 0) return null;
      const avg = filled.reduce((a, b) => a + b, 0) / filled.length;
      return Math.min(Math.max(avg + behavioralPoints, 1), 10);
    },
    [localScores, localBehavioralPoints, activities]
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
    updateBehavioralPoints,
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
