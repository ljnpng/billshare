import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../store';
import LanguageSwitcher from './LanguageSwitcher';
import AutoSaveIndicator from './AutoSaveIndicator';

interface CollapsibleHeaderProps {
  uuid?: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({ 
  uuid, 
  isCollapsed, 
  onToggle
}) => {
  const t = useTranslations('app');
  const tCommon = useTranslations('common');
  const tHeader = useTranslations('header');
  const router = useRouter();
  const { reset } = useAppStore();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleCreateNewBill = useCallback(() => {
    if (isCreatingSession) return;
    
    setIsCreatingSession(true);
    reset();
    router.replace('/');
    setIsCreatingSession(false);
  }, [isCreatingSession, router, reset]);

  // 移除自动折叠逻辑，完全由用户控制

  return (
    <div className={`bg-white border-b sticky top-0 z-20 transition-[padding,height] duration-300`}>
      <div className="max-w-5xl mx-auto px-4">
        {/* 折叠状态 - 只显示薄薄的条 */}
        {isCollapsed && (
          <div className="flex items-center justify-between py-2">
            <div className="flex-1"></div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateNewBill}
                disabled={isCreatingSession}
                className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 hover:bg-green-200 transition-colors text-sm text-green-700 hover:text-green-800 border border-green-200 disabled:opacity-50"
                aria-label={tCommon('newBill')}
              >
                <Plus className={`h-3 w-3 ${isCreatingSession ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
              <button
                onClick={onToggle}
                className="flex items-center gap-2 px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 transition-colors text-sm text-blue-700 hover:text-blue-800 border border-blue-200"
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                <span>{t('title')}</span>
              </button>
            </div>
            <div className="flex-1"></div>
          </div>
        )}

        {/* 展开状态 - 完整的header */}
        {!isCollapsed && (
          <div className="py-4">
            <div className="flex justify-between items-center">
              <div>
                {uuid && (
                  <AutoSaveIndicator />
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateNewBill}
                  disabled={isCreatingSession}
                  className="flex items-center gap-2 px-3 py-2 rounded bg-green-100 hover:bg-green-200 transition-colors text-green-700 hover:text-green-800 border border-green-200 disabled:opacity-50"
                  aria-label={tCommon('newBill')}
                >
                  <Plus className={`h-4 w-4 ${isCreatingSession ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span className="text-sm">{tCommon('newBill')}</span>
                </button>
                <LanguageSwitcher />
                <button
                  onClick={onToggle}
                  className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800 border border-gray-200"
                  aria-label={tHeader('collapseTitle')}
                >
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollapsibleHeader;
