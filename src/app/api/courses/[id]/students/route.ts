import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import {
  getCoursesCollection,
  getStudentsCollection,
  getEnrollmentsCollection,
} from '@/lib/mongodb/collections';
import { calculateAllStudentsAttendance, calculateAllStudentsAverages } from '@/lib/calculations';
import { Student, Enrollment } from '@/types/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/courses/[id]/students - Lista alumnos matriculados
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

    const enrollmentsCollection = await getEnrollmentsCollection();
    const studentsCollection = await getStudentsCollection();

    // Obtener enrollments (activos e inactivos)
    const enrollments = await enrollmentsCollection
      .find({ courseId })
      .toArray();

    if (enrollments.length === 0) {
      return NextResponse.json([]);
    }

    // Obtener datos de alumnos
    const studentIds = enrollments.map(e => e.studentId);
    const students = await studentsCollection
      .find({ _id: { $in: studentIds } })
      .toArray();

    // Calcular métricas
    const attendanceMap = await calculateAllStudentsAttendance(courseId);
    const gradesMap = await calculateAllStudentsAverages(courseId);

    // Combinar datos
    const studentsWithMetrics = students.map(student => {
      const enrollment = enrollments.find(e => e.studentId.toString() === student._id.toString());
      return {
        ...student,
        attendancePercentage: attendanceMap.get(student._id.toString()) || 0,
        gradeAverage: gradesMap.get(student._id.toString()) || null,
        enrollmentStatus: enrollment?.status || 'active', // Default to active if missing (shouldn't happen)
      };
    });

    return NextResponse.json(studentsWithMetrics);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/courses/[id]/students - Agregar alumno al curso
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
    const { studentId, firstName, lastName, email, phone, externalId } = body;

    const studentsCollection = await getStudentsCollection();
    const enrollmentsCollection = await getEnrollmentsCollection();
    const coursesCollection = await getCoursesCollection();

    let finalStudentId: ObjectId;

    if (studentId) {
      // Matricular alumno existente
      finalStudentId = new ObjectId(studentId);

      // Verificar que el alumno existe
      const existingStudent = await studentsCollection.findOne({ _id: finalStudentId });
      if (!existingStudent) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
    } else {
      // Crear nuevo alumno
      if (!firstName || !lastName) {
        return NextResponse.json(
          { error: 'firstName and lastName are required for new students' },
          { status: 400 }
        );
      }

      const newStudent: Omit<Student, '_id'> = {
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        externalId: externalId || undefined,
        createdAt: new Date(),
      };

      const result = await studentsCollection.insertOne(newStudent as Student);
      finalStudentId = result.insertedId;
    }

    // Verificar si ya está matriculado
    const existingEnrollment = await enrollmentsCollection.findOne({
      courseId,
      studentId: finalStudentId,
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        return NextResponse.json(
          { error: 'Student already enrolled in this course' },
          { status: 400 }
        );
      } else {
        // Reactivar enrollment
        await enrollmentsCollection.updateOne(
          { _id: existingEnrollment._id },
          { $set: { status: 'active', enrollDate: new Date() } }
        );
      }
    } else {
      // Crear nuevo enrollment
      const newEnrollment: Omit<Enrollment, '_id'> = {
        courseId,
        studentId: finalStudentId,
        enrollDate: new Date(),
        status: 'active',
      };

      await enrollmentsCollection.insertOne(newEnrollment as Enrollment);
    }

    // Actualizar contador de alumnos
    await coursesCollection.updateOne(
      { _id: courseId },
      { $inc: { 'meta.studentCount': 1 } }
    );

    // Retornar alumno creado/matriculado
    const student = await studentsCollection.findOne({ _id: finalStudentId });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Error adding student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
