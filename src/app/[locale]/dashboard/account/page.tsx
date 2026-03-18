'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function AccountPage() {
  const t = useTranslations('account');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsDeleting(true);
      const res = await fetch('/api/user', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete account');
      }

      setSuccessMsg(t('deleteModal.success'));
      // Wait a moment and sign out
      setTimeout(async () => {
        await signOut({ callbackUrl: '/login' });
      }, 1500);

    } catch (error) {
      console.error(error);
      setErrorMsg(t('deleteModal.error'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-[var(--text-primary)] sm:text-3xl sm:truncate">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t('description')}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg shadow-sm">
          <div className="p-6 sm:p-8">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-400 flex items-center mb-4">
              <ShieldAlert className="w-5 h-5 mr-2" />
              {t('dangerZone')}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-6">
              {t('deleteWarning')}
            </p>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('deleteAccount')}
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-[var(--bg-main)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-lg font-bold text-center text-[var(--text-primary)] mb-2">
                {t('deleteModal.title')}
              </h3>
              
              <div className="text-sm text-[var(--text-secondary)] mb-6 text-center">
                <p className="mb-4">{t('deleteModal.description')}</p>
                <ul className="text-left bg-gray-50 dark:bg-[var(--bg-card)] rounded-lg p-4 space-y-2 text-red-800 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                  <li className="flex items-start">
                    <span className="mr-2 text-sm">•</span>
                    <span>{t('deleteModal.warning1')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-sm">•</span>
                    <span>{t('deleteModal.warning2')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-sm">•</span>
                    <span>{t('deleteModal.warning3')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-sm">•</span>
                    <span>{t('deleteModal.warning4')}</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isDeleting || successMsg !== null}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-[var(--border)] rounded-lg shadow-sm bg-[var(--bg-card)] text-sm font-medium text-[var(--text-primary)] hover:bg-gray-50 dark:hover:bg-[var(--bg-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {t('deleteModal.cancelButton')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || successMsg !== null}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    t('deleteModal.confirmButton')
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-800 text-sm dark:bg-red-900/20 dark:text-red-300">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm dark:bg-green-900/20 dark:text-green-300">
                  {successMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
