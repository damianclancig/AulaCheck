'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, RefreshCw, Link2, AlertCircle, Clock, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useModal } from '@/hooks/useModal';
import { useTranslations } from 'next-intl';
import { JoinRequestsList } from '../students/JoinRequestsList';
import { cn } from '@/lib/utils';

interface InviteStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  currentJoinCode?: string;
  allowJoinRequests: boolean;
  joinCodeExpiresAt?: string | Date;
  initialTab?: 'invite' | 'requests';
  onRequestProcessed?: () => void;
}

function isCodeExpired(code: string | undefined, expiresAt?: string | Date | null): boolean {
  if (!code) return false;
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

export function InviteStudentsModal({
  isOpen,
  onClose,
  courseId,
  courseName,
  currentJoinCode,
  allowJoinRequests,
  joinCodeExpiresAt,
  initialTab = 'invite',
  onRequestProcessed,
}: InviteStudentsModalProps) {
  const initialExpired = isCodeExpired(currentJoinCode, joinCodeExpiresAt);

  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState(initialExpired ? '' : (currentJoinCode || ''));
  const [isEnabled, setIsEnabled] = useState(allowJoinRequests && !initialExpired);
  const [expired, setExpired] = useState(initialExpired);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'invite' | 'requests'>(initialTab);
  const [pendingCount, setPendingCount] = useState(0);

  // Re-sync state every time the modal is opened (props may have changed)
  useEffect(() => {
    if (isOpen) {
      const exp = isCodeExpired(currentJoinCode, joinCodeExpiresAt);
      setJoinCode(exp ? '' : (currentJoinCode || ''));
      setIsEnabled(allowJoinRequests && !exp);
      setExpired(exp);
      setActiveTab(initialTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const { showAlert, showConfirm } = useModal();
  const t = useTranslations('courses.invite');
  const tRequests = useTranslations('students.joinRequests');
  const tCommon = useTranslations('common');

  if (!isOpen) return null;

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${joinCode}` : '';

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/join-code`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('generate_error');

      const data = await response.json();
      setJoinCode(data.joinCode);
      setIsEnabled(true);
      setExpired(false);
    } catch (error) {
      console.error(error);
      await showAlert({
        title: tCommon('error'),
        description: t('alerts.errorGenerate'),
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    const isConfirmed = await showConfirm({
      title: t('disableConfirm.title'),
      description: t('disableConfirm.desc'),
      confirmText: t('disableConfirm.confirm'),
      cancelText: tCommon('cancel'),
      variant: 'warning'
    });

    if (!isConfirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/join-code`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('disable_error');

      setIsEnabled(false);
      setJoinCode('');
      await showAlert({
        title: tCommon('success'),
        description: t('alerts.successDisable'),
        variant: 'info'
      });
    } catch (error) {
      console.error(error);
      await showAlert({
        title: tCommon('error'),
        description: t('alerts.errorDisable'),
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors flex flex-col max-h-[90vh]">
        {/* Header with Tabs */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 md:p-6 pb-2 md:pb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'invite' ? t('title') : tRequests('title', { count: pendingCount })}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label={tCommon('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex px-4 md:px-6">
            <button
              onClick={() => setActiveTab('invite')}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === 'invite' 
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" 
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              <Link2 className="w-4 h-4" />
              {t('tabTitle') || 'Link de Invitación'}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 relative",
                activeTab === 'requests' 
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" 
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              <Users className="w-4 h-4" />
              {tRequests('tabTitle') || 'Solicitudes'}
              {pendingCount > 0 && (
                <span className="absolute top-2 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {activeTab === 'invite' ? (
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-1">{t('howItWorks')}</p>
                    <p>{t('howItWorksDesc')}</p>
                  </div>
                </div>
              </div>

              {!joinCode ? (
                <div className="text-center py-8">
                  {expired && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4 text-left">
                      <div className="flex gap-3">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-amber-800 dark:text-amber-300">{t('expired')}</p>
                          <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">{t('expiredDesc')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{t('generateLinkDesc')}</p>
                  <button
                    onClick={handleGenerateCode}
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center gap-2 mx-auto active:scale-95 transition-all"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    {t('generateLink')}
                  </button>
                </div>
              ) : (
                <>
                  {isEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('activeLink')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={joinUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                          onClick={handleCopy}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 active:scale-95 transition-all"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="hidden sm:inline">{copied ? t('copied') : t('copy')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isEnabled && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-indigo-100 dark:border-indigo-800/50 transition-colors">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
                        {t('qrTitle')}
                      </p>
                      <div className="flex justify-center bg-white p-6 rounded-2xl shadow-sm mx-auto w-fit">
                        <QRCodeSVG
                          value={joinUrl}
                          size={180}
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 max-w-[250px] mx-auto">
                        {t('qrDesc')}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleGenerateCode}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {t('regenerate')}
                    </button>
                    {isEnabled && (
                        <button
                          onClick={handleDisable}
                          disabled={loading}
                          className="flex-1 px-4 py-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors active:scale-95"
                        >
                          <X className="w-4 h-4" />
                          {t('disable')}
                        </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <JoinRequestsList 
              courseId={courseId} 
              onRequestProcessed={() => {
                onRequestProcessed?.();
              }} 
              onCountChange={setPendingCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
