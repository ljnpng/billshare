import React, { useState } from 'react';
import { Plus, Trash2, Edit2, DollarSign, Receipt } from 'lucide-react';
import { useAppStore } from '../store';
import { RawReceiptData } from '../types';

const InputStep: React.FC = () => {
  const {
    getActiveReceipt,
    processRawData,
    addItem,
    removeItem,
    updateTaxAndTip,
    setCurrentStep,
  } = useAppStore();

  const receipt = getActiveReceipt();

  const [newItemName, setNewItemName] = React.useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [taxAmount, setTaxAmount] = useState(receipt?.tax?.toString() || '');
  const [tipAmount, setTipAmount] = useState(receipt?.tip?.toString() || '');

  // 初始化时创建空的小票
  React.useEffect(() => {
    if (!receipt) {
      const initialData: RawReceiptData = {
        items: [],
        tax: 0,
        tip: 0
      };
      // 这将在 activeReceiptId 设置后由 store 保证有 receipt
      // processRawData(initialData);
    } else {
      setTaxAmount(String(receipt.tax));
      setTipAmount(String(receipt.tip));
    }
  }, [receipt]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && newItemPrice.trim()) {
      const price = parseFloat(newItemPrice);
      if (!isNaN(price) && price > 0) {
        addItem(newItemName.trim(), price);
        setNewItemName('');
        setNewItemPrice('');
      }
    }
  };

  const handleTaxTipUpdate = () => {
    const tax = parseFloat(taxAmount) || 0;
    const tip = parseFloat(tipAmount) || 0;
    if (tax >= 0 && tip >= 0) {
      updateTaxAndTip(tax, tip);
    }
  };

  const handleNext = () => {
    if (receipt && receipt.items.length > 0) {
      setCurrentStep('assign');
    }
  };

  const handleBack = () => {
    setCurrentStep('setup');
  };

  if (!receipt) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：条目输入 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">输入账单条目</h2>
            <p className="text-sm text-gray-600">
              添加每个消费项目的名称和价格
            </p>
          </div>

          <div className="card-content">
            {/* 添加条目表单 */}
            <form onSubmit={handleAddItem} className="mb-6">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="项目名称（如：汉堡、薯条等）"
                  className="input w-full"
                  maxLength={50}
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      placeholder="价格"
                      className="input w-full pl-10"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-md"
                    disabled={!newItemName.trim() || !newItemPrice.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加
                  </button>
                </div>
              </div>
            </form>

            {/* 条目列表 */}
            <div className="space-y-2">
              {receipt.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>还没有添加任何条目</p>
                  <p className="text-sm">请添加至少一个消费项目</p>
                </div>
              ) : (
                receipt.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        原价: ${item.originalPrice.toFixed(2)}
                        {item.finalPrice > item.originalPrice && (
                          <span className="ml-2 text-blue-600">
                            含税费: ${item.finalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="btn btn-danger btn-sm ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧：税费和汇总 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">税费和小费</h2>
            <p className="text-sm text-gray-600">
              输入税费和小费金额，系统会自动按比例分摊
            </p>
          </div>

          <div className="card-content">
            <div className="space-y-4">
              {/* 税费输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  税费 (Tax)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    onBlur={handleTaxTipUpdate}
                    placeholder="0.00"
                    className="input w-full pl-10"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* 小费输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  小费 (Tip)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    onBlur={handleTaxTipUpdate}
                    placeholder="0.00"
                    className="input w-full pl-10"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* 费用汇总 */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">小计:</span>
                    <span className="font-medium">${receipt.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">税费:</span>
                    <span className="font-medium">${receipt.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">小费:</span>
                    <span className="font-medium">${receipt.tip.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>总计:</span>
                    <span>${receipt.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          className="btn btn-secondary btn-lg"
        >
          上一步
        </button>
        <button
          onClick={handleNext}
          className="btn btn-primary btn-lg"
          disabled={!receipt || receipt.items.length === 0}
        >
          下一步：分配条目
        </button>
      </div>
    </div>
  );
};

export default InputStep; 