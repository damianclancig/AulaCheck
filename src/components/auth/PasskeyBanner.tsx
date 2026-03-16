'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, X, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { usePasskeys } from '@/hooks/usePasskeys';

export function PasskeyBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [hasPasskeys, setHasPasskeys] = useState<boolean | null>(null);
    const t = useTranslations('passkeyBanner');
    const { isSupported } = usePasskeys();

    useEffect(() => {
        // Verificar si ya tiene passkeys
        const checkPasskeys = async () => {
            try {
                const resp = await fetch('/api/auth/passkey');
                if (resp.ok) {
                    const data = await resp.json();
                    setHasPasskeys(data.length > 0);
                    
                    // Si no tiene y el navegador soporta, mostrar banner
                    if (data.length === 0 && isSupported()) {
                        setIsVisible(true);
                    }
                }
            } catch (error) {
                console.error('Error checking passkeys:', error);
            }
        };

        checkPasskeys();
    }, [isSupported]);

    if (!isVisible || hasPasskeys === true) return null;

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none group transition-all">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/15 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl flex-shrink-0" />

            <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-md shadow-inner border border-white/10 shrink-0 transform group-hover:scale-110 transition-transform duration-500">
                    <Fingerprint className="w-10 h-10 text-white" />
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <h3 className="text-2xl font-black tracking-tight">{t('title')}</h3>
                    <p className="text-indigo-50 text-sm md:text-lg max-w-2xl leading-relaxed opacity-90">
                        {t('description')}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="w-full sm:w-auto px-4 py-2 text-indigo-100 hover:text-white text-sm font-semibold transition-colors order-2 sm:order-1"
                    >
                        {t('dismiss')}
                    </button>
                    <Link
                        href="/dashboard/security"
                        className="w-full sm:w-auto bg-white text-indigo-700 px-8 py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg active:scale-95 order-1 sm:order-2"
                    >
                        {t('button')}
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all md:top-6 md:right-6"
                aria-label="Cerrar"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
