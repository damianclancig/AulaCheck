'use client'

import { Student } from '@/types/models'
import { AttendanceIcon } from './AttendanceIcon'
import { useEffect, useRef, useState, useTransition, useMemo, useCallback, memo } from 'react'
import { Check, XCircle, Clock, X as XIcon, Info } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useModal } from '@/hooks/useModal'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { StudentAvatar } from '../students/StudentAvatar'

type AttendanceStatus = 'present' | 'absent' | 'late'

interface AttendanceSheetProps {
  students: (Student & { enrollmentStatus?: 'active' | 'inactive' })[]
  dates: string[]
  records: Record<string, Record<string, AttendanceStatus>>
  suspensions?: Record<string, { reason: string; note?: string }>
  onUpdate?: () => void
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  studentId: string
  date: string
  currentStatus?: AttendanceStatus
}

// Función para obtener fecha local en formato YYYY-MM-DD sin conversión UTC
const getLocalDateString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isFutureDate = (dateStr: string) => {
  const today = getLocalDateString()
  return dateStr > today
}

interface StudentAttendanceCardProps {
  student: Student & { enrollmentStatus?: 'active' | 'inactive' }
  dates: string[]
  studentRecords: Record<string, AttendanceStatus>
  suspensions?: Record<string, { reason: string; note?: string }>
  onContextMenu: (
    e: React.MouseEvent | React.TouchEvent,
    studentId: string,
    date: string,
    status?: AttendanceStatus,
  ) => void
  scrollRef: (el: HTMLDivElement | null) => void
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  t: any
}

