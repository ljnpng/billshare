'use client'

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

interface IntlProviderProps {
  messages: any;
  locale: string;
  children: ReactNode;
}

export default function IntlProvider({ messages, locale, children }: IntlProviderProps) {
  const timeZone = typeof window !== 'undefined' 
    ? Intl.DateTimeFormat().resolvedOptions().timeZone 
    : 'Asia/Shanghai';

  return (
    <NextIntlClientProvider 
      messages={messages} 
      locale={locale}
      timeZone={timeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
} 