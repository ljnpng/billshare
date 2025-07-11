import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '../store';

interface ErrorAlertProps {
  message: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  const t = useTranslations('errorAlert');
  const { setError } = useAppStore();

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animation-fade-in">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            {t('title')}
          </h3>
          <p className="text-sm text-red-700">
            {message}
          </p>
        </div>
        <button
          onClick={() => setError(null)}
          className="ml-3 text-red-600 hover:text-red-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ErrorAlert; 