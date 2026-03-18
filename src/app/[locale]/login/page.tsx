'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import logoPic from '../../../../public/assets/logo.webp';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

import { usePasskeys } from '@/hooks/usePasskeys';
import { Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('login');
  const { authenticatePasskey, isSupported, error: passkeyError } = usePasskeys();

  useEffect(() => {
    setMounted(true);
  }, []);

  const authCalled = useRef(false);

  // Soporte para Conditional UI (Autofill)
  useEffect(() => {
    if (mounted && isSupported() && !authCalled.current) {
      authCalled.current = true;
      authenticatePasskey(true).then((result) => {
        if (result?.verified) {
          signIn('credentials', { 
            email: result.email, 
            callbackUrl: '/dashboard',
            redirect: true 
          });
        }
      });
    }
  }, [mounted, isSupported, authenticatePasskey]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(t('errorGoogle') || 'Error general');
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError(null);
    const result = await authenticatePasskey();
    
    if (result?.verified) {
        await signIn('credentials', { 
            email: result.email, 
            callbackUrl: '/dashboard',
            redirect: true 
        });
    } else {
        // Al fallar, el hook usePasskeys ya habrá actualizado su estado de error interno.
        // Solo necesitamos que la UI local sepa si hubo un error real (no cancelación).
        setLoading(false);
    }
  };

  // Sincronizar el error del hook con el estado local para mostrarlo traducido
  useEffect(() => {
    if (passkeyError) {
      // Intentamos traducir el error si es una llave válida, si no usamos el mensaje original o uno genérico
      const translatedError = t.has(passkeyError) ? t(passkeyError) : passkeyError;
      setError(translatedError);
    }
  }, [passkeyError, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative transition-colors duration-200">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="p-8 text-center pt-12">
          <div className="mx-auto flex items-center justify-center mb-6">
            <div className="hover:scale-[1.02] transition-transform duration-300">
              <Image 
                src={logoPic} 
                alt="AulaCheck Logo" 
                className="h-16 md:h-20 w-auto object-contain transition-all" 
                priority 
              />
            </div>
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

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-medium py-3 px-4 rounded-lg hover:bg-[var(--bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
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

            {mounted && isSupported() && (
              <button
                onClick={handlePasskeyLogin}
                disabled={loading}
                className="w-full bg-indigo-600 border border-transparent text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all flex items-center justify-center gap-3 shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Fingerprint className="w-5 h-5" />
                )}
                <span>
                  {t('continuePasskey')}
                </span>
              </button>
            )}
          </div>

          <p className="mt-8 text-[10px] leading-relaxed text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
            {t('termsText1')}{' '}
            <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              {t('termsText2')}
            </Link>{' '}
            {t('termsText3')}{' '}
            <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              {t('termsText4')}
            </Link>.
          </p>
        </div>

        <div className="bg-[var(--bg-muted)] p-4 text-center border-t border-[var(--border)] transition-colors duration-200">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('needHelp')} <a href="#" className="text-indigo-600 hover:underline">{t('contactSupport')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
