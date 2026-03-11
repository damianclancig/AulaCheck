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
