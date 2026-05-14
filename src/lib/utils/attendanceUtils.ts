export type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceStats {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  presentPercentage: string;
  absentPercentage: string;
}

/**
 * Calculates attendance statistics for a single student,
 * excluding dates marked as suspensions.
 */
export function calculateStudentAttendanceStats(
  dates: string[],
  studentRecords: Record<string, AttendanceStatus>,
  suspensions?: Record<string, { reason: string; note?: string }>
): AttendanceStats {
  // Un alumno puede no tener registros en ciertas fechas (ej. si ingresó tarde al curso)
  const validDates = dates.filter((date) => !suspensions?.[date] && studentRecords[date] !== undefined);
  const totalClasses = validDates.length;
  
  const presentCount = validDates.filter(
    (date) => studentRecords[date] === 'present' || studentRecords[date] === 'late'
  ).length;
  
  const absentCount = validDates.filter(
    (date) => studentRecords[date] === 'absent'
  ).length;

  const presentPercentage =
    totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(0) : '0';
  const absentPercentage =
    totalClasses > 0 ? ((absentCount / totalClasses) * 100).toFixed(0) : '0';

  return {
    totalClasses,
    presentCount,
    absentCount,
    presentPercentage,
    absentPercentage,
  };
}
