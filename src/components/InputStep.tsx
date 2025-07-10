import React, { useRef } from 'react';
import { Plus, Receipt, ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';
import { ReceiptCard } from './ReceiptCard';

const InputStep: React.FC = () => {
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

    const newReceiptId = addReceipt('识别中的收据');
    await processReceiptImage(newReceiptId, file);
    
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="card-title">输入账单条目</h2>
              <p className="text-description">
                添加一张或多张收据，并输入每个条目的名称和价格。
              </p>
            </div>
            {receipts.length > 0 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isAiProcessing}
                  className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{isAiProcessing ? '识别中...' : 'AI识别'}</span>
                  <span className="sm:hidden">{isAiProcessing ? '识别中' : 'AI'}</span>
                </button>
                <button 
                  onClick={() => addReceipt('新收据')} 
                  className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">手动添加</span>
                  <span className="sm:hidden">添加</span>
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
            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50">
              <Receipt className="h-16 w-16 mx-auto mb-6 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">开始添加你的第一份账单</h3>
              <p className="text-description mb-8">所有条目都会在这里显示。</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  onClick={handleUploadClick}
                  disabled={isAiProcessing}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Sparkles className="h-6 w-6 mr-3" />
                  {isAiProcessing ? '识别中...' : 'AI识别'}
                </button>
                <button 
                  onClick={() => addReceipt('新收据')} 
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  手动添加
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between mt-6">
        <button onClick={handleBack} className="btn btn-secondary btn-lg order-2 sm:order-1">
          上一步
        </button>
        <button
          onClick={handleNext}
          className="btn btn-primary btn-lg order-1 sm:order-2"
          disabled={totalItems === 0}
        >
          <span className="hidden sm:inline">下一步：分配条目</span>
          <span className="sm:hidden">分配条目</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default InputStep; 