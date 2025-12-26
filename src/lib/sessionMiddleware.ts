import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { AppState } from '../types';

// 持久化中间件类型定义
type SessionPersist = {
  sessionId: string | null;
  isSessionLoaded: boolean;
  saveSession: () => Promise<boolean>;
  loadSession: (uuid: string) => Promise<boolean | { error: string; message: string }>;
  setSessionId: (uuid: string) => void;
  loadSessionData: (data: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'>) => void;
};

type SessionMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T & SessionPersist, Mps, Mcs>,
  name?: string
) => StateCreator<T & SessionPersist, Mps, Mcs>;

type SessionMiddlewareImpl = <T>(
  f: StateCreator<T & SessionPersist, [], [], T & SessionPersist>,
  name?: string
) => StateCreator<T & SessionPersist, [], [], T & SessionPersist>;

// 自动保存中间件实现
const sessionMiddlewareImpl: SessionMiddlewareImpl = (f, name) => (set, get, store) => {
  const sessionPersist: SessionPersist = {
    sessionId: null,
    isSessionLoaded: false,
    
    // 保存当前状态到服务器
    saveSession: async () => {
      const state = get();
      const sessionId = state.sessionId;
      
      if (!sessionId) {
        console.warn('No session ID available for saving');
        return false;
      }
      
      try {
        // 提取需要持久化的数据
        const persistData = {
          people: (state as any).people || [],
          receipts: (state as any).receipts || [],
          currentStep: (state as any).currentStep || 'setup'
        };
        
        const response = await fetch(`/api/session/${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: persistData }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save session');
        }
        
        const result = await response.json();
        return result.success;
      } catch (error) {
        console.error('Session save error:', error);
        return false;
      }
    },
    
    // 从服务器加载会话数据
    loadSession: async (uuid: string) => {
      try {
        const response = await fetch(`/api/session/${uuid}`);
        
        if (response.status === 404) {
          console.warn('Session not found:', uuid);
          return false;
        }
        
        // Handle service unavailable
        if (response.status === 503) {
          const result = await response.json();
          console.error('Service unavailable:', result.message);
          // Return a special error indicator for service down
          return { error: 'SERVICE_UNAVAILABLE', message: result.message };
        }
        
        if (!response.ok) {
          throw new Error('Failed to load session');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          // 使用 loadSessionData 来设置状态
          get().loadSessionData(result.data);
          get().setSessionId(uuid);
          
          // 标记会话已加载
          set({ isSessionLoaded: true } as any);
          
          console.log('Session loaded successfully:', uuid);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Session load error:', error);
        return false;
      }
    },
    
    // 设置会话ID
    setSessionId: (uuid: string) => {
      set({ sessionId: uuid } as any);
    },
    
    // 加载会话数据到store
    loadSessionData: (data: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'>) => {
      set({
        people: data.people || [],
        receipts: data.receipts || [],
        currentStep: data.currentStep || 'setup',
        isSessionLoaded: true,
      } as any);
    },
  };

  // 创建原始store
  const originalState = f(set, get, store);

  // 包装set函数以自动保存
  const wrappedSet: typeof set = (partial, replace) => {
    const result = set(partial, replace);
    
    // 异步保存（不阻塞UI）
    const state = get();
    if (state.sessionId && state.isSessionLoaded) {
      // 使用防抖延迟保存，避免频繁请求
      clearTimeout((state as any)._saveTimeout);
      (state as any)._saveTimeout = setTimeout(() => {
        state.saveSession().catch(console.error);
      }, 1000); // 1秒后保存
    }
    
    return result;
  };

  // 重新创建store使用包装后的set函数
  const enhancedState = f(wrappedSet, get, store);

  return {
    ...enhancedState,
    ...sessionPersist,
  };
};

export const sessionMiddleware = sessionMiddlewareImpl as SessionMiddleware;

export type { SessionPersist };