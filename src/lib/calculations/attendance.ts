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

    // Contar todos los registros reales (sin contar suspensiones)
    // Esto refleja el total de "posibles presentes" basado en alumnos que realmente
    // tuvieron un estado marcado.
    const totalPossible = await attendanceCollection.countDocuments({
      courseId,
      status: { $exists: true }
    });

    if (totalPossible === 0) {
      return 0;
    }

    // Contar presentes (present o late)
    const presentCount = await attendanceCollection.countDocuments({
      courseId,
      status: { $in: ['present', 'late'] },
    });

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

    // Obtener total de sesiones donde el alumno tenga un estado
    const totalSessions = await attendanceCollection.countDocuments({ 
      courseId,
      studentId,
      status: { $exists: true }
    });

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

    // Utilizar aggregate para obtener total y presentes por alumno en un solo viaje
    const aggregation = await attendanceCollection.aggregate([
      { $match: { courseId, status: { $exists: true } } },
      { 
        $group: { 
          _id: "$studentId", 
          totalSessions: { $sum: 1 },
          presentCount: { 
            $sum: { 
              $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] 
            } 
          }
        }
      }
    ]).toArray();

    const result = new Map<string, number>();

    // Inicializar a 0 para todos los alumnos activos
    for (const enrollment of enrollments) {
      result.set(enrollment.studentId.toString(), 0);
    }

    // Rellenar con los resultados del aggregation
    for (const record of aggregation) {
      const studentId = record._id.toString();
      if (result.has(studentId) && record.totalSessions > 0) {
        result.set(studentId, record.presentCount / record.totalSessions);
      }
    }

    return result;
  } catch (error) {
    console.error('Error calculating all students attendance:', error);
    return new Map();
  }
}
