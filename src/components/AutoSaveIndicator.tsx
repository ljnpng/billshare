import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Cloud, CloudOff } from 'lucide-react';
import { useAppStore } from '../store';

const AutoSaveIndicator: React.FC = () => {
  const t = useTranslations('autoSave');
  const { sessionId, isSessionLoaded } = useAppStore();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 监听自动保存状态
  useEffect(() => {
    if (!sessionId || !isSessionLoaded) return;

    // 模拟监听自动保存状态变化
    const handleStorageChange = () => {
      setSaveStatus('saving');
      
      // 模拟保存完成
      setTimeout(() => {
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // 2秒后回到空闲状态
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }, 500);
    };

    // 监听存储变化（简化版本）
    const interval = setInterval(() => {
      // 这里可以改为监听实际的保存事件
      const shouldTrigger = Math.random() < 0.1; // 10% 概率触发，用于演示
      if (shouldTrigger && saveStatus === 'idle') {
        handleStorageChange();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, isSessionLoaded, saveStatus]);

  if (!sessionId || !isSessionLoaded) {
    return null;
  }

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return '正在保存...';
      case 'saved':
        return '已保存';
      case 'error':
        return '保存失败';
      default:
        return lastSaved ? `上次保存: ${lastSaved.toLocaleTimeString()}` : '自动保存已启用';
    }
  };

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Cloud className="h-3 w-3 animate-pulse" />;
      case 'saved':
        return <Check className="h-3 w-3 text-green-600" />;
      case 'error':
        return <CloudOff className="h-3 w-3 text-red-600" />;
      default:
        return <Cloud className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'saved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="hidden sm:inline">{getStatusText()}</span>
      <span className="sm:hidden">
        {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '自动保存'}
      </span>
    </div>
  );
};

export default AutoSaveIndicator;