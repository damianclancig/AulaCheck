'use client';

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Error al iniciar sesión con Google. Por favor intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AulaCheck</h1>
          <p className="text-gray-500 mb-8">
            Gestión inteligente de asistencias y calificaciones para docentes.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all flex items-center justify-center gap-3 shadow-sm"
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
              {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
            </span>
          </button>

          <p className="mt-8 text-xs text-gray-400">
            Al continuar, aceptas nuestros términos y condiciones.
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda? <a href="#" className="text-indigo-600 hover:underline">Contactar soporte</a>
          </p>
        </div>
      </div>
    </div>
  );
}
