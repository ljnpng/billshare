'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, Receipt } from 'lucide-react'
import { AppState } from '../../../../types'
import { dataProcessor } from '../../../../lib/dataProcessor'
import { getCachedExchangeRate, convertUsdToCny } from '../../../../lib/currencyService'
import { useAppStore } from '../../../../store'

interface PreviewPageProps {}

export default function PreviewPage({}: PreviewPageProps) {
  const t = useTranslations('summaryStep')
  const tCommon = useTranslations('common')
  const tPreview = useTranslations('preview')
  const tInput = useTranslations('inputStep')
  const tAssign = useTranslations('assignStep')
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<AppState | null>(null)
  const [expandedReceipts, setExpandedReceipts] = useState<string[]>([])
  const [exchangeRate, setExchangeRate] = useState(7.2) // Default fallback rate
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const replaceDraft = useAppStore(state => state.replaceDraft)
  const reset = useAppStore(state => state.reset)
  const addReceipt = useAppStore(state => state.addReceipt)
  const processReceiptImage = useAppStore(state => state.processReceiptImage)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
    router.push('/')
  }

  const handleCreateNewBill = useCallback(() => {
    if (isCreatingSession) return;

    setIsCreatingSession(true);

    reset();
    router.replace('/');
    setIsCreatingSession(false);
  }, [isCreatingSession, reset, router]);

  const handleReceiptSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processReceiptImage('', file, locale)
    router.replace('/')
    event.target.value = ''
  }

  const handleManualInput = () => {
    addReceipt(tCommon('receipt'))
    router.replace('/')
  }

  const renderEmptyState = (title: string, description: string) => (
    <div className="min-h-screen bg-luxury-rich">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-6">
        <main className="animation-fade-in text-center py-16 sm:py-24">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleReceiptSelected}
            className="sr-only"
            aria-label={tInput('uploadReceipt')}
          />
          <Receipt className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-6 sm:mb-8 text-gray-300" aria-hidden="true" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">{title}</h2>
          <p className="text-gray-500 text-sm sm:text-base px-4 max-w-md mx-auto mb-6">{description}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary min-h-[3.25rem] w-56 px-6 text-lg shadow-sm hover:shadow-md whitespace-nowrap"
          >
            {tInput('aiRecognition')}
          </button>
          <button
            onClick={handleManualInput}
            className="block mx-auto mt-4 text-gray-500 hover:text-gray-700 text-sm underline transition-colors whitespace-nowrap"
          >
            {tInput('orManualInput')}
          </button>
        </main>
      </div>
    </div>
  )

  // Currency display component
  const CurrencyDisplay = ({ usdAmount }: { usdAmount: number }) => {
    const cnyAmount = convertUsdToCny(usdAmount, exchangeRate);
    return (
      <div className="text-right shrink-0 whitespace-nowrap">
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
    if (!uuid) {
      setError(tPreview('invalidLink'))
      setIsLoading(false)
      return
    }

    // 验证UUID格式
    if (!isValidUUID(uuid)) {
      setError(tPreview('invalidLink'))
      setIsLoading(false)
      return
    }

    // 加载会话数据
    const loadPreviewData = async () => {
      try {
        const response = await fetch(`/api/session/${uuid}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(tPreview('notFound'))
          } else {
            setError(tPreview('loadFailed'))
          }
          return
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          setSessionData(result.data)
          replaceDraft(result.data)
        } else {
          setError(tPreview('invalidData'))
        }
      } catch (error) {
        console.error('加载预览数据错误:', error)
        setError(tPreview('networkError'))
      } finally {
        setIsLoading(false)
      }
    }

    loadPreviewData()
  }, [replaceDraft, tPreview, uuid])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-luxury-rich">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-6">
          <main className="animation-fade-in text-center py-16 sm:py-24">
            <div
              className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-700 mx-auto mb-4"
              aria-hidden="true"
            />
            <p className="text-gray-500 text-sm sm:text-base px-4">{tPreview('loading')}</p>
          </main>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return renderEmptyState(tPreview('cannotLoad'), error || tPreview('invalidData'))
  }

  // 计算账单摘要
  const billSummary = dataProcessor.generateBillSummary(
    sessionData.receipts,
    sessionData.people
  )

  if (!billSummary) {
    return renderEmptyState(tPreview('incompleteData'), tPreview('missingInfo'))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900 min-w-0 balance-text">
              {tPreview('title')}
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleEditSession}
                className="btn btn-secondary btn-sm"
                title={tPreview('editBill')}
              >
                {tPreview('editBill')}
              </button>
              <button
                onClick={handleCreateNewBill}
                disabled={isCreatingSession}
                className="btn btn-primary btn-sm"
                title={tCommon('newBill')}
              >
                {isCreatingSession ? tCommon('loading') : tCommon('newBill')}
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
              <div className="p-4 bg-gray-50 rounded-lg">
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
                                  <span className="font-medium min-w-0 break-words">{receipt.name}</span>
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
                                                      <span className="text-gray-600 min-w-0 break-words">{item.name}</span>
                                                      <CurrencyDisplay usdAmount={item.finalPrice} />
                                                  </div>
                                                  {/* 显示分配的人员 */}
                                                  <div className="flex flex-wrap gap-1">
                                                      {item.assignedTo.map(personId => {
                                                          const person = billSummary.people.find(p => p.id === personId);
                                                          return person ? (
                                                              <div 
                                                                  key={personId}
                                                                  className="flex items-center gap-1 px-2 py-1 bg-white rounded text-xs border"
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
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm break-words">{item.itemName}</div>
                              <div className="text-xs text-gray-600">
                                {item.share > 1 ? tAssign('sharedWith', { count: item.share - 1 }) : tAssign('exclusive')}
                              </div>
                            </div>
                            <div className="text-right shrink-0 whitespace-nowrap">
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
