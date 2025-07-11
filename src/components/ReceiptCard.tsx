import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Trash2, PlusCircle, DollarSign } from 'lucide-react';
import { Receipt } from '../types';
import { useAppStore } from '../store';
import { uiLogger } from '../lib/logger';

interface ReceiptCardProps {
  receipt: Receipt;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt }) => {
  const { 
    updateReceiptName, 
    removeReceipt,
    addItem, 
    removeItem, 
    updateTaxAndTip
  } = useAppStore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(receipt.name);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [taxAmount, setTaxAmount] = useState(receipt.tax.toString());
  const [tipAmount, setTipAmount] = useState(receipt.tip.toString());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingItemPrice, setEditingItemPrice] = useState('');

  // 监听receipt的税费和小费变化，同步更新本地状态
  useEffect(() => {
    setTaxAmount(receipt.tax.toString());
    setTipAmount(receipt.tip.toString());
    setName(receipt.name);
    
    uiLogger.debug('收据信息同步到本地状态', {
      receiptId: receipt.id,
      tax: receipt.tax,
      tip: receipt.tip,
      name: receipt.name
    });
  }, [receipt.id, receipt.tax, receipt.tip, receipt.name]);

  const handleNameSave = () => {
    if (name.trim() !== receipt.name) {
      updateReceiptName(receipt.id, name.trim());
    }
    setIsEditingName(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && newItemPrice.trim()) {
      addItem(receipt.id, newItemName.trim(), parseFloat(newItemPrice));
      setNewItemName('');
      setNewItemPrice('');
    }
  };

  const handleTaxTipUpdate = () => {
    const tax = parseFloat(taxAmount) || 0;
    const tip = parseFloat(tipAmount) || 0;
    updateTaxAndTip(receipt.id, tax, tip);
  };

  const handleEditItem = (itemId: string, itemName: string, itemPrice: number | null) => {
    setEditingItemId(itemId);
    setEditingItemName(itemName);
    setEditingItemPrice(itemPrice !== null ? itemPrice.toString() : '');
  };

  const handleSaveEdit = () => {
    if (editingItemId && editingItemName.trim() && editingItemPrice.trim()) {
      // 先删除原商品，再添加新商品（简单的编辑实现）
      removeItem(receipt.id, editingItemId);
      addItem(receipt.id, editingItemName.trim(), parseFloat(editingItemPrice));
      setEditingItemId(null);
      setEditingItemName('');
      setEditingItemPrice('');
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItemName('');
    setEditingItemPrice('');
  };



  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-200/60 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200/60 flex justify-between items-center">
        {!isEditingName ? (
          <div className="flex items-center group">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{receipt.name}</h2>
            <button onClick={() => setIsEditingName(true)} className="ml-3 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
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
            <button onClick={handleNameSave} className="ml-2 btn btn-ghost btn-sm text-blue-600 hover:text-blue-700">
              <Save className="h-4 w-4" />
            </button>
            <button onClick={() => setIsEditingName(false)} className="ml-2 btn btn-ghost btn-sm text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <button onClick={() => removeReceipt(receipt.id)} className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          删除
        </button>
      </div>
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8">
        {/* Left: Item Entry */}
        <div className="md:col-span-3">
          <form onSubmit={handleAddItem} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="项目名称 (例如: 披萨)"
                className="input flex-1"
                aria-label="项目名称"
              />
              <div className="flex gap-3">
                <div className="relative flex-1 sm:flex-none">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                   <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="价格"
                    className="input w-full sm:w-32 pl-9"
                    step="0.01"
                    min="0"
                    aria-label="价格"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={!newItemName.trim() || !newItemPrice} aria-label="添加项目">
                  <PlusCircle className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">添加</span>
                </button>
              </div>
            </div>
          </form>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {receipt.items.length > 0 ? receipt.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                {editingItemId === item.id ? (
                  // 编辑模式
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="text"
                      value={editingItemName}
                      onChange={(e) => setEditingItemName(e.target.value)}
                      className="input input-sm flex-1"
                      placeholder="商品名称"
                    />
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={editingItemPrice}
                        onChange={(e) => setEditingItemPrice(e.target.value)}
                        className="input input-sm w-24 pl-9"
                        placeholder="价格"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <button onClick={handleSaveEdit} className="btn btn-ghost btn-xs text-blue-600 hover:text-blue-700">
                      <Save className="h-4 w-4" />
                    </button>
                    <button onClick={handleCancelEdit} className="btn btn-ghost btn-xs text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  // 显示模式
                  <>
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${item.originalPrice !== null ? 'text-gray-700' : 'text-red-500'}`}>
                        {item.originalPrice !== null ? `$${item.originalPrice.toFixed(2)}` : '需要填写价格'}
                      </span>
                      <button 
                        onClick={() => handleEditItem(item.id, item.name, item.originalPrice)} 
                        className="btn btn-ghost btn-xs text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeItem(receipt.id, item.id)} className="btn btn-ghost btn-xs text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )) : <p className="text-description text-center py-8">暂无项目</p>}
          </div>
        </div>
        {/* Right: Tax, Tip, Summary */}
        <div className="md:col-span-2 md:border-l md:pl-6">
          <div className="space-y-6">
            <div>
              <label htmlFor={`tax-${receipt.id}`} className="block text-sm font-semibold text-gray-700 mb-2">税费 (Tax)</label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                 <input
                  id={`tax-${receipt.id}`}
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  onBlur={handleTaxTipUpdate}
                  className="input w-full pl-9"
                  step="0.01"
                  min="0"
                  aria-describedby={`tax-help-${receipt.id}`}
                />
              </div>
              <div id={`tax-help-${receipt.id}`} className="sr-only">输入此收据的税费金额</div>
            </div>
            <div>
              <label htmlFor={`tip-${receipt.id}`} className="block text-sm font-semibold text-gray-700 mb-2">小费 (Tip)</label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                 <input
                  id={`tip-${receipt.id}`}
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  onBlur={handleTaxTipUpdate}
                  className="input w-full pl-9"
                  step="0.01"
                  min="0"
                  aria-describedby={`tip-help-${receipt.id}`}
                />
              </div>
              <div id={`tip-help-${receipt.id}`} className="sr-only">输入此收据的小费金额</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">小计:</span> <span className="font-semibold">${receipt.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">税费:</span> <span className="font-semibold">${receipt.tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">小费:</span> <span className="font-semibold">${receipt.tip.toFixed(2)}</span></div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between font-bold text-lg"><span>总计:</span> <span className="text-blue-600">${receipt.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 