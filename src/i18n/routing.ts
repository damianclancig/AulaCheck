import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['es', 'en', 'pt'],

  // Used when no locale matches
  defaultLocale: 'es',
  
  // Custom prefix strategy (optional)
  // pathnames: {
  //   '/': '/',
  //   '/about': {
  //     es: '/acerca',
  //     en: '/about',
  //     pt: '/sobre'
  //   }
  // }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
