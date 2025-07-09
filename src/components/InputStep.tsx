import React from 'react';
import { Plus, Receipt } from 'lucide-react';
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
      <div className="flex justify-end mb-4">
        <button onClick={() => addReceipt('新收据')} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          添加新收据
        </button>
      </div>

      {receipts.length > 0 ? (
        [...receipts].reverse().map(receipt => (
          <ReceiptCard key={receipt.id} receipt={receipt} />
        ))
      ) : (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
          <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium">还没有收据</h3>
          <p className="mt-2">点击“添加新收据”开始创建你的第一份账单。</p>
        </div>
      )}

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
          下一步：分配条目
        </button>
      </div>
    </div>
  );
};

export default InputStep; 