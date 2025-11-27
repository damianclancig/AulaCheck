import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getCoursesCollection, getEnrollmentsCollection } from '@/lib/mongodb/collections';

interface RouteParams {
  params: Promise<{
    id: string;
    studentId: string;
  }>;
}

// DELETE /api/courses/[id]/students/[studentId] - Dar de baja alumno del curso
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request);
    if (!requireAuth(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, studentId } = await params;
    const courseId = new ObjectId(id);
    const studentObjectId = new ObjectId(studentId);

    const isOwner = await verifyCourseOwnership(courseId, user.uid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const enrollmentsCollection = await getEnrollmentsCollection();
    const coursesCollection = await getCoursesCollection();

    // Buscar enrollment
    const enrollment = await enrollmentsCollection.findOne({
      courseId,
      studentId: studentObjectId,
      status: 'active',
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Marcar como inactivo
    await enrollmentsCollection.updateOne(
      { _id: enrollment._id },
      { $set: { status: 'inactive' } }
    );

    // Decrementar contador
    await coursesCollection.updateOne(
      { _id: courseId },
      { $inc: { 'meta.studentCount': -1 } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
