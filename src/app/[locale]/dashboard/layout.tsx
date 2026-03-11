'use client';

import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useRouter } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return null; // Redirecting...
  }

  const user = session.user;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            >
              <span className="sr-only">{t('aria.openMenu')}</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 truncate">
              {t('welcome', { name: user.name?.split(' ')[0] || '' })}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            {user.image && (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700"
              />
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
