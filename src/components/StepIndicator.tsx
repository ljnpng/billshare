import React from 'react';
import { useTranslations } from 'next-intl';
import { Check, Users, FileText, UserCheck, Calculator } from 'lucide-react';
import { AppState } from '../types';

interface StepIndicatorProps {
  currentStep: AppState['currentStep'];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const t = useTranslations('steps');
  
  const steps = [
    { id: 'setup', label: t('setup'), icon: Users },
    { id: 'input', label: t('input'), icon: FileText },
    { id: 'assign', label: t('assign'), icon: UserCheck },
    { id: 'summary', label: t('summary'), icon: Calculator }
  ];

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
    <div className="mb-6 sm:mb-8">
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl shadow-gray-200/40 border border-gray-200/60">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center group min-w-0 flex-1">
                  <div className={`step-indicator ${status} group-hover:scale-105 transition-transform`}>
                    {status === 'completed' ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <span className={`mt-2 sm:mt-3 text-xs sm:text-sm font-semibold transition-colors text-center ${
                    status === 'active' ? 'text-blue-600' : 
                    status === 'completed' ? 'text-green-600' : 
                    'text-gray-500'
                  }`}>
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.label.substring(0, 4)}</span>
                  </span>
                  {status === 'active' && (
                    <div className="mt-1 sm:mt-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse"></div>
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