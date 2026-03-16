'use client'

import { X, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { JoinRequestsList } from './JoinRequestsList'
import { useState } from 'react'

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
  const t = useTranslations('students.joinRequests')
  const [totalCount, setTotalCount] = useState(0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('title', { count: totalCount })}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <JoinRequestsList 
            courseId={courseId} 
            onRequestProcessed={onRequestProcessed} 
            onCountChange={setTotalCount}
          />
        </div>
      </div>
    </div>
  )
}
