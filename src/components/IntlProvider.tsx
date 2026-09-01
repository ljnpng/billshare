'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';

type Locale = 'en' | 'zh';

const messagesByLocale: Record<Locale, typeof enMessages> = {
  en: enMessages,
  zh: zhMessages,
};

/**
 * Locale is resolved entirely in the browser from the user's
 * language settings; no switching UI and no persistence.
 */
function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export default function IntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale | null>(null);

  // The app is intentionally client-rendered: localStorage is only readable
  // in the browser, so the locale is resolved after mount. Rendering null
  // until then keeps the server shell empty and avoids a hydration mismatch.
  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  if (locale === null) {
    return null;
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
