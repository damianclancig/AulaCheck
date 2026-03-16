import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { verifyCourseOwnership } from '@/lib/auth/ownership'
import {
  getJoinRequestsCollection,
  getStudentsCollection,
  getEnrollmentsCollection,
  getCoursesCollection,
} from '@/lib/mongodb/collections'
import { PendingJoinRequestWithMatches, JoinRequestPossibleDuplicate } from '@/types/models'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

function normalizeComparableValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function buildStudentNameKey(firstName: string, lastName: string) {
  const normalizedFirstName = normalizeComparableValue(firstName)
  const normalizedLastName = normalizeComparableValue(lastName)
  return `${normalizedFirstName}::${normalizedLastName}`
}

// GET /api/courses/[id]/join-requests - List pending join requests
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const courseId = new ObjectId(id)
    const userId = session.user.id

    const isOwner = await verifyCourseOwnership(courseId, userId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const joinRequestsCollection = await getJoinRequestsCollection()
    const studentsCollection = await getStudentsCollection()
    const enrollmentsCollection = await getEnrollmentsCollection()

    const requests = await joinRequestsCollection
      .find({ courseId, status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray()

    const enrollments = await enrollmentsCollection.find({ courseId }).toArray()
    const enrollmentStatusByStudentId = new Map<string, 'active' | 'inactive'>()
    const enrolledStudentIds = Array.from(
      new Set(
        enrollments.map((enrollment) => {
          const studentId = enrollment.studentId.toString()
          enrollmentStatusByStudentId.set(studentId, enrollment.status)
          return studentId
        }),
      ),
    ).map((id) => new ObjectId(id))

    const enrolledStudents =
      enrolledStudentIds.length > 0
        ? await studentsCollection.find({ _id: { $in: enrolledStudentIds } }).toArray()
        : []

    const enrolledStudentsByNameKey = new Map<string, JoinRequestPossibleDuplicate[]>()
    for (const student of enrolledStudents) {
      const nameKey = buildStudentNameKey(student.firstName, student.lastName)
      const matchesForKey = enrolledStudentsByNameKey.get(nameKey) ?? []
      matchesForKey.push({
        type: 'enrolledStudent',
        id: student._id.toString(),
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        externalId: student.externalId,
        enrollmentStatus: enrollmentStatusByStudentId.get(student._id.toString()),
        createdAt: student.createdAt,
      })
      enrolledStudentsByNameKey.set(nameKey, matchesForKey)
    }

    const pendingRequestsByNameKey = new Map<string, JoinRequestPossibleDuplicate[]>()
    for (const pendingRequest of requests) {
      const nameKey = buildStudentNameKey(pendingRequest.firstName, pendingRequest.lastName)
      const matchesForKey = pendingRequestsByNameKey.get(nameKey) ?? []
      matchesForKey.push({
        type: 'pendingRequest',
        id: pendingRequest._id.toString(),
        firstName: pendingRequest.firstName,
        lastName: pendingRequest.lastName,
        email: pendingRequest.email,
        phone: pendingRequest.phone,
        externalId: pendingRequest.externalId,
        createdAt: pendingRequest.createdAt,
      })
      pendingRequestsByNameKey.set(nameKey, matchesForKey)
    }

    const requestsWithMatches: PendingJoinRequestWithMatches[] = requests.map((pendingRequest) => {
      const nameKey = buildStudentNameKey(pendingRequest.firstName, pendingRequest.lastName)
      const enrolledMatches = enrolledStudentsByNameKey.get(nameKey) ?? []
      const pendingMatches = (pendingRequestsByNameKey.get(nameKey) ?? []).filter(
        (match) => match.id !== pendingRequest._id.toString(),
      )

      const possibleDuplicates = [...enrolledMatches, ...pendingMatches]

      return {
        ...pendingRequest,
        hasPossibleDuplicates: possibleDuplicates.length > 0,
        possibleDuplicates,
      }
    })

    return NextResponse.json(requestsWithMatches)
  } catch (error) {
    console.error('Error fetching join requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/courses/[id]/join-requests - Process join request (approve/reject)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const courseId = new ObjectId(id)
    const userId = session.user.id

    const isOwner = await verifyCourseOwnership(courseId, userId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { requestId, action } = body // action: 'approve' | 'reject'

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const joinRequestsCollection = await getJoinRequestsCollection()
    const request_doc = await joinRequestsCollection.findOne({
      _id: new ObjectId(requestId),
      courseId,
    })

    if (!request_doc) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Create student
      const studentsCollection = await getStudentsCollection()
      const newStudent = {
        firstName: request_doc.firstName,
        lastName: request_doc.lastName,
        email: request_doc.email,
        phone: request_doc.phone,
        externalId: request_doc.externalId,
        createdAt: new Date(),
      }

      const studentResult = await studentsCollection.insertOne(newStudent as any)

      // Create enrollment
      const enrollmentsCollection = await getEnrollmentsCollection()
      await enrollmentsCollection.insertOne({
        courseId,
        studentId: studentResult.insertedId,
        enrollDate: new Date(),
        status: 'active',
      } as any)

      // Mark request as approved
      await joinRequestsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: 'approved',
            processedAt: new Date(),
            processedBy: userId,
          },
        },
      )

      // Actualizar contador de alumnos en el curso
      const coursesCollection = await getCoursesCollection()
      await coursesCollection.updateOne({ _id: courseId }, { $inc: { 'meta.studentCount': 1 } })

      return NextResponse.json({ success: true, message: 'Alumno agregado correctamente' })
    } else {
      // Mark request as rejected
      await joinRequestsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: 'rejected',
            processedAt: new Date(),
            processedBy: userId,
          },
        },
      )

      return NextResponse.json({ success: true, message: 'Solicitud rechazada' })
    }
  } catch (error) {
    console.error('Error processing join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
