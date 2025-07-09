import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppState, Person, Receipt, RawReceiptData } from '../types';
import { dataProcessor } from '../lib/dataProcessor';

interface AppStore extends AppState {
  // Actions
  setPeople: (people: Person[]) => void;
  addPerson: (name: string) => void;
  removePerson: (personId: string) => void;
  
  setReceipt: (receipt: Receipt) => void;
  processRawData: (rawData: RawReceiptData) => void;
  updateTaxAndTip: (tax: number, tip: number) => void;
  addItem: (name: string, price: number) => void;
  removeItem: (itemId: string) => void;
  updateItemAssignment: (itemId: string, assignedTo: string[]) => void;
  
  setCurrentStep: (step: AppState['currentStep']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getBillSummary: () => ReturnType<typeof dataProcessor.generateBillSummary> | null;
  
  // Reset
  reset: () => void;
}

// 生成随机颜色
const generateRandomColor = () => {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', 
    '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      people: [],
      receipt: null,
      currentStep: 'setup',
      isLoading: false,
      error: null,

      // Actions
      setPeople: (people) => set({ people }),
      
      addPerson: (name) => {
        const newPerson: Person = {
          id: `person_${Date.now()}`,
          name,
          color: generateRandomColor()
        };
        set(state => ({ 
          people: [...state.people, newPerson] 
        }));
      },
      
      removePerson: (personId) => {
        set(state => ({
          people: state.people.filter(p => p.id !== personId),
          receipt: state.receipt ? {
            ...state.receipt,
            items: state.receipt.items.map(item => ({
              ...item,
              assignedTo: item.assignedTo.filter(id => id !== personId)
            }))
          } : null
        }));
      },
      
      setReceipt: (receipt) => set({ receipt }),
      
      processRawData: (rawData) => {
        try {
          set({ isLoading: true, error: null });
          const receipt = dataProcessor.processRawData(rawData);
          
          if (!dataProcessor.validateData(receipt)) {
            throw new Error('数据验证失败');
          }
          
          set({ receipt, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '数据处理失败',
            isLoading: false 
          });
        }
      },
      
      updateTaxAndTip: (tax, tip) => {
        const { receipt } = get();
        if (!receipt) return;
        
        try {
          const updatedReceipt = dataProcessor.updateTaxAndTip(receipt, tax, tip);
          set({ receipt: updatedReceipt });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新税费失败' 
          });
        }
      },
      
      addItem: (name, price) => {
        const { receipt } = get();
        if (!receipt) return;
        
        try {
          const updatedReceipt = dataProcessor.addItem(receipt, name, price);
          set({ receipt: updatedReceipt });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '添加条目失败' 
          });
        }
      },
      
      removeItem: (itemId) => {
        const { receipt } = get();
        if (!receipt) return;
        
        try {
          const updatedReceipt = dataProcessor.removeItem(receipt, itemId);
          set({ receipt: updatedReceipt });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '删除条目失败' 
          });
        }
      },
      
      updateItemAssignment: (itemId, assignedTo) => {
        const { receipt } = get();
        if (!receipt) return;
        
        try {
          const updatedReceipt = dataProcessor.updateItemAssignment(receipt, itemId, assignedTo);
          set({ receipt: updatedReceipt });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新分配失败' 
          });
        }
      },
      
      setCurrentStep: (currentStep) => set({ currentStep }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      getBillSummary: () => {
        const { receipt, people } = get();
        if (!receipt || people.length === 0) return null;
        
        try {
          return dataProcessor.generateBillSummary(receipt, people);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '生成账单汇总失败' 
          });
          return null;
        }
      },
      
      reset: () => set({
        people: [],
        receipt: null,
        currentStep: 'setup',
        isLoading: false,
        error: null
      })
    }),
    {
      name: 'aapay-store'
    }
  )
); 