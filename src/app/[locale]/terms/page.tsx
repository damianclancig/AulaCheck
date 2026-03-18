'use client';

import { Link } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Scale, BookOpen, ShieldAlert, Ban, Database, UserCheck, UserX } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export default function TermsPage() {
    const { status } = useSession();
    const t = useTranslations('terms');
    const isAuthenticated = status === 'authenticated';
    const returnHref = isAuthenticated ? '/dashboard' : '/';
    
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200 relative">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
            </div>
            
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
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

                <div className="space-y-8">
                    <section className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-sm border border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold">{t('introTitle')}</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {t('introDesc')}
                        </p>
                    </section>

                    <section className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-sm border border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold">{t('usageTitle')}</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic border-l-4 border-blue-200 dark:border-blue-800 pl-4 py-1">
                            {t('usageDesc')}
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-6">
                        <section className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border)]">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                <h3 className="font-bold">{t('disclaimerTitle')}</h3>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {t('disclaimerDesc')}
                            </p>
                        </section>

                        <section className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border)]">
                            <div className="flex items-center gap-3 mb-4">
                                <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <h3 className="font-bold">{t('limitationsTitle')}</h3>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {t('limitationsDesc')}
                            </p>
                        </section>
                    </div>

                    <section className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-sm border border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold">{t('dataTitle')}</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {t('dataDesc')}
                        </p>
                    </section>

                    <section className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-sm border border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold">{t('conductTitle')}</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {t('conductDesc')}
                        </p>
                    </section>

                    <section className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-sm border border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                                <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold">{t('accountDeletionTitle')}</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {t('accountDeletionDesc')}
                        </p>
                    </section>
                </div>

                <div className="mt-12 text-center">
                    <Link
                        href={returnHref}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all inline-block"
                    >
                        {isAuthenticated ? 'Volver al Dashboard' : 'Volver al inicio'}
                    </Link>
                </div>

                <footer className="mt-20 pt-8 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} AulaCheck. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}
