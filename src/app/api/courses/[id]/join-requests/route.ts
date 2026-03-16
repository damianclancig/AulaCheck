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

const NAME_SIMILARITY_THRESHOLD = 0.8

function normalizeComparableValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function buildFullName(firstName: string, lastName: string) {
  return normalizeComparableValue(`${firstName} ${lastName}`)
}

function getNameTokens(value: string) {
  return normalizeComparableValue(value).split(' ').filter(Boolean)
}

function calculateLevenshteinDistance(source: string, target: string) {
  if (source === target) return 0
  if (source.length === 0) return target.length
  if (target.length === 0) return source.length

  const matrix = Array.from({ length: source.length + 1 }, (_, rowIndex) =>
    Array.from({ length: target.length + 1 }, (_, columnIndex) => {
      if (rowIndex === 0) return columnIndex
      if (columnIndex === 0) return rowIndex
      return 0
    }),
  )

  for (let rowIndex = 1; rowIndex <= source.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= target.length; columnIndex += 1) {
      const substitutionCost = source[rowIndex - 1] === target[columnIndex - 1] ? 0 : 1
      matrix[rowIndex][columnIndex] = Math.min(
        matrix[rowIndex - 1][columnIndex] + 1,
        matrix[rowIndex][columnIndex - 1] + 1,
        matrix[rowIndex - 1][columnIndex - 1] + substitutionCost,
      )
    }
  }

  return matrix[source.length][target.length]
}

function calculateStringSimilarity(source: string, target: string) {
  const normalizedSource = normalizeComparableValue(source)
  const normalizedTarget = normalizeComparableValue(target)

  if (!normalizedSource || !normalizedTarget) {
    return 0
  }

  if (normalizedSource === normalizedTarget) {
    return 1
  }

  const maxLength = Math.max(normalizedSource.length, normalizedTarget.length)
  const levenshteinDistance = calculateLevenshteinDistance(normalizedSource, normalizedTarget)

  return maxLength === 0 ? 1 : 1 - levenshteinDistance / maxLength
}

function calculateTokenSimilarity(source: string, target: string) {
  const sourceTokens = getNameTokens(source)
  const targetTokens = getNameTokens(target)

  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return 0
  }

  const averageBestScore = (baseTokens: string[], candidateTokens: string[]) => {
    const totalScore = baseTokens.reduce((sum, token) => {
      const bestTokenScore = candidateTokens.reduce((bestScore, candidateToken) => {
        return Math.max(bestScore, calculateStringSimilarity(token, candidateToken))
      }, 0)

      return sum + bestTokenScore
    }, 0)

    return totalScore / baseTokens.length
  }

  const sourcePerspective = averageBestScore(sourceTokens, targetTokens)
  const targetPerspective = averageBestScore(targetTokens, sourceTokens)

  return (sourcePerspective + targetPerspective) / 2
}

function calculateFieldSimilarity(source: string, target: string) {
  const stringSimilarity = calculateStringSimilarity(source, target)
  const tokenSimilarity = calculateTokenSimilarity(source, target)

  return Number(Math.max(stringSimilarity, tokenSimilarity).toFixed(3))
}

function calculateFullNameSimilarity(
  sourceFirstName: string,
  sourceLastName: string,
  targetFirstName: string,
  targetLastName: string,
) {
  const firstNameSimilarity = calculateFieldSimilarity(sourceFirstName, targetFirstName)
  const lastNameSimilarity = calculateFieldSimilarity(sourceLastName, targetLastName)
  const sourceFullName = buildFullName(sourceFirstName, sourceLastName)
  const targetFullName = buildFullName(targetFirstName, targetLastName)

  if (!sourceFullName || !targetFullName) {
    return 0
  }

  if (sourceFullName === targetFullName) {
    return 1
  }

  const fullNameSimilarity = calculateFieldSimilarity(sourceFullName, targetFullName)

  return Number(
    (firstNameSimilarity * 0.45 + lastNameSimilarity * 0.45 + fullNameSimilarity * 0.1).toFixed(3),
  )
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

    const requestsWithMatches: PendingJoinRequestWithMatches[] = requests.map((pendingRequest) => {
      const enrolledMatches = enrolledStudents.reduce<JoinRequestPossibleDuplicate[]>((matches, student) => {
          const similarityScore = calculateFullNameSimilarity(
            pendingRequest.firstName,
            pendingRequest.lastName,
            student.firstName,
            student.lastName,
          )

          if (similarityScore < NAME_SIMILARITY_THRESHOLD) {
            return matches
          }

          matches.push({
            type: 'enrolledStudent' as const,
            id: student._id.toString(),
            firstName: student.firstName,
            lastName: student.lastName,
            similarityScore,
            email: student.email,
            phone: student.phone,
            externalId: student.externalId,
            enrollmentStatus: enrollmentStatusByStudentId.get(student._id.toString()),
            createdAt: student.createdAt,
          })

          return matches
        }, [])

      const pendingMatches = requests.reduce<JoinRequestPossibleDuplicate[]>((matches, otherPendingRequest) => {
        if (otherPendingRequest._id.toString() === pendingRequest._id.toString()) {
          return matches
        }

          const similarityScore = calculateFullNameSimilarity(
            pendingRequest.firstName,
            pendingRequest.lastName,
            otherPendingRequest.firstName,
            otherPendingRequest.lastName,
          )

          if (similarityScore < NAME_SIMILARITY_THRESHOLD) {
            return matches
          }

          matches.push({
            type: 'pendingRequest' as const,
            id: otherPendingRequest._id.toString(),
            firstName: otherPendingRequest.firstName,
            lastName: otherPendingRequest.lastName,
            similarityScore,
            email: otherPendingRequest.email,
            phone: otherPendingRequest.phone,
            externalId: otherPendingRequest.externalId,
            createdAt: otherPendingRequest.createdAt,
          })

          return matches
        }, [])

      const possibleDuplicates = [...enrolledMatches, ...pendingMatches].sort(
        (left, right) => right.similarityScore - left.similarityScore,
      )

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
