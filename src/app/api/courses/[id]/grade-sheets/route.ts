import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getGradesCollection, getGradeSheetMetaCollection } from '@/lib/mongodb/collections';
import { getGradeSheetData, getAnnualClose } from '@/lib/calculations/gradeSheets';
import { Grade } from '@/types/models';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/courses/[id]/grade-sheets?period=1&year=2026
 * Devuelve la planilla del cuatrimestre especificado, o el cierre anual.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period');
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Si se pide el cierre anual
    if (periodParam === 'annual') {
      const rows = await getAnnualClose(courseId, year);
      return NextResponse.json({ type: 'annual', year, rows });
    }

    const period = periodParam === '2' ? 2 : 1;
    const data = await getGradeSheetData(courseId, period, year);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching grade sheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/courses/[id]/grade-sheets
 * Actualiza (upsert) actividades y notas de la planilla de un cuatrimestre.
 * Body: { period: 1|2, year: number, activities: GradeActivity[], scores: { studentId, activityId, score }[] }
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
    const { period, year, activities, scores } = body as {
      period: 1 | 2;
      year: number;
      activities: { id: string; name: string; order: number }[];
      scores: { studentId: string; activityId: string; score: number | null }[];
    };

    if (!period || !year || !activities) {
      return NextResponse.json({ error: 'period, year y activities son requeridos' }, { status: 400 });
    }

    const gradesCollection = await getGradesCollection();

    // Procesar cada score: upsert por (courseId, studentId, activityId, period, year)
    const ops = scores
      .filter((s) => s.activityId && s.studentId)
      .map((s) => {
        const activity = activities.find((a) => a.id === s.activityId);
        if (!activity) return null;

        const filter = {
          courseId,
          studentId: new ObjectId(s.studentId),
          activityId: s.activityId,
          period,
          year,
        };

        if (s.score === null) {
          // Si la nota es null, eliminar el documento si existe
          return gradesCollection.deleteOne(filter);
        }

        const update: Partial<Grade> = {
          courseId,
          studentId: new ObjectId(s.studentId),
          assessment: activity.name,
          activityId: s.activityId,
          period,
          year,
          score: s.score,
          weight: 1,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date(),
        };

        return gradesCollection.updateOne(
          filter,
          { $set: update },
          { upsert: true }
        );
      })
      .filter(Boolean);

    await Promise.all(ops);

    // Actualizar los nombres de las actividades si cambiaron
    for (const activity of activities) {
      await gradesCollection.updateMany(
        { courseId, activityId: activity.id, period, year },
        { $set: { assessment: activity.name } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating grade sheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
