'use client';

import { X, MessageSquare, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface AddCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  studentName: string;
  isLoading?: boolean;
}

export function AddCommentModal({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  isLoading = false,
}: AddCommentModalProps) {
  const t = useTranslations('students.addCommentModal');
  const tCommon = useTranslations('common');
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onConfirm(comment);
    setComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full overflow-hidden transform transition-all sm:my-8 border border-gray-100 dark:border-gray-800">
        <div className="absolute top-0 right-0 pt-4 pr-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md transition-colors"
          >
            <span className="sr-only">{tCommon('close')}</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 sm:mx-0 sm:h-10 sm:w-10 mb-4 sm:mb-0">
                <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="sm:mt-0 sm:ml-4 text-center sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                  {t('title')}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {studentName}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('commentLabel')}
                      </label>
                      <textarea
                        id="comment"
                        autoFocus
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t('commentPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 min-h-[120px] resize-none"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 sm:px-6 flex flex-row gap-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !comment.trim()}
              className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('addButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
