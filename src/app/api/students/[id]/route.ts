import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const studentId = new ObjectId(id);
    const userId = session.user.id;

    // Verificar que el usuario tiene acceso al alumno
    const hasAccess = await verifyStudentAccess(studentId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, externalId, requiresAttention, isRepeating, notes } = body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (externalId !== undefined) updateData.externalId = externalId;
    if (requiresAttention !== undefined) updateData.requiresAttention = requiresAttention;
    if (isRepeating !== undefined) updateData.isRepeating = isRepeating;
    if (notes !== undefined) updateData.notes = notes;

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
