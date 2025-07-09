import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppState, Person, Receipt, RawReceiptData } from '../types';
import { dataProcessor } from '../lib/dataProcessor';

interface AppStore extends AppState {
  // Actions
  setPeople: (people: Person[]) => void;
  addPerson: (name: string) => void;
  removePerson: (personId: string) => void;
  
  addReceipt: (name?: string) => string;
  removeReceipt: (receiptId: string) => void;
  updateReceiptName: (receiptId: string, name: string) => void;

  processRawData: (receiptId: string, rawData: RawReceiptData) => void;
  updateTaxAndTip: (receiptId: string, tax: number, tip: number) => void;
  addItem: (receiptId: string, name: string, price: number) => void;
  removeItem: (receiptId: string, itemId: string) => void;
  updateItemAssignment: (itemId: string, assignedTo: string[]) => void;
  
  setCurrentStep: (step: AppState['currentStep']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getBillSummary: () => ReturnType<typeof dataProcessor.generateBillSummary> | null;
  
  // Reset
  reset: () => void;
}

// 颜色系列，选择一组视觉上区分度高且美观的颜色
// 使用 Pinterest 的 Gestalt 设计系统的12色分类调色板
const colorPalette = [
  '#0081FE', // 亮蓝
  '#11A69C', // 蓝绿
  '#FF5383', // 粉红
  '#D17711', // 橙色
  '#924AF7', // 紫色
  '#00AB55', // 绿色
  '#F2681F', // 亮橙
  '#DE2C62', // 洋红
  '#005062', // 深青
  '#400387', // 深紫
  '#660E00', // 深红
  '#003C96', // 深蓝
];

// 根据已有的人数，顺序分配颜色
const assignColor = (peopleCount: number) => {
  return colorPalette[peopleCount % colorPalette.length];
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      people: [],
      receipts: [],
      currentStep: 'setup',
      isLoading: false,
      error: null,

      // Actions
      setPeople: (people) => set({ people }),
      
      addPerson: (name) => {
        set(state => {
          const newPerson: Person = {
            id: `person_${Date.now()}`,
            name,
            color: assignColor(state.people.length)
          };
          return { people: [...state.people, newPerson] };
        });
      },
      
      removePerson: (personId) => {
        set(state => {
          const newReceipts = state.receipts.map(r => ({
            ...r,
            items: r.items.map(item => ({
              ...item,
              assignedTo: item.assignedTo.filter(id => id !== personId)
            }))
          }));
          return { people: state.people.filter(p => p.id !== personId), receipts: newReceipts };
        });
      },
      
      addReceipt: (name = '新收据') => {
        const newReceipt: Receipt = {
          id: `receipt_${Date.now()}`,
          name: `${name} ${get().receipts.length + 1}`,
          items: [],
          subtotal: 0,
          tax: 0,
          tip: 0,
          total: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set(state => ({
          receipts: [...state.receipts, newReceipt],
        }));
        return newReceipt.id;
      },

      removeReceipt: (receiptId) => {
        set(state => {
          const newReceipts = state.receipts.filter(r => r.id !== receiptId);
          return { receipts: newReceipts };
        });
      },

      updateReceiptName: (receiptId, name) => {
        set(state => ({
          receipts: state.receipts.map(r => 
            r.id === receiptId ? { ...r, name, updatedAt: new Date() } : r
          ),
        }));
      },
      
      processRawData: (receiptId, rawData) => {
        // Disabled for now as it depends on active receipt logic
      },
      
      updateTaxAndTip: (receiptId, tax, tip) => {
        const receipt = get().receipts.find(r => r.id === receiptId);
        if (!receipt) return;
        
        try {
          const updatedReceipt = dataProcessor.updateTaxAndTip(receipt, tax, tip);
          set(state => ({
            receipts: state.receipts.map(r => r.id === receiptId ? updatedReceipt : r),
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新税费失败' 
          });
        }
      },
      
      addItem: (receiptId, name, price) => {
        const receipt = get().receipts.find(r => r.id === receiptId);
        if (!receipt) return;
        
        try {
          const updatedReceipt = dataProcessor.addItem(receipt, name, price);
          set(state => ({
            receipts: state.receipts.map(r => r.id === receiptId ? updatedReceipt : r),
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '添加条目失败' 
          });
        }
      },
      
      removeItem: (receiptId, itemId) => {
        const receipt = get().receipts.find(r => r.id === receiptId);
        if (!receipt) return;
        
        try {
          const updatedReceipt = dataProcessor.removeItem(receipt, itemId);
          set(state => ({
            receipts: state.receipts.map(r => r.id === receiptId ? updatedReceipt : r),
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '删除条目失败' 
          });
        }
      },
      
      updateItemAssignment: (itemId, assignedTo) => {
        const allReceipts = get().receipts;
        let targetReceipt: Receipt | undefined;
        
        for (const receipt of allReceipts) {
          const found = receipt.items.find(item => item.id === itemId);
          if (found) {
            targetReceipt = receipt;
            break;
          }
        }

        if (!targetReceipt) return;
        
        try {
          const updatedReceipt = dataProcessor.updateItemAssignment(targetReceipt, itemId, assignedTo);
          set(state => ({
            receipts: state.receipts.map(r => r.id === targetReceipt!.id ? updatedReceipt : r),
          }));
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
        const { receipts, people } = get();

        if (receipts.length === 0 || people.length === 0) return null;
        
        try {
          return dataProcessor.generateBillSummary(receipts, people);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '生成账单汇总失败' 
          });
          return null;
        }
      },
      
      reset: () => set({
        people: [],
        receipts: [],
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