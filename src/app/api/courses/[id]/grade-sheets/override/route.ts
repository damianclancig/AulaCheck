import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getGradeSheetMetaCollection } from '@/lib/mongodb/collections';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/courses/[id]/grade-sheets/override
 * Guarda un override manual de estado (TEA/TEP/TED o condición final).
 * Body: { studentId, year, semester1Override?, semester2Override?, annualForcedCondition? }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const {
      studentId,
      year,
      semester1Override,
      semester2Override,
      annualForcedCondition,
    } = body as {
      studentId: string;
      year: number;
      semester1Override?: string | null;
      semester2Override?: string | null;
      annualForcedCondition?: string | null;
    };

    if (!studentId || !year) {
      return NextResponse.json(
        { error: 'studentId y year son requeridos' },
        { status: 400 }
      );
    }

    // Validar valores permitidos
    const validStatuses = ['TEA', 'TEP', 'TED', null];
    const validConditions = ['APPROVED', 'DECEMBER', 'FEBRUARY', null];

    if (semester1Override !== undefined && !validStatuses.includes(semester1Override)) {
      return NextResponse.json({ error: 'semester1Override inválido' }, { status: 400 });
    }
    if (semester2Override !== undefined && !validStatuses.includes(semester2Override)) {
      return NextResponse.json({ error: 'semester2Override inválido' }, { status: 400 });
    }
    if (annualForcedCondition !== undefined && !validConditions.includes(annualForcedCondition)) {
      return NextResponse.json({ error: 'annualForcedCondition inválido' }, { status: 400 });
    }

    const metaCollection = await getGradeSheetMetaCollection();

    const updateFields: Record<string, unknown> = { updatedAt: new Date(), isManual: true };
    if (semester1Override !== undefined) updateFields.semester1Override = semester1Override;
    if (semester2Override !== undefined) updateFields.semester2Override = semester2Override;
    if (annualForcedCondition !== undefined) updateFields.annualForcedCondition = annualForcedCondition;

    await metaCollection.updateOne(
      { courseId, studentId: new ObjectId(studentId), year },
      { $set: updateFields },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving override:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
