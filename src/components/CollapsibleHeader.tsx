import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
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
  const params = useParams();
  const router = useRouter();
  const { reset, setSessionId } = useAppStore();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // 创建新会话的处理函数
  const handleCreateNewBill = useCallback(async () => {
    if (isCreatingSession) return;
    
    setIsCreatingSession(true);
    const locale = params.locale as string;
    
    try {
      const response = await fetch('/api/session/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('创建会话失败');
      }
      
      const result = await response.json();
      
      if (result.success && result.uuid) {
        // 重置状态并设置新的sessionId
        reset();
        setSessionId(result.uuid);
        // 重定向到新的UUID URL
        router.replace(`/${locale}/${result.uuid}`);
      } else {
        throw new Error('创建会话失败');
      }
    } catch (error) {
      console.error('创建新会话错误:', error);
    } finally {
      setIsCreatingSession(false);
    }
  }, [isCreatingSession, params.locale, router, reset, setSessionId]);

  // 移除自动折叠逻辑，完全由用户控制

  return (
    <div className={`bg-white border-b sticky top-0 z-20 transition-all duration-300 ${
      isCollapsed ? 'shadow-sm' : 'shadow-md'
    }`}>
      <div className="max-w-5xl mx-auto px-4">
        {/* 折叠状态 - 只显示薄薄的条 */}
        {isCollapsed && (
          <div className="flex items-center justify-between py-2">
            <div className="flex-1"></div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateNewBill}
                disabled={isCreatingSession}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 hover:bg-green-200 transition-colors text-sm text-green-700 hover:text-green-800 shadow-sm disabled:opacity-50"
                title={tCommon('newBill')}
              >
                <Plus className={`h-3 w-3 ${isCreatingSession ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onToggle}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors text-sm text-blue-700 hover:text-blue-800 shadow-sm"
              >
                <ChevronDown className="h-4 w-4" />
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 hover:bg-green-200 transition-colors text-green-700 hover:text-green-800 disabled:opacity-50"
                  title={tCommon('newBill')}
                >
                  <Plus className={`h-4 w-4 ${isCreatingSession ? 'animate-spin' : ''}`} />
                  <span className="text-sm">{tCommon('newBill')}</span>
                </button>
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