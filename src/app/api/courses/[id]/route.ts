import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getCoursesCollection, getEnrollmentsCollection, getAttendanceCollection, getGradesCollection } from '@/lib/mongodb/collections';
import { calculateCourseAttendance, calculateCourseAverage } from '@/lib/calculations';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/courses/[id] - Detalle del curso
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request);
    if (!requireAuth(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = new ObjectId(id);

    // Verificar ownership
    const isOwner = await verifyCourseOwnership(courseId, user.uid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const coursesCollection = await getCoursesCollection();
    const course = await coursesCollection.findOne({ _id: courseId });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Recalcular métricas
    const avgAttendance = await calculateCourseAttendance(courseId);
    const avgGrade = await calculateCourseAverage(courseId);

    const courseWithMetrics = {
      ...course,
      meta: {
        ...course.meta,
        avgAttendance,
        avgGrade: avgGrade || undefined,
      },
    };

    return NextResponse.json(courseWithMetrics);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/courses/[id] - Editar curso
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request);
    if (!requireAuth(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = new ObjectId(id);

    const isOwner = await verifyCourseOwnership(courseId, user.uid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, startDate, description, institutionName, annualClassCount } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (institutionName) updateData.institutionName = institutionName;
    if (startDate) updateData.startDate = startDate; // Guardar como string YYYY-MM-DD
    if (annualClassCount !== undefined) updateData.annualClassCount = annualClassCount;
    if (description !== undefined) updateData.description = description;

    const coursesCollection = await getCoursesCollection();
    await coursesCollection.updateOne(
      { _id: courseId },
      { $set: updateData }
    );

    const updatedCourse = await coursesCollection.findOne({ _id: courseId });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/courses/[id] - Eliminar curso
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request);
    if (!requireAuth(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = new ObjectId(id);

    const isOwner = await verifyCourseOwnership(courseId, user.uid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Eliminar curso y datos relacionados
    const coursesCollection = await getCoursesCollection();
    const enrollmentsCollection = await getEnrollmentsCollection();
    const attendanceCollection = await getAttendanceCollection();
    const gradesCollection = await getGradesCollection();

    await Promise.all([
      coursesCollection.deleteOne({ _id: courseId }),
      enrollmentsCollection.deleteMany({ courseId }),
      attendanceCollection.deleteMany({ courseId }),
      gradesCollection.deleteMany({ courseId }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
