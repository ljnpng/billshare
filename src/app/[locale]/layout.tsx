import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import IntlProvider from '../../components/IntlProvider';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });
const locales = ['zh', 'en'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}) {
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    messages = {};
  }
  
  return {
    title: messages.app?.title || 'BillShare',
    description: messages.app?.description || 'Smart bill splitting for meals, taxes, and tips',
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // 验证语言是否支持
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // 获取翻译消息
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    messages = {};
  }

  return (
    <IntlProvider messages={messages} locale={locale}>
      {children}
    </IntlProvider>
  );
} 