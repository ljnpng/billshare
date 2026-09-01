import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const safeLocale = locale || 'zh';

  return {
    locale: safeLocale,
    messages: (await import(`./src/messages/${safeLocale}.json`)).default,
    timeZone: 'Asia/Shanghai',
    now: new Date(),
  };
});
