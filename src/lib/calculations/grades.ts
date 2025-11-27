import { ObjectId } from 'mongodb';
import { getGradesCollection, getEnrollmentsCollection } from '../mongodb/collections';

/**
 * Calcula el promedio ponderado de un alumno en un curso
 * @param courseId - ID del curso
 * @param studentId - ID del alumno
 * @returns Promedio ponderado (0-10) o null si no tiene notas
 */
export async function calculateStudentAverage(
  courseId: ObjectId,
  studentId: ObjectId
): Promise<number | null> {
  try {
    const gradesCollection = await getGradesCollection();

    const grades = await gradesCollection
      .find({ courseId, studentId })
      .toArray();

    if (grades.length === 0) {
      return null;
    }

    // Promedio ponderado: sum(score * weight) / sum(weight)
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const grade of grades) {
      totalWeightedScore += grade.score * grade.weight;
      totalWeight += grade.weight;
    }

    if (totalWeight === 0) {
      return null;
    }

    return totalWeightedScore / totalWeight;
  } catch (error) {
    console.error('Error calculating student average:', error);
    return null;
  }
}

/**
 * Calcula el promedio general del curso (promedio de promedios de alumnos)
 * @param courseId - ID del curso
 * @returns Promedio del curso o null si no hay datos
 */
export async function calculateCourseAverage(
  courseId: ObjectId
): Promise<number | null> {
  try {
    const enrollmentsCollection = await getEnrollmentsCollection();

    // Obtener alumnos activos
    const enrollments = await enrollmentsCollection
      .find({ courseId, status: 'active' })
      .toArray();

    if (enrollments.length === 0) {
      return null;
    }

    const averages: number[] = [];

    // Calcular promedio de cada alumno
    for (const enrollment of enrollments) {
      const avg = await calculateStudentAverage(courseId, enrollment.studentId);
      if (avg !== null) {
        averages.push(avg);
      }
    }

    if (averages.length === 0) {
      return null;
    }

    // Promedio de promedios
    const sum = averages.reduce((acc, val) => acc + val, 0);
    return sum / averages.length;
  } catch (error) {
    console.error('Error calculating course average:', error);
    return null;
  }
}

/**
 * Obtiene el promedio para todos los alumnos de un curso
 * @param courseId - ID del curso
 * @returns Map de studentId -> promedio
 */
export async function calculateAllStudentsAverages(
  courseId: ObjectId
): Promise<Map<string, number | null>> {
  try {
    const enrollmentsCollection = await getEnrollmentsCollection();

    const enrollments = await enrollmentsCollection
      .find({ courseId, status: 'active' })
      .toArray();

    const result = new Map<string, number | null>();

    for (const enrollment of enrollments) {
      const avg = await calculateStudentAverage(courseId, enrollment.studentId);
      result.set(enrollment.studentId.toString(), avg);
    }

    return result;
  } catch (error) {
    console.error('Error calculating all students averages:', error);
    return new Map();
  }
}
