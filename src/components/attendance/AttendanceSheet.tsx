'use client';

import { Student } from '@/types/models';
import { AttendanceIcon } from './AttendanceIcon';
import { useEffect, useRef, useState } from 'react';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceSheetProps {
  students: Student[];
  dates: string[];
  records: Record<string, Record<string, AttendanceStatus>>;
}

export function AttendanceSheet({ students, dates, records }: AttendanceSheetProps) {
  const [visibleStudents, setVisibleStudents] = useState(20);
  const observerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleStudents < students.length) {
          setVisibleStudents(prev => Math.min(prev + 20, students.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [visibleStudents, students.length]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const displayedStudents = students.slice(0, visibleStudents);

  if (dates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hay registros de asistencia para este curso.</p>
        <p className="text-sm mt-2">Comienza tomando asistencia para ver la planilla.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info header */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{students.length} alumnos</span>
        <span>{dates.length} clases registradas</span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Alumno
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  title={new Date(date).toLocaleDateString('es-AR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                >
                  {formatDate(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedStudents.map((student) => (
              <tr key={student._id.toString()} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                  {student.lastName}, {student.firstName}
                </td>
                {dates.map((date) => {
                  const status = records[student._id.toString()]?.[date];
                  return (
                    <td key={date} className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <AttendanceIcon status={status} size="md" />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Infinite scroll trigger */}
        {visibleStudents < students.length && (
          <div ref={observerRef} className="h-10 flex items-center justify-center text-sm text-gray-400">
            Cargando más alumnos...
          </div>
        )}
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-4">
        {displayedStudents.map((student) => (
          <div key={student._id.toString()} className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              {student.lastName}, {student.firstName}
            </h4>
            <div className="space-y-2">
              {dates.slice(0, 5).map((date) => {
                const status = records[student._id.toString()]?.[date];
                return (
                  <div key={date} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <AttendanceIcon status={status} size="sm" />
                  </div>
                );
              })}
              {dates.length > 5 && (
                <p className="text-xs text-gray-400 mt-2">
                  +{dates.length - 5} clases más
                </p>
              )}
            </div>
          </div>
        ))}
        
        {/* Infinite scroll trigger */}
        {visibleStudents < students.length && (
          <div ref={observerRef} className="h-10 flex items-center justify-center text-sm text-gray-400">
            Cargando más alumnos...
          </div>
        )}
      </div>
    </div>
  );
}
