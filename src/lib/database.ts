import { Redis } from '@upstash/redis';
import { AppState } from '../types';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      throw new Error(
        'Missing Upstash Redis configuration. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      );
    }
    
    redis = new Redis({
      url,
      token,
    });
  }
  
  return redis;
}

export interface SessionData {
  uuid: string;
  data: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'>; // 排除临时UI状态
  createdAt: Date;
  updatedAt: Date;
}

export class SessionService {
  private redis: Redis;
  private readonly SESSION_TTL = 30 * 24 * 60 * 60; // 30天，秒为单位
  
  constructor() {
    this.redis = getRedis();
  }
  
  private getSessionKey(uuid: string): string {
    return `session:${uuid}`;
  }
  
  async getSession(uuid: string): Promise<SessionData | null> {
    try {
      const sessionKey = this.getSessionKey(uuid);
      const sessionData = await this.redis.get(sessionKey);
      
      if (!sessionData) {
        return null;
      }
      
      // Redis 可能返回对象或字符串，统一处理
      const parsed = typeof sessionData === 'string' 
        ? JSON.parse(sessionData) 
        : sessionData;
        
      return {
        uuid,
        data: parsed.data,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt)
      };
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }
  
  async saveSession(uuid: string, data: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'>): Promise<boolean> {
    try {
      const sessionKey = this.getSessionKey(uuid);
      const now = new Date();
      
      // 检查是否是新会话
      const existingSession = await this.redis.get(sessionKey);
      const createdAt = existingSession 
        ? (typeof existingSession === 'string' 
            ? JSON.parse(existingSession).createdAt 
            : (existingSession as any).createdAt)
        : now.toISOString();
      
      const sessionData = {
        data,
        createdAt,
        updatedAt: now.toISOString()
      };
      
      // 设置数据并自动过期
      await this.redis.setex(sessionKey, this.SESSION_TTL, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }
  
  async deleteSession(uuid: string): Promise<boolean> {
    try {
      const sessionKey = this.getSessionKey(uuid);
      const result = await this.redis.del(sessionKey);
      return result > 0;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }
  
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    // Redis 自动处理过期，无需手动清理
    // 此方法保留兼容性，但实际上不执行任何操作
    console.log(`Redis automatically handles session expiration after ${daysOld} days`);
    return 0;
  }
}

// 单例实例
export const sessionService = new SessionService();