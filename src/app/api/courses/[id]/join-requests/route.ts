import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getJoinRequestsCollection, getStudentsCollection, getEnrollmentsCollection } from '@/lib/mongodb/collections';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/courses/[id]/join-requests - List pending join requests
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

    const joinRequestsCollection = await getJoinRequestsCollection();
    const requests = await joinRequestsCollection
      .find({ courseId, status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/courses/[id]/join-requests - Process join request (approve/reject)
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
    const { requestId, action } = body; // action: 'approve' | 'reject'

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const joinRequestsCollection = await getJoinRequestsCollection();
    const request_doc = await joinRequestsCollection.findOne({ 
      _id: new ObjectId(requestId),
      courseId 
    });

    if (!request_doc) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Create student
      const studentsCollection = await getStudentsCollection();
      const newStudent = {
        firstName: request_doc.firstName,
        lastName: request_doc.lastName,
        email: request_doc.email,
        phone: request_doc.phone,
        externalId: request_doc.externalId,
        createdAt: new Date(),
      };

      const studentResult = await studentsCollection.insertOne(newStudent as any);

      // Create enrollment
      const enrollmentsCollection = await getEnrollmentsCollection();
      await enrollmentsCollection.insertOne({
        courseId,
        studentId: studentResult.insertedId,
        enrollDate: new Date(),
        status: 'active',
      } as any);

      // Mark request as approved
      await joinRequestsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        { 
          $set: { 
            status: 'approved',
            processedAt: new Date(),
            processedBy: user.uid 
          } 
        }
      );

      return NextResponse.json({ success: true, message: 'Alumno agregado correctamente' });
    } else {
      // Mark request as rejected
      await joinRequestsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        { 
          $set: { 
            status: 'rejected',
            processedAt: new Date(),
            processedBy: user.uid 
          } 
        }
      );

      return NextResponse.json({ success: true, message: 'Solicitud rechazada' });
    }
  } catch (error) {
    console.error('Error processing join request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
