import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest, requireAuth } from '@/lib/auth/middleware';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import {
  getCoursesCollection,
  getEnrollmentsCollection,
  getStudentsCollection,
} from '@/lib/mongodb/collections';
import { calculateAllStudentsAttendance, calculateAllStudentsAverages } from '@/lib/calculations';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/courses/[id]/report - Exportar reporte CSV
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'attendance';

    const coursesCollection = await getCoursesCollection();
    const enrollmentsCollection = await getEnrollmentsCollection();
    const studentsCollection = await getStudentsCollection();

    // Obtener curso
    const course = await coursesCollection.findOne({ _id: courseId });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Obtener alumnos
    const enrollments = await enrollmentsCollection
      .find({ courseId, status: 'active' })
      .toArray();

    const studentIds = enrollments.map(e => e.studentId);
    const students = await studentsCollection
      .find({ _id: { $in: studentIds } })
      .toArray();

    // Calcular métricas
    const attendanceMap = await calculateAllStudentsAttendance(courseId);
    const gradesMap = await calculateAllStudentsAverages(courseId);

    // Generar CSV
    let csv = '';

    if (type === 'attendance') {
      // CSV de asistencia
      csv = 'Apellido,Nombre,Legajo,Email,Teléfono,Asistencia (%)\n';
      
      for (const student of students) {
        const attendance = attendanceMap.get(student._id.toString()) || 0;
        const attendancePercent = (attendance * 100).toFixed(2);
        
        csv += `"${student.lastName}","${student.firstName}","${student.externalId || ''}","${student.email || ''}","${student.phone || ''}",${attendancePercent}\n`;
      }
    } else if (type === 'grades') {
      // CSV de calificaciones
      csv = 'Apellido,Nombre,Legajo,Email,Promedio\n';
      
      for (const student of students) {
        const average = gradesMap.get(student._id.toString());
        const averageStr = average !== null && average !== undefined ? average.toFixed(2) : 'N/A';
        
        csv += `"${student.lastName}","${student.firstName}","${student.externalId || ''}","${student.email || ''}",${averageStr}\n`;
      }
    } else {
      // CSV completo
      csv = 'Apellido,Nombre,Legajo,Email,Teléfono,Asistencia (%),Promedio\n';
      
      for (const student of students) {
        const attendance = attendanceMap.get(student._id.toString()) || 0;
        const attendancePercent = (attendance * 100).toFixed(2);
        const average = gradesMap.get(student._id.toString());
        const averageStr = average !== null && average !== undefined ? average.toFixed(2) : 'N/A';
        
        csv += `"${student.lastName}","${student.firstName}","${student.externalId || ''}","${student.email || ''}","${student.phone || ''}",${attendancePercent},${averageStr}\n`;
      }
    }

    // Retornar CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${course.name.replace(/[^a-z0-9]/gi, '_')}_${type}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
