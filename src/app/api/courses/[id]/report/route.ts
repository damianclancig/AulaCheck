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

    // Parsear opciones
    const includeDni = searchParams.get('dni') === 'true';
    const includeEmail = searchParams.get('email') === 'true';
    const includePhone = searchParams.get('phone') === 'true';
    const includeGrades = searchParams.get('grades') === 'true';
    const includeAttendanceStats = searchParams.get('attendanceStats') === 'true';
    const includeAttendanceDetails = searchParams.get('attendanceDetails') === 'true';

    // Si no se selecciona nada, incluir todo por defecto (fallback)
    const isDefault = !includeDni && !includeEmail && !includePhone && !includeGrades && !includeAttendanceStats && !includeAttendanceDetails;

    const showDni = includeDni || isDefault;
    const showEmail = includeEmail || isDefault;
    const showPhone = includePhone || isDefault;
    const showGrades = includeGrades || isDefault;
    const showAttendanceStats = includeAttendanceStats || isDefault;
    const showAttendanceDetails = includeAttendanceDetails;

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
      .sort({ lastName: 1, firstName: 1 }) // Ordenar alfabéticamente
      .toArray();

    // Calcular métricas si es necesario
    let attendanceMap = new Map<string, number>();
    if (showAttendanceStats) {
      attendanceMap = await calculateAllStudentsAttendance(courseId);
    }

    let gradesMap = new Map<string, number | null>();
    if (showGrades) {
      gradesMap = await calculateAllStudentsAverages(courseId);
    }

    // Obtener detalles de asistencia si es necesario
    let attendanceDates: string[] = [];
    let attendanceRecords: Record<string, Record<string, string>> = {}; // studentId -> date -> status

    if (showAttendanceDetails) {
      const attendanceCollection = await import('@/lib/mongodb/collections').then(m => m.getAttendanceCollection());
      const allRecords = await attendanceCollection
        .find({ courseId })
        .sort({ date: 1 })
        .toArray();

      // Extraer fechas únicas
      const datesSet = new Set<string>();
      allRecords.forEach(record => {
        if (record.date) datesSet.add(record.date);
      });
      attendanceDates = Array.from(datesSet).sort();

      // Mapear registros
      allRecords.forEach(record => {
        if (!record.studentId) return;
        const sId = record.studentId.toString();
        if (!attendanceRecords[sId]) attendanceRecords[sId] = {};
        attendanceRecords[sId][record.date] = record.status;
      });
    }

    // Generar CSV
    const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    let csv = `Institución: AulaCheck,Curso: ${course.name},Fecha: ${today}\n\n`;

    const headers: string[] = ['Apellido', 'Nombre']; // Siempre incluidos

    if (showDni) headers.push('Legajo/DNI');
    if (showEmail) headers.push('Email');
    if (showPhone) headers.push('Teléfono');

    if (showAttendanceStats) {
      headers.push('Asistencia (%)');
      headers.push('Inasistencia (%)');
    }
    if (showGrades) headers.push('Promedio');

    if (showAttendanceDetails) {
      attendanceDates.forEach(date => {
        // Formatear fecha para el header (YYYY-MM-DD -> DD/MM)
        const [year, month, day] = date.split('-');
        headers.push(`${day}/${month}`);
      });
    }

    csv += headers.join(',') + '\n';

    for (const student of students) {
      const row: string[] = [
        `"${student.lastName}"`,
        `"${student.firstName}"`
      ];

      if (showDni) row.push(`"${student.externalId || ''}"`);
      if (showEmail) row.push(`"${student.email || ''}"`);
      if (showPhone) row.push(`"${student.phone || ''}"`);

      if (showAttendanceStats) {
        const attendance = attendanceMap.get(student._id.toString()) || 0;
        const attendancePercent = attendance * 100;
        const absencePercent = 100 - attendancePercent;

        row.push(attendancePercent.toFixed(2));
        row.push(absencePercent.toFixed(2));
      }

      if (showGrades) {
        const average = gradesMap.get(student._id.toString());
        const averageStr = average !== null && average !== undefined ? average.toFixed(2) : 'N/A';
        row.push(averageStr);
      }

      if (showAttendanceDetails) {
        const studentRecords = attendanceRecords[student._id.toString()] || {};
        attendanceDates.forEach(date => {
          const status = studentRecords[date];
          let statusSymbol = '-';
          if (status === 'present') statusSymbol = 'P';
          else if (status === 'absent') statusSymbol = 'A';
          else if (status === 'late') statusSymbol = 'T';
          row.push(statusSymbol);
        });
      }

      csv += row.join(',') + '\n';
    }

    // Retornar CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${course.name.replace(/[^a-z0-9]/gi, '_')}_reporte.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
