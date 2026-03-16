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

export default function SecurityPage() {
    const t = useTranslations('security');
    const { locale } = useParams();
    const [authenticators, setAuthenticators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

    const handleDelete = async (id: string) => {
        if (!confirm(t('passkeys.removeConfirm'))) return;

        try {
            const resp = await fetch('/api/auth/passkey', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (resp.ok) {
                setAuthenticators(authenticators.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error('Error deleting authenticator:', error);
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

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Fingerprint className="w-5 h-5 text-indigo-500" />
                            {t('passkeys.title')}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('passkeys.description')}
                        </p>
                    </div>
                    <button
                        onClick={handleRegister}
                        disabled={isPending}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {t('passkeys.addPasskey')}
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : authenticators.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                            <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">{t('passkeys.noPasskeys')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {authenticators.map((auth) => (
                                <div 
                                    key={auth.id} 
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                            <Monitor className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                Dispositivo Registrado
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Plus className="w-3 h-3" />
                                                    {t('passkeys.registered', { 
                                                        date: new Intl.DateTimeFormat(locale as string, {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        }).format(new Date(auth.createdAt))
                                                    })}
                                                </span>
                                                {auth.lastUsedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
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
                                    <button 
                                        onClick={() => handleDelete(auth.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        title={t('passkeys.remove')}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
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
        </div>
    );
}
