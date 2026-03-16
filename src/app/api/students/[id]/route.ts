import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { verifyStudentAccess } from '@/lib/auth/ownership'
import {
  getAttendanceCollection,
  getCoursesCollection,
  getEnrollmentsCollection,
  getGradeSheetMetaCollection,
  getGradesCollection,
  getStudentsCollection,
} from '@/lib/mongodb/collections'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PUT /api/students/[id] - Editar datos del alumno
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const studentId = new ObjectId(id)
    const userId = session.user.id

    // Verificar que el usuario tiene acceso al alumno
    const hasAccess = await verifyStudentAccess(studentId, userId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, externalId, requiresAttention, isRepeating, notes } =
      body

    const updateData: any = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (externalId !== undefined) updateData.externalId = externalId
    if (requiresAttention !== undefined) updateData.requiresAttention = requiresAttention
    if (isRepeating !== undefined) updateData.isRepeating = isRepeating
    if (notes !== undefined) updateData.notes = notes

    const studentsCollection = await getStudentsCollection()
    await studentsCollection.updateOne({ _id: studentId }, { $set: updateData })

    const updatedStudent = await studentsCollection.findOne({ _id: studentId })

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/students/[id] - Eliminar definitivamente alumno y registros relacionados
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const studentId = new ObjectId(id)
    const userId = session.user.id

    const coursesCollection = await getCoursesCollection()
    const enrollmentsCollection = await getEnrollmentsCollection()
    const attendanceCollection = await getAttendanceCollection()
    const gradesCollection = await getGradesCollection()
    const gradeSheetMetaCollection = await getGradeSheetMetaCollection()
    const studentsCollection = await getStudentsCollection()

    // Limitar la operación a cursos del docente autenticado.
    const ownedCourses = await coursesCollection
      .find({ ownerId: userId }, { projection: { _id: 1 } })
      .toArray()

    const ownedCourseIds = ownedCourses.map((course) => course._id)

    if (ownedCourseIds.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const enrollmentsInOwnedCourses = await enrollmentsCollection
      .find({
        studentId,
        courseId: { $in: ownedCourseIds },
      })
      .toArray()

    if (enrollmentsInOwnedCourses.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const activeCountsByCourse = enrollmentsInOwnedCourses.reduce<Record<string, number>>(
      (acc, enrollment) => {
        if (enrollment.status === 'active') {
          const key = enrollment.courseId.toString()
          acc[key] = (acc[key] || 0) + 1
        }
        return acc
      },
      {},
    )

    await Promise.all([
      attendanceCollection.deleteMany({
        studentId,
        courseId: { $in: ownedCourseIds },
      }),
      gradesCollection.deleteMany({
        studentId,
        courseId: { $in: ownedCourseIds },
      }),
      gradeSheetMetaCollection.deleteMany({
        studentId,
        courseId: { $in: ownedCourseIds },
      }),
      enrollmentsCollection.deleteMany({
        studentId,
        courseId: { $in: ownedCourseIds },
      }),
    ])

    const courseUpdates = Object.entries(activeCountsByCourse).map(([courseId, activeCount]) =>
      coursesCollection.updateOne(
        { _id: new ObjectId(courseId) },
        { $inc: { 'meta.studentCount': -activeCount } },
      ),
    )

    if (courseUpdates.length > 0) {
      await Promise.all(courseUpdates)
    }

    const remainingEnrollments = await enrollmentsCollection.countDocuments({ studentId })

    if (remainingEnrollments === 0) {
      await studentsCollection.deleteOne({ _id: studentId })
    }

    return NextResponse.json({
      success: true,
      removedFromOwnedCourses: true,
      studentDeleted: remainingEnrollments === 0,
    })
  } catch (error) {
    console.error('Error deleting student permanently:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