const StudentAttendanceCard = memo(function StudentAttendanceCard({
  student,
  dates,
  studentRecords,
  suspensions,
  onContextMenu,
  scrollRef,
  onScroll,
  t,
}: StudentAttendanceCardProps) {
  const isInactive = student.enrollmentStatus === 'inactive'

  return (
    <Card
      variant={isInactive ? "standard" : "interactive"}
      className="p-2.5 transition-colors space-y-3"
    >
      {/* Student Header */}
      <div
        className={`${isInactive ? 'bg-gray-200/70 dark:bg-gray-700/60' : 'bg-gray-50 dark:bg-gray-800'} -mx-2.5 -mt-2.5 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl flex justify-between items-center gap-2`}
      >
        <div className="flex items-center gap-2 truncate">
          <StudentAvatar firstName={student.firstName} lastName={student.lastName} isInactive={isInactive} />
          <h3
            className={`text-base font-semibold ${isInactive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'} truncate`}
          >
            {student.lastName}, {student.firstName}
          </h3>
        </div>

        {/* Statistics in Header */}
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {(() => {
            const totalClasses = dates.length
            const presentCount = dates.filter((date) => studentRecords[date] === 'present').length
            const absentCount = dates.filter((date) => studentRecords[date] === 'absent').length
            const presentPercentage =
              totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(0) : '0'
            const absentPercentage =
              totalClasses > 0 ? ((absentCount / totalClasses) * 100).toFixed(0) : '0'
            return (
              <>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-green-700 dark:text-green-400 font-semibold">
                    {presentCount}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">/</span>
                  <span className="text-red-700 dark:text-red-400 font-semibold">
                    {absentCount}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>{presentPercentage}%</span>
                  <span className="text-gray-300 dark:text-gray-600">/</span>
                  <span>{absentPercentage}%</span>
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* Attendance Slider - Horizontal */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={onScroll}
        >
          <div className="flex gap-2 p-3 min-w-min">
            {dates.map((date) => {
              const status = studentRecords[date]
              const isSuspended = !!suspensions?.[date]
              const isFuture = isFutureDate(date)
              const hasRecord = !!status
              const isDisabled = isSuspended || isFuture || (isInactive && !hasRecord)

              return (
                <div
                  key={date}
                  className={`flex flex-col items-center gap-2 min-w-[70px] snap-start ${isDisabled ? 'opacity-70' : ''}`}
                  onContextMenu={(e) => {
                    if (!isDisabled) onContextMenu(e, student._id.toString(), date, status)
                    else e.preventDefault()
                  }}
                  onTouchStart={(e) => {
                    if (isDisabled) return
                    const touch = e.touches[0]
                    const timer = setTimeout(() => {
                      onContextMenu(
                        {
                          preventDefault: () => {},
                          clientX: touch.clientX,
                          clientY: touch.clientY,
                        } as any,
                        student._id.toString(),
                        date,
                        status,
                      )
                    }, 500)
                    const cancel = () => clearTimeout(timer)
                    e.currentTarget.addEventListener('touchend', cancel, { once: true })
                    e.currentTarget.addEventListener('touchmove', cancel, { once: true })
                  }}
                >
                  <div
                    className={`text-xs font-medium text-center flex flex-col items-center ${
                      isSuspended
                        ? 'text-blue-600 dark:text-blue-400'
                        : isFuture
                          ? 'text-gray-400 dark:text-gray-500 italic'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {(() => {
                      const [, month, day] = date.split('-').map(Number)
                      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
                    })()}
                    {isSuspended && <Info className="w-3 h-3 mt-0.5" />}
                  </div>
                  <div className="flex items-center justify-center">
                    {isSuspended ? (
                      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    ) : isFuture && !status ? (
                      <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                    ) : isInactive && !status ? (
                      <div className="w-4 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    ) : (
                      <AttendanceIcon status={status} size="md" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
      </div>
    </Card>
  )
})

export function AttendanceSheet({
  students,
  dates,
  records,
  suspensions,
  onUpdate,
}: AttendanceSheetProps) {
  const { data: session } = useSession()
  const params = useParams()
  const courseId = params.id as string
  const t = useTranslations('attendance.sheet')
  const tCommon = useTranslations('common')
  const [visibleStudents, setVisibleStudents] = useState(20)
  const observerRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    studentId: '',
    date: '',
  })
  const [updating, setUpdating] = useState(false)
  const { showAlert } = useModal()
  const [, startTransition] = useTransition()

  // Synchronized scroll state for mobile sliders
  const scrollRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const isScrolling = useRef(false)

  // Infinite scroll logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const totalStudents = students.length
        if (entries[0].isIntersecting && visibleStudents < totalStudents) {
          setVisibleStudents((prev) => Math.min(prev + 20, totalStudents))
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [visibleStudents, students.length])

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu((prev) => ({ ...prev, visible: false }))
    if (contextMenu.visible) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu.visible])

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return `${day}/${month}`
  }

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const aIsInactive = a.enrollmentStatus === 'inactive'
      const bIsInactive = b.enrollmentStatus === 'inactive'

      if (aIsInactive !== bIsInactive) {
        return aIsInactive ? 1 : -1
      }

      const lastNameCompare = a.lastName.localeCompare(b.lastName)
      return lastNameCompare !== 0 ? lastNameCompare : a.firstName.localeCompare(b.firstName)
    })
  }, [students])

  const displayedStudents = useMemo(() => {
    return sortedStudents.slice(0, visibleStudents)
  }, [sortedStudents, visibleStudents])

  const handleContextMenu = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      studentId: string,
      date: string,
      currentStatus?: AttendanceStatus,
    ) => {
      if ('preventDefault' in e) e.preventDefault()

      let clientX = 0
      let clientY = 0

      if ('touches' in e && (e as any).touches.length > 0) {
        clientX = (e as any).touches[0].clientX
        clientY = (e as any).touches[0].clientY
      } else {
        clientX = (e as any).clientX
        clientY = (e as any).clientY
      }

      const menuWidth = 160
      const menuHeight = currentStatus ? 200 : 150
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      let x = clientX
      if (x + menuWidth > windowWidth) x = clientX - menuWidth

      let y = clientY
      if (y + menuHeight > windowHeight) y = clientY - menuHeight + 20

      x = Math.max(10, x)
      y = Math.max(10, y)

      startTransition(() => {
        setContextMenu({ visible: true, x, y, studentId, date, currentStatus })
      })
    },
    [],
  )

  const handleStatusChange = async (newStatus: AttendanceStatus | null) => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
    setUpdating(true)

    try {
      if (newStatus === null) {
        const response = await fetch(
          `/api/courses/${courseId}/attendance/${contextMenu.studentId}?date=${contextMenu.date}`,
          { method: 'DELETE' },
        )
        if (!response.ok) throw new Error(t('legends.delete'))
      } else {
        const response = await fetch(`/api/courses/${courseId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: contextMenu.date,
            records: [{ studentId: contextMenu.studentId, status: newStatus }],
          }),
        })
        if (!response.ok) throw new Error(tCommon('error'))
      }
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating attendance:', error)
      await showAlert({ title: tCommon('error'), description: tCommon('error'), variant: 'danger' })
    } finally {
      setUpdating(false)
    }
  }

  const syncScroll = useCallback((e: React.UIEvent<HTMLDivElement>, studentId: string) => {
    if (isScrolling.current) return
    isScrolling.current = true
    const scrollLeft = e.currentTarget.scrollLeft

    requestAnimationFrame(() => {
      scrollRefs.current.forEach((ref, id) => {
        if (id !== studentId && ref && ref.scrollLeft !== scrollLeft) {
          ref.scrollLeft = scrollLeft
        }
      })
      isScrolling.current = false
    })
  }, [])

  // Totals calculation
  const totalsByDate = useMemo(() => {
    const totals: Record<
      string,
      {
        present: number
        absent: number
        totalActive: number
        presentPercentage: string
        hasRecordsLoaded: boolean
      }
    > = {}

    dates.forEach((date) => {
      let presentCount = 0
      let absentCount = 0
      let totalActive = 0
      let hasRecordsLoaded = false

      students.forEach((student) => {
        if (student.enrollmentStatus !== 'inactive') {
          totalActive++
          const status = records[student._id.toString()]?.[date]
          if (status) hasRecordsLoaded = true
          if (status === 'present') presentCount++
          if (status === 'absent') absentCount++
        }
      })

      let presentPercentage = t('totals.empty')
      if (hasRecordsLoaded && totalActive > 0) {
        presentPercentage = ((presentCount / totalActive) * 100).toFixed(1).replace(/\.0$/, '')
      }

      totals[date] = {
        present: presentCount,
        absent: absentCount,
        totalActive,
        presentPercentage,
        hasRecordsLoaded,
      }
    })

    return totals
  }, [dates, students, records, t])

  if (dates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>{t('noRecords')}</p>
        <p className="text-sm mt-2">{t('howToStart')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{t('stats', { students: students.length, dates: dates.length })}</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 transition-colors">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <span>
            <span className="hidden sm:inline">{t('helpDesktop')}</span>
            <span className="sm:hidden">{t('helpMobile')}</span>
          </span>
        </div>
      </div>

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
            <span className="font-medium">{t('legends.present')}</span>
          </button>
          <button
            onClick={() => handleStatusChange('absent')}
            disabled={updating}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 disabled:opacity-50 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="font-medium">{t('legends.absent')}</span>
          </button>
          <button
            onClick={() => handleStatusChange('late')}
            disabled={updating}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 disabled:opacity-50 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium">{t('legends.late')}</span>
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
                <span className="font-medium">{t('legends.delete')}</span>
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
                {tCommon('student')}
              </th>
              {dates.map((date) => {
                const suspension = suspensions?.[date]
                const isFuture = isFutureDate(date)
                return (
                  <th
                    key={date}
                    className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap group relative ${suspension ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' : isFuture ? 'text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/50' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={isFuture ? 'italic' : ''}>{formatDate(date)}</span>
                      {suspension && <Info className="w-3 h-3" />}
                    </div>
                  </th>
                )
              })}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                {t('columnHeader')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {displayedStudents.map((student) => {
              const studentId = student._id.toString()
              const studentRecords = records[studentId] || {}
              const totalClasses = dates.length
              const presentCount = dates.filter((date) => studentRecords[date] === 'present').length
              const absentCount = dates.filter((date) => studentRecords[date] === 'absent').length
              const presentPercentage =
                totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(0) : '0'
              const absentPercentage =
                totalClasses > 0 ? ((absentCount / totalClasses) * 100).toFixed(0) : '0'

              const isInactive = student.enrollmentStatus === 'inactive'

              return (
                <tr
                  key={studentId}
                  className={`transition-colors ${isInactive ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/60 dark:hover:bg-gray-700/60' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <td
                    className={`sticky left-0 z-10 ${isInactive ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'} px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700`}
                  >
                    <div className="flex items-center gap-3">
                      <StudentAvatar firstName={student.firstName} lastName={student.lastName} isInactive={isInactive} />
                      <span className={`text-base font-medium ${isInactive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {student.lastName}, {student.firstName}
                      </span>
                    </div>
                  </td>
                  {dates.map((date) => {
                    const status = studentRecords[date]
                    const isDisabled =
                      !!suspensions?.[date] ||
                      isFutureDate(date) ||
                      (student.enrollmentStatus === 'inactive' && !status)
                    return (
                      <td
                        key={date}
                        className={`px-4 py-4 text-center ${isDisabled ? 'bg-gray-50/50 dark:bg-gray-800/50 cursor-default' : 'cursor-context-menu'}`}
                        onContextMenu={(e) => {
                          if (!isDisabled) handleContextMenu(e, studentId, date, status)
                          else e.preventDefault()
                        }}
                      >
                        <div className="flex justify-center">
                          {isDisabled && !status ? (
                            <div
                              className={`rounded-full ${!!suspensions?.[date] ? 'w-2 h-2 bg-gray-300' : isFutureDate(date) ? 'w-1 h-1 bg-gray-200' : 'w-4 h-0.5 bg-gray-300'}`}
                            />
                          ) : (
                            <AttendanceIcon status={status} size="md" />
                          )}
                        </div>
                      </td>
                    )
                  })}
                  <td
                    className={`px-6 py-4 text-center border-l border-gray-200 dark:border-gray-700 ${isInactive ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}
                  >
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-green-700 dark:text-green-400 font-semibold">
                          {presentCount}
                        </span>
                        <span className="text-gray-400 dark:text-gray-600">/</span>
                        <span className="text-red-700 dark:text-red-400 font-semibold">
                          {absentCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                        <span>{presentPercentage}%</span>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <span>{absentPercentage}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800 sticky bottom-0 z-10 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <tr>
              <td className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                {t('totals.presentAbsent')}
              </td>
              {dates.map((date) => {
                const total = totalsByDate[date]
                return (
                  <td
                    key={date}
                    className="px-4 py-3 text-center text-xs font-medium border-r border-gray-200 border-opacity-50 dark:border-gray-700 dark:border-opacity-50 last:border-0"
                  >
                    {total.hasRecordsLoaded ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-green-700 dark:text-green-400">{total.present}</span>
                        <span className="text-gray-400 dark:text-gray-500">/</span>
                        <span className="text-red-700 dark:text-red-400">{total.absent}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 break-words line-clamp-1">{t('totals.empty')}</span>
                    )}
                  </td>
                )
              })}
              <td className="px-6 py-3 border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" />
            </tr>
            <tr>
              <td className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                {t('totals.rate')}
              </td>
              {dates.map((date) => {
                const total = totalsByDate[date]
                return (
                  <td
                    key={date}
                    className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 border-opacity-50 dark:border-gray-700 dark:border-opacity-50 last:border-0"
                  >
                    {total.hasRecordsLoaded ? `${total.presentPercentage}%` : t('totals.empty')}
                  </td>
                )
              })}
              <td className="px-6 py-3 border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" />
            </tr>
          </tfoot>
        </table>
        {visibleStudents < students.length && (
          <div
            ref={observerRef}
            className="h-10 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500"
          >
            {t('loading')}
          </div>
        )}
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-4">
        {displayedStudents.map((student) => (
          <StudentAttendanceCard
            key={student._id.toString()}
            student={student}
            dates={dates}
            studentRecords={records[student._id.toString()] || {}}
            suspensions={suspensions}
            onContextMenu={handleContextMenu}
            scrollRef={(el) => {
              if (el) scrollRefs.current.set(student._id.toString(), el)
            }}
            onScroll={(e) => syncScroll(e, student._id.toString())}
            t={t}
          />
        ))}
        {visibleStudents < students.length && (
          <div
            ref={observerRef}
            className="h-10 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500"
          >
            {t('loading')}
          </div>
        )}


        {/* Mobile Totals Card - Horizontal Scroll consistent with student cards */}
        <Card className="p-0 overflow-hidden mt-6 border-blue-100 dark:border-blue-900/50 bg-white dark:bg-gray-900 shadow-md">
          {/* Header */}
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-blue-100 dark:border-blue-900/30">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider">
              {t('totals.title')}
            </h3>
          </div>

          {/* Scrollable Content */}
          <div className="relative">
            <div
              ref={(el) => {
                if (el) scrollRefs.current.set('totals', el)
              }}
              className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={(e) => syncScroll(e, 'totals')}
            >
              <div className="flex gap-2 p-4 min-w-min">
                {dates.map((date) => {
                  const total = totalsByDate[date]
                  return (
                    <div
                      key={date}
                      className="flex flex-col items-center gap-2.5 min-w-[80px] snap-start"
                    >
                      {/* Date Header */}
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center">
                        {formatDate(date)}
                      </div>

                      {/* Content Box */}
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 w-full min-h-[60px] transition-colors">
                        {total.hasRecordsLoaded ? (
                          <>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-green-700 dark:text-green-400 font-bold">
                                {total.present}
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">/</span>
                              <span className="text-red-700 dark:text-red-400 font-bold">
                                {total.absent}
                              </span>
                            </div>
                            <div className="text-[10px] font-bold text-gray-900 dark:text-gray-100 mt-1 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                              {total.presentPercentage}%
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs font-medium italic">
                            {t('totals.empty')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Gradients to hint scroll */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none opacity-50" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none opacity-50" />
          </div>
        </Card>
      </div>
    </div>
  )
}
