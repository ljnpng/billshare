import React, { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Plus, Receipt, ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';
import { ReceiptCard } from './ReceiptCard';

const InputStep: React.FC = () => {
  const t = useTranslations('inputStep');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = params.locale as string;
  const { receipts, addReceipt, setCurrentStep, processReceiptImage, isAiProcessing } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    setCurrentStep('assign');
  };

  const handleBack = () => {
    setCurrentStep('setup');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newReceiptId = addReceipt(t('aiRecognizing'));
    await processReceiptImage(newReceiptId, file, locale);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="card-title">{t('title')}</h2>
              <p className="text-description">
                {t('description')}
              </p>
            </div>
            {receipts.length > 0 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isAiProcessing}
                  className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{isAiProcessing ? t('aiRecognizing') : t('aiRecognition')}</span>
                  <span className="sm:hidden">{isAiProcessing ? tCommon('loading') : 'AI'}</span>
                </button>
                <button 
                  onClick={() => addReceipt(tCommon('receipt'))} 
                  className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{t('manualAdd')}</span>
                  <span className="sm:hidden">{tCommon('add')}</span>
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        
        <div className="card-content">
          {receipts.length > 0 ? (
            <div className="space-y-6">
              {[...receipts].reverse().map((receipt, index) => (
                <div key={receipt.id} className="animation-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ReceiptCard receipt={receipt} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50">
              <Receipt className="h-16 w-16 mx-auto mb-6 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">{t('emptyStateTitle')}</h3>
              <p className="text-description mb-8">{t('emptyStateDescription')}</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  onClick={handleUploadClick}
                  disabled={isAiProcessing}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Sparkles className="h-6 w-6 mr-3" />
                  {isAiProcessing ? t('aiRecognizing') : t('aiRecognition')}
                </button>
                <button 
                  onClick={() => addReceipt(tCommon('receipt'))} 
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  {t('manualAdd')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between mt-6">
        <button onClick={handleBack} className="btn btn-secondary btn-lg order-2 sm:order-1">
          {tCommon('previous')}
        </button>
        <button
          onClick={handleNext}
          className="btn btn-primary btn-lg order-1 sm:order-2"
          disabled={totalItems === 0}
        >
          <span className="hidden sm:inline">{t('nextButton')}</span>
          <span className="sm:hidden">{t('assignItems')}</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default InputStep; 