'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, ExternalLink, Edit3, Plus } from 'lucide-react'
import { AppState } from '../../../../types'
import { dataProcessor } from '../../../../lib/dataProcessor'
import LanguageSwitcher from '../../../../components/LanguageSwitcher'
import { getCachedExchangeRate, convertUsdToCny } from '../../../../lib/currencyService'

interface PreviewPageProps {}

export default function PreviewPage({}: PreviewPageProps) {
  const t = useTranslations('summaryStep')
  const tCommon = useTranslations('common')
  const tPreview = useTranslations('preview')
  const tAssign = useTranslations('assignStep')
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<AppState | null>(null)
  const [expandedReceipts, setExpandedReceipts] = useState<string[]>([])
  const [exchangeRate, setExchangeRate] = useState(7.2) // Default fallback rate
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  
  const uuid = params.uuid as string
  const locale = params.locale as string

  // 验证UUID格式
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  const toggleReceipt = (receiptId: string) => {
    setExpandedReceipts(prev =>
      prev.includes(receiptId)
        ? prev.filter(id => id !== receiptId)
        : [...prev, receiptId]
    )
  }

  const handleEditSession = () => {
    router.push(`/${locale}/${uuid}`)
  }

  // 创建新会话的处理函数
  const handleCreateNewBill = useCallback(async () => {
    if (isCreatingSession) return;
    
    setIsCreatingSession(true);
    
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
        // 重定向到新的UUID URL
        router.replace(`/${locale}/${result.uuid}`);
      } else {
        throw new Error('创建会话失败');
      }
    } catch (error) {
      console.error('创建新会话错误:', error);
    } finally {
      setIsCreatingSession(false);
    }
  }, [isCreatingSession, locale, router]);

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

  // Load exchange rate
  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        const rate = await getCachedExchangeRate();
        setExchangeRate(rate);
      } catch (error) {
        console.error('Failed to load exchange rate:', error);
        // Keep default fallback rate
      }
    };
    
    loadExchangeRate();
  }, []);

  useEffect(() => {
    if (!uuid) return

    // 验证UUID格式
    if (!isValidUUID(uuid)) {
      setError('无效的分享链接格式')
      setIsLoading(false)
      return
    }

    // 加载会话数据
    const loadPreviewData = async () => {
      try {
        const response = await fetch(`/api/session/${uuid}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('分享的账单不存在或已过期')
          } else {
            setError('加载分享内容失败')
          }
          return
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          setSessionData(result.data)
        } else {
          setError('分享的账单数据无效')
        }
      } catch (error) {
        console.error('加载预览数据错误:', error)
        setError('网络连接失败，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    }

    loadPreviewData()
  }, [uuid])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载分享内容...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-red-500 mb-4">
              <ExternalLink className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              无法加载分享内容
            </h2>
            <p className="text-gray-600 mb-6">
              {error || '分享的账单数据无效'}
            </p>
            <button
              onClick={handleCreateNewBill}
              disabled={isCreatingSession}
              className="btn btn-primary btn-md"
            >
              {isCreatingSession ? tCommon('loading') : tCommon('newBill')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 计算账单摘要
  const billSummary = dataProcessor.generateBillSummary(
    sessionData.receipts,
    sessionData.people
  )

  if (!billSummary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              账单数据不完整
            </h2>
            <p className="text-gray-600 mb-6">
              这个分享的账单缺少必要的信息
            </p>
            <button
              onClick={handleCreateNewBill}
              disabled={isCreatingSession}
              className="btn btn-primary btn-md"
            >
              {isCreatingSession ? tCommon('loading') : tCommon('newBill')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <LanguageSwitcher />
              <h1 className="text-xl font-semibold text-gray-900 hidden md:block md:ml-4">
                账单分摊预览
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleEditSession}
                className="btn btn-secondary btn-sm"
                title={tPreview('editBill')}
              >
                <Edit3 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{tPreview('editBill')}</span>
              </button>
              <button
                onClick={handleCreateNewBill}
                disabled={isCreatingSession}
                className="btn btn-primary btn-sm"
                title={tCommon('newBill')}
              >
                <Plus className={`h-4 w-4 md:mr-2 ${isCreatingSession ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{tCommon('newBill')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
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


      </div>
    </div>
  )
}