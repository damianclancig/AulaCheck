import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getGradesCollection } from '@/lib/mongodb/collections';
import { calculateStudentAverage } from '@/lib/calculations';
import { Grade } from '@/types/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/courses/[id]/grades - Obtener calificaciones
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
    const studentId = searchParams.get('studentId');

    const gradesCollection = await getGradesCollection();

    const query: any = { courseId };
    if (studentId) {
      query.studentId = new ObjectId(studentId);
    }

    const grades = await gradesCollection
      .find(query)
      .sort({ date: -1 })
      .toArray();

    // Si se filtró por alumno, calcular promedio
    let average = null;
    if (studentId) {
      average = await calculateStudentAverage(courseId, new ObjectId(studentId));
    }

    return NextResponse.json({
      grades,
      average,
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/courses/[id]/grades - Crear calificación
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
    const { studentId, assessment, date, score, weight } = body;

    // Validación
    if (!studentId || !assessment || !date || score === undefined || weight === undefined) {
      return NextResponse.json(
        { error: 'studentId, assessment, date, score, and weight are required' },
        { status: 400 }
      );
    }

    if (score < 0 || score > 10) {
      return NextResponse.json(
        { error: 'score must be between 0 and 10' },
        { status: 400 }
      );
    }

    const gradesCollection = await getGradesCollection();

    const newGrade: Omit<Grade, '_id'> = {
      courseId,
      studentId: new ObjectId(studentId),
      assessment,
      date: date, // Guardar como string YYYY-MM-DD
      score: parseFloat(score),
      weight: parseFloat(weight),
      createdAt: new Date(),
    };

    const result = await gradesCollection.insertOne(newGrade as Grade);
    const createdGrade = await gradesCollection.findOne({ _id: result.insertedId });

    // Calcular nuevo promedio del alumno
    const average = await calculateStudentAverage(courseId, new ObjectId(studentId));

    return NextResponse.json({
      grade: createdGrade,
      average,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating grade:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
