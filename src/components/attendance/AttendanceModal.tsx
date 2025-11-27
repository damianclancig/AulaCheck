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
  onAttendanceSaved: () => void;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export function AttendanceModal({ isOpen, onClose, students, onAttendanceSaved }: AttendanceModalProps) {
  const params = useParams();
  const courseId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  
  // Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Min swipe distance (in px)
  const minSwipeDistance = 50;

  // Inicializar sin selección por defecto
  useEffect(() => {
    if (isOpen && students.length > 0) {
      setAttendanceMap({});
      setCurrentIndex(0); // Reset carousel to start
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  const handleStatusChange = (studentId: string, status: AttendanceStatus, autoAdvance = false) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));

    if (autoAdvance && currentIndex < students.length - 1) {
      // Trigger transition animation
      setIsTransitioning(true);
      
      // Delay before advancing to next student
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 600);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No autenticado');

      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status
      }));

      const response = await fetch(`/api/courses/${courseId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          records
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

  const currentStudent = students[currentIndex];
  const currentStatus = currentStudent ? attendanceMap[currentStudent._id.toString()] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tomar Asistencia</h2>
            <p className="text-sm text-gray-500 mt-1">
              {students.length} alumnos registrados
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker */}
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de la clase
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
          />
        </div>

        {/* DESKTOP LIST VIEW */}
        <div className="hidden md:block overflow-y-auto p-6 space-y-4 flex-1">
          {students.map((student) => {
            const status = attendanceMap[student._id.toString()];
            
            return (
              <div key={student._id.toString()} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-medium text-sm">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.lastName}, {student.firstName}</p>
                    <p className="text-xs text-gray-500">Legajo: {student.externalId || '-'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(student._id.toString(), 'present')}
                    className={cn(
                      "p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all",
                      status === 'present' 
                        ? "bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-1" 
                        : status ? "bg-gray-50 text-gray-400" : "bg-green-50/30 text-green-600/60 hover:bg-green-50"
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
                        ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500 ring-offset-1" 
                        : status ? "bg-gray-50 text-gray-400" : "bg-yellow-50/30 text-yellow-600/60 hover:bg-yellow-50"
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
                        ? "bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-1" 
                        : status ? "bg-gray-50 text-gray-400" : "bg-red-50/30 text-red-600/60 hover:bg-red-50"
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

        {/* MOBILE CAROUSEL VIEW */}
        <div 
          className="md:hidden flex-1 flex flex-col items-center justify-center p-6 bg-gray-50"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {currentStudent && (
            <div 
              className={cn(
                "w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center space-y-6 transition-all duration-500",
                isTransitioning ? "opacity-0 scale-95 translate-x-8" : "opacity-100 scale-100 translate-x-0"
              )} 
              key={currentIndex}
            >
              
              {/* Progress Indicator */}
              <div className="w-full flex justify-between text-xs text-gray-400 uppercase tracking-wider font-medium">
                <span>Alumno {currentIndex + 1} de {students.length}</span>
                <span>{Math.round(((currentIndex + 1) / students.length) * 100)}%</span>
              </div>

              {/* Student Info */}
              <div className="flex flex-col items-center gap-3">
                <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-inner">
                  {currentStudent.firstName[0]}{currentStudent.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {currentStudent.lastName}, {currentStudent.firstName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Legajo: {currentStudent.externalId || 'Sin legajo'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleStatusChange(currentStudent._id.toString(), 'present', true)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all active:scale-95",
                      currentStatus === 'present'
                        ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                        : currentStatus ? "border-gray-200 bg-white text-gray-400" : "border-green-200 bg-green-50/20 text-green-600 hover:bg-green-50"
                    )}
                  >
                    <Check className="w-8 h-8" />
                    <span className="font-bold">Presente</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(currentStudent._id.toString(), 'absent', true)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all active:scale-95",
                      currentStatus === 'absent'
                        ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                        : currentStatus ? "border-gray-200 bg-white text-gray-400" : "border-red-200 bg-red-50/20 text-red-600 hover:bg-red-50"
                    )}
                  >
                    <XCircle className="w-8 h-8" />
                    <span className="font-bold">Ausente</span>
                  </button>
                </div>

                <button
                  onClick={() => handleStatusChange(currentStudent._id.toString(), 'late', true)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95",
                    currentStatus === 'late'
                      ? "border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm"
                      : currentStatus ? "border-gray-200 bg-white text-gray-400" : "border-yellow-200 bg-yellow-50/20 text-yellow-600 hover:bg-yellow-50"
                  )}
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Llegada Tarde</span>
                </button>
              </div>

              {/* Navigation Hints */}
              <div className="flex items-center justify-between w-full text-gray-300 pt-2">
                <button 
                  onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
                  disabled={currentIndex === 0}
                  className="p-2 hover:text-gray-500 disabled:opacity-30"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-1">
                  {students.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        idx === currentIndex ? "bg-indigo-500 w-3" : "bg-gray-200"
                      )} 
                    />
                  ))}
                </div>
                <button 
                  onClick={() => currentIndex < students.length - 1 && setCurrentIndex(prev => prev + 1)}
                  disabled={currentIndex === students.length - 1}
                  className="p-2 hover:text-gray-500 disabled:opacity-30"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Asistencia
          </button>
        </div>
      </div>
    </div>
  );
}
