'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
const MinimalFooter: React.FC = () => {
  const tApp = useTranslations('app');

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1" />

          <div className="flex-1 text-center">
            <span className="text-xs text-gray-500 font-medium tracking-wide">{tApp('title')}</span>
          </div>

          <div className="flex-1" />
        </div>
      </div>
    </footer>
  );
};

export default MinimalFooter;
