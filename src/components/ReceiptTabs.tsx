import React from 'react';
import { useAppStore } from '../store';
import { Plus, X } from 'lucide-react';

export const ReceiptTabs: React.FC = () => {
  const { receipts, activeReceiptId, addReceipt, removeReceipt, setActiveReceipt } = useAppStore();

  const handleAddReceipt = () => {
    addReceipt('新收据');
  };

  return (
    <div className="mb-4">
      <div className="flex items-center border-b border-gray-200">
        <div className="flex -mb-px space-x-2">
          {receipts.map(receipt => (
            <div
              key={receipt.id}
              className={`flex items-center py-2 px-3 border-b-2 text-sm font-medium cursor-pointer ${
                activeReceiptId === receipt.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveReceipt(receipt.id)}
            >
              <span>{receipt.name}</span>
              {receipts.length > 1 && (
                 <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeReceipt(receipt.id);
                    }}
                    className="ml-2 p-0.5 rounded-full hover:bg-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleAddReceipt}
          className="ml-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-4 w-4 mr-1" />
          添加收据
        </button>
      </div>
    </div>
  );
}; 