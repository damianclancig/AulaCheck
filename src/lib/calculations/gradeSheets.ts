import { ObjectId } from 'mongodb';
import {
  getGradesCollection,
  getEnrollmentsCollection,
  getAttendanceCollection,
  getGradeSheetMetaCollection,
  getBehavioralPointsCollection,
} from '../mongodb/collections';
import {
  calculateTrajectoryStatus,
  calculateAnnualCondition,
} from './trajectoryUtils';
import type {
  GradeSheetData,
  GradeSheetActivity,
  GradeSheetStudentRow,
  AnnualConditionRow,
} from '@/types/models';

export type { TrajectoryStatus, AnnualCondition } from './trajectoryUtils';
export { calculateTrajectoryStatus, calculateAnnualCondition } from './trajectoryUtils';

/**
 * Obtiene la planilla de calificaciones de un cuatrimestre.
 * Cruza grades (con period y year) con alumnos activos y asistencia.
 */
export async function getGradeSheetData(
  courseId: ObjectId,
  period: 1 | 2,
  year: number
): Promise<GradeSheetData> {
  const gradesCollection = await getGradesCollection();
  const enrollmentsCollection = await getEnrollmentsCollection();
  const attendanceCollection = await getAttendanceCollection();
  const metaCollection = await getGradeSheetMetaCollection();
  const behavioralCollection = await getBehavioralPointsCollection();

  // Obtener alumnos activos con sus datos
  const enrollments = await enrollmentsCollection
    .aggregate([
      { $match: { courseId, status: 'active' } },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
    ])
    .toArray();

  // Obtener todas las notas del periodo
  const grades = await gradesCollection
    .find({ courseId, period, year })
    .toArray();

  // Construir la lista de actividades únicas (por activityId + nombre)
  const activitiesMap = new Map<string, GradeSheetActivity>();
  for (const grade of grades) {
    if (grade.activityId && !activitiesMap.has(grade.activityId)) {
      activitiesMap.set(grade.activityId, {
        id: grade.activityId,
        name: grade.assessment,
        order: activitiesMap.size,
      });
    }
  }
  const activities = Array.from(activitiesMap.values()).sort(
    (a, b) => a.order - b.order
  );

  // Determinar rango de fechas del cuatrimestre
  const semesterStart = period === 1
    ? `${year}-03-01`
    : `${year}-08-01`;
  const semesterEnd = period === 1
    ? `${year}-07-31`
    : `${year}-12-31`;

  // Obtener registros de asistencia del periodo (excluir suspensiones)
  const attendanceRecords = await attendanceCollection
    .find({
      courseId,
      date: { $gte: semesterStart, $lte: semesterEnd },
      status: { $in: ['present', 'absent', 'late'] as const },
    })
    .toArray();

  // Construir el mapa de asistencia por alumno
  const attendanceByStudent = new Map<string, { present: number; absent: number }>();
  for (const record of attendanceRecords) {
    if (!record.studentId) continue;
    const key = record.studentId.toString();
    if (!attendanceByStudent.has(key)) {
      attendanceByStudent.set(key, { present: 0, absent: 0 });
    }
    const entry = attendanceByStudent.get(key)!;
    if (record.status === 'present' || record.status === 'late') {
      entry.present++;
    } else if (record.status === 'absent') {
      entry.absent++;
    }
  }

  // Obtener metas (overrides) de cada alumno
  const studentIds = enrollments.map((e) => e.studentId);
  const metas = await metaCollection
    .find({ courseId, year, studentId: { $in: studentIds } })
    .toArray();
  const metaByStudent = new Map(
    metas.map((m) => [m.studentId.toString(), m])
  );

  // Obtener puntos conductuales
  const behavioralEntries = await behavioralCollection
    .find({ courseId, year, period, studentId: { $in: studentIds } })
    .toArray();
  const behavioralByStudent = new Map<string, number>(
    behavioralEntries.map((b) => [b.studentId.toString(), b.points])
  );

  // Construir filas de la planilla
  const rows: GradeSheetStudentRow[] = enrollments.map((enrollment) => {
    const studentId = enrollment.studentId.toString();
    const student = enrollment.student as { firstName: string; lastName: string };

    // Notas del alumno en este periodo
    const studentGrades = grades.filter(
      (g) => g.studentId.toString() === studentId
    );

    // Construir mapa scores por activityId
    const scores: Record<string, number | null> = {};
    for (const act of activities) {
      scores[act.id] = null;
    }
    for (const grade of studentGrades) {
      if (grade.activityId) {
        scores[grade.activityId] = grade.score;
      }
    }

    // Calcular promedio de las actividades con nota
    const filledScores = Object.values(scores).filter(
      (s): s is number => s !== null
    );
    const average =
      activities.length > 0 && filledScores.length > 0
        ? filledScores.reduce((a, b) => a + b, 0) / filledScores.length
        : null;

    // Puntos conductuales
    const behavioralPoints = behavioralByStudent.get(studentId) || 0;

    // Nota final (promedio + puntos conductuales) clamp [1, 10]
    const finalGrade = average !== null 
      ? Math.min(Math.max(average + behavioralPoints, 1), 10) 
      : null;

    // Asistencia del periodo
    const att = attendanceByStudent.get(studentId) || { present: 0, absent: 0 };
    const total = att.present + att.absent;
    const attendancePercent = total > 0 ? (att.present / total) * 100 : 100;
    const absencePercent = total > 0 ? (att.absent / total) * 100 : 0;

    // Determinar si hay alguna actividad vacía o si todas están vacías
    const hasEmptyActivity =
      activities.length > 0 &&
      Object.values(scores).some((s) => s === null);
    
    const allActivitiesEmpty = 
      activities.length > 0 &&
      Object.values(scores).every((s) => s === null);

    // Calcular estado TEA/TEP/TED
    const status = calculateTrajectoryStatus(
      finalGrade, 
      absencePercent, 
      hasEmptyActivity,
      allActivitiesEmpty,
      attendancePercent,
      total > 0
    );

    // Override manual
    const meta = metaByStudent.get(studentId);
    const overrideKey = period === 1 ? 'semester1Override' : 'semester2Override';
    const statusOverride = meta?.[overrideKey] ?? null;

    return {
      studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      scores,
      average,
      attendancePresent: att.present,
      attendanceAbsent: att.absent,
      attendancePercent,
      absencePercent,
      status,
      statusOverride,
      isManual: meta?.isManual ?? false,
      behavioralPoints,
    };
  });

  // Ordenar por apellido
  rows.sort((a, b) => a.lastName.localeCompare(b.lastName));

  return { period, year, activities, rows };
}

/**
 * Obtiene los datos de cierre anual para todos los alumnos activos.
 */
export async function getAnnualClose(
  courseId: ObjectId,
  year: number
): Promise<AnnualConditionRow[]> {
  const enrollmentsCollection = await getEnrollmentsCollection();
  const attendanceCollection = await getAttendanceCollection();
  const metaCollection = await getGradeSheetMetaCollection();

  const enrollments = await enrollmentsCollection
    .aggregate([
      { $match: { courseId, status: 'active' } },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
    ])
    .toArray();

  const studentIds = enrollments.map((e) => e.studentId);
  const metas = await metaCollection
    .find({ courseId, year, studentId: { $in: studentIds } })
    .toArray();
  const metaByStudent = new Map(
    metas.map((m) => [m.studentId.toString(), m])
  );

  // Asistencia anual (todo el año)
  const annualStart = `${year}-01-01`;
  const annualEnd = `${year}-12-31`;
  const annualAttendance = await attendanceCollection
    .find({
      courseId,
      date: { $gte: annualStart, $lte: annualEnd },
      status: { $exists: true },
    })
    .toArray();

  const annualAttByStudent = new Map<string, { present: number; absent: number }>();
  for (const record of annualAttendance) {
    if (!record.studentId) continue;
    const key = record.studentId.toString();
    if (!annualAttByStudent.has(key)) {
      annualAttByStudent.set(key, { present: 0, absent: 0 });
    }
    const entry = annualAttByStudent.get(key)!;
    if (record.status === 'present' || record.status === 'late') {
      entry.present++;
    } else if (record.status === 'absent') {
      entry.absent++;
    }
  }

  // Para obtener promedios y estados, necesitamos los datos de cada cuatrimestre
  const sheet1 = await getGradeSheetData(courseId, 1, year);
  const sheet2 = await getGradeSheetData(courseId, 2, year);

  const s1ByStudent = new Map(sheet1.rows.map((r) => [r.studentId, r]));
  const s2ByStudent = new Map(sheet2.rows.map((r) => [r.studentId, r]));

  const rows: AnnualConditionRow[] = enrollments.map((enrollment) => {
    const studentId = enrollment.studentId.toString();
    const student = enrollment.student as { firstName: string; lastName: string };

    const s1 = s1ByStudent.get(studentId);
    const s2 = s2ByStudent.get(studentId);
    const meta = metaByStudent.get(studentId);

    const semester1Average = s1?.average ?? null;
    const semester2Average = s2?.average ?? null;
    const finalAverage =
      semester1Average !== null && semester2Average !== null
        ? (semester1Average + semester2Average) / 2
        : null;

    const semester1Status = s1?.statusOverride ?? s1?.status ?? 'TED';
    const semester2Status = s2?.statusOverride ?? s2?.status ?? 'TED';

    const annualAtt = annualAttByStudent.get(studentId) || { present: 0, absent: 0 };
    const totalAnnual = annualAtt.present + annualAtt.absent;
    const annualAttendancePercent =
      totalAnnual > 0 ? (annualAtt.present / totalAnnual) * 100 : 100;

    const calculatedCondition = calculateAnnualCondition(
      semester1Average,
      semester2Average,
      semester1Status,
      semester2Status,
      annualAttendancePercent
    );

    return {
      studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      semester1Average,
      semester2Average,
      finalAverage,
      semester1Status,
      semester2Status,
      annualAttendancePercent,
      calculatedCondition,
      forcedCondition: meta?.annualForcedCondition ?? null,
      isManual: meta?.isManual ?? false,
    };
  });

  rows.sort((a, b) => a.lastName.localeCompare(b.lastName));
  return rows;
}
