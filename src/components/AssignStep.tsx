import React from 'react';
import { useAppStore } from '../store';
import { UserCheck, Users, CheckCircle, ArrowRight } from 'lucide-react';

const AssignStep: React.FC = () => {
  const { people, receipts, updateItemAssignment, setCurrentStep } = useAppStore();
  
  const allItems = receipts.flatMap(r => r.items);

  if (allItems.length === 0 || !people.length) {
    // 应该由 App.tsx 中的逻辑处理，这里做个兜底
    return <div>加载中...</div>;
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
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">分配条目</h2>
          <p className="text-sm text-gray-600">
            为每个条目选择付费的人员。每个条目可以由多人分摊。
          </p>
        </div>
        
        <div className="card-content">
          {/* 进度指示 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  已分配 {getAssignedItemsCount()} / {allItems.length} 个条目
                </span>
              </div>
              {getAssignedItemsCount() === allItems.length && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ 所有条目已分配
                </span>
              )}
            </div>
          </div>

          {/* 人员预览 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">人员预览</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {people.map(person => {
                const info = getPersonAssignmentInfo(person.id);
                return (
                  <div key={person.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div 
                        className="person-color"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="font-medium">{person.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {info.count} 个条目 • ${info.total.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 条目分配列表 */}
          <div className="space-y-4">
            {allItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{item.name}</h4>
                    <div className="text-sm text-gray-600">
                      原价: ${item.originalPrice.toFixed(2)}
                      {item.finalPrice > item.originalPrice && (
                        <span className="ml-2 text-blue-600">
                          含税费: ${item.finalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {item.assignedTo.length > 0 ? (
                        <span className="text-green-600">
                          已分配给 {item.assignedTo.length} 人
                        </span>
                      ) : (
                        <span className="text-red-600">
                          未分配
                        </span>
                      )}
                    </div>
                    {item.assignedTo.length > 0 && (
                      <div className="text-sm font-medium">
                        每人: ${(item.finalPrice / item.assignedTo.length).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 人员选择 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {people.map(person => (
                    <button
                      key={person.id}
                      onClick={() => handlePersonToggle(item.id, person.id)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        item.assignedTo.includes(person.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div 
                          className="person-color"
                          style={{ backgroundColor: person.color }}
                        />
                        <span className="text-sm font-medium">{person.name}</span>
                        {item.assignedTo.includes(person.id) && (
                          <CheckCircle className="h-4 w-4 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="btn btn-secondary btn-lg"
        >
          上一步
        </button>
        <button
          onClick={handleNext}
          className="btn btn-primary btn-lg"
          disabled={getAssignedItemsCount() !== allItems.length}
        >
          下一步：费用汇总
        </button>
      </div>
    </div>
  );
};

export default AssignStep; 