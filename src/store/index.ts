import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { AppState, Person, Receipt } from '../types';
import { dataProcessor } from '../lib/dataProcessor';
import { recognizeReceipt } from '../lib/aiService';
import { storeLogger } from '../lib/logger';
import { FALLBACK_RATE, getCachedExchangeRate } from '../lib/currencyService';
interface AppStore extends AppState {
  isDraftHydrated: boolean;

  exchangeRate: number;
  isLoadingExchangeRate: boolean;

  createShareSession: () => Promise<string | null>;
  hydrateDraft: () => void;
  loadSharedSession: (uuid: string) => Promise<boolean>;
  replaceDraft: (data: PersistedAppState) => void;

  loadExchangeRate: () => Promise<void>;
  setExchangeRate: (rate: number) => void;

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

  processReceiptImage: (receiptId: string, imageFile: File, locale?: string) => Promise<boolean>;
  setAiProcessing: (processing: boolean) => void;

  setCurrentStep: (step: AppState['currentStep']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  getBillSummary: () => ReturnType<typeof dataProcessor.generateBillSummary> | null;

  reset: () => void;
}

const colorPalette = [
  '#007AFF',
  '#32D74B',
  '#FF9F0A',
  '#BF5AF2',
  '#FF453A',
  '#64D2FF',
  '#FF2D92',
  '#30D158',
  '#5AC8FA',
  '#FFCC00',
  '#FF6B35',
  '#A855F7',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
];

const assignColor = (peopleCount: number) => {
  return colorPalette[peopleCount % colorPalette.length];
};

type PersistedAppState = Pick<AppState, 'people' | 'receipts' | 'currentStep'>;
type StoredDraft = { version: 1; state: PersistedAppState };

const DRAFT_STORAGE_KEY = 'splitbill:draft:v1';
const LEGACY_DRAFT_STORAGE_KEY = 'billshare:draft:v1';

const browserStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch (error) {
      storeLogger.warn('浏览器草稿保存失败', { error });
    }
  },
};

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      people: [],
      receipts: [],
      currentStep: 'input',
      isLoading: false,
      error: null,
      isAiProcessing: false,
      isDraftHydrated: false,

      exchangeRate: FALLBACK_RATE,
      isLoadingExchangeRate: false,

      createShareSession: async () => {
        const state = get();

        try {
          const persistData = {
            people: state.people || [],
            receipts: state.receipts || [],
            currentStep: state.currentStep || 'input',
          };

          const response = await fetch('/api/session/new', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: persistData }),
          });

          if (!response.ok) {
            throw new Error('Failed to create shared snapshot');
          }

          const result = await response.json();
          return result.success && result.uuid ? result.uuid : null;
        } catch (error) {
          console.error('Shared snapshot creation error:', error);
          return null;
        }
      },

      hydrateDraft: () => {
        if (get().isDraftHydrated) return;

        try {
          const rawDraft = browserStorage.getItem(DRAFT_STORAGE_KEY) ?? browserStorage.getItem(LEGACY_DRAFT_STORAGE_KEY);
          if (rawDraft) {
            const storedDraft = JSON.parse(rawDraft) as StoredDraft;
            if (storedDraft.version === 1 && storedDraft.state) {
              set({
                people: storedDraft.state.people || [],
                receipts: storedDraft.state.receipts || [],
                currentStep: storedDraft.state.currentStep || 'input',
                isDraftHydrated: true,
              });
              // Migrate drafts saved under the previous app branding.
              if (!browserStorage.getItem(DRAFT_STORAGE_KEY)) {
                browserStorage.setItem(DRAFT_STORAGE_KEY, rawDraft);
              }
              return;
            }
          }
        } catch (error) {
          storeLogger.warn('浏览器草稿加载失败', { error });
        }

        set({ isDraftHydrated: true });
      },

      loadSharedSession: async (uuid: string) => {
        try {
          const response = await fetch(`/api/session/${uuid}`);

          if (response.status === 404) {
            console.warn('Session not found:', uuid);
            return false;
          }

          if (!response.ok) {
            throw new Error('Failed to load session');
          }

          const result = await response.json();

          if (result.success && result.data) {
            get().replaceDraft(result.data);

            console.log('Shared snapshot loaded successfully:', uuid);
            return true;
          }

          return false;
        } catch (error) {
          console.error('Session load error:', error);
          return false;
        }
      },

      replaceDraft: (data: PersistedAppState) => {
        set({
          people: data.people || [],
          receipts: data.receipts || [],
          currentStep: data.currentStep || 'input',
          error: null,
          isLoading: false,
          isAiProcessing: false,
          isDraftHydrated: true,
        });
      },

      loadExchangeRate: async () => {
        set({ isLoadingExchangeRate: true });
        try {
          const rate = await getCachedExchangeRate();
          set({ exchangeRate: rate, isLoadingExchangeRate: false });
          storeLogger.info('汇率加载成功', { rate });
        } catch (error) {
          storeLogger.error('汇率加载失败', { error });
          set({ isLoadingExchangeRate: false });
        }
      },

      setExchangeRate: (rate: number) => {
        set({ exchangeRate: rate });
        storeLogger.info('汇率已更新', { rate });
      },

      setPeople: (people) => set({ people }),

      addPerson: (name) => {
        set((state) => {
          const newPerson: Person = {
            id: `person_${Date.now()}`,
            name,
            color: assignColor(state.people.length),
          };
          storeLogger.info('添加新人员', {
            personId: newPerson.id,
            name: newPerson.name,
            totalPeople: state.people.length + 1,
          });
          return { people: [...state.people, newPerson] };
        });
      },

      removePerson: (personId) => {
        set((state) => {
          const newReceipts = state.receipts.map((r) => ({
            ...r,
            items: r.items.map((item) => ({
              ...item,
              assignedTo: item.assignedTo.filter((id) => id !== personId),
            })),
          }));
          return {
            people: state.people.filter((p) => p.id !== personId),
            receipts: newReceipts,
          };
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
          totalReceipts: get().receipts.length + 1,
        });
        set((state) => ({
          receipts: [...state.receipts, newReceipt],
        }));
        return newReceipt.id;
      },

      removeReceipt: (receiptId) => {
        set((state) => {
          const newReceipts = state.receipts.filter((r) => r.id !== receiptId);
          return { receipts: newReceipts };
        });
      },

      updateReceiptName: (receiptId, name) => {
        set((state) => ({
          receipts: state.receipts.map((r) => (r.id === receiptId ? { ...r, name, updatedAt: new Date() } : r)),
        }));
      },

      updateTaxAndTip: (receiptId, tax, tip) => {
        const receipt = get().receipts.find((r) => r.id === receiptId);
        if (!receipt) return;

        try {
          const updatedReceipt = dataProcessor.updateTaxAndTip(receipt, tax, tip);
          set((state) => ({
            receipts: state.receipts.map((r) => (r.id === receiptId ? updatedReceipt : r)),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '更新税费失败',
          });
        }
      },

      addItem: (receiptId, name, price) => {
        const receipt = get().receipts.find((r) => r.id === receiptId);
        if (!receipt) return;

        try {
          const updatedReceipt = dataProcessor.addItem(receipt, name, price);
          set((state) => ({
            receipts: state.receipts.map((r) => (r.id === receiptId ? updatedReceipt : r)),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '添加条目失败',
          });
        }
      },

      removeItem: (receiptId, itemId) => {
        const receipt = get().receipts.find((r) => r.id === receiptId);
        if (!receipt) return;

        try {
          const updatedReceipt = dataProcessor.removeItem(receipt, itemId);
          set((state) => ({
            receipts: state.receipts.map((r) => (r.id === receiptId ? updatedReceipt : r)),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '删除条目失败',
          });
        }
      },

      updateItemAssignment: (itemId, assignedTo) => {
        const allReceipts = get().receipts;
        let targetReceipt: Receipt | undefined;

        for (const receipt of allReceipts) {
          const found = receipt.items.find((item) => item.id === itemId);
          if (found) {
            targetReceipt = receipt;
            break;
          }
        }

        if (!targetReceipt) return;

        try {
          const updatedReceipt = dataProcessor.updateItemAssignment(targetReceipt, itemId, assignedTo);
          set((state) => ({
            receipts: state.receipts.map((r) => (r.id === targetReceipt!.id ? updatedReceipt : r)),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '更新分配失败',
          });
        }
      },

      processReceiptImage: async (receiptId, imageFile, locale = 'zh') => {
        storeLogger.info('开始处理收据图片', {
          receiptId,
          fileName: imageFile.name,
          fileSize: imageFile.size,
          locale,
        });

        set({ isAiProcessing: true, error: null });

        try {
          const result = await recognizeReceipt(imageFile, locale);

          if (!result.success || !result.data) {
            storeLogger.error('AI识别失败', {
              receiptId,
              error: result.error,
            });
            set({
              error: result.error || 'AI识别失败',
              isAiProcessing: false,
            });
            return false;
          }

          const aiData = result.data;

          let receipt: Receipt;
          let isNewReceipt = false;

          if (!receiptId) {
            const newReceiptId = get().addReceipt(aiData.businessName || '新收据');
            receipt = get().receipts.find((r) => r.id === newReceiptId)!;
            isNewReceipt = true;
            storeLogger.info('AI识别成功，创建新收据', {
              newReceiptId,
              businessName: aiData.businessName,
            });
          } else {
            const foundReceipt = get().receipts.find((r) => r.id === receiptId);
            if (!foundReceipt) {
              storeLogger.error('未找到指定的收据', { receiptId });
              set({
                error: '未找到指定的收据',
                isAiProcessing: false,
              });
              return false;
            }
            receipt = foundReceipt;
          }

          storeLogger.info('AI识别成功', {
            receiptId: receipt.id,
            businessName: aiData.businessName,
            itemCount: aiData.items.length,
            subtotal: aiData.subtotal,
            tax: aiData.tax,
            tip: aiData.tip,
            total: aiData.total,
            confidence: aiData.confidence,
            isNewReceipt,
          });

          let updatedReceipt: Receipt = {
            ...receipt,
            items: [],
            name: aiData.businessName || receipt.name, // 使用AI识别的名称，如果没有则保持原名称
            updatedAt: new Date(),
          };

          if (aiData.businessName && !isNewReceipt) {
            storeLogger.info('收据名称已自动更新', {
              receiptId: receipt.id,
              oldName: receipt.name,
              newName: aiData.businessName,
            });
          } else if (!aiData.businessName && !isNewReceipt) {
            storeLogger.warn('AI未识别到商家名称，保持原名称', {
              receiptId: receipt.id,
              currentName: receipt.name,
            });
          }

          for (const item of aiData.items) {
            updatedReceipt = dataProcessor.addItem(updatedReceipt, item.name, item.price);
          }

          const finalReceipt = dataProcessor.updateTaxAndTip(updatedReceipt, aiData.tax || 0, aiData.tip || 0);

          set((state) => ({
            receipts: state.receipts.map((r) => (r.id === receipt.id ? finalReceipt : r)),
            isAiProcessing: false,
          }));

          storeLogger.info('收据处理完成', {
            receiptId: receipt.id,
            finalItemCount: finalReceipt.items.length,
            finalTotal: finalReceipt.total,
            isNewReceipt,
          });

          return true;
        } catch (error) {
          storeLogger.error('AI识别处理异常', {
            receiptId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          if (!receiptId && error instanceof Error) {
            const receipts = get().receipts;
            const lastReceipt = receipts[receipts.length - 1];
            if (lastReceipt && lastReceipt.items.length === 0) {
              get().removeReceipt(lastReceipt.id);
              storeLogger.info('移除失败创建的空收据', {
                removedReceiptId: lastReceipt.id,
                receiptName: lastReceipt.name,
              });
            }
          }

          set({
            error: error instanceof Error ? error.message : 'AI识别处理失败',
            isAiProcessing: false,
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
            peopleCount: people.length,
          });
          return null;
        }

        try {
          storeLogger.info('开始生成账单汇总', {
            receiptsCount: receipts.length,
            peopleCount: people.length,
          });
          const summary = dataProcessor.generateBillSummary(receipts, people);
          storeLogger.info('账单汇总生成成功', {
            grandTotal: summary.grandTotal,
            personalBillsCount: summary.personalBills.length,
          });
          return summary;
        } catch (error) {
          storeLogger.error('生成账单汇总失败', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          set({
            error: error instanceof Error ? error.message : '生成账单汇总失败',
          });
          return null;
        }
      },

      reset: () =>
        set({
          people: [],
          receipts: [],
          currentStep: 'input',
          isLoading: false,
          error: null,
          isAiProcessing: false,
          isDraftHydrated: true,
          exchangeRate: FALLBACK_RATE,
          isLoadingExchangeRate: false,
        }),
    })),
    {
      name: 'splitbill-store',
    },
  ),
);

useAppStore.subscribe(
  (state) => ({
    people: state.people,
    receipts: state.receipts,
    currentStep: state.currentStep,
  }),
  (draft) => {
    const storedDraft: StoredDraft = { version: 1, state: draft };
    browserStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(storedDraft));
  },
  {
    equalityFn: (current, previous) => current.people === previous.people && current.receipts === previous.receipts && current.currentStep === previous.currentStep,
  },
);
