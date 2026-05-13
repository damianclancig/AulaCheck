import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyCourseOwnership } from '@/lib/auth/ownership';
import {
  getCoursesCollection,
  getEnrollmentsCollection,
  getStudentsCollection,
} from '@/lib/mongodb/collections';
import { calculateAllStudentsAttendance } from '@/lib/calculations';
import { getAnnualClose } from '@/lib/calculations/gradeSheets';
const ExcelJS = require('exceljs');

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/courses/[id]/report - Exportar reporte CSV
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = new ObjectId(id);
    const userId = session.user.id;

    const isOwner = await verifyCourseOwnership(courseId, userId);
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

    let annualCloseRows: any[] = [];
    if (showGrades) {
      const year = new Date().getFullYear();
      annualCloseRows = await getAnnualClose(courseId, year);
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
        if (!record.date) return;
        const date = record.date as any;
        const sId = record.studentId.toString();
        if (!attendanceRecords[sId]) attendanceRecords[sId] = {};
        attendanceRecords[sId][date] = record.status as string;
      });
    }

    const format = searchParams.get('format') === 'excel' ? 'excel' : 'csv';
    const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const headers: string[] = ['Apellido', 'Nombre']; // Siempre incluidos
    if (showDni) headers.push('Legajo/DNI');
    if (showEmail) headers.push('Email');
    if (showPhone) headers.push('Teléfono');

    if (showAttendanceStats) {
      headers.push('Asistencia (%)');
      headers.push('Inasistencia (%)');
    }
    if (showGrades) {
      headers.push('Prom. 1er Cuat.');
      headers.push('Estado C1');
      headers.push('Prom. 2do Cuat.');
      headers.push('Estado C2');
      headers.push('Prom. Final');
      headers.push('Condición Final');
    }

    if (showAttendanceDetails) {
      attendanceDates.forEach(date => {
        // Formatear fecha para el header (YYYY-MM-DD -> DD/MM)
        const [year, month, day] = date.split('-');
        headers.push(`${day}/${month}`);
      });
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte');

      const thinBorder: any = {
        top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        right: { style: 'thin', color: { argb: 'FF9CA3AF' } }
      };

      // Add main header
      const titleRow = worksheet.addRow(['PLANILLA DE SEGUIMIENTO Y CALIFICACIONES']);
      titleRow.font = { size: 16, bold: true, color: { argb: 'FF111827' } }; // Gray 900
      titleRow.height = 30;
      titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      const instRow = worksheet.addRow(['Institución:', course.institutionName || 'Sin Institución']);
      instRow.getCell(1).font = { bold: true, color: { argb: 'FF374151' } };

      const courseRow = worksheet.addRow(['Curso:', course.name]);
      courseRow.getCell(1).font = { bold: true, color: { argb: 'FF374151' } };
      
      const dateRow = worksheet.addRow(['Fecha de Exportación:', today]);
      dateRow.getCell(1).font = { bold: true, color: { argb: 'FF374151' } };

      worksheet.addRow([]); // Spacer

      worksheet.addRow(headers);
      const headerRowIndex = worksheet.rowCount;

      // Define columns to apply auto-width and styles easily later
      headers.forEach((h, i) => {
        let width = 12; // default
        if (h === 'Apellido' || h === 'Nombre') width = 20;
        else if (h === 'Email') width = 28;
        else if (h === 'Condición Final' || h === 'Legajo/DNI' || h === 'Teléfono') width = 18;
        else if (h.includes('Prom.') || h.includes('Estado')) width = 15;
        worksheet.getColumn(i + 1).width = width;
      });

      // Find indices for Status columns
      const s1Index = headers.indexOf('Estado C1') + 1; // 1-based index in ExcelJS
      const s2Index = headers.indexOf('Estado C2') + 1;

      let rowIndex = 0;
      for (const student of students) {
        rowIndex++;
        const rowDataArray: any[] = [student.lastName, student.firstName];

        if (showDni) rowDataArray.push(student.externalId || '');
        if (showEmail) rowDataArray.push(student.email || '');
        if (showPhone) rowDataArray.push(student.phone || '');

        if (showAttendanceStats) {
          const attendance = attendanceMap.get(student._id.toString()) || 0;
          const attendancePercent = Math.round(attendance * 100);
          const absencePercent = 100 - attendancePercent;
          rowDataArray.push(attendancePercent);
          rowDataArray.push(absencePercent);
        }

        if (showGrades) {
          const rowData = annualCloseRows.find(r => r.studentId === student._id.toString());
          if (rowData) {
            const conditionMap: Record<string, string> = {
              APPROVED: 'Aprobado',
              DECEMBER: 'A Diciembre',
              FEBRUARY: 'A Febrero'
            };
            const rawCondition = rowData.forcedCondition || rowData.calculatedCondition;
            const translatedCondition = conditionMap[rawCondition] || rawCondition;

            rowDataArray.push(rowData.semester1Average !== null ? Number(rowData.semester1Average.toFixed(2)) : '-');
            rowDataArray.push(rowData.semester1Status);
            rowDataArray.push(rowData.semester2Average !== null ? Number(rowData.semester2Average.toFixed(2)) : '-');
            rowDataArray.push(rowData.semester2Status);
            rowDataArray.push(rowData.finalAverage !== null ? Number(rowData.finalAverage.toFixed(2)) : '-');
            rowDataArray.push(translatedCondition);
          } else {
            rowDataArray.push('-', '-', '-', '-', '-', '-');
          }
        }

        if (showAttendanceDetails) {
          const studentRecords = attendanceRecords[student._id.toString()] || {};
          attendanceDates.forEach(date => {
            const status = studentRecords[date];
            let statusSymbol = '-';
            if (status === 'present') statusSymbol = 'P';
            else if (status === 'absent') statusSymbol = 'A';
            else if (status === 'late') statusSymbol = 'T';
            rowDataArray.push(statusSymbol);
          });
        }

        const addedRow = worksheet.addRow(rowDataArray);

        // Apply borders, alignment and zebra striping (alternate rows)
        addedRow.eachCell((cell: any, colNumber: number) => {
          cell.border = thinBorder;
          
          if (colNumber > 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }

          if (rowIndex % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }; // Tailwind Gray-200
          }
        });

        // Apply colors to status columns
        if (showGrades) {
          const applyStatusColor = (cellIndex: number) => {
            if (cellIndex > 0) {
              const cell = addedRow.getCell(cellIndex);
              const val = cell.value?.toString() || '';
              if (val === 'TEA') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Blue 100
                cell.font = { color: { argb: 'FF1E40AF' }, bold: true }; // Blue 800
              } else if (val === 'TEP') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Green 100
                cell.font = { color: { argb: 'FF166534' }, bold: true }; // Green 800
              } else if (val === 'TED') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red 100
                cell.font = { color: { argb: 'FF991B1B' }, bold: true }; // Red 800
              }
            }
          };
          applyStatusColor(s1Index);
          applyStatusColor(s2Index);
        }
      }

      // Format headers
      const headerRow = worksheet.getRow(headerRowIndex);
      headerRow.eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: 'FF111827' } }; // Gray 900
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } }; // Gray 300
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Add Footer with Logo
      worksheet.addRow([]);
      worksheet.addRow([]);
      
      const footerRowIndex = worksheet.rowCount + 1;
      const fs = require('fs');
      const path = require('path');
      
      try {
        const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo.png');
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          const logoId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
          });
          worksheet.addImage(logoId, {
            tl: { col: 0, row: footerRowIndex - 1 }, // Column A
            ext: { width: 120, height: 34 } // Proporcional al original 927x265 y ajustado para que no tape la columna B
          });
        }
      } catch (e) {
        console.error('No se pudo cargar el logo para el reporte', e);
      }

      const footerRow = worksheet.getRow(footerRowIndex);
      footerRow.getCell(2).value = 'Reporte generado con AulaCheck';
      footerRow.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF4F46E5' } }; // Indigo 600
      footerRow.getCell(2).alignment = { vertical: 'bottom', horizontal: 'left' };
      footerRow.height = 25;

      const linkRowIndex = footerRowIndex + 1;
      const linkRow = worksheet.getRow(linkRowIndex);
      linkRow.getCell(2).value = { text: 'http://aulacheck.clancig.com.ar', hyperlink: 'http://aulacheck.clancig.com.ar' };
      linkRow.getCell(2).font = { color: { argb: 'FF2563EB' }, underline: true }; // Blue 600
      linkRow.getCell(2).alignment = { vertical: 'top', horizontal: 'left' };
      linkRow.height = 25;

      const buffer = await workbook.xlsx.writeBuffer();
      const uint8Array = new Uint8Array(buffer as ArrayBuffer);
      const institutionSafe = (course.institutionName || 'Institucion').replace(/[^a-z0-9]/gi, '_');
      const courseSafe = course.name.replace(/[^a-z0-9]/gi, '_');
      const dateSafe = today.replace(/\//g, '-');
      const fileName = `${institutionSafe}_${courseSafe}_${dateSafe}`;

      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
        },
      });
    }

    // Default CSV Generate
    let csv = `Institución: ${course.institutionName || 'Sin Institución'},Curso: ${course.name},Fecha: ${today}\n\n`;
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
        const attendancePercent = Math.round(attendance * 100);
        const absencePercent = 100 - attendancePercent;

        row.push(attendancePercent.toString());
        row.push(absencePercent.toString());
      }

      if (showGrades) {
        const rowData = annualCloseRows.find(r => r.studentId === student._id.toString());
        if (rowData) {
          const conditionMap: Record<string, string> = {
            APPROVED: 'Aprobado',
            DECEMBER: 'A Diciembre',
            FEBRUARY: 'A Febrero'
          };
          const rawCondition = rowData.forcedCondition || rowData.calculatedCondition;
          const translatedCondition = conditionMap[rawCondition] || rawCondition;

          row.push(rowData.semester1Average !== null ? rowData.semester1Average.toFixed(2) : '-');
          row.push(`"${rowData.semester1Status}"`);
          row.push(rowData.semester2Average !== null ? rowData.semester2Average.toFixed(2) : '-');
          row.push(`"${rowData.semester2Status}"`);
          row.push(rowData.finalAverage !== null ? rowData.finalAverage.toFixed(2) : '-');
          row.push(`"${translatedCondition}"`);
        } else {
          row.push('-', '-', '-', '-', '-', '-');
        }
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
    const institutionSafe = (course.institutionName || 'Institucion').replace(/[^a-z0-9]/gi, '_');
    const courseSafe = course.name.replace(/[^a-z0-9]/gi, '_');
    const dateSafe = today.replace(/\//g, '-');
    const fileName = `${institutionSafe}_${courseSafe}_${dateSafe}`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', stack: error.stack }, { status: 500 });
  }
}
