import React from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '../store';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const AssignStep: React.FC = () => {
  const t = useTranslations('assignStep');
  const tCommon = useTranslations('common');
  const { people, receipts, updateItemAssignment, setCurrentStep } = useAppStore();
  
  const allItems = receipts.flatMap(r => r.items);

  if (allItems.length === 0 || !people.length) {
    // 应该由 App.tsx 中的逻辑处理，这里做个兜底
    return <div>{tCommon('loading')}</div>;
  }

  const handlePersonToggle = (itemId: string, personId: string) => {
    const item = allItems.find(item => item.id === itemId);
    if (!item) return;

    const newAssignedTo = item.assignedTo.includes(personId)
      ? item.assignedTo.filter(id => id !== personId)
      : [...item.assignedTo, personId];
    
    updateItemAssignment(itemId, newAssignedTo);
  };

  const handleNext = () => {
    if (allItems.every(item => item.assignedTo.length > 0)) {
      setCurrentStep('summary');
    }
  };

  const handleBack = () => {
    setCurrentStep('input');
  };

  const getAssignedItemsCount = () => {
    return allItems.filter(item => item.assignedTo.length > 0).length;
  };

  const getPersonAssignmentInfo = (personId: string) => {
    let count = 0;
    let total = 0;
    
    allItems.forEach(item => {
      if (item.assignedTo.includes(personId)) {
        count++;
        total += item.finalPrice / item.assignedTo.length;
      }
    });
    
    return { count, total: Math.round(total * 100) / 100 };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="card-title">{t('title')}</h2>
          <p className="text-description">
            {t('description')}
          </p>
        </div>
        
        <div className="card-content">
          {/* 进度指示 */}
          <div className="mb-8 p-6 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-blue-600 mr-3" />
                <span className="text-base font-semibold text-blue-800">
                  {t('progressText', { assigned: getAssignedItemsCount(), total: allItems.length })}
                </span>
              </div>
              {getAssignedItemsCount() === allItems.length && (
                <span className="text-sm text-green-600 font-semibold bg-green-100 px-3 py-1 rounded border border-green-200">
                  {t('allAssigned')}
                </span>
              )}
            </div>
          </div>

          {/* 人员预览 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">{t('peoplePreview')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {people.map(person => {
                const info = getPersonAssignmentInfo(person.id);
                return (
                  <div key={person.id} className="p-4 bg-white rounded border border-gray-200 hover:border-gray-300 transition-all">
                    <div className="flex items-center mb-3">
                      <div 
                        className="person-color"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="font-semibold">{person.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('itemsCount', { count: info.count })} • <span className="font-semibold text-blue-600">${info.total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 条目分配列表 */}
          <div className="space-y-8">
            {receipts.map(receipt => (
              <div key={receipt.id}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{receipt.name}</h3>
                  <p className="text-subtitle mt-1">{t('itemsCount', { count: receipt.items.length })}</p>
                </div>
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {receipt.items.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{item.name}</h4>
                            <div className="text-sm text-gray-600">
                              {t('originalPrice')}: ${item.originalPrice?.toFixed(2) || 'N/A'}
                              {item.originalPrice && item.finalPrice > item.originalPrice && (
                                <span className="ml-2 text-blue-600">
                                  {t('includingTax')}: ${item.finalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="text-sm text-gray-600">
                              {item.assignedTo.length > 0 ? (
                                <span className="text-green-600 font-semibold">
                                  {t('assigned', { count: item.assignedTo.length })}
                                </span>
                              ) : (
                                <span className="text-red-600 font-semibold">
                                  {t('unassigned')}
                                </span>
                              )}
                            </div>
                            {item.assignedTo.length > 0 && (
                              <div className="text-sm font-medium">
                                {t('perPerson')}: ${(item.finalPrice / item.assignedTo.length).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 人员选择 */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-4" role="group" aria-label={t('selectPayersFor', { itemName: item.name })}>
                          {people.map(person => (
                            <button
                              key={person.id}
                              onClick={() => handlePersonToggle(item.id, person.id)}
                              className={`p-3 rounded border-2 flex items-center justify-center transition-all duration-200 ease-in-out ${
                                item.assignedTo.includes(person.id)
                                  ? 'border-blue-600 bg-blue-100 text-blue-800'
                                  : 'border-gray-300 bg-white hover:border-gray-400'
                              }`}
                              aria-pressed={item.assignedTo.includes(person.id)}
                              aria-label={t('togglePersonFor', { 
                                action: item.assignedTo.includes(person.id) ? t('unselect') : t('select'),
                                personName: person.name,
                                itemName: item.name 
                              })}
                            >
                              <div 
                                className="person-color-sm"
                                style={{ backgroundColor: person.color }}
                                aria-hidden="true"
                              />
                              <span className="text-sm font-semibold">{person.name}</span>
                              {item.assignedTo.includes(person.id) && (
                                <CheckCircle className="h-4 w-4 ml-2 flex-shrink-0 text-blue-600" aria-hidden="true" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between gap-3">
        <button
          onClick={handleBack}
          className="btn btn-secondary btn-md sm:btn-lg"
          title={tCommon('previous')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleNext}
          className="btn btn-primary btn-md sm:btn-lg"
          disabled={getAssignedItemsCount() !== allItems.length}
          title={t('nextButton')}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AssignStep; 