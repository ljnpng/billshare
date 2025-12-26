import { createClient, RedisClientType } from 'redis';
import { AppState } from "../types";

// Error types for better error handling
export enum DatabaseErrorType {
  CONNECTION_ERROR = "CONNECTION_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INVALID_DATA = "INVALID_DATA",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
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

let redis: RedisClientType | null = null;

export function getRedis(): RedisClientType {
  if (!redis) {
    const host = process.env.REDIS_HOST?.trim();
    const port = process.env.REDIS_PORT?.trim();
    const password = process.env.REDIS_PASSWORD?.trim();

    if (!host || !port || !password) {
      throw new Error(
        "Missing Redis configuration. Please set REDIS_HOST, REDIS_PORT and REDIS_PASSWORD environment variables.",
      );
    }

    redis = createClient({
      socket: {
        host,
        port: parseInt(port),
      },
      password,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  return redis;
}

// Redis health check function
export async function isRedisHealthy(): Promise<DatabaseResult<boolean>> {
  try {
    const redis = getRedis();
    // Connect if not already connected
    if (!redis.isOpen) {
      await redis.connect();
    }
    // Simple ping test to check connectivity
    await redis.ping();
    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error("Redis health check failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Classify error types
    let errorType = DatabaseErrorType.UNKNOWN_ERROR;
    if (
      errorMessage.includes("fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("connection")
    ) {
      errorType = DatabaseErrorType.CONNECTION_ERROR;
    } else if (
      errorMessage.includes("service") ||
      errorMessage.includes("unavailable")
    ) {
      errorType = DatabaseErrorType.SERVICE_UNAVAILABLE;
    }

    return {
      success: false,
      error: {
        type: errorType,
        message: errorMessage,
        originalError: error instanceof Error ? error : new Error(errorMessage),
      },
    };
  }
}

export interface SessionData {
  uuid: string;
  data: Omit<AppState, "isLoading" | "error" | "isAiProcessing">; // 排除临时UI状态
  createdAt: Date;
  updatedAt: Date;
}

export class SessionService {
  private redis: RedisClientType | null = null;
  private readonly SESSION_TTL = 30 * 24 * 60 * 60; // 30天，秒为单位

  constructor() {}

  private async getRedisClient(): Promise<RedisClientType> {
    if (!this.redis) {
      this.redis = getRedis();
    }
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
    return this.redis;
  }

  private getSessionKey(uuid: string): string {
    return `session:${uuid}`;
  }

  async getSession(uuid: string): Promise<DatabaseResult<SessionData>> {
    try {
      const redis = await this.getRedisClient();
      const sessionKey = this.getSessionKey(uuid);
      const sessionData = await redis.get(sessionKey);

      if (!sessionData) {
        return {
          success: false,
          error: {
            type: DatabaseErrorType.SESSION_NOT_FOUND,
            message: `Session not found: ${uuid}`,
          },
        };
      }

      // Redis 可能返回对象或字符串，统一处理
      const parsed =
        typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData;

      const result = {
        uuid,
        data: parsed.data,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Failed to get session:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Classify error type
      let errorType = DatabaseErrorType.UNKNOWN_ERROR;
      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("connection")
      ) {
        errorType = DatabaseErrorType.CONNECTION_ERROR;
      } else if (errorMessage.includes("JSON")) {
        errorType = DatabaseErrorType.INVALID_DATA;
      }

      return {
        success: false,
        error: {
          type: errorType,
          message: errorMessage,
          originalError:
            error instanceof Error ? error : new Error(errorMessage),
        },
      };
    }
  }

  async saveSession(
    uuid: string,
    data: Omit<AppState, "isLoading" | "error" | "isAiProcessing">,
  ): Promise<DatabaseResult<boolean>> {
    try {
      const redis = await this.getRedisClient();
      const sessionKey = this.getSessionKey(uuid);
      const now = new Date();

      // 检查是否是新会话
      const existingSession = await redis.get(sessionKey);
      const createdAt = existingSession
        ? typeof existingSession === "string"
          ? JSON.parse(existingSession).createdAt
          : (existingSession as any).createdAt
        : now.toISOString();

      const sessionData = {
        data,
        createdAt,
        updatedAt: now.toISOString(),
      };

      // 设置数据并自动过期
      await redis.setEx(
        sessionKey,
        this.SESSION_TTL,
        JSON.stringify(sessionData),
      );

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error("Failed to save session:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Classify error type
      let errorType = DatabaseErrorType.UNKNOWN_ERROR;
      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("connection")
      ) {
        errorType = DatabaseErrorType.CONNECTION_ERROR;
      }

      return {
        success: false,
        error: {
          type: errorType,
          message: errorMessage,
          originalError:
            error instanceof Error ? error : new Error(errorMessage),
        },
      };
    }
  }

  async deleteSession(uuid: string): Promise<DatabaseResult<boolean>> {
    try {
      const redis = await this.getRedisClient();
      const sessionKey = this.getSessionKey(uuid);
      const result = await redis.del(sessionKey);

      return {
        success: true,
        data: result > 0,
      };
    } catch (error) {
      console.error("Failed to delete session:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Classify error type
      let errorType = DatabaseErrorType.UNKNOWN_ERROR;
      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("connection")
      ) {
        errorType = DatabaseErrorType.CONNECTION_ERROR;
      }

      return {
        success: false,
        error: {
          type: errorType,
          message: errorMessage,
          originalError:
            error instanceof Error ? error : new Error(errorMessage),
        },
      };
    }
  }

  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    // Redis 自动处理过期，无需手动清理
    // 此方法保留兼容性，但实际上不执行任何操作
    console.log(
      `Redis automatically handles session expiration after ${daysOld} days`,
    );
    return 0;
  }
}

// 单例实例
export const sessionService = new SessionService();
