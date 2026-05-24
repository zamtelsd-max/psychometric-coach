import IORedis from 'ioredis';
import logger from './logger';

let redis: IORedis | null = null;

export function getRedis(): IORedis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }
  if (!redis) {
    try {
      redis = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 5000,
      });
      redis.on('error', (err) => {
        logger.warn('Redis error (non-fatal):', err.message);
        redis = null;
      });
    } catch (err) {
      logger.warn('Redis connection failed (non-fatal):', err);
      redis = null;
    }
  }
  return redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return await r.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.setex(key, ttlSeconds, value);
  } catch {
    // non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key);
  } catch {
    // non-fatal
  }
}
