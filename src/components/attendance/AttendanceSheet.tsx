'use client';

import { Student } from '@/types/models';
import { AttendanceIcon } from './AttendanceIcon';
import { useEffect, useRef, useState } from 'react';
import { Check, XCircle, Clock, X as XIcon, Info } from 'lucide-react';
import { useParams } from 'next/navigation';
import { auth } from '@/lib/firebase/client';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceSheetProps {
  students: Student[];
  dates: string[];
  records: Record<string, Record<string, AttendanceStatus>>;
  onUpdate?: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  studentId: string;
  date: string;
  currentStatus?: AttendanceStatus;
}

export function AttendanceSheet({ students, dates, records, onUpdate }: AttendanceSheetProps) {
  const params = useParams();
  const courseId = params.id as string;
  const [visibleStudents, setVisibleStudents] = useState(20);
  const observerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    studentId: '',
    date: '',
  });
  const [updating, setUpdating] = useState(false);

  // Infinite scroll logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const totalStudents = students.length;
        if (entries[0].isIntersecting && visibleStudents < totalStudents) {
          setVisibleStudents(prev => Math.min(prev + 20, totalStudents));
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [visibleStudents, students.length]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  // Sort students alphabetically by last name, then first name
  const sortedStudents = [...students].sort((a, b) => {
    const lastNameCompare = a.lastName.localeCompare(b.lastName);
    return lastNameCompare !== 0 ? lastNameCompare : a.firstName.localeCompare(b.firstName);
  });

  const displayedStudents = sortedStudents.slice(0, visibleStudents);

  const handleContextMenu = (e: React.MouseEvent, studentId: string, date: string, currentStatus?: AttendanceStatus) => {
    e.preventDefault();
    
    // Dimensiones estimadas del menú contextual
    const menuWidth = 160;
    const menuHeight = currentStatus ? 200 : 150; // Más alto si tiene la opción de eliminar
    
    // Obtener dimensiones de la ventana
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calcular posición X (horizontal)
    let x = e.clientX;
    if (x + menuWidth > windowWidth) {
      // Si se sale por la derecha, mostrar a la izquierda del cursor
      x = e.clientX - menuWidth;
    }
    
    // Calcular posición Y (vertical)
    let y = e.clientY;
    if (y + menuHeight > windowHeight) {
      // Si se sale por abajo, posicionar para que el borde inferior quede cerca del cursor
      y = e.clientY - menuHeight + 20; // El borde inferior queda ~20px arriba del cursor
    }
    
    // Asegurar que no se salga por los bordes superior e izquierdo
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setContextMenu({
      visible: true,
      x,
      y,
      studentId,
      date,
      currentStatus,
    });
  };

  const handleStatusChange = async (newStatus: AttendanceStatus | null) => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    setUpdating(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (newStatus === null) {
        // Delete attendance record
        const response = await fetch(
          `/api/courses/${courseId}/attendance/${contextMenu.studentId}?date=${contextMenu.date}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error('Error al eliminar registro');
      } else {
        // Update attendance record
        const response = await fetch(`/api/courses/${courseId}/attendance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: contextMenu.date,
            records: [{ studentId: contextMenu.studentId, status: newStatus }],
          }),
        });

        if (!response.ok) throw new Error('Error al actualizar asistencia');
      }

      // Refresh data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Error al actualizar la asistencia');
    } finally {
      setUpdating(false);
    }
  };

  if (dates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No hay registros de asistencia para este curso.</p>
        <p className="text-sm mt-2">Comienza tomando asistencia para ver la planilla.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{students.length} alumnos</span>
          <span>•</span>
          <span>{dates.length} clases registradas</span>
        </div>
        
        {/* Help text */}
        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 transition-colors">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <span>
            <span className="hidden sm:inline">Click derecho sobre un ícono para editar. </span>
            <span className="sm:hidden">Mantén presionado para editar. </span>
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[160px] transition-colors"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleStatusChange('present')}
            disabled={updating}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 disabled:opacity-50 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="font-medium">Presente</span>
          </button>
          <button
            onClick={() => handleStatusChange('absent')}
            disabled={updating}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 disabled:opacity-50 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="font-medium">Ausente</span>
          </button>
          <button
            onClick={() => handleStatusChange('late')}
            disabled={updating}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 disabled:opacity-50 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium">Tarde</span>
          </button>
          {contextMenu.currentStatus && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
              <button
                onClick={() => handleStatusChange(null)}
                disabled={updating}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 disabled:opacity-50 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <XIcon className="w-4 h-4" />
                <span className="font-medium">Eliminar registro</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                Alumno
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
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
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                Estadística
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {displayedStudents.map((student) => {
              const studentRecords = records[student._id.toString()] || {};
              const totalClasses = dates.length;
              const presentCount = dates.filter(date => studentRecords[date] === 'present').length;
              const absentCount = dates.filter(date => studentRecords[date] === 'absent').length;
              const lateCount = dates.filter(date => studentRecords[date] === 'late').length;
              const presentPercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(0) : '0';
              const absentPercentage = totalClasses > 0 ? ((absentCount / totalClasses) * 100).toFixed(0) : '0';

              return (
                <tr key={student._id.toString()} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                    {student.lastName}, {student.firstName}
                  </td>
                  {dates.map((date) => {
                    const status = studentRecords[date];
                    return (
                      <td 
                        key={date} 
                        className="px-4 py-4 text-center cursor-context-menu"
                        onContextMenu={(e) => handleContextMenu(e, student._id.toString(), date, status)}
                      >
                        <div className="flex justify-center">
                          <AttendanceIcon status={status} size="md" />
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="text-green-700 dark:text-green-400 font-semibold">{presentCount}</span>
                        <span className="text-gray-400 dark:text-gray-600">/</span>
                        <span className="text-red-700 dark:text-red-400 font-semibold">{absentCount}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{presentPercentage}%</span>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <span>{absentPercentage}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Infinite scroll trigger */}
        {visibleStudents < students.length && (
          <div ref={observerRef} className="h-10 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Cargando más alumnos...
          </div>
        )}
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-4">
        {displayedStudents.map((student) => {
          const studentRecords = records[student._id.toString()] || {};
          const totalClasses = dates.length;
          const presentCount = dates.filter(date => studentRecords[date] === 'present').length;
          const absentCount = dates.filter(date => studentRecords[date] === 'absent').length;
          const presentPercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(0) : '0';
          const absentPercentage = totalClasses > 0 ? ((absentCount / totalClasses) * 100).toFixed(0) : '0';

          return (
            <div key={student._id.toString()} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
              {/* Student Header */}
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {student.lastName}, {student.firstName}
                </h4>
              </div>

              {/* Attendance Table */}
              <div className="p-3">
                <div className="space-y-1">
                  {dates.slice(0, 10).map((date) => {
                    const status = studentRecords[date];
                    return (
                      <div 
                        key={date} 
                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                        onContextMenu={(e) => handleContextMenu(e, student._id.toString(), date, status)}
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          const timer = setTimeout(() => {
                            handleContextMenu(
                              { preventDefault: () => {}, clientX: touch.clientX, clientY: touch.clientY } as any,
                              student._id.toString(),
                              date,
                              status
                            );
                          }, 500);
                          e.currentTarget.addEventListener('touchend', () => clearTimeout(timer), { once: true });
                        }}
                      >
                        {/* Date and Icon - Left */}
                        <div className="flex items-center gap-3">
                          <AttendanceIcon status={status} size="sm" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>

                        {/* Statistics - Right */}
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-green-700 dark:text-green-400 font-semibold">{presentCount}</span>
                            <span className="text-gray-300 dark:text-gray-600">/</span>
                            <span className="text-red-700 dark:text-red-400 font-semibold">{absentCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <span>{presentPercentage}%</span>
                            <span className="text-gray-300 dark:text-gray-600">/</span>
                            <span>{absentPercentage}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {dates.length > 10 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                    +{dates.length - 10} clases más
                  </p>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Infinite scroll trigger */}
        {visibleStudents < students.length && (
          <div ref={observerRef} className="h-10 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Cargando más alumnos...
          </div>
        )}
      </div>
    </div>
  );
}
