'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import logoPic from '../../../../public/assets/logo.webp';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('login');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usamos el signIn de next-auth. Redirigirá a '/dashboard' si la config default lo permite
      // o usará el callbackUrl si lo definimos explícitamente.
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(t('errorGoogle') || 'Error general');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative transition-colors duration-200">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="p-8 text-center pt-12">
          <div className="mx-auto flex items-center justify-center mb-6">
            <Image src={logoPic} alt="AulaCheck Logo" className="h-24 w-auto object-contain" priority />
          </div>
          <h1 className="sr-only">AulaCheck</h1>
          <p className="text-gray-500 mb-8">
            {t('description')}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
                className="w-5 h-5"
              />
            )}
            <span>
              {loading ? t('loggingIn') : t('continueGoogle')}
            </span>
          </button>

          <p className="mt-8 text-xs text-gray-400">
            {t('termsText1')}{' '}
            <a href="/privacy" className="text-indigo-600 hover:underline">
              {t('termsText2')}
            </a>.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 text-center border-t border-gray-100 dark:border-gray-800 transition-colors duration-200">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('needHelp')} <a href="#" className="text-indigo-600 hover:underline">{t('contactSupport')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
