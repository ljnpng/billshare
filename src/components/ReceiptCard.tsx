import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Edit, Save, X, Trash2, PlusCircle, DollarSign, Check } from 'lucide-react';
import { Receipt } from '../types';
import { useAppStore } from '../store';
import { uiLogger } from '../lib/logger';

interface ReceiptCardProps {
  receipt: Receipt;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt }) => {
  const t = useTranslations('receiptCard');
  const tCommon = useTranslations('common');
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
  
  // 防抖定时器引用
  const [nameDebounceTimer, setNameDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [taxDebounceTimer, setTaxDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [tipDebounceTimer, setTipDebounceTimer] = useState<NodeJS.Timeout | null>(null);

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

  // 即时更新税费，带防抖
  const handleTaxChange = (value: string) => {
    setTaxAmount(value);
    
    // 清除之前的定时器
    if (taxDebounceTimer) {
      clearTimeout(taxDebounceTimer);
    }
    
    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      const tax = parseFloat(value) || 0;
      const tip = parseFloat(tipAmount) || 0;
      updateTaxAndTip(receipt.id, tax, tip);
    }, 800);
    
    setTaxDebounceTimer(timer);
  };

  // 即时更新小费，带防抖
  const handleTipChange = (value: string) => {
    setTipAmount(value);
    
    // 清除之前的定时器
    if (tipDebounceTimer) {
      clearTimeout(tipDebounceTimer);
    }
    
    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      const tax = parseFloat(taxAmount) || 0;
      const tip = parseFloat(value) || 0;
      updateTaxAndTip(receipt.id, tax, tip);
    }, 800);
    
    setTipDebounceTimer(timer);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (nameDebounceTimer) clearTimeout(nameDebounceTimer);
      if (taxDebounceTimer) clearTimeout(taxDebounceTimer);
      if (tipDebounceTimer) clearTimeout(tipDebounceTimer);
    };
  }, [nameDebounceTimer, taxDebounceTimer, tipDebounceTimer]);

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
              onChange={(e) => {
                setName(e.target.value);
                
                // 清除之前的定时器
                if (nameDebounceTimer) {
                  clearTimeout(nameDebounceTimer);
                }
                
                // 即时保存名称变化
                if (e.target.value.trim() && e.target.value.trim() !== receipt.name) {
                  const timer = setTimeout(() => {
                    updateReceiptName(receipt.id, e.target.value.trim());
                  }, 800); // 800ms 防抖
                  
                  setNameDebounceTimer(timer);
                }
              }}
              className="input input-sm"
              autoFocus
              onBlur={() => {
                if (name.trim() !== receipt.name) {
                  handleNameSave();
                }
                setIsEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameSave();
                  setIsEditingName(false);
                }
                if (e.key === 'Escape') {
                  setName(receipt.name);
                  setIsEditingName(false);
                }
              }}
              placeholder="输入收据名称..."
            />
            <button onClick={() => setIsEditingName(false)} className="ml-2 btn btn-ghost btn-sm text-gray-400 hover:text-gray-600" title="完成编辑">
                <Check className="h-4 w-4" />
            </button>
          </div>
        )}
        <button onClick={() => removeReceipt(receipt.id)} className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 hover:text-red-600" title={t('deleteReceipt')}>
          <Trash2 className="h-5 w-5" />
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
                placeholder={t('addItemPlaceholder')}
                className="input flex-1"
                aria-label={tCommon('name')}
              />
              <div className="flex gap-3">
                <div className="relative flex-1 sm:flex-none">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                   <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder={t('pricePlaceholder')}
                    className="input w-full sm:w-32 pl-9"
                    step="0.01"
                    min="0"
                    aria-label={tCommon('price')}
                  />
                </div>
                <button type="submit" className="btn btn-primary h-12 w-12 flex-shrink-0 p-0" disabled={!newItemName.trim() || !newItemPrice} title={t('addItemButton')}>
                  <PlusCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {receipt.items.length > 0 ? receipt.items.map((item) => (
              <div key={item.id} className="bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                {editingItemId === item.id ? (
                  // 编辑模式
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="text"
                      value={editingItemName}
                      onChange={(e) => setEditingItemName(e.target.value)}
                      className="input input-sm flex-1"
                      placeholder="商品名称"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit();
                        }
                        if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          }
                          if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        onBlur={() => {
                          // 失焦时自动保存（如果有内容）
                          if (editingItemName.trim() && editingItemPrice.trim()) {
                            setTimeout(handleSaveEdit, 100);
                          }
                        }}
                      />
                    </div>
                    <button onClick={handleSaveEdit} className="btn btn-ghost btn-xs text-green-600 hover:text-green-700" title="保存 (Enter)">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={handleCancelEdit} className="btn btn-ghost btn-xs text-gray-400 hover:text-gray-600" title="取消 (Esc)">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  // 显示模式
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className={`text-sm font-semibold mr-2 ${item.originalPrice !== null ? 'text-gray-700' : 'text-red-500'}`}>
                        {item.originalPrice !== null ? `$${item.originalPrice.toFixed(2)}` : t('needsPriceMessage')}
                      </span>
                      <button 
                        onClick={() => handleEditItem(item.id, item.name, item.originalPrice)} 
                        className="btn btn-ghost btn-xs text-gray-400 hover:text-blue-600 min-h-0 h-8 w-8 p-0"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => removeItem(receipt.id, item.id)} 
                        className="btn btn-ghost btn-xs text-gray-400 hover:text-red-600 min-h-0 h-8 w-8 p-0"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )) : <p className="text-description text-center py-8">{t('noItemsMessage')}</p>}
          </div>
        </div>
        {/* Right: Tax, Tip, Summary */}
        <div className="md:col-span-2 md:border-l md:pl-6">
          <div className="space-y-6">
            <div>
              <label htmlFor={`tax-${receipt.id}`} className="block text-sm font-semibold text-gray-700 mb-2">{t('taxLabel')}</label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                 <input
                  id={`tax-${receipt.id}`}
                  type="number"
                  value={taxAmount}
                  onChange={(e) => handleTaxChange(e.target.value)}
                  className="input w-full pl-9"
                  step="0.01"
                  min="0"
                  aria-describedby={`tax-help-${receipt.id}`}
                  placeholder="0.00"
                />
              </div>
              <div id={`tax-help-${receipt.id}`} className="sr-only">{t('taxHelpText')}</div>
            </div>
            <div>
              <label htmlFor={`tip-${receipt.id}`} className="block text-sm font-semibold text-gray-700 mb-2">{t('tipLabel')}</label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                 <input
                  id={`tip-${receipt.id}`}
                  type="number"
                  value={tipAmount}
                  onChange={(e) => handleTipChange(e.target.value)}
                  className="input w-full pl-9"
                  step="0.01"
                  min="0"
                  aria-describedby={`tip-help-${receipt.id}`}
                  placeholder="0.00"
                />
              </div>
              <div id={`tip-help-${receipt.id}`} className="sr-only">{t('tipHelpText')}</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">{tCommon('subtotal')}:</span> <span className="font-semibold">${receipt.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">{tCommon('tax')}:</span> <span className="font-semibold">${receipt.tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">{tCommon('tip')}:</span> <span className="font-semibold">${receipt.tip.toFixed(2)}</span></div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between font-bold text-lg"><span>{tCommon('total')}:</span> <span className="text-blue-600">${receipt.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 