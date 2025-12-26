import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { RotateCcw, Share2, Check, ChevronDown, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store';
import confetti from 'canvas-confetti';
import ShareModal from './ShareModal';
import { convertUsdToCny } from '../lib/currencyService';

const SummaryStep: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('summaryStep');
  const tCommon = useTranslations('common');
  const tCopy = useTranslations('copySuccess');
  const tAssign = useTranslations('assignStep');
  const { getBillSummary, reset, setCurrentStep, setSessionId, sessionId, exchangeRate, loadExchangeRate } = useAppStore();
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedReceipts, setExpandedReceipts] = useState<string[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const billSummary = getBillSummary();

  // Load exchange rate on component mount
  useEffect(() => {
    loadExchangeRate();
  }, [loadExchangeRate]);

  // Currency display component
  const CurrencyDisplay = ({ usdAmount }: { usdAmount: number }) => {
    const cnyAmount = convertUsdToCny(usdAmount, exchangeRate);
    return (
      <div className="text-right">
        <div className="font-medium">${usdAmount.toFixed(2)}</div>
        <div className="text-sm text-gray-600">≈ ¥{cnyAmount.toFixed(2)}</div>
      </div>
    );
  };

  const toggleReceipt = (receiptId: string) => {
    setExpandedReceipts(prev =>
      prev.includes(receiptId)
        ? prev.filter(id => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  const getShareUrl = () => {
    if (!sessionId) return '';
    const locale = params.locale as string;
    return `${window.location.origin}/${locale}/preview/${sessionId}`;
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleModalCopyLink = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;

    // iOS Safari 兼容性处理
    const copyToClipboard = async (text: string) => {
      // 首先尝试现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (error) {
          console.warn('Clipboard API failed:', error);
        }
      }

      // 降级方案：创建临时textarea元素
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          return true;
        }
      } catch (error) {
        console.warn('Fallback copy failed:', error);
      }

      return false;
    };

    const success = await copyToClipboard(shareUrl);
    
    if (success) {
      setCopySuccess(true);
      
      // 触发confetti特效
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981'],
        shapes: ['square', 'circle'],
        scalar: 0.8
      });
      
      setTimeout(() => setCopySuccess(false), 3000);
    } else {
      // 复制失败时显示链接让用户手动复制
      const fallbackMessage = `${t('copyManually')}: ${shareUrl}`;
      
      // 在iOS Safari中使用prompt让用户可以长按复制
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const userSelection = window.prompt(t('copyManually'), shareUrl);
        // 即使用户取消，我们也认为他们看到了链接
        if (userSelection !== null) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        }
      } else {
        alert(fallbackMessage);
      }
    }
  };


  const handleOpenInBrowser = () => {
    const shareUrl = getShareUrl();
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const handleStartOver = async () => {
    if (isCreatingSession) return;
    
    setIsCreatingSession(true);
    const locale = params.locale as string;
    
    try {
      const response = await fetch('/api/session/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('创建会话失败');
      }
      
      const result = await response.json();
      
      if (result.success && result.uuid) {
        // 重置状态并设置新的sessionId
        reset();
        setSessionId(result.uuid);
        // 重定向到新的UUID URL
        router.replace(`/${locale}/${result.uuid}`);
      } else {
        throw new Error('创建会话失败');
      }
    } catch (error) {
      console.error('创建新会话错误:', error);
      // 如果创建新会话失败，回退到原来的重置逻辑
      reset();
      setCurrentStep('setup');
    } finally {
      setIsCreatingSession(false);
    }
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
                title={t('restartButton')}
              >
                <RotateCcw className="h-5 w-5" />
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
                  <CurrencyDisplay usdAmount={billSummary.totalSubtotal} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{tCommon('tax')}:</span>
                  <CurrencyDisplay usdAmount={billSummary.totalTax} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{tCommon('tip')}:</span>
                  <CurrencyDisplay usdAmount={billSummary.totalTip} />
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>{tCommon('total')}:</span>
                  <CurrencyDisplay usdAmount={billSummary.grandTotal} />
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
                    <CurrencyDisplay usdAmount={bill.totalFinal} />
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
                                    <div className="mr-4">
                                        <CurrencyDisplay usdAmount={receipt.total} />
                                    </div>
                                    <ChevronDown
                                        className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="p-4 border-t">
                                    <div className="space-y-2">
                                        {receipt.items.map(item => (
                                            <div key={item.id} className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">{item.name}</span>
                                                    <CurrencyDisplay usdAmount={item.finalPrice} />
                                                </div>
                                                {/* 显示分配的人员 */}
                                                <div className="flex flex-wrap gap-1">
                                                    {item.assignedTo.map(personId => {
                                                        const person = billSummary.people.find(p => p.id === personId);
                                                        return person ? (
                                                            <div 
                                                                key={personId}
                                                                className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs border"
                                                            >
                                                                <div 
                                                                    className="w-2 h-2 rounded-full"
                                                                    style={{ backgroundColor: person.color }}
                                                                />
                                                                <span className="text-gray-700">{person.name}</span>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        { (receipt.tax > 0 || receipt.tip > 0) &&
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{tCommon('subtotal')}</span>
                                            <div className="text-sm">
                                              <div className="font-medium">${receipt.subtotal.toFixed(2)}</div>
                                              <div className="text-gray-600">≈ ¥{convertUsdToCny(receipt.subtotal, exchangeRate).toFixed(2)}</div>
                                            </div>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{tCommon('tax')}</span>
                                            <div className="text-sm">
                                              <div className="font-medium">${receipt.tax.toFixed(2)}</div>
                                              <div className="text-gray-600">≈ ¥{convertUsdToCny(receipt.tax, exchangeRate).toFixed(2)}</div>
                                            </div>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{tCommon('tip')}</span>
                                            <div className="text-sm">
                                              <div className="font-medium">${receipt.tip.toFixed(2)}</div>
                                              <div className="text-gray-600">≈ ¥{convertUsdToCny(receipt.tip, exchangeRate).toFixed(2)}</div>
                                            </div>
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
              <div className="space-y-4">
                {/* 按收据分组显示条目 */}
                {Object.entries(
                  bill.items.reduce((groups, item) => {
                    const receiptId = item.receiptId;
                    if (!groups[receiptId]) {
                      groups[receiptId] = {
                        receiptName: item.receiptName,
                        items: []
                      };
                    }
                    groups[receiptId].items.push(item);
                    return groups;
                  }, {} as Record<string, { receiptName: string; items: typeof bill.items }>)
                ).map(([receiptId, group]) => (
                  <div key={receiptId} className="border rounded-lg p-3 bg-gray-50">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">{group.receiptName}</h4>
                    <div className="space-y-2">
                      {group.items.map(item => (
                        <div key={item.itemId} className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.itemName}</div>
                            <div className="text-xs text-gray-600">
                              {item.share > 1 ? tAssign('sharedWith', { count: item.share - 1 }) : tAssign('exclusive')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">${item.finalShare.toFixed(2)}</div>
                            <div className="text-xs text-gray-600">≈ ¥{convertUsdToCny(item.finalShare, exchangeRate).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              {tAssign('originalPrice')}: ${item.originalShare.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{tCommon('total')}:</span>
                    <CurrencyDisplay usdAmount={bill.totalFinal} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2">
          <button
            onClick={handleEditAssignments}
            className="btn btn-secondary btn-sm sm:btn-md"
            title={t('modifyAssignments')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleShareClick}
            className="btn btn-secondary btn-sm sm:btn-md hover:scale-105 transition-all"
            disabled={!sessionId}
            title={t('shareLink')}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        
        <button
          onClick={handleStartOver}
          className="btn btn-primary btn-sm sm:btn-md"
          disabled={isCreatingSession}
          title={isCreatingSession ? tCommon('loading') : t('startOver')}
        >
          <RotateCcw className={`h-5 w-5 ${isCreatingSession ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 分享弹窗 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={getShareUrl()}
        onCopyLink={handleModalCopyLink}
        onOpenInBrowser={handleOpenInBrowser}
        copySuccess={copySuccess}
      />
    </div>
  );
};

export default SummaryStep; 