import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  return {
    locale: locale as string,
    messages: (await import(`./src/messages/${locale}.json`)).default,
    timeZone: 'Asia/Shanghai',
    now: new Date()
  };
}); 