'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ShieldCheck, Lock, EyeOff, UserCircle } from 'lucide-react';

export default function PrivacyPage() {
    const { status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const returnHref = isAuthenticated ? '/dashboard' : '/';
    const returnText = isAuthenticated ? 'Volver al Dashboard' : 'Volver al inicio';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href={returnHref}
                        className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-8 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {returnText}
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Política de Privacidad
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
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
                            En <strong>AulaCheck</strong>, nos tomamos muy en serio la privacidad de nuestros usuarios. Esta política describe cómo manejamos la información que obtenemos a través de la autenticación de Google.
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-6">
                        <section className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <UserCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h2 className="text-xl font-semibold">Datos que recolectamos</h2>
                            </div>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Nombre completo</li>
                                <li>Dirección de correo electrónico</li>
                                <li>Imagen de perfil (URL)</li>
                            </ul>
                            <p className="mt-4 text-sm text-gray-500">
                                Estos datos son proporcionados por Google OAuth con tu consentimiento previo.
                            </p>
                        </section>

                        <section className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                    <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h2 className="text-xl font-semibold">Uso de la información</h2>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                                Utilizamos estos datos exclusivamente para:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-2 text-gray-700 dark:text-gray-300">
                                <li>Identificarte de forma única en la plataforma.</li>
                                <li>Personalizar tu interfaz de usuario.</li>
                                <li>Permitirte gestionar tus propios cursos y alumnos.</li>
                            </ul>
                        </section>
                    </div>

                    <section className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                <EyeOff className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-semibold">No compartimos tus datos</h2>
                        </div>
                        <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                            AulaCheck <strong>no comparte, vende ni alquila</strong> tu información personal a terceros. Tus datos se almacenan de forma segura en una base de datos privada técnica y solo se utilizan para los fines operativos descritos anteriormente. No utilizamos tus datos para fines publicitarios ni de marketing.
                        </p>
                    </section>

                    <section className="text-center py-12">
                        <h2 className="text-xl font-semibold mb-4">Tus Derechos</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
                            Puedes solicitar la eliminación completa de tu cuenta y todos tus datos asociados en cualquier momento contactando con el administrador del sistema.
                        </p>
                        <Link
                            href={returnHref}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all inline-block"
                        >
                            {returnText}
                        </Link>
                    </section>
                </div>

                <footer className="mt-20 pt-8 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} AulaCheck. Todos los derechos reservados.</p>
                </footer>
            </div>
        </div>
    );
}
