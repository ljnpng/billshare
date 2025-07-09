import React, { useEffect } from 'react';
import { useAppStore } from './store';
import StepIndicator from './components/StepIndicator';
import SetupStep from './components/SetupStep';
import InputStep from './components/InputStep';
import AssignStep from './components/AssignStep';
import SummaryStep from './components/SummaryStep';
import ErrorAlert from './components/ErrorAlert';
import { ReceiptTabs } from './components/ReceiptTabs';

const App: React.FC = () => {
  const { 
    currentStep, 
    error, 
    people,
    receipts,
    activeReceiptId,
    addReceipt,
  } = useAppStore();

  useEffect(() => {
    if (receipts.length === 0) {
      addReceipt('收据');
    }
  }, [receipts, addReceipt]);

  const activeReceipt = receipts.find(r => r.id === activeReceiptId);

  const renderStep = () => {
    // 如果人员少于2人，强制留在设置步骤
    if (currentStep !== 'setup' && people.length < 2) {
      return <SetupStep />;
    }

    // 如果没有活动的收据，也停留在设置步骤
    if (currentStep !== 'setup' && !activeReceipt) {
      return <SetupStep />;
    }

    // 如果进入分配步骤，但没有条目，则退回输入步骤
    if (currentStep === 'assign' && activeReceipt && activeReceipt.items.length === 0) {
      return <InputStep />;
    }

    // 如果进入汇总步骤，但有条目未分配，则退回分配步骤
    const isAllAssigned = activeReceipt?.items.every(item => item.assignedTo.length > 0) ?? false;
    if (currentStep === 'summary' && !isAllAssigned) {
      return <AssignStep />;
    }

    switch (currentStep) {
      case 'setup':
        return <SetupStep />;
      case 'input':
        return <InputStep />;
      case 'assign':
        return <AssignStep />;
      case 'summary':
        return <SummaryStep />;
      default:
        return <SetupStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">AAP费用分摊</h1>
          <p className="mt-2 text-lg text-gray-600">
            智能分摊餐费、税费和小费，让每个人都支付合理的份额
          </p>
        </header>

        {error && <ErrorAlert message={error} />}
        
        <div className="mb-8">
          <StepIndicator />
        </div>

        <ReceiptTabs />

        <main className="animation-fade-in">
          {renderStep()}
        </main>
      </div>
    </div>
  );
};

export default App; 