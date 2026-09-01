import React from 'react';
import { useTranslations } from 'next-intl';

const ReceiptRecognitionSkeleton: React.FC = () => {
  const t = useTranslations('inputStep');

  return (
    <section
      className="card receipt-recognition-skeleton"
      aria-busy="true"
      aria-live="polite"
      aria-label={t('aiRecognizing')}
    >
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{t('aiRecognizing')}</span>
        </div>
        <div className="skeleton-shimmer mt-3 h-7 w-2/5 rounded" />
      </div>

      <div className="card-content space-y-4">
        {[0, 1, 2].map((row) => (
          <div className="flex items-center justify-between gap-4" key={row}>
            <div className="skeleton-shimmer h-5 flex-1 rounded" />
            <div className="skeleton-shimmer h-5 w-20 rounded" />
          </div>
        ))}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex justify-between">
            <div className="skeleton-shimmer h-4 w-24 rounded" />
            <div className="skeleton-shimmer h-4 w-20 rounded" />
          </div>
          <div className="flex justify-between">
            <div className="skeleton-shimmer h-6 w-28 rounded" />
            <div className="skeleton-shimmer h-6 w-24 rounded" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReceiptRecognitionSkeleton;
