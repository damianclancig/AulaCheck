'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePasskeys } from '@/hooks/usePasskeys';
import { 
    Fingerprint, 
    ShieldCheck, 
    Trash2, 
    Plus, 
    Smartphone, 
    Monitor, 
    Clock,
    Loader2
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';

export default function SecurityPage() {
    const t = useTranslations('security');
    const { locale } = useParams();
    const [authenticators, setAuthenticators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { registerPasskey, isPending, error: passkeyError } = usePasskeys();

    const fetchAuthenticators = async () => {
        try {
            const resp = await fetch('/api/auth/passkey');
            if (resp.ok) {
                const data = await resp.json();
                setAuthenticators(data);
            }
        } catch (error) {
            console.error('Error fetching authenticators:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthenticators();
    }, []);

    const handleRegister = async () => {
        const success = await registerPasskey();
        if (success) {
            fetchAuthenticators();
        }
    };

    const handleDeleteClick = (id: string) => {
        setIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        setIsDeleting(true);

        try {
            const resp = await fetch('/api/auth/passkey', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idToDelete }),
            });

            if (resp.ok) {
                setAuthenticators(authenticators.filter(a => a.id !== idToDelete));
                setIsDeleteModalOpen(false);
                setIdToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting authenticator:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-indigo-600" />
                    {t('title')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {t('description')}
                </p>
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                                <Fingerprint className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            {t('passkeys.title')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md leading-relaxed">
                            {t('passkeys.description')}
                        </p>
                    </div>
                    <button
                        onClick={handleRegister}
                        disabled={isPending}
                        className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 font-bold disabled:opacity-50 shadow-md shadow-indigo-100 dark:shadow-none"
                    >
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        {t('passkeys.addPasskey')}
                    </button>
                </div>

                <div className="p-4 md:p-8">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                        </div>
                    ) : authenticators.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl bg-gray-50/50 dark:bg-gray-900/20">
                            <div className="bg-white dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-50 dark:border-gray-700">
                                <Smartphone className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">{t('passkeys.noPasskeys')}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('passkeys.addFirst') || 'Protege tu cuenta con biometría'}</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:gap-6">
                            {authenticators.map((auth) => (
                                <div 
                                    key={auth.id} 
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-105 transition-transform duration-300">
                                            {auth.deviceType === 'single_device' || auth.deviceType === 'platform' ? (
                                                <Smartphone className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                                            ) : (
                                                <Monitor className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-black text-gray-900 dark:text-white text-lg">
                                                {auth.deviceType === 'single_device' || auth.deviceType === 'platform' 
                                                    ? 'Dispositivo Móvil / Biometría' 
                                                    : 'Computadora / Llave USB'}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                                                    {t('passkeys.registered', { 
                                                        date: new Intl.DateTimeFormat(locale as string, {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        }).format(new Date(auth.createdAt))
                                                    })}
                                                </span>
                                                {auth.lastUsedAt && (
                                                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {t('passkeys.lastUsed', { 
                                                            date: new Intl.DateTimeFormat(locale as string, {
                                                                dateStyle: 'medium',
                                                                timeStyle: 'short'
                                                            }).format(new Date(auth.lastUsedAt))
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-gray-800">
                                        <button 
                                            onClick={() => handleDeleteClick(auth.id)}
                                            className="w-full sm:w-auto px-4 py-2 sm:p-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all flex items-center justify-center gap-2 font-bold sm:font-normal"
                                            title={t('passkeys.remove')}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            <span className="sm:hidden text-sm uppercase tracking-wider">{t('passkeys.remove')}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {passkeyError && (
                        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                            {passkeyError}
                        </div>
                    ) }
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title={t('passkeys.removeTitle') || 'Eliminar Passkey'}
                description={t('passkeys.removeConfirm')}
                variant="danger"
                confirmText={t('passkeys.remove') || 'Eliminar'}
            />
        </div>
    );
}
