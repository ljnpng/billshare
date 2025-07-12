import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // 在构建时提供默认的 locale，避免 ENVIRONMENT_FALLBACK 错误
  const safeLocale = locale || 'zh';
  
  return {
    locale: safeLocale,
    messages: (await import(`./src/messages/${safeLocale}.json`)).default,
    timeZone: 'Asia/Shanghai',
    now: new Date()
  };
}); 