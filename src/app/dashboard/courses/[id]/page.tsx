'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { Course, Student } from '@/types/models';
import { auth } from '@/lib/firebase/client';
import { StudentList } from '@/components/students/StudentList';
import { AttendanceSheet } from '@/components/attendance/AttendanceSheet';
import { AddStudentModal } from '@/components/students/AddStudentModal';
import { EditStudentModal } from '@/components/students/EditStudentModal';
import { AttendanceModal } from '@/components/attendance/AttendanceModal';
import { GradeModal } from '@/components/grades/GradeModal';
import { EditCourseModal } from '@/components/courses/EditCourseModal';
import { InviteStudentsModal } from '@/components/courses/InviteStudentsModal';
import { JoinRequestsModal } from '@/components/students/JoinRequestsModal';
import { ExportModal, ExportOptions } from '@/components/courses/ExportModal';
import {
  Loader2,
  ArrowLeft,
  UserPlus,
  CalendarCheck,
  GraduationCap,
  Download,
  Edit,
  Link2,
  Users,
  List,
  Table
} from 'lucide-react';
import { WithdrawalModal } from '@/components/students/WithdrawalModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import Link from 'next/link';

const fetcher = async (url: string) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No autenticado');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Error al cargar datos');
  return res.json();
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();

  const { data: course, error: courseError, mutate: mutateCourse } = useSWR<Course>(
    courseId ? `/api/courses/${courseId}` : null,
    fetcher
  );

  const { data: students, mutate: mutateStudents } = useSWR<(Student & {
    attendancePercentage: number;
    gradeAverage: number | null;
    enrollmentStatus?: 'active' | 'inactive';
  })[]>(
    courseId ? `/api/courses/${courseId}/students` : null,
    fetcher
  );

  const [viewMode, setViewMode] = useState<'list' | 'sheet'>('list');

  const { data: attendanceData, mutate: mutateAttendance } = useSWR<{
    dates: string[];
    records: Record<string, Record<string, 'present' | 'absent' | 'late'>>;
    suspensions: Record<string, { reason: string; note?: string }>;
  }>(
    courseId ? `/api/courses/${courseId}/attendance-records` : null,
    fetcher
  );

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinRequestsModalOpen, setIsJoinRequestsModalOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  // Fetch pending join requests count
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!courseId) return;
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`/api/courses/${courseId}/join-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPendingRequestsCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    fetchPendingCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [courseId]);

  if (!course && !courseError) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar el curso.</p>
        <Link href="/dashboard" className="text-indigo-600 hover:underline mt-4 inline-block">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const confirmDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
  };

  const handleExecuteWithdrawal = async (reason: string, note?: string) => {
    if (!studentToDelete) return;
    setIsDeletingStudent(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/courses/${courseId}/students/${studentToDelete._id.toString()}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, note })
      });
      mutateStudents();
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error withrawing student:', error);
      alert('Error al dar de baja al alumno');
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const handleExport = async (options: ExportOptions) => {
    try {
      const token = await auth.currentUser?.getIdToken();

      // Construir query params
      const params = new URLSearchParams();
      if (options.dni) params.append('dni', 'true');
      if (options.email) params.append('email', 'true');
      if (options.phone) params.append('phone', 'true');
      if (options.grades) params.append('grades', 'true');
      if (options.attendanceStats) params.append('attendanceStats', 'true');
      if (options.attendanceDetails) params.append('attendanceDetails', 'true');

      const res = await fetch(`/api/courses/${courseId}/report?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error descargando reporte');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${course.name}_reporte.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar reporte');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {course.institutionName}
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
              <button
                onClick={() => setIsEditCourseModalOpen(true)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                title="Editar curso"
              >
                <Edit className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {course.description || 'Sin descripción'} • {students?.length || 0} alumnos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-evenly gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors"
          >
            <CalendarCheck className="w-4 h-4" /> Asistencia
          </button>
          <button
            onClick={() => setIsGradeModalOpen(true)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors"
          >
            <GraduationCap className="w-4 h-4" /> Calificar
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={() => pendingRequestsCount > 0 ? setIsJoinRequestsModalOpen(true) : setIsInviteModalOpen(true)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2 text-sm font-medium whitespace-nowrap relative transition-colors"
          >
            <Link2 className="w-4 h-4" /> Invitar Alumnos
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium shadow-sm whitespace-nowrap transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Agregar Alumno
          </button>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Asistencia Promedio</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white text-center md:text-left">
            {((course.meta.avgAttendance || 0) * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Promedio General</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white text-center md:text-left">
            {course.meta.avgGrade ? course.meta.avgGrade.toFixed(2) : '-'}
          </p>
        </div>
      </div>

      {/* Tabs / Content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
        <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Listado de Alumnos</h3>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list'
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode('sheet')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'sheet'
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">Planilla</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {!students ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : viewMode === 'list' ? (
            <StudentList
              students={students}
              onDeleteStudent={confirmDeleteStudent}
              onEditStudent={(student) => {
                setSelectedStudent(student);
                setIsEditStudentModalOpen(true);
              }}
            />
          ) : (
            attendanceData ? (
              <AttendanceSheet
                students={students}
                dates={attendanceData.dates}
                records={attendanceData.records}
                suspensions={attendanceData.suspensions}
                onUpdate={() => {
                  mutateStudents();
                  // Trigger re-fetch of attendance data by mutating the SWR cache
                  mutate(`/api/courses/${courseId}/attendance-records`);
                }}
              />
            ) : (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
              </div>
            )
          )}
        </div>
      </div>

      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onStudentAdded={() => mutateStudents()}
      />

      {/* Filter active students for attendance and grades */}
      {(() => {
        const activeStudents = students?.filter(s => s.enrollmentStatus !== 'inactive') || [];

        return (
          <>
            <AttendanceModal
              isOpen={isAttendanceModalOpen}
              onClose={() => setIsAttendanceModalOpen(false)}
              students={activeStudents}
              existingDates={attendanceData?.dates || []}
              onAttendanceSaved={() => {
                mutateStudents(); // Update metrics
                mutateAttendance(); // Update attendance data
              }}
            />

            <GradeModal
              isOpen={isGradeModalOpen}
              onClose={() => setIsGradeModalOpen(false)}
              students={activeStudents}
              onGradeSaved={() => {
                mutateStudents(); // Update metrics (averages)
              }}
            />
          </>
        );
      })()}
      {/* EditCourseModal */}
      {course && (
        <EditCourseModal
          isOpen={isEditCourseModalOpen}
          onClose={() => setIsEditCourseModalOpen(false)}
          course={course}
          onCourseUpdated={() => {
            mutateCourse();
          }}
        />
      )}

      {/* ExportModal */}
      {course && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          courseName={course.name}
        />
      )}

      {/* InviteStudentsModal */}
      {course && (
        <InviteStudentsModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          courseId={courseId}
          courseName={course.name}
          currentJoinCode={course.joinCode}
          allowJoinRequests={course.allowJoinRequests}
        />
      )}

      {/* JoinRequestsModal */}
      <JoinRequestsModal
        isOpen={isJoinRequestsModalOpen}
        onClose={() => setIsJoinRequestsModalOpen(false)}
        courseId={courseId}
        onRequestProcessed={() => {
          mutateStudents();
          // Refresh pending count
        }}
      />

      {/* EditStudentModal */}
      <EditStudentModal
        isOpen={isEditStudentModalOpen}
        onClose={() => {
          setIsEditStudentModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onStudentUpdated={() => {
          mutateStudents();
          setIsEditStudentModalOpen(false);
          setSelectedStudent(null);
        }}
      />

      <WithdrawalModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleExecuteWithdrawal}
        studentName={`${studentToDelete?.lastName}, ${studentToDelete?.firstName}`}
        isLoading={isDeletingStudent}
      />
    </div>
  );
}
