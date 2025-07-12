import React, { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Plus, Receipt, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
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
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <h2 className="card-title text-xl sm:text-2xl">{t('title')}</h2>
              <p className="text-description text-sm sm:text-base">
                {t('description')}
              </p>
            </div>
            {receipts.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isAiProcessing}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>{isAiProcessing ? t('aiRecognizing') : t('aiRecognition')}</span>
                </button>
                <button 
                  onClick={() => addReceipt(tCommon('receipt'))} 
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>{t('manualAdd')}</span>
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
            <div className="text-center py-12 sm:py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50">
              <Receipt className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-gray-400" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">{t('emptyStateTitle')}</h3>
              <p className="text-description text-sm sm:text-base mb-6 sm:mb-8 px-4">{t('emptyStateDescription')}</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
                <button
                  onClick={handleUploadClick}
                  disabled={isAiProcessing}
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-base sm:text-lg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                  {isAiProcessing ? t('aiRecognizing') : t('aiRecognition')}
                </button>
                <button 
                  onClick={() => addReceipt(tCommon('receipt'))} 
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-base sm:text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                  {t('manualAdd')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between gap-3 mt-6">
        <button onClick={handleBack} className="btn btn-secondary btn-md sm:btn-lg" title={tCommon('previous')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleNext}
          className="btn btn-primary btn-md sm:btn-lg"
          disabled={totalItems === 0}
          title={t('nextButton')}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default InputStep; 