import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getAttendanceCollection, getCoursesCollection } from '@/lib/mongodb/collections';
import { calculateCourseAttendance } from '@/lib/calculations';
import { Attendance } from '@/types/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/courses/[id]/attendance - Historial de asistencia
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const attendanceCollection = await getAttendanceCollection();

    // Construir query
    const query: any = { courseId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const attendance = await attendanceCollection
      .find(query)
      .sort({ date: -1, studentId: 1 })
      .toArray();

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/courses/[id]/attendance - Marcar asistencia
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { date, records } = body;

    // Validación
    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'date and records array are required' },
        { status: 400 }
      );
    }

    const attendanceCollection = await getAttendanceCollection();

    // Procesar cada registro (upsert)
    const operations = records.map((record: { studentId: string; status: 'present' | 'absent' | 'late' }) => ({
      updateOne: {
        filter: {
          courseId,
          studentId: new ObjectId(record.studentId),
          date,
        },
        update: {
          $set: {
            status: record.status,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await attendanceCollection.bulkWrite(operations);

    // Recalcular promedio de asistencia del curso
    const avgAttendance = await calculateCourseAttendance(courseId);
    const coursesCollection = await getCoursesCollection();
    await coursesCollection.updateOne(
      { _id: courseId },
      { $set: { 'meta.avgAttendance': avgAttendance } }
    );

    return NextResponse.json({ success: true, avgAttendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
