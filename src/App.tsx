import React from 'react';
import { useAppStore } from './store';
import StepIndicator from './components/StepIndicator';
import SetupStep from './components/SetupStep';
import InputStep from './components/InputStep';
import AssignStep from './components/AssignStep';
import SummaryStep from './components/SummaryStep';
import ErrorAlert from './components/ErrorAlert';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { currentStep, isLoading, error } = useAppStore();

  const renderCurrentStep = () => {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AAP费用分摊
          </h1>
          <p className="text-gray-600">
            智能分摊餐费、税费和小费，让每个人都支付合理的份额
          </p>
        </div>

        {/* 步骤指示器 */}
        <StepIndicator currentStep={currentStep} />

        {/* 错误提示 */}
        {error && <ErrorAlert message={error} />}

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" />
          </div>
        )}

        {/* 当前步骤内容 */}
        {!isLoading && (
          <div className="animation-fade-in">
            {renderCurrentStep()}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 