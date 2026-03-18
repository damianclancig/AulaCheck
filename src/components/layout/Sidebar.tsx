'use client';

import { Link, usePathname } from '@/i18n/routing';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import logoPic from '../../../public/assets/logo.webp';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Security', href: '/dashboard/security', icon: ShieldCheck },
  // { name: 'Cursos', href: '/dashboard/courses', icon: BookOpen }, // Dashboard ya muestra cursos
  // { name: 'Alumnos', href: '/dashboard/students', icon: Users }, // Gestión global opcional
  // { name: 'Configuración', href: '/dashboard/settings', icon: Settings }, // Opcional
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations('sidebar');

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar component */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-menu)] border-r border-[var(--border)] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col lg:h-full",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--border)]">
          <div className="flex items-center py-2">
            <div className="group-hover:scale-105 transition-transform duration-300">
              <Image 
                src={logoPic} 
                alt="AulaCheck Logo" 
                className="h-12 w-auto object-contain transition-all" 
                priority 
              />
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="sr-only">{t('aria.closeMenu')}</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose()} // Close sidebar on navigation (mobile)
                  className={cn(
                    isActive
                      ? 'bg-primary-50 text-primary-900 border border-primary-100 dark:bg-accent-500 dark:text-primary-900'
                      : 'text-[var(--text-secondary)] hover:bg-primary-50 hover:text-primary-900 dark:hover:bg-accent-500 dark:hover:text-primary-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive
                        ? 'text-primary-900'
                        : 'text-[var(--text-muted)] group-hover:text-primary-900',
                      'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                    )}
                    aria-hidden="true"
                  />
                  {t(`nav.${item.name.toLowerCase()}` as any)}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-shrink-0 flex flex-col border-t border-[var(--border)] p-4 space-y-2">

          <Link
            href="/privacy"
            onClick={() => onClose()}
            className="flex items-center px-2 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-primary-50 hover:text-primary-900 dark:hover:bg-accent-500 dark:hover:text-primary-900 rounded-md transition-all group"
          >
            <Settings className="mr-3 h-5 w-5 text-[var(--text-muted)] group-hover:text-primary-900 transition-colors" />
            {t('links.privacy')}
          </Link>

          <Link
            href="/terms"
            onClick={() => onClose()}
            className="flex items-center px-2 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-primary-50 hover:text-primary-900 dark:hover:bg-accent-500 dark:hover:text-primary-900 rounded-md transition-all group"
          >
            <Scale className="mr-3 h-5 w-5 text-[var(--text-muted)] group-hover:text-primary-900 transition-colors" />
            {t('links.terms')}
          </Link>

          <button
            onClick={() => handleSignOut()}
            className="flex-shrink-0 w-full group block hover:bg-primary-50 dark:hover:bg-accent-500 rounded-md transition-all"
          >
            <div className="flex items-center px-2 py-2">
              <LogOut className="inline-block h-5 w-5 text-[var(--text-muted)] group-hover:text-primary-900 transition-colors" />
              <div className="ml-3">
                <p className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-primary-900 transition-colors">
                  {t('links.logout')}
                </p>
              </div>
            </div>
          </button>

          {/* Mobile only selectors (Footer) */}
          <div className="flex items-center justify-around lg:hidden pt-4 border-t border-[var(--border)]">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
}
