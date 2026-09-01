import { getRequestConfig } from 'next-intl/server';
import enMessages from './src/messages/en.json';
import zhMessages from './src/messages/zh.json';

const messagesByLocale = {
  en: enMessages,
  zh: zhMessages,
} as const;

const locales = Object.keys(messagesByLocale);

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale || 'en';
  if (!locales.includes(resolvedLocale)) {
    throw new Error(`Unsupported locale: ${resolvedLocale}`);
  }

  return {
    locale: resolvedLocale,
    messages: messagesByLocale[resolvedLocale as keyof typeof messagesByLocale],
    timeZone: 'Asia/Shanghai',
    now: new Date(),
  };
});
