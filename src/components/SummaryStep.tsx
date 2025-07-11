import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, Copy, Check, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store';

const SummaryStep: React.FC = () => {
  const t = useTranslations('summaryStep');
  const tCommon = useTranslations('common');
  const tCopy = useTranslations('copySuccess');
  const { getBillSummary, reset, setCurrentStep } = useAppStore();
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedReceipts, setExpandedReceipts] = useState<string[]>([]);
  
  const billSummary = getBillSummary();

  const toggleReceipt = (receiptId: string) => {
    setExpandedReceipts(prev =>
      prev.includes(receiptId)
        ? prev.filter(id => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  const handleCopyToClipboard = () => {
    if (!billSummary) return;

    let text = `${tCopy('title')}\n\n`;
    text += `${tCopy('totalLabel')}: $${billSummary.grandTotal.toFixed(2)}\n`;
    text += `${tCopy('subtotalLabel')}: $${billSummary.totalSubtotal.toFixed(2)}\n`;
    text += `${tCopy('taxLabel')}: $${billSummary.totalTax.toFixed(2)}\n`;
    text += `${tCopy('tipLabel')}: $${billSummary.totalTip.toFixed(2)}\n\n`;
    
    text += `${tCopy('personalBillsHeader')}\n`;
    billSummary.personalBills.forEach(bill => {
      text += `${bill.personName}: $${bill.totalFinal.toFixed(2)}\n`;
    });
    text += '\n';

    text += `${tCopy('receiptDetailsHeader')}\n`;
    billSummary.receipts.forEach(receipt => {
      text += `${receipt.name}: $${receipt.total.toFixed(2)}\n`;
    });


    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleStartOver = () => {
    reset();
    setCurrentStep('setup');
  };

  const handleEditAssignments = () => {
    setCurrentStep('assign');
  };

  if (!billSummary) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-content">
            <div className="text-center py-8">
              <p className="text-gray-500">{t('cannotGenerate')}</p>
              <button
                onClick={() => setCurrentStep('setup')}
                className="btn btn-primary btn-md mt-4"
              >
                {t('restartButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 总览卡片 */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">{t('title')}</h2>
          <p className="text-sm text-gray-600">
            {t('description')}
          </p>
        </div>
        
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 账单总览 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">{t('billOverview')}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{tCommon('subtotal')}:</span>
                  <span>${billSummary.totalSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{tCommon('tax')}:</span>
                  <span>${billSummary.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{tCommon('tip')}:</span>
                  <span>${billSummary.totalTip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>{tCommon('total')}:</span>
                  <span>${billSummary.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 人员分摊 */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-3">{t('personalSplit')}</h3>
              <div className="space-y-2">
                {billSummary.personalBills.map(bill => (
                  <div key={bill.personId} className="flex justify-between">
                    <div className="flex items-center">
                      <div 
                        className="person-color"
                        style={{ 
                          backgroundColor: billSummary.people.find(p => p.id === bill.personId)?.color 
                        }}
                      />
                      <span>{bill.personName}</span>
                    </div>
                    <span className="font-medium">${bill.totalFinal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 收据明细 */}
      <div className="card mb-6">
        <div className="card-header">
            <h2 className="card-title">{t('receiptDetails')}</h2>
        </div>
        <div className="card-content">
            <div className="space-y-2">
                {billSummary.receipts.map(receipt => {
                    const isExpanded = expandedReceipts.includes(receipt.id);
                    return (
                        <div key={receipt.id} className="bg-gray-50 rounded-lg">
                            <button
                                onClick={() => toggleReceipt(receipt.id)}
                                className="w-full flex justify-between items-center p-4 text-left"
                            >
                                <span className="font-medium">{receipt.name}</span>
                                <div className="flex items-center">
                                    <span className="mr-4 font-medium">${receipt.total.toFixed(2)}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="p-4 border-t">
                                    <div className="space-y-2">
                                        {receipt.items.map(item => (
                                            <div key={item.id} className="flex justify-between">
                                                <span className="text-gray-600">{item.name}</span>
                                                <span>${item.finalPrice.toFixed(2)}</span>
                                            </div>
                                        ))}
                                        { (receipt.tax > 0 || receipt.tip > 0) &&
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{tCommon('subtotal')}</span>
                                            <span>${receipt.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{tCommon('tax')}</span>
                                            <span>${receipt.tax.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{tCommon('tip')}</span>
                                            <span>${receipt.tip.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>


      {/* 详细分摊 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {billSummary.personalBills.map(bill => (
          <div key={bill.personId} className="card">
            <div className="card-header">
              <div className="flex items-center">
                <div 
                  className="person-color"
                  style={{ 
                    backgroundColor: billSummary.people.find(p => p.id === bill.personId)?.color 
                  }}
                />
                <h3 className="card-title">{bill.personName}</h3>
              </div>
            </div>
            
            <div className="card-content">
              <div className="space-y-3">
                {bill.items.map(item => (
                  <div key={item.itemId} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-sm text-gray-600">
                        {item.share > 1 ? t('sharedWith', { count: item.share - 1 }) : t('exclusive')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${item.finalShare.toFixed(2)}</div>
                                              <div className="text-sm text-gray-600">
                          {t('originalPrice')}: ${item.originalShare.toFixed(2)}
                        </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{tCommon('total')}:</span>
                    <span>${bill.totalFinal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleEditAssignments}
            className="btn btn-secondary btn-md"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('modifyAssignments')}
          </button>
          <button
            onClick={handleCopyToClipboard}
            className={`btn btn-md ${copySuccess ? 'btn-success' : 'btn-secondary'}`}
            disabled={copySuccess}
          >
            {copySuccess ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copySuccess ? tCommon('copied') : t('copyToClipboard')}
          </button>
        </div>
        
        <button
          onClick={handleStartOver}
          className="btn btn-primary btn-md"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('startOver')}
        </button>
      </div>
    </div>
  );
};

export default SummaryStep; 