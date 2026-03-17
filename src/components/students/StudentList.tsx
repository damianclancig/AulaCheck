'use client'

import { Student } from '@/types/models'
import {
  MoreVertical,
  Mail,
  Phone,
  Trash2,
  UserCog,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Loader2,
  MessageSquare,
  Info,
} from 'lucide-react'
import { useState, useMemo, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ContactPopover } from './ContactPopover'
import { AddCommentModal } from './AddCommentModal'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  studentId: string
  mode: 'active' | 'inactive'
}

interface StudentListProps {
  students: (Student & {
    attendancePercentage?: number
    gradeAverage?: number | null
    enrollmentStatus?: 'active' | 'inactive'
    withdrawalReason?: 'course_change' | 'school_change' | 'other'
    withdrawalNote?: string
  })[]
  onDeleteStudent: (student: Student) => void
  onEditStudent: (student: Student) => void
  onStudentUpdated?: () => void
}

type SortField = 'name' | 'attendance' | 'grade'
type SortDirection = 'asc' | 'desc'

import { useTranslations } from 'next-intl'

function ContactTrigger({ student, showText = false }: { student: Student; showText?: boolean }) {
  const t = useTranslations('students.list')
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const hasEmail = !!student.email
  const hasPhone = !!student.phone

  if (!hasEmail && !hasPhone) {
    return null
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
          isOpen
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}
        title={t('contact')}
      >
        <div className="flex items-center">
          {hasEmail && <Mail className={`w-4 h-4 ${hasPhone ? 'mr-1' : ''}`} />}
          {hasPhone && <Phone className="w-4 h-4" />}
        </div>
        {showText && <span className="text-sm font-medium">{t('contact')}</span>}
      </button>

      <ContactPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        email={student.email}
        phone={student.phone}
        studentName={`${student.firstName} ${student.lastName}`}
      />
    </>
  )
}

