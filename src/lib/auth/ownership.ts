import { ObjectId } from 'mongodb';
import { getCoursesCollection } from '../mongodb/collections';

/**
 * Verifica que el usuario sea el owner de un curso
 * @param courseId - ID del curso
 * @param uid - Firebase UID del usuario
 * @returns true si el usuario es owner, false en caso contrario
 */
export async function verifyCourseOwnership(
  courseId: ObjectId,
  uid: string
): Promise<boolean> {
  try {
    const coursesCollection = await getCoursesCollection();
    const course = await coursesCollection.findOne({ _id: courseId });
    
    if (!course) {
      return false;
    }
    
    return course.ownerId === uid;
  } catch (error) {
    console.error('Error verifying course ownership:', error);
    return false;
  }
}

/**
 * Verifica que el usuario tenga acceso a un alumno
 * (debe ser owner de al menos un curso donde esté matriculado el alumno)
 * @param studentId - ID del alumno
 * @param uid - Firebase UID del usuario
 * @returns true si el usuario tiene acceso, false en caso contrario
 */
export async function verifyStudentAccess(
  studentId: ObjectId,
  uid: string
): Promise<boolean> {
  try {
    const coursesCollection = await getCoursesCollection();
    const { getEnrollmentsCollection } = await import('../mongodb/collections');
    const enrollmentsCollection = await getEnrollmentsCollection();
    
    // Buscar enrollments del alumno
    const enrollments = await enrollmentsCollection
      .find({ studentId, status: 'active' })
      .toArray();
    
    if (enrollments.length === 0) {
      return false;
    }
    
    // Verificar si el usuario es owner de alguno de los cursos
    const courseIds = enrollments.map(e => e.courseId);
    const userCourse = await coursesCollection.findOne({
      _id: { $in: courseIds },
      ownerId: uid,
    });
    
    return userCourse !== null;
  } catch (error) {
    console.error('Error verifying student access:', error);
    return false;
  }
}
