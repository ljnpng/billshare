import React, { useState } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { useAppStore } from '../store';

const SetupStep: React.FC = () => {
  const { people, addPerson, removePerson, setCurrentStep } = useAppStore();
  const [newPersonName, setNewPersonName] = useState('');

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setNewPersonName('');
    }
  };

  const handleNext = () => {
    if (people.length >= 2) {
      setCurrentStep('input');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">设置分摊人员</h2>
          <p className="text-sm text-gray-600">
            添加参与费用分摊的人员，至少需要2个人
          </p>
        </div>
        
        <div className="card-content">
          {/* 添加人员表单 */}
          <form onSubmit={handleAddPerson} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="输入人员姓名"
                className="input flex-1"
                maxLength={20}
              />
              <button
                type="submit"
                className="btn btn-primary btn-md"
                disabled={!newPersonName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加
              </button>
            </div>
          </form>

          {/* 人员列表 */}
          <div className="space-y-3">
            {people.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>还没有添加任何人员</p>
                <p className="text-sm">请添加至少2个人来开始分摊</p>
              </div>
            ) : (
              people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div 
                      className="person-color"
                      style={{ backgroundColor: person.color }}
                    />
                    <span className="font-medium">{person.name}</span>
                  </div>
                  <button
                    onClick={() => removePerson(person.id)}
                    className="btn btn-danger btn-sm"
                    disabled={people.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 提示信息 */}
          {people.length === 1 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                请再添加至少1个人来继续
              </p>
            </div>
          )}

          {/* 下一步按钮 */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleNext}
              className="btn btn-primary btn-lg"
              disabled={people.length < 2}
            >
              下一步：输入账单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupStep; 