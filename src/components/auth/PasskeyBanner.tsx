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
        <div className="mb-8 relative overflow-hidden bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:shadow-indigo-300">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl" />

            <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                    <Fingerprint className="w-8 h-8" />
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold mb-1">{t('title')}</h3>
                    <p className="text-indigo-100 text-sm md:text-base max-w-2xl">
                        {t('description')}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-indigo-200 hover:text-white text-sm font-medium transition-colors"
                    >
                        {t('dismiss')}
                    </button>
                    <Link
                        href="/dashboard/security"
                        className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                    >
                        {t('button')}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                aria-label="Cerrar"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
