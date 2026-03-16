'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check, XCircle, Clock, ChevronLeft, ChevronRight, Calendar, AlertTriangle, UserX, MessageSquare, School } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Student } from '@/types/models';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useModal } from '@/hooks/useModal';
import { useTranslations } from 'next-intl';

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
  const { showAlert } = useModal();
  const t = useTranslations('attendance.modal');
  const tLegends = useTranslations('attendance.sheet.legends');
  const tCommon = useTranslations('common');
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);


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
        },
        body: JSON.stringify({
          date,
          records,
          suspensionReason: suspensionReason !== 'none' ? suspensionReason : undefined,
          suspensionNote: suspensionReason === 'other' ? suspensionNote : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(tCommon('error'));
      }

      onAttendanceSaved();
      onClose();
    } catch (error) {
      console.error('Error saving attendance:', error);
      await showAlert({
        title: tCommon('error'),
        description: tCommon('error'),
        variant: 'danger'
      });
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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('count', { count: sortedStudents.length })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={tCommon('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker and Status Selectors */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 transition-colors bg-gray-50/50 dark:bg-gray-800/30">
          <div className="grid grid-cols-2 gap-3">
            {/* Fecha de la clase */}
            <div>
              <label className="block text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                {t('dateLabel')}
              </label>
              <button
                onClick={() => dateInputRef.current?.showPicker()}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-600 transition-all text-sm font-medium text-gray-900 dark:text-white group"
              >
                <span className="truncate">{new Date(date + 'T12:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <Calendar className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
              </button>
              <input
                ref={dateInputRef}
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="hidden"
              />
            </div>

            {/* Estado de la clase */}
            <div>
              <label className="block text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                {t('statusLabel')}
              </label>
              <button
                onClick={() => setShowStatusSelector(true)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-600 transition-all text-sm font-medium group",
                  suspensionReason !== 'none' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"
                )}
              >
                <span className="truncate">
                  {suspensionReason === 'none' && t('normalClass')}
                  {suspensionReason === 'class_suspension' && t('suspension')}
                  {suspensionReason === 'teacher_leave' && t('teacherLeave')}
                  {suspensionReason === 'other' && t('otherReason')}
                </span>
                <div className="flex-shrink-0 ml-1">
                  {suspensionReason === 'none' && <School className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />}
                  {suspensionReason === 'class_suspension' && <AlertTriangle className="w-4 h-4 text-indigo-500" />}
                  {suspensionReason === 'teacher_leave' && <UserX className="w-4 h-4 text-indigo-500" />}
                  {suspensionReason === 'other' && <MessageSquare className="w-4 h-4 text-indigo-500" />}
                </div>
              </button>
            </div>
          </div>

          {isDuplicateDate && (
            <div className="mt-3 p-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-tight text-orange-800 dark:text-orange-300 font-medium">
                {t('duplicateWarning')}. {t('duplicateDesc')}
              </p>
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
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">{t('missingAttendance')}</p>
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
                      <span className="hidden sm:inline">{tLegends('present')}</span>
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
                      <span className="hidden sm:inline">{tLegends('late')}</span>
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
                      <span className="hidden sm:inline">{tLegends('absent')}</span>
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
            className="md:hidden flex-1 flex flex-col items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/10 transition-colors overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {currentStudent && (
              <div
                className={cn(
                  "w-full max-w-sm flex flex-col items-center justify-center space-y-6 transition-all duration-500 h-full",
                  isTransitioning ? "opacity-0 scale-95 translate-x-8" : "opacity-100 scale-100 translate-x-0"
                )}
                key={currentIndex}
              >
                {/* Student Info Card */}
                <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center space-y-4">
                  {/* Progress Indicator */}
                  <div className="w-full flex justify-between text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] font-black">
                    <span>{t('carousel.progress', { current: currentIndex + 1, total: sortedStudents.length })}</span>
                    <span>{Math.round(((currentIndex + 1) / sortedStudents.length) * 100)}%</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl mb-2 shadow-lg shadow-indigo-200 dark:shadow-none">
                      {currentStudent.firstName[0]}{currentStudent.lastName[0]}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                      {currentStudent.lastName.toUpperCase()}<br />
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{currentStudent.firstName}</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      ID: {currentStudent.externalId || '---'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons - FIXED IN SCREEN */}
                <div className="w-full space-y-3 pb-2">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStatusChange(currentStudent._id.toString(), 'present', true)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 transition-all active:scale-95 shadow-lg",
                        currentStatus === 'present'
                          ? "border-green-500 bg-green-500 text-white shadow-green-200 dark:shadow-none scale-[1.02]"
                          : "border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 hover:border-green-200"
                      )}
                    >
                      <Check className={cn("w-7 h-7", currentStatus === 'present' ? "text-white" : "text-green-500")} />
                      <span className="font-black text-xs uppercase tracking-widest">{tLegends('present')}</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(currentStudent._id.toString(), 'absent', true)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 transition-all active:scale-95 shadow-lg",
                        currentStatus === 'absent'
                          ? "border-red-500 bg-red-500 text-white shadow-red-200 dark:shadow-none scale-[1.02]"
                          : "border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 hover:border-red-200"
                      )}
                    >
                      <XCircle className={cn("w-7 h-7", currentStatus === 'absent' ? "text-white" : "text-red-500")} />
                      <span className="font-black text-xs uppercase tracking-widest">{tLegends('absent')}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleStatusChange(currentStudent._id.toString(), 'late', true)}
                    className={cn(
                      "w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95",
                      currentStatus === 'late'
                        ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                        : "border-transparent bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-yellow-100"
                    )}
                  >
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-sm">{tLegends('late')}</span>
                  </button>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between w-full px-4 text-gray-400 dark:text-gray-600">
                  <button
                    onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
                    disabled={currentIndex === 0}
                    className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm disabled:opacity-30 disabled:shadow-none transition-all active:scale-90"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="flex gap-1.5">
                    {sortedStudents.length <= 10 ? (
                      sortedStudents.map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            idx === currentIndex ? "bg-indigo-500 w-5" : "bg-gray-200 dark:bg-gray-700"
                          )}
                        />
                      ))
                    ) : (
                      <span className="text-xs font-black text-gray-500">
                        {currentIndex + 1} / {sortedStudents.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => currentIndex < students.length - 1 && setCurrentIndex(prev => prev + 1)}
                    disabled={currentIndex === sortedStudents.length - 1}
                    className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm disabled:opacity-30 disabled:shadow-none transition-all active:scale-90"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Selector Modal Overlay */}
        {showStatusSelector && (
          <div className="absolute inset-0 z-[60] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-6 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
              {t('statusLabel')}
            </h3>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <button
                onClick={() => {
                  setSuspensionReason('none');
                  setSuspensionNote('');
                  setShowStatusSelector(false);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all active:scale-95",
                  suspensionReason === 'none'
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500"
                )}
              >
                <School className="w-8 h-8" />
                <span className="font-bold text-xs text-center">{t('normalClass')}</span>
              </button>

              <button
                onClick={() => {
                  setSuspensionReason('class_suspension');
                  setSuspensionNote('');
                  setShowStatusSelector(false);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all active:scale-95",
                  suspensionReason === 'class_suspension'
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500"
                )}
              >
                <AlertTriangle className="w-8 h-8" />
                <span className="font-bold text-xs text-center">{t('suspension')}</span>
              </button>

              <button
                onClick={() => {
                  setSuspensionReason('teacher_leave');
                  setSuspensionNote('');
                  setShowStatusSelector(false);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all active:scale-95",
                  suspensionReason === 'teacher_leave'
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500"
                )}
              >
                <UserX className="w-8 h-8" />
                <span className="font-bold text-xs text-center">{t('teacherLeave')}</span>
              </button>

              <button
                onClick={() => {
                  setSuspensionReason('other');
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all active:scale-95",
                  suspensionReason === 'other'
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500"
                )}
              >
                <MessageSquare className="w-8 h-8" />
                <span className="font-bold text-xs text-center">{t('otherReason')}</span>
              </button>
            </div>

            {suspensionReason === 'other' && (
              <div className="w-full max-w-sm mt-6 animate-in slide-in-from-top-2">
                <textarea
                  id="suspensionNote"
                  rows={3}
                  value={suspensionNote}
                  onChange={(e) => setSuspensionNote(e.target.value)}
                  placeholder={t('reasonPlaceholder')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white transition-all"
                  autoFocus
                />
              </div>
            )}

            <button
              onClick={() => setShowStatusSelector(false)}
              className="mt-8 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            >
              {tCommon('confirm')}
            </button>
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
                {t('suspendedMessage.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('suspendedMessage.desc')}
                {suspensionReason === 'other' && suspensionNote && (
                  <span className="block mt-2 font-medium text-gray-700 dark:text-gray-300">
                    {t('suspendedMessage.reason', { note: suspensionNote })}
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
                {t('missingCount', { count: sortedStudents.filter(s => !attendanceMap[s._id.toString()]).length })}
              </p>
            )}
            {suspensionReason === 'none' && allStudentsMarked && (
              <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {t('allMarked')}
              </p>
            )}
            {suspensionReason !== 'none' && (
              <p className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {t('readyToSave')}
              </p>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (suspensionReason === 'none' && !allStudentsMarked) || (suspensionReason === 'other' && !suspensionNote)}
              className="flex-1 sm:flex-none px-8 py-2.5 text-sm font-black text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('saveButton').toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
