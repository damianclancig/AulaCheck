import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getAttendanceCollection } from '@/lib/mongodb/collections';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

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

    const attendanceCollection = await getAttendanceCollection();

    // Get all attendance records for this course
    const attendanceRecords = await attendanceCollection
      .find({ courseId })
      .sort({ date: 1 })
      .toArray();

    // Extract unique dates (sorted ascending)
    const datesSet = new Set<string>();
    attendanceRecords.forEach(record => {
      if (record.date) {
        datesSet.add(record.date);
      }
    });
    const dates = Array.from(datesSet);

    // Build records map: { studentId: { date: status } }
    const records: Record<string, Record<string, string>> = {};

    attendanceRecords.forEach(record => {
      // Saltar registros marcadores de suspensión (sin studentId)
      if (!record.studentId || !record.status) {
        return;
      }

      const studentId = record.studentId.toString();
      const date = record.date;
      const status = record.status as string;

      if (!records[studentId]) {
        records[studentId] = {};
      }

      records[studentId][date] = status;
    });

    return NextResponse.json({
      dates,
      records
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Error al obtener registros de asistencia' },
      { status: 500 }
    );
  }
}
