import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getCoursesCollection, 
  getEnrollmentsCollection, 
  getAttendanceCollection, 
  getGradesCollection,
  getJoinRequestsCollection,
  getGradeSheetMetaCollection,
  getBehavioralPointsCollection
} from '@/lib/mongodb/collections';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Authenticator from '@/models/Authenticator';

// DELETE /api/user - Eliminar cuenta del usuario autenticado
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Colecciones nativas (cursos y derivados)
    const coursesCollection = await getCoursesCollection();
    const enrollmentsCollection = await getEnrollmentsCollection();
    const attendanceCollection = await getAttendanceCollection();
    const gradesCollection = await getGradesCollection();
    const joinRequestsCollection = await getJoinRequestsCollection();
    const gradeSheetMetaCollection = await getGradeSheetMetaCollection();
    const behavioralPointsCollection = await getBehavioralPointsCollection();

    // 1. Obtener todos los cursos del docente
    const courses = await coursesCollection.find({ ownerId: userId }).toArray();
    const courseIds = courses.map(c => c._id);

    // 2. Si tiene cursos, proceder con la eliminación en cascada
    if (courseIds.length > 0) {
      await Promise.all([
        enrollmentsCollection.deleteMany({ courseId: { $in: courseIds } }),
        attendanceCollection.deleteMany({ courseId: { $in: courseIds } }),
        gradesCollection.deleteMany({ courseId: { $in: courseIds } }),
        joinRequestsCollection.deleteMany({ courseId: { $in: courseIds } }),
        gradeSheetMetaCollection.deleteMany({ courseId: { $in: courseIds } }),
        behavioralPointsCollection.deleteMany({ courseId: { $in: courseIds } }),
        coursesCollection.deleteMany({ _id: { $in: courseIds } })
      ]);
    }

    // 3. Conectar a Mongoose para eliminar Autenticadores y Usuario
    await connectToDatabase();

    // 4. Eliminar Authenticators (Passkeys) del usuario
    await Authenticator.deleteMany({ userId: userId });

    // 5. Eliminar el documento del usuario principal
    await User.deleteOne({ _id: userId });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error cascade deleting user account:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting account.' },
      { status: 500 }
    );
  }
}
