import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { getCoursesCollection } from '@/lib/mongodb/collections';
import { Course } from '@/types/models';

// GET /api/courses - Lista cursos del docente autenticado
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!requireAuth(user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const coursesCollection = await getCoursesCollection();
    const courses = await coursesCollection
      .find({ ownerId: user.uid })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Crear nuevo curso
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!requireAuth(user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, startDate, description, institutionName } = body;

    // Validación
    if (!name || !startDate || !institutionName) {
      return NextResponse.json(
        { error: 'Name, startDate and institutionName are required' },
        { status: 400 }
      );
    }

    const coursesCollection = await getCoursesCollection();

    const newCourse: Omit<Course, '_id'> = {
      name,
      ownerId: user.uid,
      institutionName,
      startDate: new Date(startDate),
      description: description || undefined,
      allowJoinRequests: false, // Disabled by default
      createdAt: new Date(),
      meta: {
        studentCount: 0,
        avgAttendance: 0,
      },
    };

    const result = await coursesCollection.insertOne(newCourse as Course);

    const createdCourse = await coursesCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(createdCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
