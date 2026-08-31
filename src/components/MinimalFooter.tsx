'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'
const MinimalFooter: React.FC = () => {
  const tApp = useTranslations('app')

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1" />

          {/* Center: Branding */}
          <div className="flex-1 text-center">
            <span className="text-xs text-gray-500 font-medium tracking-wide">
              {tApp('title')}
            </span>
          </div>

          {/* Right: Language switcher */}
          <div className="flex-1 flex justify-end">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default MinimalFooter
