import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, User, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';

const SetupStep: React.FC = () => {
  const t = useTranslations('setupStep');
  const tCommon = useTranslations('common');
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
          <h2 className="card-title text-xl sm:text-2xl">{t('title')}</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {t('description')}
          </p>
        </div>
        
        <div className="card-content">
          {/* 添加人员表单 */}
          <form onSubmit={handleAddPerson} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder={t('addPersonPlaceholder')}
                className="input flex-1 text-base"
                maxLength={20}
              />
              <button
                type="submit"
                className="btn btn-primary btn-md whitespace-nowrap"
                disabled={!newPersonName.trim()}
                title={t('addButton')}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* 人员列表 */}
          <div className="space-y-3">
            {people.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <User className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">{t('noPeopleMessage')}</p>
                <p className="text-xs sm:text-sm">{t('noPeopleSubMessage')}</p>
              </div>
            ) : (
              people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <div 
                      className="person-color"
                      style={{ backgroundColor: person.color }}
                    />
                    <span className="font-medium text-sm sm:text-base truncate">{person.name}</span>
                  </div>
                  <button
                    onClick={() => removePerson(person.id)}
                    className="btn btn-ghost btn-sm ml-3 flex-shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                    disabled={people.length <= 1}
                    title={tCommon('delete')}
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
                {t('needMorePeopleMessage')}
              </p>
            </div>
          )}

          {/* 下一步按钮 */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleNext}
              className="btn btn-primary btn-lg"
              disabled={people.length < 2}
              title={t('nextButton')}
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupStep; 