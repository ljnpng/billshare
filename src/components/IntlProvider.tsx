'use client'

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

interface IntlProviderProps {
  messages: any;
  locale: string;
  children: ReactNode;
}

export default function IntlProvider({ messages, locale, children }: IntlProviderProps) {
  return (
    <NextIntlClientProvider 
      messages={messages} 
      locale={locale}
    >
      {children}
    </NextIntlClientProvider>
  );
} 