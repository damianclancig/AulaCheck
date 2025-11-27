import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyStudentAccess } from '@/lib/auth/ownership';
import { getStudentsCollection } from '@/lib/mongodb/collections';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PUT /api/students/[id] - Editar datos del alumno
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request);
    if (!requireAuth(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const studentId = new ObjectId(id);

    // Verificar que el usuario tiene acceso al alumno
    const hasAccess = await verifyStudentAccess(studentId, user.uid);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, externalId } = body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (externalId !== undefined) updateData.externalId = externalId;

    const studentsCollection = await getStudentsCollection();
    await studentsCollection.updateOne(
      { _id: studentId },
      { $set: updateData }
    );

    const updatedStudent = await studentsCollection.findOne({ _id: studentId });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
