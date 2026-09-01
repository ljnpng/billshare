import { notFound } from 'next/navigation';
import IntlProvider from '../../components/IntlProvider';
import '../globals.css';
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';

const locales = ['zh', 'en'] as const;
type Locale = (typeof locales)[number];

const messagesByLocale = {
  zh: zhMessages,
  en: enMessages,
} satisfies Record<Locale, typeof enMessages>;

function getMessages(locale: string) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return messagesByLocale[locale as Locale];
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const messages = getMessages(locale);

  return {
    title: messages.app.title,
    description: messages.app.description,
  };
}

export default async function LocaleLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  const messages = getMessages(locale);

  return (
    <IntlProvider messages={messages} locale={locale}>
      {children}
    </IntlProvider>
  );
}
