import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, X, ExternalLink, Check } from 'lucide-react';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      // Focus trap - cycle through focusable elements
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        role="button"
        tabIndex={0}
        aria-label={tCommon('close')}
      />

      {/* 弹窗内容 */}
      <div
        ref={modalRef}
        className="relative bg-white rounded border border-gray-200 mx-4 w-full max-w-md"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 id="share-modal-title" className="text-lg font-semibold text-gray-900">{t('shareTitle')}</h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="btn btn-ghost btn-sm !h-9 !min-h-9 !w-9 !p-0 hover:bg-gray-100"
            aria-label={tCommon('close')}
          >
            <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
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
              className={`btn w-full gap-3 ${
                copySuccess
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
              disabled={copySuccess}
            >
              {copySuccess ? (
                <Check className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Copy className="h-5 w-5" aria-hidden="true" />
              )}
              {copySuccess ? tCommon('copied') : t('copyLink')}
            </button>


            {/* 浏览器打开 */}
            <button
              onClick={onOpenInBrowser}
              className="btn btn-secondary w-full gap-3"
            >
              <ExternalLink className="h-5 w-5" aria-hidden="true" />
              {t('openInBrowser')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
