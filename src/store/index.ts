import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppState, Person, Receipt } from '../types';
import { dataProcessor } from '../lib/dataProcessor';
import { recognizeReceipt } from '../lib/aiService';
import { storeLogger } from '../lib/logger';

interface AppStore extends AppState {
  // Actions
  setPeople: (people: Person[]) => void;
  addPerson: (name: string) => void;
  removePerson: (personId: string) => void;
  
  addReceipt: (name?: string) => string;
  removeReceipt: (receiptId: string) => void;
  updateReceiptName: (receiptId: string, name: string) => void;

  updateTaxAndTip: (receiptId: string, tax: number, tip: number) => void;
  addItem: (receiptId: string, name: string, price: number | null) => void;
  removeItem: (receiptId: string, itemId: string) => void;
  updateItemAssignment: (itemId: string, assignedTo: string[]) => void;
  
  // AI识别相关
  processReceiptImage: (receiptId: string, imageFile: File, locale?: string) => Promise<boolean>;
  setAiProcessing: (processing: boolean) => void;
  
  setCurrentStep: (step: AppState['currentStep']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getBillSummary: () => ReturnType<typeof dataProcessor.generateBillSummary> | null;
  
  // Reset
  reset: () => void;
}

// 使用现代化的颜色系统 - 更加柔和且富有活力
// 基于苹果设计系统的颜色理念，提供更好的视觉体验
const colorPalette = [
  '#007AFF', // 苹果蓝
  '#32D74B', // 苹果绿
  '#FF9F0A', // 苹果橙
  '#BF5AF2', // 苹果紫
  '#FF453A', // 苹果红
  '#64D2FF', // 苹果青
  '#FF2D92', // 苹果粉
  '#30D158', // 苹果薄荷绿
  '#5AC8FA', // 苹果天蓝
  '#FFCC00', // 苹果黄
  '#FF6B35', // 苹果珊瑚色
  '#A855F7', // 苹果薰衣草
  '#06B6D4', // 现代青色
  '#10B981', // 现代绿色
  '#F59E0B', // 现代琥珀色
  '#8B5CF6', // 现代紫色
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
      isAiProcessing: false,

      // Actions
      setPeople: (people) => set({ people }),
      
      addPerson: (name) => {
        set(state => {
          const newPerson: Person = {
            id: `person_${Date.now()}`,
            name,
            color: assignColor(state.people.length)
          };
          storeLogger.info('添加新人员', { 
            personId: newPerson.id, 
            name: newPerson.name,
            totalPeople: state.people.length + 1
          });
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
        storeLogger.info('添加新收据', { 
          receiptId: newReceipt.id, 
          name: newReceipt.name,
          totalReceipts: get().receipts.length + 1
        });
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

      // AI识别相关actions
      processReceiptImage: async (receiptId, imageFile, locale = 'zh') => {
        storeLogger.info('开始处理收据图片', { 
          receiptId, 
          fileName: imageFile.name,
          fileSize: imageFile.size,
          locale
        });
        
        set({ isAiProcessing: true, error: null });
        
        try {
          const result = await recognizeReceipt(imageFile, locale);
          
          if (!result.success || !result.data) {
            storeLogger.error('AI识别失败', { 
              receiptId, 
              error: result.error 
            });
            set({ 
              error: result.error || 'AI识别失败',
              isAiProcessing: false 
            });
            return false;
          }

          const aiData = result.data;
          const receipt = get().receipts.find(r => r.id === receiptId);
          if (!receipt) {
            storeLogger.error('未找到指定的收据', { receiptId });
            set({ 
              error: '未找到指定的收据',
              isAiProcessing: false 
            });
            return false;
          }

          storeLogger.info('AI识别成功', { 
            receiptId,
            businessName: aiData.businessName,
            itemCount: aiData.items.length,
            subtotal: aiData.subtotal,
            tax: aiData.tax,
            tip: aiData.tip,
            total: aiData.total,
            confidence: aiData.confidence
          });

          // 创建更新后的收据对象，包含AI识别的名称
          let updatedReceipt: Receipt = { 
            ...receipt, 
            items: [],
            name: aiData.businessName || receipt.name, // 使用AI识别的名称，如果没有则保持原名称
            updatedAt: new Date()
          };

          if (aiData.businessName) {
            storeLogger.info('收据名称已自动更新', { 
              receiptId,
              oldName: receipt.name,
              newName: aiData.businessName
            });
          } else {
            storeLogger.warn('AI未识别到商家名称，保持原名称', { 
              receiptId,
              currentName: receipt.name
            });
          }

          // 添加AI识别的items
          for (const item of aiData.items) {
            updatedReceipt = dataProcessor.addItem(updatedReceipt, item.name, item.price);
          }

          // 更新税费和小费
          const finalReceipt = dataProcessor.updateTaxAndTip(
            updatedReceipt,
            aiData.tax || 0,
            aiData.tip || 0
          );

          // 更新store中的receipt
          set(state => ({
            receipts: state.receipts.map(r => r.id === receiptId ? finalReceipt : r),
            isAiProcessing: false
          }));

          storeLogger.info('收据处理完成', { 
            receiptId,
            finalItemCount: finalReceipt.items.length,
            finalTotal: finalReceipt.total
          });

          return true;
        } catch (error) {
          storeLogger.error('AI识别处理异常', { 
            receiptId, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          set({ 
            error: error instanceof Error ? error.message : 'AI识别处理失败',
            isAiProcessing: false 
          });
          return false;
        }
      },

      setAiProcessing: (isAiProcessing) => set({ isAiProcessing }),
      
      setCurrentStep: (currentStep) => set({ currentStep }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => {
        if (error) {
          storeLogger.error('应用错误', { error });
        }
        set({ error });
      },
      
      getBillSummary: () => {
        const { receipts, people } = get();

        if (receipts.length === 0 || people.length === 0) {
          storeLogger.debug('无法生成账单汇总', { 
            receiptsCount: receipts.length,
            peopleCount: people.length
          });
          return null;
        }
        
        try {
          storeLogger.info('开始生成账单汇总', { 
            receiptsCount: receipts.length,
            peopleCount: people.length
          });
          const summary = dataProcessor.generateBillSummary(receipts, people);
          storeLogger.info('账单汇总生成成功', { 
            grandTotal: summary.grandTotal,
            personalBillsCount: summary.personalBills.length
          });
          return summary;
        } catch (error) {
          storeLogger.error('生成账单汇总失败', { 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
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
        error: null,
        isAiProcessing: false
      })
    }),
    {
      name: 'aapay-store'
    }
  )
); 