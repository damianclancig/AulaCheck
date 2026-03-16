'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Check, XCircle, User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { PendingJoinRequestWithMatches } from '@/types/models'
import { useModal } from '@/hooks/useModal'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface JoinRequestsModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  onRequestProcessed: () => void
}

export function JoinRequestsModal({
  isOpen,
  onClose,
  courseId,
  onRequestProcessed,
}: JoinRequestsModalProps) {
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<PendingJoinRequestWithMatches[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const { showAlert } = useModal()
  const t = useTranslations('students.joinRequests')
  const tCommon = useTranslations('common')

  useEffect(() => {
    if (isOpen) {
      fetchRequests()
    }
  }, [isOpen, courseId])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}/join-requests`)

      if (!response.ok) throw new Error(t('alerts.errorLoad'))

      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId)
    try {
      const response = await fetch(`/api/courses/${courseId}/join-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action }),
      })

      if (!response.ok) throw new Error(t('alerts.error'))

      // Remove from list
      setRequests(requests.filter((r) => r._id.toString() !== requestId))
      onRequestProcessed()
    } catch (error) {
      console.error(error)
      await showAlert({
        title: tCommon('error'),
        description: t('alerts.error'),
        variant: 'danger',
      })
    } finally {
      setProcessing(null)
    }
  }

  if (!isOpen) return null

  const renderDuplicateTypeLabel = (type: 'enrolledStudent' | 'pendingRequest') => {
    if (type === 'enrolledStudent') return t('duplicateBox.type.enrolledStudent')
    return t('duplicateBox.type.pendingRequest')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('title', { count: requests.length })}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('noRequests')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {requests.map((request) => (
                <div
                  key={request._id.toString()}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="w-full">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {request.firstName} {request.lastName}
                      </h3>
                      {request.hasPossibleDuplicates && (
                        <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-4">
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tight">
                            {t('duplicateBox.title', { count: request.possibleDuplicates.length })}
                          </p>
                          <div className="mt-3 space-y-3">
                            {request.possibleDuplicates.map((duplicate) => (
                              <div
                                key={`${duplicate.type}-${duplicate.id}`}
                                className="rounded-md border border-amber-200 dark:border-amber-900/30 bg-white/70 dark:bg-gray-800/70 p-3 text-xs text-amber-900 dark:text-amber-300"
                              >
                                <p className="italic">
                                  <span className="font-bold not-italic">
                                    {renderDuplicateTypeLabel(duplicate.type)}:
                                  </span>{' '}
                                  {duplicate.firstName} {duplicate.lastName}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 opacity-90">
                                  <span className="bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                    {t('duplicateBox.similarity', {
                                      value: Math.round(duplicate.similarityScore * 100),
                                    })}
                                  </span>
                                  {duplicate.externalId && (
                                    <span>🆔 {t('duplicateBox.externalId', { value: duplicate.externalId })}</span>
                                  )}
                                  {duplicate.email && (
                                    <span>📧 {duplicate.email}</span>
                                  )}
                                  {duplicate.phone && (
                                    <span>📱 {duplicate.phone}</span>
                                  )}
                                  {duplicate.type === 'enrolledStudent' &&
                                    duplicate.enrollmentStatus && (
                                      <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                        duplicate.enrollmentStatus === 'active' 
                                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                      )}>
                                        {duplicate.enrollmentStatus === 'active'
                                          ? t('duplicateBox.status.active')
                                          : t('duplicateBox.status.inactive')}
                                      </span>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        {request.email && <p className="flex items-center gap-2">📧 {request.email}</p>}
                        {request.phone && <p className="flex items-center gap-2">📱 {request.phone}</p>}
                        {request.externalId && <p className="flex items-center gap-2">🆔 {t('externalId', { value: request.externalId })}</p>}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 sm:col-span-2">
                          {t('requestedAt', { date: new Date(request.createdAt).toLocaleString() })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                      <button
                        onClick={() => handleProcess(request._id.toString(), 'approve')}
                        disabled={processing === request._id.toString()}
                        className="flex-1 px-4 py-3 md:py-2 bg-green-600 text-white rounded-xl md:rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-bold shadow-sm shadow-green-200 dark:shadow-none transition-all active:scale-95"
                      >
                        {processing === request._id.toString() ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        {t('approve')}
                      </button>
                      <button
                        onClick={() => handleProcess(request._id.toString(), 'reject')}
                        disabled={processing === request._id.toString()}
                        className="flex-1 px-4 py-3 md:py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl md:rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium transition-all active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        {t('reject')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
