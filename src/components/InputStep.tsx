import React, { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Plus, Receipt, ArrowRight, ArrowLeft, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store';
import { ReceiptCard } from './ReceiptCard';

const InputStep: React.FC = () => {
  const t = useTranslations('inputStep');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = params.locale as string;
  const { receipts, addReceipt, setCurrentStep, processReceiptImage, isAiProcessing, error, setError } = useAppStore();
  const tAI = useTranslations('aiRecognition');
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

    // 直接进行 AI 识别，不先创建空收据
    const success = await processReceiptImage('', file, locale);
    
    // 如果识别失败，processReceiptImage 会自动设置错误状态
    // 用户会看到错误提示，可以重试
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRetry = () => {
    setError(null);
    handleUploadClick();
  };

  const handleDismissError = () => {
    setError(null);
  };

  // 获取国际化的错误消息
  const getErrorMessage = (errorType: string) => {
    // 如果错误类型在我们的错误消息中存在，使用国际化消息
    const errorKey = `errors.${errorType}`;
    try {
      return tAI(errorKey);
    } catch (e) {
      // 如果国际化键不存在，返回原始错误消息
      return errorType;
    }
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
        
        {/* 错误提示和重试组件 */}
        {error && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-red-800 mb-1">{tAI('errorTitle')}</h4>
                <p className="text-sm text-red-700 mb-3">{getErrorMessage(error)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRetry}
                    disabled={isAiProcessing}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    {tAI('retry')}
                  </button>
                  <button
                    onClick={handleDismissError}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                  >
                    {tAI('dismiss')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
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