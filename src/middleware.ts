import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Solo se aplicará el middleware a las rutas que no sean:
  // - Rutas de la API (/api/*)
  // - Archivos estáticos bajo /_next/ (archivos de compilación)
  // - Archivos ubicados en la carpeta public (imágenes, favicon, etc.)
  matcher: ['/((?!api|_next|.*\\..*).*)']
};

export function middleware(request: any) {
    const response = createMiddleware(routing)(request);
    
    // Añadir CSP para WebAuthn
    // Nota: 'connect-src' debe permitir el origen actual para las llamadas a la API
    // En producción esto debería ser más granular.
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.clancig.com.ar;"
    );
    
    return response;
}
