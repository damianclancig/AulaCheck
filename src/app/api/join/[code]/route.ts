import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCoursesCollection } from '@/lib/mongodb/collections';

interface RouteParams {
  params: Promise<{
    code: string;
  }>;
}

// GET /api/join/[code] - Get course info by join code (public, no auth)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    const coursesCollection = await getCoursesCollection();
    const course = await coursesCollection.findOne({ 
      joinCode: code,
      allowJoinRequests: true 
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Código de invitación inválido o expirado' },
        { status: 404 }
      );
    }

    // Return only public info
    return NextResponse.json({
      courseId: course._id.toString(),
      courseName: course.name,
      institutionName: course.institutionName,
      description: course.description,
    });
  } catch (error) {
    console.error('Error fetching course by join code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/join/[code] - Submit join request (public, no auth)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { firstName, lastName, email, phone, externalId } = body;

    // Validation
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Nombre y apellido son requeridos' },
        { status: 400 }
      );
    }

    const coursesCollection = await getCoursesCollection();
    const course = await coursesCollection.findOne({ 
      joinCode: code,
      allowJoinRequests: true 
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Código de invitación inválido o expirado' },
        { status: 404 }
      );
    }

    // Create join request
    const { getJoinRequestsCollection } = await import('@/lib/mongodb/collections');
    const joinRequestsCollection = await getJoinRequestsCollection();

    const newRequest = {
      courseId: course._id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      externalId: externalId?.trim() || undefined,
      status: 'pending' as const,
      createdAt: new Date(),
    };

    await joinRequestsCollection.insertOne(newRequest as any);

    return NextResponse.json({ 
      success: true,
      message: 'Solicitud enviada correctamente. El docente la revisará pronto.' 
    });
  } catch (error) {
    console.error('Error creating join request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
