'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'
import AutoSaveIndicator from './AutoSaveIndicator'

interface MinimalFooterProps {
  showAutoSave?: boolean
}

const MinimalFooter: React.FC<MinimalFooterProps> = ({ showAutoSave = true }) => {
  const tApp = useTranslations('app')

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Auto-save indicator */}
          <div className="flex-1">
            {showAutoSave && <AutoSaveIndicator />}
          </div>

          {/* Center: Branding */}
          <div className="flex-1 text-center">
            <span className="text-xs text-amber-700/60 font-medium tracking-wide">
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
