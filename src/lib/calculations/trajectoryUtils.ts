/**
 * Funciones de cálculo puras para el módulo de calificaciones.
 * Este archivo NO importa MongoDB y puede usarse tanto en cliente como en servidor.
 */

export type TrajectoryStatus = 'TEA' | 'TEP' | 'TED';
export type AnnualCondition = 'APPROVED' | 'DECEMBER' | 'FEBRUARY';

/**
 * Calcula el estado de trayectoria para un alumno en un cuatrimestre.
 * TED: Discontinua - No entregó NINGUNA actividad O tiene 0% de asistencia (si hay datos)
 * TEP: En Proceso - Tiene inasistencias (>30%) O adeuda alguna actividad O promedio < 7
 * TEA: Avanzada - Asistencia al día Y Todas actividades completas Y Promedio >= 7
 */
export function calculateTrajectoryStatus(
  average: number | null,
  absencePercent: number,
  hasEmptyActivity: boolean,
  allActivitiesEmpty: boolean,
  attendancePercent: number,
  hasAttendanceData: boolean = true
): TrajectoryStatus {
  // 1. TED (Condiciones críticas de desconexión)
  // Si hay actividades definidas pero no entregó ninguna, o si tiene 0% de asistencia
  if (allActivitiesEmpty || (hasAttendanceData && attendancePercent === 0)) {
    return 'TED';
  }

  // 2. TEP (Condiciones de proceso o riesgo)
  // Si falta alguna actividad, o tiene muchas faltas, o el promedio es insuficiente
  if (hasEmptyActivity || absencePercent > 30 || (average !== null && average < 7) || average === null) {
    return 'TEP';
  }

  // 3. TEA (Cumple con todo)
  return 'TEA';
}

/**
 * Calcula la condición final anual de un alumno.
 * APPROVED: PF >= 7 + Ambos cuatrimestres TEA + Asistencia anual > 70%
 * DECEMBER: PF entre 4 y 6.99 O algún cuatrimestre TEP O Asistencia 60-70%
 * FEBRUARY: PF < 4 O estado TED persistente O Asistencia < 60%
 */
export function calculateAnnualCondition(
  semester1Average: number | null,
  semester2Average: number | null,
  semester1Status: string,
  semester2Status: string,
  annualAttendancePercent: number
): AnnualCondition {
  if (
    semester1Status === 'TED' ||
    semester2Status === 'TED' ||
    annualAttendancePercent < 60
  ) {
    return 'FEBRUARY';
  }

  const finalAverage =
    semester1Average !== null && semester2Average !== null
      ? (semester1Average + semester2Average) / 2
      : null;

  if (finalAverage !== null && finalAverage < 4) {
    return 'FEBRUARY';
  }

  if (
    finalAverage !== null &&
    finalAverage >= 7 &&
    semester1Status === 'TEA' &&
    semester2Status === 'TEA' &&
    annualAttendancePercent > 70
  ) {
    return 'APPROVED';
  }

  return 'DECEMBER';
}
