import React from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  MessageSquare, 
  UserCog, 
  Trash2, 
  Check, 
  Loader2 
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StudentContextMenuProps {
  x: number;
  y: number;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    requiresAttention?: boolean;
    isRepeating?: boolean;
    enrollmentStatus?: 'active' | 'inactive';
    status?: 'active' | 'inactive';
  };
  mode?: 'active' | 'inactive';
  loadingFlags?: Record<string, boolean>;
  onToggleFlag: (flag: 'requiresAttention' | 'isRepeating') => void;
  onAddComment: () => void;
  onEdit: () => void;
  onWithdraw: () => void;
  onHardDelete?: () => void;
  onClose: () => void;
}

export function StudentContextMenu({
  x,
  y,
  student,
  mode = 'active',
  loadingFlags = {},
  onToggleFlag,
  onAddComment,
  onEdit,
  onWithdraw,
  onHardDelete,
  onClose,
}: StudentContextMenuProps) {
  const t = useTranslations('students.list');
  
  const isInactive = student.enrollmentStatus === 'inactive' || student.status === 'inactive';

  return (
    <div
      className="fixed bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-[100] min-w-[220px] transition-colors"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {mode === 'active' ? (
        <>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800 mb-1">
            {t('indicators')}
          </div>
          
          <button
            onClick={() => {
              onToggleFlag('requiresAttention');
            }}
            disabled={loadingFlags.requiresAttention}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={`w-4 h-4 ${student.requiresAttention ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-fuchsia-500'}`}
              />
              <span className={student.requiresAttention ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}>
                {t('requiresAttention')}
              </span>
            </div>
            {loadingFlags.requiresAttention ? (
              <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
            ) : (
              student.requiresAttention && <Check className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
            )}
          </button>

          <button
            onClick={() => {
              onToggleFlag('isRepeating');
            }}
            disabled={loadingFlags.isRepeating}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <RefreshCw
                className={`w-4 h-4 ${student.isRepeating ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-amber-500'}`}
              />
              <span className={student.isRepeating ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}>
                {t('isRepeating')}
              </span>
            </div>
            {loadingFlags.isRepeating ? (
              <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
            ) : (
              student.isRepeating && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
          </button>

          <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

          <button
            onClick={onAddComment}
            disabled={loadingFlags.comment}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {t('actions.addComment')}
              </span>
            </div>
            {loadingFlags.comment && (
              <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
            )}
          </button>

          <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

          <button
            onClick={onEdit}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
          >
            <UserCog className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">{t('actions.edit')}</span>
          </button>

          <button
            onClick={onWithdraw}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className="text-red-600 dark:text-red-400">
              {isInactive ? t('actions.withdrawalDetails') : t('actions.withdrawal')}
            </span>
          </button>
        </>
      ) : (
        <>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800 mb-1">
            {t('inactiveSection.title')}
          </div>
          <button
            onClick={onHardDelete}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className="text-red-600 dark:text-red-400">{t('actions.hardDelete')}</span>
          </button>
        </>
      )}
    </div>
  );
}
