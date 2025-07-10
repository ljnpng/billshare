import React from 'react';
import { Check, Users, FileText, UserCheck, Calculator } from 'lucide-react';
import { AppState } from '../types';

interface StepIndicatorProps {
  currentStep: AppState['currentStep'];
}

const steps = [
  { id: 'setup', label: '设置人员', icon: Users },
  { id: 'input', label: '输入账单', icon: FileText },
  { id: 'assign', label: '分配条目', icon: UserCheck },
  { id: 'summary', label: '费用汇总', icon: Calculator }
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/40 border border-gray-200/60">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center group">
                  <div className={`step-indicator ${status} group-hover:scale-105 transition-transform`}>
                    {status === 'completed' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-3 text-sm font-semibold transition-colors ${
                    status === 'active' ? 'text-blue-600' : 
                    status === 'completed' ? 'text-green-600' : 
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {status === 'active' && (
                    <div className="mt-2 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`step-line ${
                    getStepStatus(index + 1) === 'completed' || 
                    getStepStatus(index + 1) === 'active' ? 'active' : ''
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator; 