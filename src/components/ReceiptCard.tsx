import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Receipt } from '../types';
import { Plus, Trash2, DollarSign, Edit, Save, X, PlusCircle } from 'lucide-react';

interface ReceiptCardProps {
  receipt: Receipt;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt }) => {
  const {
    updateReceiptName,
    removeReceipt,
    addItem,
    removeItem,
    updateTaxAndTip,
  } = useAppStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(receipt.name);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [taxAmount, setTaxAmount] = useState(receipt.tax.toString());
  const [tipAmount, setTipAmount] = useState(receipt.tip.toString());

  const handleNameSave = () => {
    if (name.trim()) {
      updateReceiptName(receipt.id, name.trim());
      setIsEditingName(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && newItemPrice) {
      const price = parseFloat(newItemPrice);
      if (!isNaN(price) && price > 0) {
        addItem(receipt.id, newItemName.trim(), price);
        setNewItemName('');
        setNewItemPrice('');
      }
    }
  };
  
  const handleTaxTipUpdate = () => {
    const tax = parseFloat(taxAmount) || 0;
    const tip = parseFloat(tipAmount) || 0;
    if (tax >= 0 && tip >= 0) {
      updateTaxAndTip(receipt.id, tax, tip);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        {!isEditingName ? (
          <div className="flex items-center group">
            <h2 className="text-xl font-bold text-gray-800">{receipt.name}</h2>
            <button onClick={() => setIsEditingName(true)} className="ml-3 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-sm"
              autoFocus
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            />
            <button onClick={handleNameSave} className="ml-2 btn btn-success btn-sm">
              <Save className="h-4 w-4" />
            </button>
            <button onClick={() => setIsEditingName(false)} className="ml-2 btn btn-ghost btn-sm">
                <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <button onClick={() => removeReceipt(receipt.id)} className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50">
          <Trash2 className="h-4 w-4 mr-1" />
          删除
        </button>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left: Item Entry */}
        <div className="md:col-span-3">
          <form onSubmit={handleAddItem} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="项目名称 (例如: 披萨)"
                className="input input-bordered flex-1"
              />
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="价格"
                  className="input input-bordered w-32 pl-9"
                  step="0.01"
                  min="0"
                />
              </div>
              <button type="submit" className="btn btn-ghost btn-square text-blue-600 hover:bg-blue-100" disabled={!newItemName.trim() || !newItemPrice}>
                <PlusCircle className="h-6 w-6" />
              </button>
            </div>
          </form>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {receipt.items.length > 0 ? receipt.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md">
                <span>{item.name}</span>
                <div className="flex items-center">
                  <span className="mr-4">${item.originalPrice.toFixed(2)}</span>
                  <button onClick={() => removeItem(receipt.id, item.id)} className="btn btn-ghost btn-xs text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )) : <p className="text-gray-500 text-center py-4">暂无项目</p>}
          </div>
        </div>
        {/* Right: Tax, Tip, Summary */}
        <div className="md:col-span-2 md:border-l md:pl-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">税费 (Tax)</label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  onBlur={handleTaxTipUpdate}
                  className="input input-bordered w-full pl-9"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">小费 (Tip)</label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  onBlur={handleTaxTipUpdate}
                  className="input input-bordered w-full pl-9"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
          <div className="border-t mt-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">小计:</span> <span>${receipt.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">税费:</span> <span>${receipt.tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">小费:</span> <span>${receipt.tip.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t"><span >总计:</span> <span>${receipt.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 