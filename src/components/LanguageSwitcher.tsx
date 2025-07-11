'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

const LanguageSwitcher: React.FC = () => {
  const t = useTranslations('languageSwitcher')
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentLocale = params.locale as string

  const switchLanguage = (locale: string) => {
    // 替换当前路径中的语言代码
    const newPath = pathname.replace(`/${currentLocale}`, `/${locale}`)
    router.push(newPath)
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-600">{t('switchLanguage')}:</span>
      <div className="flex gap-2">
        <button
          onClick={() => switchLanguage('zh')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            currentLocale === 'zh'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {t('chinese')}
        </button>
        <button
          onClick={() => switchLanguage('en')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            currentLocale === 'en'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {t('english')}
        </button>
      </div>
    </div>
  )
}

export default LanguageSwitcher 