'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import AssignStep from './AssignStep';
import ErrorAlert from './ErrorAlert';
import InputStep from './InputStep';
import MinimalFooter from './MinimalFooter';
import SummaryStep from './SummaryStep';

export default function BillEditor() {
  const isHydrated = useAppStore(state => state.isDraftHydrated);
  const hydrateDraft = useAppStore(state => state.hydrateDraft);
  const currentStep = useAppStore(state => state.currentStep);
  const error = useAppStore(state => state.error);
  const people = useAppStore(state => state.people);
  const receipts = useAppStore(state => state.receipts);
  const setCurrentStep = useAppStore(state => state.setCurrentStep);

  useEffect(() => {
    hydrateDraft();
  }, [hydrateDraft]);

  useEffect(() => {
    if (!isHydrated) return;

    const totalItems = receipts.reduce((sum, receipt) => sum + receipt.items.length, 0);

    if (currentStep === 'assign' && totalItems === 0) {
      setCurrentStep('input');
      return;
    }

    if (currentStep === 'assign' && people.length < 2) {
      setCurrentStep('summary');
      return;
    }

    if (currentStep === 'summary' && people.length >= 2) {
      const allItemsAssigned = receipts
        .flatMap(receipt => receipt.items)
        .every(item => item.assignedTo.length > 0);

      if (totalItems > 0 && !allItemsAssigned) {
        setCurrentStep('assign');
      }
    }
  }, [currentStep, isHydrated, people.length, receipts, setCurrentStep]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-luxury-rich flex items-center justify-center p-4">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">正在加载浏览器草稿...</p>
        </div>
      </div>
    );
  }

  const step = currentStep === 'assign'
    ? <AssignStep />
    : currentStep === 'summary'
      ? <SummaryStep />
      : <InputStep />;

  return (
    <div className="min-h-screen bg-luxury-rich">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
        {error ? (
          <div className="mb-4">
            <ErrorAlert message={error} />
          </div>
        ) : null}

        <main className="animation-fade-in">{step}</main>
      </div>

      <MinimalFooter />
    </div>
  );
}
