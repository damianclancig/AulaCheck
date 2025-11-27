import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import { getCoursesCollection } from '@/lib/mongodb/collections';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Generate random 8-character alphanumeric code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/courses/[id]/join-code - Generate or regenerate join code
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

    const coursesCollection = await getCoursesCollection();
    
    // Generate unique code
    let joinCode: string;
    let isUnique = false;
    
    while (!isUnique) {
      joinCode = generateJoinCode();
      const existing = await coursesCollection.findOne({ joinCode });
      if (!existing) {
        isUnique = true;
      }
    }

    // Update course with new join code and enable join requests
    await coursesCollection.updateOne(
      { _id: courseId },
      { 
        $set: { 
          joinCode: joinCode!,
          allowJoinRequests: true 
        } 
      }
    );

    return NextResponse.json({ joinCode: joinCode! });
  } catch (error) {
    console.error('Error generating join code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/courses/[id]/join-code - Disable join requests
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const coursesCollection = await getCoursesCollection();
    
    // Disable join requests (keep code for history)
    await coursesCollection.updateOne(
      { _id: courseId },
      { $set: { allowJoinRequests: false } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disabling join requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
