'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { useRouter } from '@/i18n/routing'
import { useParams } from 'next/navigation'
import { Course, Student } from '@/types/models'
import { useSession } from 'next-auth/react'
import { StudentList } from '@/components/students/StudentList'
import { AttendanceSheet } from '@/components/attendance/AttendanceSheet'
import { AddStudentModal } from '@/components/students/AddStudentModal'
import { EditStudentModal } from '@/components/students/EditStudentModal'
import { AttendanceModal } from '@/components/attendance/AttendanceModal'
import { GradeTable } from '@/components/grades/GradeTable'
import { PeriodTabs } from '@/components/grades/PeriodTabs'
import { AnnualCloseTable } from '@/components/grades/AnnualCloseTable'
import { EditCourseModal } from '@/components/courses/EditCourseModal'
import { InviteStudentsModal } from '@/components/courses/InviteStudentsModal'
import { JoinRequestsModal } from '@/components/students/JoinRequestsModal'
import { ExportModal, ExportOptions } from '@/components/courses/ExportModal'
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
  Table,
  BookOpen,
} from 'lucide-react'
import { WithdrawalModal } from '@/components/students/WithdrawalModal'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { Link } from '@/i18n/routing'
import { useModal } from '@/hooks/useModal'

import { useTranslations } from 'next-intl'

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) throw new Error('Error al cargar datos')
  return res.json()
}

