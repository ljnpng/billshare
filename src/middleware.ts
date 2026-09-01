import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'en',
  // Keep locale selection internal; public URLs must not expose /zh or /en.
  localePrefix: 'never',
  // Let next-intl use the browser's Accept-Language header on first visit.
  localeDetection: true,
  // Do not persist a language choice; resolve it from the browser on each visit.
  localeCookie: false,
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
