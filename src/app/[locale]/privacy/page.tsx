'use client';

import { Link } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ShieldCheck, Lock, EyeOff, UserCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export default function PrivacyPage() {
    const { status } = useSession();
    const t = useTranslations('privacy');
    const isAuthenticated = status === 'authenticated';
    const returnHref = isAuthenticated ? '/dashboard' : '/';
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200 relative">
            {/* Controles Top */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
            </div>
            
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href={returnHref}
                        className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-8 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {isAuthenticated ? 'Volver al Dashboard' : 'Volver al inicio'}
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        {t('title')}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        {t('updated')}
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-12">
                    <section className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-2xl font-semibold">Compromiso de Privacidad</h2>
                        </div>
                        <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                            {t('introduction')}
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-6">
                        <section className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <UserCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h2 className="text-xl font-semibold">{t('dataCollection')}</h2>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                                {t('dataCollectionDesc')}
                            </p>
                        </section>

                        <section className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                    <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h2 className="text-xl font-semibold">{t('usage')}</h2>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                                {t('usageDesc')}
                            </p>
                        </section>
                    </div>

                    <section className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                <EyeOff className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-semibold">{t('contact')}</h2>
                        </div>
                        <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                            {t('contactDesc')}
                        </p>
                    </section>

                    <section className="text-center py-12">
                        <Link
                            href={returnHref}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all inline-block"
                        >
                            {isAuthenticated ? 'Volver al Dashboard' : 'Volver al inicio'}
                        </Link>
                    </section>
                </div>

                <footer className="mt-20 pt-8 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} AulaCheck. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}

