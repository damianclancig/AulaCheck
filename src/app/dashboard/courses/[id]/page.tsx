'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { Course, Student } from '@/types/models';
import { auth } from '@/lib/firebase/client';
import { StudentList } from '@/components/students/StudentList';
import { AddStudentModal } from '@/components/students/AddStudentModal';
import { EditStudentModal } from '@/components/students/EditStudentModal';
import { AttendanceModal } from '@/components/attendance/AttendanceModal';
import { GradeModal } from '@/components/grades/GradeModal';
import { EditCourseModal } from '@/components/courses/EditCourseModal';
import { InviteStudentsModal } from '@/components/courses/InviteStudentsModal';
import { JoinRequestsModal } from '@/components/students/JoinRequestsModal';
import { 
  Loader2, 
  ArrowLeft, 
  UserPlus, 
  CalendarCheck, 
  GraduationCap, 
  Download,
  Edit,
  Link2,
  Users
} from 'lucide-react';
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

  const { data: students, mutate: mutateStudents } = useSWR<(Student & { attendancePercentage: number; gradeAverage: number | null })[]>(
    courseId ? `/api/courses/${courseId}/students` : null,
    fetcher
  );

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinRequestsModalOpen, setIsJoinRequestsModalOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);

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

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('¿Estás seguro de dar de baja a este alumno?')) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/courses/${courseId}/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      mutateStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error al dar de baja al alumno');
    }
  };

  const handleExport = (type: 'attendance' | 'grades' | 'full') => {
    // Redirigir directamente al endpoint de descarga
    // Necesitamos pasar el token, pero para descarga directa es complicado con headers
    // Una opción es abrir en nueva pestaña y manejar auth por cookie (no tenemos cookies)
    // O hacer fetch blob y descargar. Haremos fetch blob.
    
    const downloadReport = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/courses/${courseId}/report?type=${type}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) throw new Error('Error descargando reporte');
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${course.name}_${type}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error exporting:', error);
        alert('Error al exportar reporte');
      }
    };

    downloadReport();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
              {course.institutionName}
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              <button
                onClick={() => setIsEditCourseModalOpen(true)}
                className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Editar curso"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-500 text-sm">
              {course.description || 'Sin descripción'} • {students?.length || 0} alumnos
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            <CalendarCheck className="w-4 h-4" /> Asistencia
          </button>
          <button
            onClick={() => setIsGradeModalOpen(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            <GraduationCap className="w-4 h-4" /> Calificar
          </button>
          <button
            onClick={() => handleExport('full')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={() => pendingRequestsCount > 0 ? setIsJoinRequestsModalOpen(true) : setIsInviteModalOpen(true)}
            className="px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 flex items-center gap-2 text-sm font-medium whitespace-nowrap relative"
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium shadow-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" /> Agregar Alumno
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-700">Asistencia Promedio</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {((course.meta.avgAttendance || 0) * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-700">Promedio General</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {course.meta.avgGrade ? course.meta.avgGrade.toFixed(2) : '-'}
          </p>
        </div>
      </div>

      {/* Tabs / Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Listado de Alumnos</h3>
        </div>
        
        {students ? (
          <StudentList 
            students={students} 
            onDeleteStudent={handleDeleteStudent}
            onEditStudent={(student) => {
              setSelectedStudent(student);
              setIsEditStudentModalOpen(true);
            }}
          />
        ) : (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          </div>
        )}
      </div>

      {/* AddStudentModal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onStudentAdded={() => mutateStudents()}
      />

      {/* AttendanceModal */}
      {students && (
        <AttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          students={students}
          onAttendanceSaved={() => {
            mutateStudents();
          }}
        />
      )}

      {/* GradeModal */}
      {students && (
        <GradeModal
          isOpen={isGradeModalOpen}
          onClose={() => setIsGradeModalOpen(false)}
          students={students}
          onGradeSaved={() => {
            mutateStudents();
          }}
        />
      )}

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
    </div>
  );
}
