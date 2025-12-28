import React from 'react';
import { useTranslations } from 'next-intl';
import { Copy, X, MessageCircle, ExternalLink, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  onCopyLink: () => void;
  onOpenInBrowser: () => void;
  copySuccess: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  onCopyLink,
  onOpenInBrowser,
  copySuccess
}) => {
  const t = useTranslations('summaryStep');
  const tCommon = useTranslations('common');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded border border-gray-200 mx-4 w-full max-w-md transform transition-all">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('shareTitle')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title={tCommon('close')}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            {t('shareDescription')}
          </p>

          {/* 链接显示区 */}
          <div className="bg-gray-50 rounded p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">{t('shareUrl')}</div>
            <div className="text-sm font-mono text-gray-800 break-all bg-white p-3 rounded border">
              {shareUrl}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="space-y-3">
            {/* 复制链接 */}
            <button
              onClick={onCopyLink}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded font-medium transition-all ${
                copySuccess
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
              disabled={copySuccess}
            >
              {copySuccess ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
              {copySuccess ? tCommon('copied') : t('copyLink')}
            </button>


            {/* 浏览器打开 */}
            <button
              onClick={onOpenInBrowser}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-all"
            >
              <ExternalLink className="h-5 w-5" />
              {t('openInBrowser')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;