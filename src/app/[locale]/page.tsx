import { Link } from "@/i18n/routing";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import logoPic from '../../../public/assets/logo.webp';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Home() {
  const t = useTranslations('landing');

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center -ml-2">
          <Link href="/" className="hover:scale-105 transition-transform duration-300">
            <Image 
              src={logoPic} 
              alt="AulaCheck Logo" 
              className="h-14 w-auto object-contain md:h-16 transition-all" 
              priority 
            />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2 transition-colors"
          >
            {t('login')}
          </Link>
          <Link
            href="/dashboard"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            {t('goToDashboard')}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center lg:text-left lg:flex lg:items-center lg:gap-16">
        <div className="lg:w-1/2">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6 transition-colors duration-200">
            {t('heroTitle')} <br />
            <span className="text-indigo-600 dark:text-indigo-400">{t('heroSubtitle')}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed transition-colors duration-200">
            {t('heroDescription')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all text-lg font-semibold shadow-lg hover:shadow-indigo-200"
            >
              {t('startNow')} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {[
              t('feature1'),
              t('feature2'),
              t('feature3'),
              t('feature4')
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-200">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-indigo-200 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="relative bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 transform rotate-2 hover:rotate-0 transition-transform duration-500">
            {/* Mock UI */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-indigo-100 rounded-full"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-indigo-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      <div className="h-2 w-16 bg-gray-100 rounded"></div>
                    </div>
                    <div className="h-6 w-12 bg-green-100 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-8 text-center text-gray-500 dark:text-gray-400 text-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} AulaCheck. {t('footerRights')}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              {t('privacyPolicy')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
