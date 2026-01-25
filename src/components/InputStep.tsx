import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Plus, Receipt, ArrowRight, Sparkles, AlertCircle, RotateCcw, ChevronDown, Trash2, User } from 'lucide-react';
import { useAppStore } from '../store';
import { ReceiptCard } from './ReceiptCard';

const InputStep: React.FC = () => {
  const t = useTranslations('inputStep');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = params.locale as string;
  const {
    receipts,
    people,
    addReceipt,
    addPerson,
    removePerson,
    setCurrentStep,
    processReceiptImage,
    isAiProcessing,
    error,
    setError
  } = useAppStore();
  const tAI = useTranslations('aiRecognition');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [isSplitSectionExpanded, setIsSplitSectionExpanded] = useState(false);

  const handleNext = () => {
    if (people.length >= 2) {
      setCurrentStep('assign');
    } else {
      setCurrentStep('summary');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processReceiptImage('', file, locale);

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

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setNewPersonName('');
    }
  };

  const getErrorMessage = (errorType: string) => {
    const errorKey = `errors.${errorType}`;
    try {
      return tAI(errorKey);
    } catch (e) {
      return errorType;
    }
  };

  const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);
  const hasReceipts = receipts.length > 0;

  // Determine button text based on people count
  const nextButtonText = people.length >= 2 ? t('assignItems') : t('viewSummary');

  return (
    <div className="max-w-4xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="sr-only"
        aria-label={t('uploadReceipt')}
      />

      {/* Error alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-red-800 mb-1">{tAI('errorTitle')}</h4>
              <p className="text-sm text-red-700 mb-3">{getErrorMessage(error)}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  disabled={isAiProcessing}
                  className="inline-flex items-center px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  {tAI('retry')}
                </button>
                <button
                  onClick={handleDismissError}
                  className="inline-flex items-center px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                >
                  {tAI('dismiss')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasReceipts ? (
        /* Empty state - minimal upload UI */
        <div className="text-center py-16 sm:py-24">
          <Receipt className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-6 sm:mb-8 text-gray-300" aria-hidden="true" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">{t('emptyStateTitle')}</h3>
          <p className="text-gray-500 text-sm sm:text-base mb-8 sm:mb-10 px-4 max-w-md mx-auto">{t('emptyStateDescription')}</p>

          <button
            onClick={handleUploadClick}
            disabled={isAiProcessing}
            className="inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg sm:text-xl border border-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 mr-3" aria-hidden="true" />
            {isAiProcessing ? t('aiRecognizing') : t('aiRecognition')}
          </button>

          <button
            onClick={() => addReceipt(tCommon('receipt'))}
            className="block mx-auto mt-4 text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
          >
            {t('orManualInput')}
          </button>
        </div>
      ) : (
        /* Has receipts - show list */
        <div className="space-y-6">
          {/* Receipt cards */}
          {[...receipts].reverse().map((receipt, index) => (
            <div key={receipt.id} className="animation-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <ReceiptCard receipt={receipt} />
            </div>
          ))}

          {/* Add more receipts buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isAiProcessing}
              className="inline-flex items-center justify-center px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm border border-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
              <span>{isAiProcessing ? t('aiRecognizing') : t('aiRecognition')}</span>
            </button>
            <button
              onClick={() => addReceipt(tCommon('receipt'))}
              className="inline-flex items-center justify-center px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm border border-blue-600 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              <span>{t('manualAdd')}</span>
            </button>
          </div>

          {/* Collapsible split section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsSplitSectionExpanded(!isSplitSectionExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-500 mr-2" aria-hidden="true" />
                <span className="font-medium text-gray-700">
                  {isSplitSectionExpanded ? t('splitSectionExpanded') : t('splitSection')}
                </span>
                {people.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {people.length}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isSplitSectionExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {isSplitSectionExpanded && (
              <div className="p-4 border-t border-gray-200">
                {/* Add person form */}
                <form onSubmit={handleAddPerson} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="personName"
                      autoComplete="name"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder={t('addPersonPlaceholder')}
                      className="input flex-1 text-base"
                      maxLength={20}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-md"
                      disabled={!newPersonName.trim()}
                      aria-label={tCommon('add')}
                    >
                      <Plus className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </form>

                {/* People list */}
                {people.length > 0 ? (
                  <div className="space-y-2">
                    {people.map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <div
                            className="person-color"
                            style={{ backgroundColor: person.color }}
                          />
                          <span className="font-medium text-sm truncate">{person.name}</span>
                        </div>
                        <button
                          onClick={() => removePerson(person.id)}
                          className="btn btn-ghost btn-sm ml-3 flex-shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`${tCommon('delete')} ${person.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    {t('splitSection')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              className="btn btn-primary btn-lg"
              disabled={totalItems === 0}
              aria-label={nextButtonText}
            >
              <span className="mr-2">{nextButtonText}</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputStep;
