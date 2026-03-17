'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import logoPic from '../../../public/assets/logo.webp';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export default function NotFoundPage() {
  const t = useTranslations('notFound');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      
      {/* Controles Top */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors duration-200">
        
        {/* Cabecera / Banner */}
        <div className="bg-indigo-50/50 dark:bg-gray-800/30 p-8 flex justify-center border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 transition-transform duration-300 hover:scale-105">
            <Image 
              src={logoPic} 
              alt="AulaCheck Logo" 
              className="h-16 w-auto object-contain drop-shadow-sm" 
              priority 
            />
          </div>
        </div>

        {/* Contenido (404) */}
        <div className="p-10 text-center flex flex-col items-center">
          <div className="relative mb-6">
            <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-blue-500 drop-shadow-sm select-none">
              404
            </h1>
            <div className="absolute inset-0 blur-2xl opacity-20 bg-indigo-500 rounded-full select-none -z-10" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-200">
            {t('title')}
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed transition-colors duration-200">
            {t('description')}
          </p>

          <button
            onClick={() => router.back()}
            className="group flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-full shadow-lg hover:shadow-indigo-500/30 dark:hover:shadow-indigo-900/50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>{t('backButton')}</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}