export default function CourseDetailPage() {
  const t = useTranslations('courses.detail')
  const tShifts = useTranslations('courses.shifts')
  const tCommon = useTranslations('common')

  const { data: session } = useSession()
  const params = useParams()
  const courseId = params.id as string
  const router = useRouter()

  const {
    data: course,
    error: courseError,
    mutate: mutateCourse,
  } = useSWR<Course>(courseId ? `/api/courses/${courseId}` : null, fetcher)

  const { data: students, mutate: mutateStudents } = useSWR<
    (Student & {
      attendancePercentage: number
      gradeAverage: number | null
      enrollmentStatus?: 'active' | 'inactive'
      withdrawalReason?: 'course_change' | 'school_change' | 'other'
      withdrawalNote?: string
    })[]
  >(courseId ? `/api/courses/${courseId}/students` : null, fetcher)

  const [viewMode, setViewMode] = useState<'list' | 'sheet' | 'grades'>('list')
  const [gradesPeriod, setGradesPeriod] = useState<1 | 2 | 'annual'>(1)
  const [gradesYear, setGradesYear] = useState<number>(new Date().getFullYear())
  const [isTabPending, startTabTransition] = useTransition()

  const { data: attendanceData, mutate: mutateAttendance } = useSWR<{
    dates: string[]
    records: Record<string, Record<string, 'present' | 'absent' | 'late'>>
    suspensions: Record<string, { reason: string; note?: string }>
  }>(courseId ? `/api/courses/${courseId}/attendance-records` : null, fetcher)

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isJoinRequestsModalOpen, setIsJoinRequestsModalOpen] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [isDeletingStudent, setIsDeletingStudent] = useState(false)
  const { showAlert } = useModal()

  const activeStudents = useMemo(
    () => (students || []).filter((student) => student.enrollmentStatus !== 'inactive'),
    [students],
  )

  // Fetch pending join requests count
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!courseId) return
      try {
        const response = await fetch(`/api/courses/${courseId}/join-requests`)
        if (response.ok) {
          const data = await response.json()
          setPendingRequestsCount(data.length)
        }
      } catch (error) {
        console.error('Error fetching pending requests:', error)
      }
    }

    fetchPendingCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    return () => clearInterval(interval)
  }, [courseId])

  if (!course && !courseError) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (courseError || !course) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{t('error')}</p>
        <Link href="/dashboard" className="text-indigo-600 hover:underline mt-4 inline-block">
          {t('backToDashboard')}
        </Link>
      </div>
    )
  }

  const confirmDeleteStudent = (student: Student) => {
    setStudentToDelete(student)
  }

  const handleExecuteWithdrawal = async (reason: string, note?: string) => {
    if (!studentToDelete) return
    setIsDeletingStudent(true)

    try {
      await fetch(`/api/courses/${courseId}/students/${studentToDelete._id.toString()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, note }),
      })
      mutateStudents()
      setStudentToDelete(null)
    } catch (error) {
      console.error('Error withrawing student:', error)
      await showAlert({
        title: tCommon('error'),
        description: tCommon('error'), // Or more specific if needed
        variant: 'danger',
      })
    } finally {
      setIsDeletingStudent(false)
    }
  }

  const handleExport = async (options: ExportOptions) => {
    try {
      // Construir query params
      const params = new URLSearchParams()
      if (options.dni) params.append('dni', 'true')
      if (options.email) params.append('email', 'true')
      if (options.phone) params.append('phone', 'true')
      if (options.grades) params.append('grades', 'true')
      if (options.attendanceStats) params.append('attendanceStats', 'true')
      if (options.attendanceDetails) params.append('attendanceDetails', 'true')

      const res = await fetch(`/api/courses/${courseId}/report?${params.toString()}`)

      if (!res.ok) throw new Error('Error descargando reporte')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${course.name}_reporte.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
      await showAlert({
        title: tCommon('error'),
        description: tCommon('error'),
        variant: 'danger',
      })
    }
  }

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
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-0.5 mb-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-right">
                {t('institutionLabel')}:
              </span>
              <p className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider leading-tight m-0">
                {course.institutionName}
              </p>

              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-right">
                {t('courseLabel')}:
              </span>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight m-0">
                  {course.name}
                </h1>
                <button
                  onClick={() => setIsEditCourseModalOpen(true)}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  title="Editar curso"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
              {course.shift && (
                <>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-right">
                    {t('shift')}:
                  </span>
                  <p
                    className={`text-sm font-semibold leading-tight m-0 ${course.shift === 'Mañana'
                        ? 'text-amber-600 dark:text-amber-400'
                        : course.shift === 'Tarde'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                  >
                    {course.shift === 'Mañana'
                      ? tShifts('morning')
                      : course.shift === 'Tarde'
                        ? tShifts('afternoon')
                        : course.shift === 'Noche'
                          ? tShifts('night')
                          : course.shift}
                  </p>
                </>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {course.description || t('noDescription')} • {activeStudents.length} {t('students')}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 md:gap-4 md:w-fit">
        <div className={`grid gap-3 md:gap-4 ${students && students.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            className="flex flex-col items-center justify-center py-2 md:py-4 md:px-8 gap-2 bg-[var(--bg-card)] border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 rounded-2xl hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-colors shadow-sm active:scale-95"
          >
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <UserPlus className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <span className="text-xs md:text-sm font-semibold text-center leading-tight">
              {t('buttons.addStudent')}
            </span>
          </button>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex flex-col items-center justify-center py-2 md:py-4 md:px-8 gap-2 bg-[var(--bg-card)] border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 rounded-2xl hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-colors shadow-sm relative active:scale-95"
          >
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <Link2 className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <span className="text-xs md:text-sm font-semibold text-center leading-tight">
              {t('buttons.invite')}
            </span>
            {pendingRequestsCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          {students && students.length > 0 && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex flex-col items-center justify-center py-2 md:py-4 md:px-8 gap-2 bg-[var(--bg-card)] border border-gray-300 dark:border-gray-700 text-[var(--text-secondary)] rounded-2xl hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-colors shadow-sm active:scale-95"
            >
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Download className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-center leading-tight">
                {t('buttons.export')}
              </span>
            </button>
          )}
        </div>

        {students && students.length > 0 && (
          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 flex items-center justify-center gap-3 text-base md:text-lg font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98]"
          >
            <CalendarCheck className="w-6 h-6" />
            {t('buttons.attendance')}
          </button>
        )}
      </div>

      {students && students.length === 0 && (
        <div className="mt-6 text-center bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border)] shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('empty.title')}</h3>
          <p className="text-gray-500 dark:text-gray-400">{t('empty.description')}</p>
        </div>
      )}

      {students && students.length > 0 && (
        <>
          {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-[var(--bg-card)] p-3 md:p-4 rounded-xl border border-[var(--border)] shadow-sm transition-colors flex flex-col items-center md:items-start">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-center md:text-left">
            {t('stats.avgAttendance')}
          </h3>
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <CalendarCheck className="w-4 h-4 md:w-5 h-5" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {((course.meta.avgAttendance || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-3 md:p-4 rounded-xl border border-[var(--border)] shadow-sm transition-colors flex flex-col items-center md:items-start">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-center md:text-left">
            {t('stats.overallAvg')}
          </h3>
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
              <GraduationCap className="w-4 h-4 md:w-5 h-5" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {course.meta.avgGrade ? course.meta.avgGrade.toFixed(2) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs / Content */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] transition-colors">
        <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {viewMode === 'list'
              ? t('tabs.list')
              : viewMode === 'sheet'
                ? t('tabs.sheet')
                : t('tabs.grades')}
          </h3>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => startTabTransition(() => setViewMode('list'))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list'
                  ? 'bg-accent-100 dark:bg-accent-500/20 text-primary-900 dark:text-accent-300'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-accent-50 dark:hover:bg-accent-500/10'
                }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">{t('tabs.listLabel')}</span>
            </button>
            <button
              onClick={() => startTabTransition(() => setViewMode('sheet'))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'sheet'
                  ? 'bg-accent-100 dark:bg-accent-500/20 text-primary-900 dark:text-accent-300'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-accent-50 dark:hover:bg-accent-500/10'
                }`}
            >
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">{t('tabs.sheetLabel')}</span>
            </button>
            <button
              onClick={() => startTabTransition(() => setViewMode('grades'))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'grades'
                  ? 'bg-accent-100 dark:bg-accent-500/20 text-primary-900 dark:text-accent-300'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-accent-50 dark:hover:bg-accent-500/10'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{t('tabs.gradesLabel')}</span>
            </button>
          </div>
        </div>

        <div className="p-2 sm:p-6">
          {!students ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : viewMode === 'list' ? (
            <StudentList
              students={students}
              onDeleteStudent={confirmDeleteStudent}
              onEditStudent={(student) => {
                setSelectedStudent(student)
                setIsEditStudentModalOpen(true)
              }}
              onStudentUpdated={() => mutateStudents()}
            />
          ) : viewMode === 'sheet' ? (
            attendanceData ? (
              <AttendanceSheet
                students={students}
                dates={attendanceData.dates}
                records={attendanceData.records}
                suspensions={attendanceData.suspensions}
                onUpdate={() => {
                  mutateStudents()
                  mutate(`/api/courses/${courseId}/attendance-records`)
                }}
              />
            ) : (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
              </div>
            )
          ) : (
            /* Tab de Calificaciones */
            <div className="space-y-4">
              <PeriodTabs
                selected={gradesPeriod}
                onChange={setGradesPeriod}
              />
              {gradesPeriod === 'annual' ? (
                <AnnualCloseTable year={gradesYear} />
              ) : (
                <GradeTable period={gradesPeriod} year={gradesYear} />
              )}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onStudentAdded={() => mutateStudents()}
      />

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        students={activeStudents}
        existingDates={attendanceData?.dates || []}
        onAttendanceSaved={() => {
          mutateStudents() // Update metrics
          mutateAttendance() // Update attendance data
        }}
      />


      {/* EditCourseModal */}
      {course && (
        <EditCourseModal
          isOpen={isEditCourseModalOpen}
          onClose={() => setIsEditCourseModalOpen(false)}
          course={course}
          onCourseUpdated={() => {
            mutateCourse()
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

      {/* InviteStudentsModal (Now includes JoinRequests) */}
      {course && (
        <InviteStudentsModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          courseId={courseId}
          courseName={course.name}
          currentJoinCode={course.joinCode}
          allowJoinRequests={course.allowJoinRequests}
          joinCodeExpiresAt={course.joinCodeExpiresAt}
          initialTab={pendingRequestsCount > 0 ? 'requests' : 'invite'}
          onRequestProcessed={() => {
            mutateStudents()
            // The modal itself refreshes count via onCountChange if we wanted, 
            // but the page will refresh on interval or we could add a dedicated mutator
          }}
        />
      )}



      {/* EditStudentModal */}
      <EditStudentModal
        isOpen={isEditStudentModalOpen}
        onClose={() => {
          setIsEditStudentModalOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onStudentUpdated={() => {
          mutateStudents()
          setIsEditStudentModalOpen(false)
          setSelectedStudent(null)
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
  )
}
