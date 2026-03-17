import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getBehavioralPointsCollection } from '@/lib/mongodb/collections';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/courses/[id]/grade-sheets/behavioral-points
 * Actualiza los puntos conductuales de un alumno.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = new ObjectId(id);
    const userId = session.user.id;

    const isOwner = await verifyCourseOwnership(courseId, userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, period, year, points } = body as {
      studentId: string;
      period: 1 | 2;
      year: number;
      points: number;
    };

    if (!studentId || !period || !year || points === undefined) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // Validar rango
    const sanitizedPoints = Math.min(Math.max(points, -5), 5);

    const behavioralPointsCollection = await getBehavioralPointsCollection();

    await behavioralPointsCollection.updateOne(
      {
        courseId,
        studentId: new ObjectId(studentId),
        period,
        year,
      },
      {
        $set: {
          points: sanitizedPoints,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, points: sanitizedPoints });
  } catch (error) {
    console.error('Error updating behavioral points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
