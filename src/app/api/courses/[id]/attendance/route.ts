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
    const { date, records, suspensionReason, suspensionNote } = body;

    // Validación
    if (!date || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'date and records array are required' },
        { status: 400 }
      );
    }

    // Si no hay suspensión, debe haber registros
    if (!suspensionReason && records.length === 0) {
      return NextResponse.json(
        { error: 'records array cannot be empty for normal classes' },
        { status: 400 }
      );
    }

    // Validar que si suspensionReason es 'other', se proporcione suspensionNote
    if (suspensionReason === 'other' && !suspensionNote) {
      return NextResponse.json(
        { error: 'suspensionNote is required when suspensionReason is "other"' },
        { status: 400 }
      );
    }

    const attendanceCollection = await getAttendanceCollection();

    // Si estamos sobrescribiendo, eliminar registros marcadores de suspensión previos
    // (registros sin studentId que solo marcan la fecha)
    await attendanceCollection.deleteMany({
      courseId,
      date,
      studentId: { $exists: false }
    });

    // Procesar cada registro (upsert)
    const operations = records.map((record: { studentId: string; status: 'present' | 'absent' | 'late' }) => {
      const updateData: any = {
        status: record.status,
        createdAt: new Date(),
      };

      // Agregar campos de suspensión si están presentes
      if (suspensionReason) {
        updateData.suspensionReason = suspensionReason;
      }
      if (suspensionNote) {
        updateData.suspensionNote = suspensionNote;
      }

      return {
        updateOne: {
          filter: {
            courseId,
            studentId: new ObjectId(record.studentId),
            date,
          },
          update: {
            $set: updateData,
          },
          upsert: true,
        },
      };
    });

    // Solo ejecutar bulkWrite si hay operaciones (no vacío)
    if (operations.length > 0) {
      await attendanceCollection.bulkWrite(operations);
    } else if (suspensionReason && suspensionReason !== 'none') {
      // Si hay suspensión pero no hay registros, crear un registro marcador
      // Este registro no tiene studentId, solo sirve para marcar la fecha como ocupada
      await attendanceCollection.insertOne({
        courseId,
        date,
        suspensionReason,
        suspensionNote: suspensionNote || undefined,
        createdAt: new Date(),
        // No incluimos studentId ni status porque es un marcador de suspensión
      } as any);
    }

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
