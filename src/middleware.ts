import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  // Keep locale selection internal; public URLs must not expose /zh or /en.
  localePrefix: 'never',
  // Let next-intl use the browser's Accept-Language header on first visit.
  localeDetection: true,
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
