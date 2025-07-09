import React from 'react';
import { Plus, Receipt, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';
import { ReceiptCard } from './ReceiptCard';

const InputStep: React.FC = () => {
  const { receipts, addReceipt, setCurrentStep } = useAppStore();

  const handleNext = () => {
    setCurrentStep('assign');
  };

  const handleBack = () => {
    setCurrentStep('setup');
  };
  
  const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">输入账单条目</h2>
          <p className="text-sm text-gray-600">
            添加一张或多张收据，并输入每个条目的名称和价格。
          </p>
        </div>
        
        <div className="card-content">
          {receipts.length > 0 ? (
            <div className="space-y-6">
              {[...receipts].reverse().map(receipt => (
                <ReceiptCard key={receipt.id} receipt={receipt} />
              ))}
              <div className="flex justify-center pt-4">
                <button onClick={() => addReceipt('新收据')} className="btn btn-secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  添加另一张收据
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-700">开始添加你的第一份账单</h3>
              <p className="mt-1 text-sm text-gray-500">所有条目都会在这里显示。 </p>
              <button onClick={() => addReceipt('新收据')} className="btn btn-primary mt-6">
                <Plus className="h-4 w-4 mr-2" />
                添加新收据
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between mt-6">
        <button onClick={handleBack} className="btn btn-secondary btn-lg">
          上一步
        </button>
        <button
          onClick={handleNext}
          className="btn btn-primary btn-lg"
          disabled={totalItems === 0}
        >
          下一步：分配条目 <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default InputStep; 