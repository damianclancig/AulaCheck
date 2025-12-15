'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { Student } from '@/types/models';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  existingDates?: string[];
  onAttendanceSaved: () => void;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export function AttendanceModal({ isOpen, onClose, students, existingDates = [], onAttendanceSaved }: AttendanceModalProps) {
  const params = useParams();
  const courseId = params.id as string;

  // Función para obtener fecha local en formato YYYY-MM-DD sin conversión UTC
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(getLocalDateString());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [suspensionReason, setSuspensionReason] = useState<'none' | 'class_suspension' | 'teacher_leave' | 'other'>('none');
  const [suspensionNote, setSuspensionNote] = useState('');

  // Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Min swipe distance (in px)
  const minSwipeDistance = 50;

  // Ordenar estudiantes por apellido y nombre
  const sortedStudents = [...students].sort((a, b) => {
    const lastNameCompare = a.lastName.localeCompare(b.lastName);
    return lastNameCompare !== 0 ? lastNameCompare : a.firstName.localeCompare(b.firstName);
  });

  // Inicializar sin selección por defecto y resetear estado al abrir
  useEffect(() => {
    if (isOpen && students.length > 0) {
      setAttendanceMap({});
      setCurrentIndex(0); // Reset carousel to start
      setDate(getLocalDateString()); // Reset to today's date
      setSuspensionReason('none'); // Reset to normal class
      setSuspensionNote(''); // Clear suspension note
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  // Verificar si la fecha seleccionada ya tiene asistencia
  const isDuplicateDate = existingDates.includes(date);

  // Check if all students have attendance marked
  const allStudentsMarked = sortedStudents.length > 0 && sortedStudents.every(student =>
    attendanceMap[student._id.toString()] !== undefined
  );

  // Find next unmarked student index
  const findNextUnmarkedStudent = (fromIndex: number): number => {
    for (let i = fromIndex; i < sortedStudents.length; i++) {
      if (!attendanceMap[sortedStudents[i]._id.toString()]) {
        return i;
      }
    }
    // If no unmarked student found after current, search from beginning
    for (let i = 0; i < fromIndex; i++) {
      if (!attendanceMap[sortedStudents[i]._id.toString()]) {
        return i;
      }
    }
    return -1; // All marked
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus, autoAdvance = false) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));

    if (autoAdvance) {
      // Find next unmarked student
      const nextUnmarkedIndex = findNextUnmarkedStudent(currentIndex + 1);

      if (nextUnmarkedIndex !== -1) {
        // Trigger transition animation
        setIsTransitioning(true);

        // Delay before advancing to next unmarked student
        setTimeout(() => {
          setCurrentIndex(nextUnmarkedIndex);
          setIsTransitioning(false);
        }, 600);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No autenticado');

      // Si hay suspensión, no enviamos registros de asistencia
      const records = suspensionReason === 'none'
        ? Object.entries(attendanceMap).map(([studentId, status]) => ({
          studentId,
          status
        }))
        : [];

      const response = await fetch(`/api/courses/${courseId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          records,
          suspensionReason: suspensionReason !== 'none' ? suspensionReason : undefined,
          suspensionNote: suspensionReason === 'other' ? suspensionNote : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar asistencia');
      }

      onAttendanceSaved();
      onClose();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error al guardar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < students.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    }

    if (isRightSwipe && currentIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const currentStudent = sortedStudents[currentIndex];
  const currentStatus = currentStudent ? attendanceMap[currentStudent._id.toString()] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Tomar Asistencia</h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {sortedStudents.length} alumnos registrados
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker and Suspension Reason */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de la clase */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de la clase
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-900 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            {/* Motivo de suspensión */}
            <div>
              <label htmlFor="suspensionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado de la clase
              </label>
              <select
                id="suspensionReason"
                value={suspensionReason}
                onChange={(e) => {
                  setSuspensionReason(e.target.value as any);
                  if (e.target.value !== 'other') {
                    setSuspensionNote('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-900 [color-scheme:light] dark:[color-scheme:dark]"
              >
                <option value="none">Clase normal</option>
                <option value="class_suspension">Suspensión de clases</option>
                <option value="teacher_leave">Licencia del docente</option>
                <option value="other">Otro motivo</option>
              </select>
            </div>
          </div>

          {/* Input condicional para "Otro motivo" */}
          {suspensionReason === 'other' && (
            <div className="mt-4">
              <label htmlFor="suspensionNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Especificar motivo
              </label>
              <input
                type="text"
                id="suspensionNote"
                value={suspensionNote}
                onChange={(e) => setSuspensionNote(e.target.value)}
                placeholder="Ej: Día feriado, evento especial, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-900"
              />
            </div>
          )}

          {isDuplicateDate && (
            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  Ya existe asistencia para esta fecha
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                  Si continúas, se sobrescribirá la asistencia existente para este día.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* DESKTOP LIST VIEW */}
        {suspensionReason === 'none' && (
          <div className="hidden md:block overflow-y-auto p-6 space-y-4 flex-1">
            {sortedStudents.map((student) => {
              const status = attendanceMap[student._id.toString()];

              return (
                <div key={student._id.toString()} className={cn(
                  "flex items-center justify-between p-3 bg-white dark:bg-gray-900 border rounded-lg hover:border-gray-200 dark:hover:border-gray-700 transition-all",
                  status ? "border-gray-100 dark:border-gray-800" : "border-orange-200 dark:border-orange-800 bg-orange-50/20 dark:bg-orange-900/10"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm",
                      status ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                    )}>
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{student.lastName}, {student.firstName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Legajo: {student.externalId || '-'}</p>
                      {!status && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">⚠ Falta marcar asistencia</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(student._id.toString(), 'present')}
                      className={cn(
                        "p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all",
                        status === 'present'
                          ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-2 ring-green-500 dark:ring-green-600 ring-offset-1"
                          : status ? "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600" : "bg-green-50/30 dark:bg-green-900/10 text-green-600/60 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                      )}
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Presente</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(student._id.toString(), 'late')}
                      className={cn(
                        "p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all",
                        status === 'late'
                          ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-500 dark:ring-yellow-600 ring-offset-1"
                          : status ? "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600" : "bg-yellow-50/30 dark:bg-yellow-900/10 text-yellow-600/60 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      )}
                    >
                      <Clock className="w-4 h-4" />
                      <span className="hidden sm:inline">Tarde</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(student._id.toString(), 'absent')}
                      className={cn(
                        "p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all",
                        status === 'absent'
                          ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-2 ring-red-500 dark:ring-red-600 ring-offset-1"
                          : status ? "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600" : "bg-red-50/30 dark:bg-red-900/10 text-red-600/60 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Ausente</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MOBILE CAROUSEL VIEW */}
        {suspensionReason === 'none' && (
          <div
            className="md:hidden flex-1 flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 transition-colors"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {currentStudent && (
              <div
                className={cn(
                  "w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-col items-center text-center space-y-4 transition-all duration-500",
                  isTransitioning ? "opacity-0 scale-95 translate-x-8" : "opacity-100 scale-100 translate-x-0"
                )}
                key={currentIndex}
              >

                {/* Progress Indicator */}
                <div className="w-full flex justify-between text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                  <span>Alumno {currentIndex + 1} de {sortedStudents.length}</span>
                  <span>{Math.round(((currentIndex + 1) / sortedStudents.length) * 100)}%</span>
                </div>

                {/* Student Info */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                      {currentStudent.lastName}, {currentStudent.firstName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      Legajo: {currentStudent.externalId || 'Sin legajo'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleStatusChange(currentStudent._id.toString(), 'present', true)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95",
                        currentStatus === 'present'
                          ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                          : currentStatus ? "border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500" : "border-green-200 bg-green-50/20 text-green-600 hover:bg-green-50 dark:border-green-800 dark:bg-green-900/10 dark:text-green-400 dark:hover:bg-green-900/20"
                      )}
                    >
                      <Check className="w-6 h-6" />
                      <span className="font-bold text-sm">Presente</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(currentStudent._id.toString(), 'absent', true)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95",
                        currentStatus === 'absent'
                          ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                          : currentStatus ? "border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500" : "border-red-200 bg-red-50/20 text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
                      )}
                    >
                      <XCircle className="w-6 h-6" />
                      <span className="font-bold text-sm">Ausente</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleStatusChange(currentStudent._id.toString(), 'late', true)}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all active:scale-95",
                      currentStatus === 'late'
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm"
                        : currentStatus ? "border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500" : "border-yellow-200 bg-yellow-50/20 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                    )}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm">Llegada Tarde</span>
                  </button>
                </div>

                {/* Navigation Hints */}
                <div className="flex items-center justify-between w-full text-gray-300 dark:text-gray-600 pt-2">
                  <button
                    onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
                    disabled={currentIndex === 0}
                    className="p-2 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="flex gap-1">
                    {sortedStudents.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          idx === currentIndex ? "bg-indigo-500 w-3" : "bg-gray-200 dark:bg-gray-700"
                        )}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => currentIndex < students.length - 1 && setCurrentIndex(prev => prev + 1)}
                    disabled={currentIndex === sortedStudents.length - 1}
                    className="p-2 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MESSAGE FOR SUSPENDED CLASSES */}
        {suspensionReason !== 'none' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Clase suspendida
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No es necesario tomar asistencia para esta fecha.
                {suspensionReason === 'other' && suspensionNote && (
                  <span className="block mt-2 font-medium text-gray-700 dark:text-gray-300">
                    Motivo: {suspensionNote}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0 bg-white dark:bg-gray-900 transition-colors">
          <div className="text-sm">
            {suspensionReason === 'none' && !allStudentsMarked && (
              <p className="text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Falta marcar {sortedStudents.filter(s => !attendanceMap[s._id.toString()]).length} alumno{sortedStudents.filter(s => !attendanceMap[s._id.toString()]).length !== 1 ? 's' : ''}
              </p>
            )}
            {suspensionReason === 'none' && allStudentsMarked && (
              <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Todos los alumnos marcados
              </p>
            )}
            {suspensionReason !== 'none' && (
              <p className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Listo para guardar
              </p>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (suspensionReason === 'none' && !allStudentsMarked) || (suspensionReason === 'other' && !suspensionNote)}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar Asistencia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
