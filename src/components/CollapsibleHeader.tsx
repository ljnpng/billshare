import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import AutoSaveIndicator from './AutoSaveIndicator';

interface CollapsibleHeaderProps {
  uuid?: string;
  isCollapsed: boolean;
  onToggle: () => void;
  autoCollapse?: boolean;
  currentStep?: string;
}

const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({ 
  uuid, 
  isCollapsed, 
  onToggle, 
  autoCollapse = false,
  currentStep
}) => {
  const t = useTranslations('app');

  // 自动折叠/展开逻辑
  useEffect(() => {
    if (autoCollapse) {
      let timer: NodeJS.Timeout;
      
      if (currentStep === 'input' && !isCollapsed) {
        // 从设置人员到输入账单时自动折叠
        timer = setTimeout(() => {
          onToggle();
        }, 300);
      } else if (currentStep === 'setup' && isCollapsed) {
        // 回退到设置人员时立即展开
        onToggle();
      }
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [currentStep, autoCollapse, isCollapsed, onToggle]);

  return (
    <div className={`bg-white border-b sticky top-0 z-20 transition-all duration-300 ${
      isCollapsed ? 'shadow-sm' : 'shadow-md'
    }`}>
      <div className="max-w-5xl mx-auto px-4">
        {/* 折叠状态 - 只显示薄薄的条 */}
        {isCollapsed && (
          <div className="flex items-center justify-between py-2">
            <div className="flex-1"></div>
            <button
              onClick={onToggle}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors text-sm text-blue-700 hover:text-blue-800 shadow-sm"
            >
              <ChevronDown className="h-4 w-4" />
              <span className="hidden sm:inline">{t('title')}</span>
              <span className="sm:hidden">展开</span>
            </button>
            <div className="flex-1"></div>
          </div>
        )}

        {/* 展开状态 - 完整的header */}
        {!isCollapsed && (
          <div className="py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {t('title')}
                </h1>
                {uuid && (
                  <div className="flex items-center gap-4 mt-1">
                    <div className="text-sm text-gray-500">
                      会话ID: {uuid.substring(0, 8)}...
                    </div>
                    <AutoSaveIndicator />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <button
                  onClick={onToggle}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800"
                  title="折叠头部"
                >
                  <ChevronUp className="h-4 w-4" />
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