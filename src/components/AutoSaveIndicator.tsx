import React from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

const AutoSaveIndicator: React.FC = () => {
  const t = useTranslations('autoSave');

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border text-gray-500 bg-gray-50 border-gray-200">
      <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
      <span className="hidden sm:inline">{t('saved')}</span>
      <span className="sm:hidden">{t('savedShort')}</span>
    </div>
  );
};

export default AutoSaveIndicator;
