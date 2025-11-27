import { ObjectId } from 'mongodb';
import { getAttendanceCollection, getEnrollmentsCollection } from '../mongodb/collections';

/**
 * Calcula el porcentaje de asistencia de un curso
 * @param courseId - ID del curso
 * @returns Porcentaje de asistencia (0-1)
 */
export async function calculateCourseAttendance(
  courseId: ObjectId
): Promise<number> {
  try {
    const attendanceCollection = await getAttendanceCollection();
    const enrollmentsCollection = await getEnrollmentsCollection();

    // Obtener número de alumnos activos
    const activeStudents = await enrollmentsCollection.countDocuments({
      courseId,
      status: 'active',
    });

    if (activeStudents === 0) {
      return 0;
    }

    // Obtener todas las fechas únicas de asistencia
    const distinctDates = await attendanceCollection.distinct('date', { courseId });
    const totalSessions = distinctDates.length;

    if (totalSessions === 0) {
      return 0;
    }

    // Contar presentes (present o late)
    const presentCount = await attendanceCollection.countDocuments({
      courseId,
      status: { $in: ['present', 'late'] },
    });

    // Total posible = alumnos * sesiones
    const totalPossible = activeStudents * totalSessions;

    return presentCount / totalPossible;
  } catch (error) {
    console.error('Error calculating course attendance:', error);
    return 0;
  }
}

/**
 * Calcula el porcentaje de asistencia de un alumno en un curso
 * @param courseId - ID del curso
 * @param studentId - ID del alumno
 * @returns Porcentaje de asistencia (0-1)
 */
export async function calculateStudentAttendance(
  courseId: ObjectId,
  studentId: ObjectId
): Promise<number> {
  try {
    const attendanceCollection = await getAttendanceCollection();

    // Obtener todas las fechas del curso
    const allDates = await attendanceCollection.distinct('date', { courseId });
    const totalSessions = allDates.length;

    if (totalSessions === 0) {
      return 0;
    }

    // Contar presentes del alumno
    const presentCount = await attendanceCollection.countDocuments({
      courseId,
      studentId,
      status: { $in: ['present', 'late'] },
    });

    return presentCount / totalSessions;
  } catch (error) {
    console.error('Error calculating student attendance:', error);
    return 0;
  }
}

/**
 * Obtiene el porcentaje de asistencia para todos los alumnos de un curso
 * @param courseId - ID del curso
 * @returns Map de studentId -> porcentaje
 */
export async function calculateAllStudentsAttendance(
  courseId: ObjectId
): Promise<Map<string, number>> {
  try {
    const enrollmentsCollection = await getEnrollmentsCollection();
    const attendanceCollection = await getAttendanceCollection();

    // Obtener alumnos activos
    const enrollments = await enrollmentsCollection
      .find({ courseId, status: 'active' })
      .toArray();

    // Obtener total de sesiones
    const allDates = await attendanceCollection.distinct('date', { courseId });
    const totalSessions = allDates.length;

    if (totalSessions === 0) {
      return new Map();
    }

    const result = new Map<string, number>();

    // Calcular para cada alumno
    for (const enrollment of enrollments) {
      const presentCount = await attendanceCollection.countDocuments({
        courseId,
        studentId: enrollment.studentId,
        status: { $in: ['present', 'late'] },
      });

      const percentage = presentCount / totalSessions;
      result.set(enrollment.studentId.toString(), percentage);
    }

    return result;
  } catch (error) {
    console.error('Error calculating all students attendance:', error);
    return new Map();
  }
}
