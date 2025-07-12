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
    <div className="flex items-center gap-1">
      <Globe className="h-3 w-3 text-gray-400" />
      <div className="flex gap-1">
        <button
          onClick={() => switchLanguage('zh')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            currentLocale === 'zh'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          中
        </button>
        <button
          onClick={() => switchLanguage('en')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            currentLocale === 'en'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  )
}

export default LanguageSwitcher 