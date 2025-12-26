import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export function getRedisClient(): RedisClientType {
  if (!client) {
    client = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      password: process.env.REDIS_PASSWORD,
    });

    client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  return client;
}

export async function connectRedis(): Promise<RedisClientType> {
  const redis = getRedisClient();

  if (!redis.isOpen) {
    await redis.connect();
  }

  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (client && client.isOpen) {
    await client.quit();
    client = null;
  }
}