export function StudentList({
  students,
  onDeleteStudent,
  onEditStudent,
  onStudentUpdated,
}: StudentListProps) {
  const t = useTranslations('students.list')
  const tWithdraw = useTranslations('students.withdrawModal')
  const tComments = useTranslations('students.addCommentModal')
  const tCommon = useTranslations('common')

  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [showInactiveStudents, setShowInactiveStudents] = useState(false)
  const [isAddCommentModalOpen, setIsAddCommentModalOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    studentId: '',
    mode: 'active',
  })
  const [studentToHardDelete, setStudentToHardDelete] = useState<Student | null>(null)
  const [isHardDeletingStudent, setIsHardDeletingStudent] = useState(false)
  const [loadingFlags, setLoadingFlags] = useState<
    Record<string, Record<string, boolean | undefined>>
  >({})
  const [optimisticFlags, setOptimisticFlags] = useState<
    Record<string, Record<string, boolean | undefined>>
  >({})
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, startTransition] = useTransition()

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu((prev) => ({ ...prev, visible: false }))
    const handleScroll = () => setContextMenu((prev) => ({ ...prev, visible: false }))

    if (contextMenu.visible) {
      document.addEventListener('click', handleClick)
      window.addEventListener('scroll', handleScroll, true) // Use capture phase for scrolling in any scrollable parent
      return () => {
        document.removeEventListener('click', handleClick)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [contextMenu.visible])

  const handleContextMenu = (
    e: React.MouseEvent | React.TouchEvent,
    studentId: string,
    mode: 'active' | 'inactive' = 'active',
  ) => {
    e.preventDefault()
    e.stopPropagation()

    let clientX = 0
    let clientY = 0

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }

    // Cálculos de posición (síncrono, no bloquea)
    const menuWidth = 220
    const menuHeight = mode === 'active' ? 280 : 120
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    let x = clientX
    if (x + menuWidth > windowWidth) x = clientX - menuWidth

    let y = clientY
    if (y + menuHeight > windowHeight) y = clientY - menuHeight

    x = Math.max(10, x)
    y = Math.max(10, y)

    // Diferir el re-render fuera del handler del evento para no bloquear el hilo principal.
    // Esto elimina el warning "contextmenu handler took Xms".
    startTransition(() => {
      setContextMenu({ visible: true, x, y, studentId, mode })
    })
  }

  const currentStudentContextMenu = students.find((s) => s._id.toString() === contextMenu.studentId)

  const isStudentInactive = (student: Student & { enrollmentStatus?: 'active' | 'inactive' }) => {
    return (
      student.enrollmentStatus === 'inactive' ||
      (student as Student & { status?: 'active' | 'inactive' }).status === 'inactive'
    )
  }

  const getWithdrawalReasonLabel = (student: {
    withdrawalReason?: 'course_change' | 'school_change' | 'other'
  }) => {
    if (student.withdrawalReason === 'course_change') return tWithdraw('reasons.courseChange')
    if (student.withdrawalReason === 'school_change') return tWithdraw('reasons.schoolChange')
    return tWithdraw('reasons.other')
  }

  const getWithdrawalTooltipText = (student: {
    withdrawalReason?: 'course_change' | 'school_change' | 'other'
    withdrawalNote?: string
  }) => {
    if (student.withdrawalReason === 'other' && student.withdrawalNote?.trim()) {
      return student.withdrawalNote.trim()
    }
    return getWithdrawalReasonLabel(student)
  }

  const renderInactiveBadge = (student: {
    withdrawalReason?: 'course_change' | 'school_change' | 'other'
    withdrawalNote?: string
  }) => {
    const tooltipText = getWithdrawalTooltipText(student)

    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        {t('inactive')}
        <span className="group relative inline-flex">
          <button
            type="button"
            className="inline-flex items-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
            aria-label={t('actions.withdrawalDetails')}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-[18rem] -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-gray-700">
            {tooltipText}
          </span>
        </span>
      </span>
    )
  }

  const handleToggleFlag = async (flag: 'requiresAttention' | 'isRepeating') => {
    if (!currentStudentContextMenu) return

    const studentId = currentStudentContextMenu._id.toString()
    const oldValue = currentStudentContextMenu[flag]
    const newValue = !oldValue

    // Configurar actualización optimista
    setOptimisticFlags((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [flag]: newValue,
      },
    }))

    // Configurar estado de carga
    setLoadingFlags((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [flag]: true,
      },
    }))

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [flag]: newValue,
        }),
      })

      if (!response.ok) throw new Error('Error al actualizar el alumno')

      if (onStudentUpdated) {
        onStudentUpdated()
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating flag:', error)
      // Revertir cambio optimista en caso de error
      setOptimisticFlags((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [flag]: oldValue,
        },
      }))
    } finally {
      // Quitar estado de carga
      setLoadingFlags((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [flag]: false,
        },
      }))
    }
  }

  const handleAddComment = async (comment: string) => {
    if (!currentStudentContextMenu) return

    const studentId = currentStudentContextMenu._id.toString()
    const oldNotes = currentStudentContextMenu.notes || ''
    const newNotes = oldNotes ? `${oldNotes}\n\n${comment}` : comment

    setLoadingFlags((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        comment: true,
      },
    }))

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: newNotes,
        }),
      })

      if (!response.ok) throw new Error('Error al actualizar el alumno')

      if (onStudentUpdated) {
        onStudentUpdated()
      }

      router.refresh()
      setIsAddCommentModalOpen(false)
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoadingFlags((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          comment: false,
        },
      }))
    }
  }

  const handleRequestHardDelete = (student: Student) => {
    setStudentToHardDelete(student)
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }

  const handleConfirmHardDelete = async () => {
    if (!studentToHardDelete) return

    setIsHardDeletingStudent(true)

    try {
      const response = await fetch(`/api/students/${studentToHardDelete._id.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar definitivamente el alumno')
      }

      if (onStudentUpdated) {
        onStudentUpdated()
      }

      router.refresh()
      setStudentToHardDelete(null)
    } catch (error) {
      console.error('Error deleting student permanently:', error)
    } finally {
      setIsHardDeletingStudent(false)
    }
  }

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    // Filter by search query
    let filtered = students.filter((student) => {
      const query = searchQuery.toLowerCase()
      return (
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.externalId?.toLowerCase().includes(query)
      )
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      if (sortField === 'name') {
        const lastNameCompare = a.lastName.localeCompare(b.lastName)
        comparison =
          lastNameCompare !== 0 ? lastNameCompare : a.firstName.localeCompare(b.firstName)
      } else if (sortField === 'attendance') {
        comparison = (a.attendancePercentage || 0) - (b.attendancePercentage || 0)
      } else if (sortField === 'grade') {
        const aGrade = a.gradeAverage ?? -1
        const bGrade = b.gradeAverage ?? -1
        comparison = aGrade - bGrade
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered.map((student) => {
      const studentId = student._id.toString()
      const studentOptimisticFlags = optimisticFlags[studentId]

      if (!studentOptimisticFlags) return student

      return {
        ...student,
        ...studentOptimisticFlags,
      }
    })
  }, [students, searchQuery, sortField, sortDirection, optimisticFlags])

  const activeStudents = useMemo(
    () => filteredAndSortedStudents.filter((student) => !isStudentInactive(student)),
    [filteredAndSortedStudents],
  )

  const inactiveStudents = useMemo(
    () => filteredAndSortedStudents.filter((student) => isStudentInactive(student)),
    [filteredAndSortedStudents],
  )

  const totalActiveStudents = useMemo(
    () => students.filter((student) => !isStudentInactive(student)).length,
    [students],
  )

  const totalInactiveStudents = useMemo(
    () => students.filter((student) => isStudentInactive(student)).length,
    [students],
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-indigo-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-indigo-600" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Mobile Sort Button */}
            <div className="relative md:hidden flex-1">
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t('sort')}
              </button>
              {sortMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-20">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {t('sortBy')}
                      </div>
                      <button
                        onClick={() => {
                          handleSort('name')
                          setSortMenuOpen(false)
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span>{t('studentAZ')}</span>
                        {sortField === 'name' && (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleSort('attendance')
                          setSortMenuOpen(false)
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span>{t('attendance')}</span>
                        {sortField === 'attendance' && (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleSort('grade')
                          setSortMenuOpen(false)
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span>{t('average')}</span>
                        {sortField === 'grade' && (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                      <button
                        onClick={() => {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span>{t('direction')}</span>
                        {sortDirection === 'asc' ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {t('count', { filtered: activeStudents.length, total: totalActiveStudents })}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && currentStudentContextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-100 min-w-[220px] transition-colors"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.mode === 'active' ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800 mb-1">
                {t('indicators')}
              </div>
              <button
                onClick={() => handleToggleFlag('requiresAttention')}
                disabled={loadingFlags[contextMenu.studentId]?.requiresAttention}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle
                    className={`w-4 h-4 ${currentStudentContextMenu.requiresAttention ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-fuchsia-500'}`}
                  />
                  <span
                    className={
                      currentStudentContextMenu.requiresAttention
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  >
                    {t('requiresAttention')}
                  </span>
                </div>
                {loadingFlags[contextMenu.studentId]?.requiresAttention ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                ) : (
                  currentStudentContextMenu.requiresAttention && (
                    <Check className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                  )
                )}
              </button>

              <button
                onClick={() => handleToggleFlag('isRepeating')}
                disabled={loadingFlags[contextMenu.studentId]?.isRepeating}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw
                    className={`w-4 h-4 ${currentStudentContextMenu.isRepeating ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-amber-500'}`}
                  />
                  <span
                    className={
                      currentStudentContextMenu.isRepeating
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  >
                    {t('isRepeating')}
                  </span>
                </div>
                {loadingFlags[contextMenu.studentId]?.isRepeating ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                ) : (
                  currentStudentContextMenu.isRepeating && (
                    <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )
                )}
              </button>

              <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

              <button
                onClick={() => {
                  setIsAddCommentModalOpen(true)
                  setContextMenu({ ...contextMenu, visible: false })
                }}
                disabled={loadingFlags[contextMenu.studentId]?.comment}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('actions.addComment')}
                  </span>
                </div>
                {loadingFlags[contextMenu.studentId]?.comment && (
                  <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                )}
              </button>

              <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

              <button
                onClick={() => {
                  onEditStudent(currentStudentContextMenu)
                  setContextMenu({ ...contextMenu, visible: false })
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
              >
                <UserCog className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">{t('actions.edit')}</span>
              </button>

              <button
                onClick={() => {
                  onDeleteStudent(currentStudentContextMenu)
                  setContextMenu({ ...contextMenu, visible: false })
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">
                  {isStudentInactive(currentStudentContextMenu)
                    ? t('actions.withdrawalDetails')
                    : t('actions.withdrawal')}
                </span>
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800 mb-1">
                {t('inactiveSection.title')}
              </div>
              <button
                onClick={() => handleRequestHardDelete(currentStudentContextMenu)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">{t('actions.hardDelete')}</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    {t('headers.student')}
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24"
                >
                  <Mail className="w-4 h-4 mx-auto" />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('attendance')}
                >
                  <div className="flex items-center gap-2">
                    {t('headers.attendance')}
                    <SortIcon field="attendance" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('grade')}
                >
                  <div className="flex items-center gap-2">
                    {t('headers.average')}
                    <SortIcon field="grade" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {activeStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchQuery ? t('empty.search') : t('empty.noStudents')}
                  </td>
                </tr>
              ) : (
                activeStudents.map((student) => {
                  const isInactive = isStudentInactive(student)
                  const attendanceColor = isInactive
                    ? 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800'
                    : (student.attendancePercentage || 0) >= 0.75
                      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                      : (student.attendancePercentage || 0) >= 0.6
                        ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
                        : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'

                  return (
                    <tr
                      key={student._id.toString()}
                      className={cn(
                        'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                        isInactive
                          ? 'opacity-60 bg-gray-50/50 dark:bg-gray-900/50'
                          : 'cursor-context-menu',
                      )}
                      onContextMenu={(e) => {
                        if (!isInactive) {
                          handleContextMenu(e, student._id.toString())
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <div
                              className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isInactive ? 'bg-gray-100 dark:bg-gray-800' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}
                            >
                              <span
                                className={`font-medium text-xs ${isInactive ? 'text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                              >
                                {student.firstName[0]}
                                {student.lastName[0]}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <span
                                  className={
                                    student.requiresAttention
                                      ? 'bg-fuchsia-200 dark:bg-fuchsia-900/40 text-fuchsia-900 dark:text-fuchsia-100 px-1.5 py-0.5 rounded-sm'
                                      : ''
                                  }
                                >
                                  {student.lastName}, {student.firstName}
                                </span>
                                {Object.values(loadingFlags[student._id.toString()] || {}).some(
                                  Boolean,
                                ) && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
                                <div className="flex items-center gap-1.5 ml-1">
                                  {student.isRepeating && (
                                    <div
                                      className="flex items-center justify-center w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50"
                                      title={t('isRepeating')}
                                    >
                                      <span className="font-black text-sm">R</span>
                                    </div>
                                  )}
                                </div>
                                {isInactive && renderInactiveBadge(student)}
                              </div>
                              {student.externalId && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {t('externalIdPlaceholder')}: {student.externalId}
                                </div>
                              )}
                            </div>
                          </div>
                          {student.notes && (
                            <div
                              className="text-sm text-gray-500 dark:text-gray-400 italic whitespace-pre-line line-clamp-2 max-w-md"
                              title={student.notes}
                            >
                              {student.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div
                          className={`flex justify-center ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <ContactTrigger student={student} showText={true} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1 justify-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${attendanceColor}`}
                          >
                            {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-600">/</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(100 - (student.attendancePercentage || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {student.gradeAverage !== null && student.gradeAverage !== undefined
                          ? student.gradeAverage.toFixed(2)
                          : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {activeStudents.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400 transition-colors">
            {searchQuery ? t('empty.search') : t('empty.noStudents')}
          </div>
        ) : (
          activeStudents.map((student) => {
            const isInactive = isStudentInactive(student)
            const attendanceColor = isInactive
              ? 'text-gray-400 bg-gray-100'
              : (student.attendancePercentage || 0) >= 0.75
                ? 'text-green-600 bg-green-50'
                : (student.attendancePercentage || 0) >= 0.6
                  ? 'text-yellow-600 bg-yellow-50'
                  : 'text-red-600 bg-red-50'

            return (
              <Card
                variant={isInactive ? "standard" : "interactive"}
                key={student._id.toString()}
                className={`p-4 transition-colors select-none ${isInactive ? 'opacity-70 bg-gray-50/50' : ''}`}
                onContextMenu={(e) => {
                  if (!isInactive) {
                    handleContextMenu(e, student._id.toString())
                  }
                }}
                onTouchStart={(e) => {
                  if (isInactive) return
                  const touch = e.touches[0]
                  // Guardar el timer id en el elemento para poder cancelarlo si se mueve el dedo
                  const timerId = window.setTimeout(() => {
                    handleContextMenu(
                      {
                        preventDefault: () => {},
                        stopPropagation: () => {},
                        touches: [{ clientX: touch.clientX, clientY: touch.clientY }],
                      } as any,
                      student._id.toString(),
                    )
                  }, 600)

                  e.currentTarget.setAttribute('data-longpress-timer', timerId.toString())
                }}
                onTouchMove={(e) => {
                  const timerId = e.currentTarget.getAttribute('data-longpress-timer')
                  if (timerId) {
                    window.clearTimeout(parseInt(timerId, 10))
                    e.currentTarget.removeAttribute('data-longpress-timer')
                  }
                }}
                onTouchEnd={(e) => {
                  const timerId = e.currentTarget.getAttribute('data-longpress-timer')
                  if (timerId) {
                    window.clearTimeout(parseInt(timerId, 10))
                    e.currentTarget.removeAttribute('data-longpress-timer')
                  }
                }}
              >
                <div className="bg-gray-50 dark:bg-gray-800 -mx-4 -mt-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl flex justify-between items-center mb-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isInactive ? 'bg-gray-200' : 'bg-indigo-100 dark:bg-indigo-900/40'}`}
                    >
                      <span
                        className={`font-medium text-[10px] ${isInactive ? 'text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                      >
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        <span
                          className={
                            student.requiresAttention
                              ? 'bg-fuchsia-200 dark:bg-fuchsia-900/40 text-fuchsia-900 dark:text-fuchsia-100 px-1.5 py-0.5 rounded-sm'
                              : ''
                          }
                        >
                          {student.lastName}, {student.firstName}
                        </span>
                      </h4>
                      <div className="flex items-center gap-1">
                        {student.isRepeating && (
                          <div
                            className="flex items-center justify-center w-5 h-5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50"
                            title={t('isRepeating')}
                          >
                            <span className="font-black text-[10px]">R</span>
                          </div>
                        )}
                        {isInactive && renderInactiveBadge(student)}
                        {Object.values(loadingFlags[student._id.toString()] || {}).some(
                          Boolean,
                        ) && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin ml-1" />}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleContextMenu(e, student._id.toString())
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {student.externalId && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
                    {t('externalIdPlaceholder')}: {student.externalId}
                  </p>
                )}

                {student.notes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic whitespace-pre-line line-clamp-3 mb-3">
                    {student.notes}
                  </p>
                )}

                {student.email || student.phone ? (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ContactTrigger student={student} showText={true} />
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t('headers.attendance')}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${attendanceColor}`}
                      >
                        {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t('headers.average')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {student.gradeAverage !== null && student.gradeAverage !== undefined
                          ? student.gradeAverage.toFixed(2)
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {totalInactiveStudents > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('inactiveSection.title')}
            </h3>
            <button
              type="button"
              onClick={() => setShowInactiveStudents((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {showInactiveStudents ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              {showInactiveStudents
                ? t('inactiveSection.hide', { count: totalInactiveStudents })
                : t('inactiveSection.show', { count: totalInactiveStudents })}
            </button>
          </div>

          {showInactiveStudents && (
            <>
              <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {t('headers.student')}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24"
                        >
                          <Mail className="w-4 h-4 mx-auto" />
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {t('headers.attendance')}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {t('headers.average')}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16"
                        >
                          <MoreVertical className="w-4 h-4 ml-auto" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {inactiveStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                          >
                            {searchQuery ? t('inactiveSection.emptySearch') : t('empty.noStudents')}
                          </td>
                        </tr>
                      ) : (
                        inactiveStudents.map((student) => {
                          const isInactive = true
                          const attendanceColor =
                            'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800'

                          return (
                            <tr
                              key={student._id.toString()}
                              className={cn(
                                'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                                isInactive
                                  ? 'opacity-60 bg-gray-50/50 dark:bg-gray-900/50'
                                  : 'cursor-context-menu',
                              )}
                              onContextMenu={(e) =>
                                handleContextMenu(e, student._id.toString(), 'inactive')
                              }
                            >
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center">
                                    <div
                                      className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isInactive ? 'bg-gray-100 dark:bg-gray-800' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}
                                    >
                                      <span
                                        className={`font-medium text-xs ${isInactive ? 'text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                                      >
                                        {student.firstName[0]}
                                        {student.lastName[0]}
                                      </span>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <span
                                          className={
                                            student.requiresAttention
                                              ? 'bg-fuchsia-200 dark:bg-fuchsia-900/40 text-fuchsia-900 dark:text-fuchsia-100 px-1.5 py-0.5 rounded-sm'
                                              : ''
                                          }
                                        >
                                          {student.lastName}, {student.firstName}
                                        </span>
                                        <div className="flex items-center gap-1.5 ml-1">
                                          {student.isRepeating && (
                                            <div
                                              className="flex items-center justify-center w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50"
                                              title={t('isRepeating')}
                                            >
                                              <span className="font-black text-sm">R</span>
                                            </div>
                                          )}
                                        </div>
                                        {renderInactiveBadge(student)}
                                      </div>
                                      {student.externalId && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {t('externalIdPlaceholder')}: {student.externalId}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {student.notes && (
                                    <div
                                      className="text-sm text-gray-500 dark:text-gray-400 italic whitespace-pre-line line-clamp-2 max-w-md"
                                      title={student.notes}
                                    >
                                      {student.notes}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex justify-center opacity-50 pointer-events-none">
                                  <ContactTrigger student={student} showText={true} />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-1 justify-center">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${attendanceColor}`}
                                  >
                                    {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-600">
                                    /
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {(100 - (student.attendancePercentage || 0) * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                {student.gradeAverage !== null && student.gradeAverage !== undefined
                                  ? student.gradeAverage.toFixed(2)
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    handleContextMenu(e, student._id.toString(), 'inactive')
                                  }
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  aria-label={t('actions.hardDelete')}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden space-y-4">
                {inactiveStudents.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400 transition-colors">
                    {searchQuery ? t('inactiveSection.emptySearch') : t('empty.noStudents')}
                  </div>
                ) : (
                  inactiveStudents.map((student) => {
                    const isInactive = true
                    const attendanceColor = 'text-gray-400 bg-gray-100'

                    return (
                      <Card
                        variant="standard"
                        key={student._id.toString()}
                        className={`p-4 transition-colors select-none ${isInactive ? 'opacity-70 bg-gray-50/50' : ''}`}
                        onContextMenu={(e) =>
                          handleContextMenu(e, student._id.toString(), 'inactive')
                        }
                        onTouchStart={(e) => {
                          const touch = e.touches[0]
                          const timerId = window.setTimeout(() => {
                            handleContextMenu(
                              {
                                preventDefault: () => {},
                                stopPropagation: () => {},
                                touches: [{ clientX: touch.clientX, clientY: touch.clientY }],
                              } as any,
                              student._id.toString(),
                              'inactive',
                            )
                          }, 600)

                          e.currentTarget.setAttribute('data-longpress-timer', timerId.toString())
                        }}
                        onTouchMove={(e) => {
                          const timerId = e.currentTarget.getAttribute('data-longpress-timer')
                          if (timerId) {
                            window.clearTimeout(parseInt(timerId, 10))
                            e.currentTarget.removeAttribute('data-longpress-timer')
                          }
                        }}
                        onTouchEnd={(e) => {
                          const timerId = e.currentTarget.getAttribute('data-longpress-timer')
                          if (timerId) {
                            window.clearTimeout(parseInt(timerId, 10))
                            e.currentTarget.removeAttribute('data-longpress-timer')
                          }
                        }}
                      >
                        <div className="bg-gray-50 dark:bg-gray-800 -mx-4 -mt-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl flex justify-between items-center mb-4 transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isInactive ? 'bg-gray-200' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}
                            >
                              <span
                                className={`font-medium text-[10px] ${isInactive ? 'text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                              >
                                {student.firstName[0]}
                                {student.lastName[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <span
                                  className={
                                    student.requiresAttention
                                      ? 'bg-fuchsia-200 dark:bg-fuchsia-900/40 text-fuchsia-900 dark:text-fuchsia-100 px-1.5 py-0.5 rounded-sm'
                                      : ''
                                  }
                                >
                                  {student.lastName}, {student.firstName}
                                </span>
                              </h4>
                              <div className="flex items-center gap-1.5 ml-1">
                                {student.isRepeating && (
                                  <div
                                    className="flex items-center justify-center w-5 h-5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50"
                                    title={t('isRepeating')}
                                  >
                                    <span className="font-black text-[10px]">R</span>
                                  </div>
                                )}
                                {renderInactiveBadge(student)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleContextMenu(e, student._id.toString(), 'inactive')
                            }
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                            aria-label={t('actions.hardDelete')}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>

                        {student.externalId && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
                            {t('externalIdPlaceholder')}: {student.externalId}
                          </p>
                        )}

                        {student.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic whitespace-pre-line line-clamp-3 mb-3">
                            {student.notes}
                          </p>
                        )}

                        {student.email || student.phone ? (
                          <div className="flex items-center justify-between mb-3 opacity-50 pointer-events-none">
                            <div className="flex items-center gap-2">
                              <ContactTrigger student={student} showText={true} />
                            </div>
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {t('headers.attendance')}
                              </p>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${attendanceColor}`}
                              >
                                {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {t('headers.average')}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {student.gradeAverage !== null && student.gradeAverage !== undefined
                                  ? student.gradeAverage.toFixed(2)
                                  : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      <AddCommentModal
        isOpen={isAddCommentModalOpen}
        onClose={() => setIsAddCommentModalOpen(false)}
        onConfirm={handleAddComment}
        studentName={
          currentStudentContextMenu
            ? `${currentStudentContextMenu.firstName} ${currentStudentContextMenu.lastName}`
            : ''
        }
        isLoading={loadingFlags[contextMenu.studentId]?.comment}
      />

      <ConfirmationModal
        isOpen={!!studentToHardDelete}
        onClose={() => {
          if (!isHardDeletingStudent) {
            setStudentToHardDelete(null)
          }
        }}
        onConfirm={handleConfirmHardDelete}
        title={t('hardDeleteModal.title')}
        description={t('hardDeleteModal.description', {
          name: studentToHardDelete
            ? `${studentToHardDelete.lastName}, ${studentToHardDelete.firstName}`
            : '',
        })}
        confirmText={t('hardDeleteModal.confirmButton')}
        cancelText={tCommon('cancel')}
        variant="danger"
        isLoading={isHardDeletingStudent}
      />
    </div>
  )
}
