import { createClient, RedisClientType } from 'redis';
import { AppState } from '../types';

export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_DATA = 'INVALID_DATA',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface DatabaseError {
  type: DatabaseErrorType;
  message: string;
  originalError?: Error;
}
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: DatabaseError;
}

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  healthCheck(): Promise<void>;
}

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string) {
    const entry = this.values.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.values.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number) {
    this.values.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async delete(key: string) {
    return this.values.delete(key);
  }
  async healthCheck() {}
}

// Next.js can load API route modules in separate bundles. Keep the in-memory
// adapter on the process global so those bundles share the same session map.
const globalForSplitBill = globalThis as typeof globalThis & {
  __splitbillMemoryStorage?: MemoryStorage;
};

class RedisStorage implements StorageAdapter {
  private client: RedisClientType | null = null;

  private async getClient() {
    if (!this.client) {
      const host = process.env.REDIS_HOST?.trim();
      const port = process.env.REDIS_PORT?.trim();
      const password = process.env.REDIS_PASSWORD?.trim();
      if (!host || !port || !password) throw new Error('Missing REDIS_HOST, REDIS_PORT or REDIS_PASSWORD');
      this.client = createClient({
        socket: { host, port: parseInt(port, 10) },
        password,
      });
      this.client.on('error', (error) => console.error('Redis connection error:', error));
    }
    if (!this.client.isOpen) await this.client.connect();
    return this.client;
  }

  async get(key: string) {
    return (await this.getClient()).get(key);
  }
  async set(key: string, value: string, ttlSeconds: number) {
    await (await this.getClient()).setEx(key, ttlSeconds, value);
  }
  async delete(key: string) {
    return (await (await this.getClient()).del(key)) > 0;
  }
  async healthCheck() {
    await (await this.getClient()).ping();
  }
}

class CloudflareKVStorage implements StorageAdapter {
  private getConfig() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID?.trim();
    const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
    if (!accountId || !namespaceId || !apiToken) {
      throw new Error('Missing CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_KV_NAMESPACE_ID or CLOUDFLARE_API_TOKEN');
    }
    return { accountId, namespaceId, apiToken };
  }

  private async request(key: string, init?: RequestInit, ttlSeconds?: number) {
    const { accountId, namespaceId, apiToken } = this.getConfig();
    const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces/${encodeURIComponent(namespaceId)}/values/${encodeURIComponent(key)}`;
    const url = ttlSeconds ? `${base}?expiration_ttl=${ttlSeconds}` : base;
    return fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        ...(init?.headers || {}),
      },
    });
  }

  async get(key: string) {
    const response = await this.request(key);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Cloudflare KV read failed with status ${response.status}`);
    return response.text();
  }

  async set(key: string, value: string, ttlSeconds: number) {
    const response = await this.request(key, { method: 'PUT', body: value }, ttlSeconds);
    if (!response.ok) throw new Error(`Cloudflare KV write failed with status ${response.status}`);
  }

  async delete(key: string) {
    const response = await this.request(key, { method: 'DELETE' });
    if (!response.ok && response.status !== 404) throw new Error(`Cloudflare KV delete failed with status ${response.status}`);
    return response.status !== 404;
  }

  async healthCheck() {
    const response = await this.request('__splitbill_healthcheck__');
    if (!response.ok && response.status !== 404) throw new Error(`Cloudflare KV health check failed with status ${response.status}`);
  }
}

function createStorage(): StorageAdapter {
  const provider = (process.env.STORAGE_PROVIDER || 'memory').trim().toLowerCase();
  if (provider === 'redis') return new RedisStorage();
  if (provider === 'cloudflare') return new CloudflareKVStorage();
  if (provider === 'memory') {
    globalForSplitBill.__splitbillMemoryStorage ??= new MemoryStorage();
    return globalForSplitBill.__splitbillMemoryStorage;
  }
  throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
}

export const storage = createStorage();

export async function isStorageHealthy(): Promise<DatabaseResult<boolean>> {
  try {
    await storage.healthCheck();
    return { success: true, data: true };
  } catch (error) {
    return failure('Storage health check failed', error);
  }
}

export interface SessionData {
  uuid: string;
  data: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'>;
  createdAt: Date;
  updatedAt: Date;
}

const SESSION_TTL = 30 * 24 * 60 * 60;

export class SessionService {
  private getSessionKey(uuid: string) {
    return `session:${uuid}`;
  }

  async getSession(uuid: string): Promise<DatabaseResult<SessionData>> {
    try {
      const raw = await storage.get(this.getSessionKey(uuid));
      if (!raw)
        return {
          success: false,
          error: {
            type: DatabaseErrorType.SESSION_NOT_FOUND,
            message: `Session not found: ${uuid}`,
          },
        };
      const parsed = JSON.parse(raw);
      return {
        success: true,
        data: {
          uuid,
          data: parsed.data,
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
        },
      };
    } catch (error) {
      return failure('Failed to get session', error, DatabaseErrorType.INVALID_DATA);
    }
  }

  async saveSession(uuid: string, data: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'>): Promise<DatabaseResult<boolean>> {
    try {
      const key = this.getSessionKey(uuid);
      const existing = await storage.get(key);
      const createdAt = existing ? JSON.parse(existing).createdAt : new Date().toISOString();
      await storage.set(
        key,
        JSON.stringify({
          data,
          createdAt,
          updatedAt: new Date().toISOString(),
        }),
        SESSION_TTL,
      );
      return { success: true, data: true };
    } catch (error) {
      return failure('Failed to save session', error);
    }
  }

  async deleteSession(uuid: string): Promise<DatabaseResult<boolean>> {
    try {
      return {
        success: true,
        data: await storage.delete(this.getSessionKey(uuid)),
      };
    } catch (error) {
      return failure('Failed to delete session', error);
    }
  }

  async cleanupOldSessions() {
    return 0;
  }
}

function failure<T>(operation: string, error: unknown, type = DatabaseErrorType.CONNECTION_ERROR): DatabaseResult<T> {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`${operation}:`, error);
  return {
    success: false,
    error: {
      type,
      message,
      originalError: error instanceof Error ? error : new Error(message),
    },
  };
}

export const sessionService = new SessionService();
