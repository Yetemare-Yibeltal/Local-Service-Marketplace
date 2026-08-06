import redis, { Redis } from "redis";
import env from "./env";
import logger from "../utils/logger";

// ============================================================
// REDIS CLIENT CONFIGURATION
// ============================================================

/**
 * Redis client instance
 */
let redisClient: Redis | null = null;
let isConnected: boolean = false;

/**
 * Create Redis client with configuration
 */
export function createRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const client = redis.createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          logger.error("Redis connection retry limit exceeded");
          return new Error("Redis connection failed after 10 retries");
        }
        const delay = Math.min(retries * 100, 3000);
        logger.debug(`Redis reconnect attempt ${retries} in ${delay}ms`);
        return delay;
      },
      connectTimeout: 10000,
      keepAlive: 30000,
    },
    pingInterval: 30000,
  });

  // Event handlers
  client.on("error", (error: Error) => {
    logger.error("Redis error:", error);
  });

  client.on("connect", () => {
    logger.info("Redis connecting...");
  });

  client.on("ready", () => {
    isConnected = true;
    logger.info("Redis connected successfully");
  });

  client.on("end", () => {
    isConnected = false;
    logger.info("Redis connection ended");
  });

  client.on("reconnecting", () => {
    logger.info("Redis reconnecting...");
  });

  redisClient = client;
  return redisClient;
}

/**
 * Connect to Redis server
 */
export async function connectRedis(): Promise<void> {
  try {
    const client = createRedisClient();
    await client.connect();
    isConnected = true;
    logger.info("Redis connection established");
  } catch (error) {
    logger.error("Redis connection failed:", error);
    throw error;
  }
}

/**
 * Disconnect from Redis server
 */
export async function disconnectRedis(): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.quit();
    isConnected = false;
    logger.info("Redis disconnected successfully");
  } catch (error) {
    logger.error("Redis disconnection failed:", error);
    throw error;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return isConnected;
}

/**
 * Health check for Redis
 */
export async function redisHealthCheck(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    logger.error("Redis health check failed:", error);
    return false;
  }
}

// ============================================================
// CACHE HELPERS
// ============================================================

/**
 * Set a value in Redis with expiration
 */
export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds: number = 3600,
): Promise<void> {
  try {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);
    await client.setEx(key, ttlSeconds, serialized);
    logger.debug(`Cache set: ${key} (${ttlSeconds}s)`);
  } catch (error) {
    logger.error(`Cache set failed for ${key}:`, error);
    throw error;
  }
}

/**
 * Get a value from Redis
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as T;
  } catch (error) {
    logger.error(`Cache get failed for ${key}:`, error);
    return null;
  }
}

/**
 * Delete a key from Redis
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.del(key);
    return result > 0;
  } catch (error) {
    logger.error(`Cache delete failed for ${key}:`, error);
    return false;
  }
}

/**
 * Check if a key exists in Redis
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`Cache exists check failed for ${key}:`, error);
    return false;
  }
}

/**
 * Set expiration on a key
 */
export async function cacheExpire(
  key: string,
  ttlSeconds: number,
): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.expire(key, ttlSeconds);
    return result;
  } catch (error) {
    logger.error(`Cache expire failed for ${key}:`, error);
    return false;
  }
}

/**
 * Get remaining TTL for a key
 */
export async function cacheTTL(key: string): Promise<number> {
  try {
    const client = getRedisClient();
    return await client.ttl(key);
  } catch (error) {
    logger.error(`Cache TTL check failed for ${key}:`, error);
    return -2;
  }
}

/**
 * Increment a counter in Redis
 */
export async function cacheIncrement(
  key: string,
  increment: number = 1,
): Promise<number> {
  try {
    const client = getRedisClient();
    return await client.incrBy(key, increment);
  } catch (error) {
    logger.error(`Cache increment failed for ${key}:`, error);
    return 0;
  }
}

/**
 * Get all keys matching a pattern
 */
export async function cacheKeys(pattern: string): Promise<string[]> {
  try {
    const client = getRedisClient();
    return await client.keys(pattern);
  } catch (error) {
    logger.error(`Cache keys pattern failed for ${pattern}:`, error);
    return [];
  }
}

/**
 * Flush all keys (use with caution)
 */
export async function cacheFlush(): Promise<void> {
  try {
    const client = getRedisClient();
    await client.flushAll();
    logger.warn("Cache flushed all keys");
  } catch (error) {
    logger.error("Cache flush failed:", error);
    throw error;
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.on("SIGTERM", async () => {
  await disconnectRedis();
});

process.on("SIGINT", async () => {
  await disconnectRedis();
});

// ============================================================
// EXPORTS
// ============================================================

export default {
  createRedisClient,
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
  redisHealthCheck,
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheExists,
  cacheExpire,
  cacheTTL,
  cacheIncrement,
  cacheKeys,
  cacheFlush,
};
