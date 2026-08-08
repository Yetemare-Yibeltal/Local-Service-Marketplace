import { createClient, RedisClientType, RedisClientOptions } from "redis";
import env from "../config/env";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
  tags?: string[]; // Tags for cache invalidation by tag
}

export interface PubSubMessage {
  channel: string;
  message: any;
  timestamp: Date;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  total: number;
}

// ============================================================
// REDIS SERVICE
// ============================================================

/**
 * Redis service class for managing Redis operations
 */
class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private pubSubClient: RedisClientType | null = null;
  private subscribers: Map<string, ((message: any) => void)[]> = new Map();

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        logger.debug("Redis already connected");
        return;
      }

      const options: RedisClientOptions = {
        url: env.REDIS_URL || "redis://localhost:6379",
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
      };

      this.client = createClient(options) as RedisClientType;

      // Event handlers
      this.client.on("error", (error) => {
        logger.error("Redis error:", error);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        logger.info("Redis connecting...");
      });

      this.client.on("ready", () => {
        this.isConnected = true;
        logger.info("Redis connected successfully");
      });

      this.client.on("end", () => {
        this.isConnected = false;
        logger.info("Redis connection ended");
      });

      this.client.on("reconnecting", () => {
        logger.info("Redis reconnecting...");
      });

      await this.client.connect();

      // Initialize pub/sub client
      await this.initPubSub();

      logger.info("Redis client initialized successfully");
    } catch (error) {
      logger.error("Redis connection failed:", error);
      throw error;
    }
  }

  /**
   * Initialize pub/sub client
   */
  private async initPubSub(): Promise<void> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }

      this.pubSubClient = this.client.duplicate() as RedisClientType;
      await this.pubSubClient.connect();

      logger.info("Redis pub/sub client initialized");
    } catch (error) {
      logger.error("Redis pub/sub initialization failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.pubSubClient) {
        await this.pubSubClient.quit();
        this.pubSubClient = null;
      }

      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
      }

      logger.info("Redis disconnected successfully");
    } catch (error) {
      logger.error("Redis disconnection failed:", error);
      throw error;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected");
    }
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isConnectedFn(): boolean {
    return this.isConnected;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error("Redis health check failed:", error);
      return false;
    }
  }

  // ============================================================
  // CACHE OPERATIONS
  // ============================================================

  /**
   * Set a value in cache
   */
  async set(
    key: string,
    value: any,
    options: CacheOptions = {},
  ): Promise<boolean> {
    try {
      const client = this.getClient();
      const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
      const serialized = JSON.stringify(value);
      const ttl = options.ttl || 3600;

      await client.setEx(fullKey, ttl, serialized);

      // Store tags if provided
      if (options.tags && options.tags.length > 0) {
        const tagKey = `tag:${fullKey}`;
        await client.setEx(tagKey, ttl, JSON.stringify(options.tags));
      }

      logger.debug(`Cache set: ${fullKey} (${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Cache set failed for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const data = await client.get(fullKey);

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
   * Get multiple values from cache
   */
  async mget<T>(keys: string[], prefix?: string): Promise<(T | null)[]> {
    try {
      const client = this.getClient();
      const fullKeys = keys.map((key) => (prefix ? `${prefix}:${key}` : key));

      if (fullKeys.length === 0) {
        return [];
      }

      const data = await client.mGet(fullKeys);

      return data.map((item) => {
        if (!item) {
          return null;
        }
        try {
          return JSON.parse(item) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error("Cache mget failed:", error);
      return keys.map(() => null);
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string, prefix?: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const result = await client.del(fullKey);

      // Delete associated tags
      await client.del(`tag:${fullKey}`);

      return result > 0;
    } catch (error) {
      logger.error(`Cache delete failed for ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async mdelete(keys: string[], prefix?: string): Promise<number> {
    try {
      const client = this.getClient();
      const fullKeys = keys.map((key) => (prefix ? `${prefix}:${key}` : key));

      if (fullKeys.length === 0) {
        return 0;
      }

      // Delete associated tags
      const tagKeys = fullKeys.map((key) => `tag:${key}`);
      await client.del(tagKeys);

      const result = await client.del(fullKeys);
      return result;
    } catch (error) {
      logger.error("Cache mdelete failed:", error);
      return 0;
    }
  }

  /**
   * Delete keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const client = this.getClient();
      const keys = await client.keys(pattern);
      let deletedCount = 0;

      for (const key of keys) {
        const result = await client.del(key);
        if (result > 0) {
          deletedCount++;
        }
        // Delete associated tags
        await client.del(`tag:${key}`);
      }

      logger.info(`Deleted ${deletedCount} keys by pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Cache delete by pattern ${pattern} failed:`, error);
      return 0;
    }
  }

  /**
   * Delete keys by tag
   */
  async deleteByTag(tag: string, prefix?: string): Promise<number> {
    try {
      const client = this.getClient();
      const pattern = prefix ? `${prefix}:*` : "*";
      const keys = await client.keys(pattern);
      let deletedCount = 0;

      for (const key of keys) {
        const tagKey = `tag:${key}`;
        const tagsData = await client.get(tagKey);

        if (tagsData) {
          try {
            const tags = JSON.parse(tagsData);
            if (Array.isArray(tags) && tags.includes(tag)) {
              const result = await client.del(key);
              if (result > 0) {
                deletedCount++;
              }
              await client.del(tagKey);
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }

      logger.info(`Deleted ${deletedCount} keys by tag: ${tag}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Cache delete by tag ${tag} failed:`, error);
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string, prefix?: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const result = await client.exists(fullKey);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists check failed for ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, ttl: number, prefix?: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const result = await client.expire(fullKey, ttl);
      return result;
    } catch (error) {
      logger.error(`Cache expire failed for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string, prefix?: string): Promise<number> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      return await client.ttl(fullKey);
    } catch (error) {
      logger.error(`Cache TTL check failed for ${key}:`, error);
      return -2;
    }
  }

  /**
   * Increment a counter
   */
  async increment(
    key: string,
    increment: number = 1,
    prefix?: string,
  ): Promise<number> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      return await client.incrBy(fullKey, increment);
    } catch (error) {
      logger.error(`Cache increment failed for ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const client = this.getClient();
      return await client.keys(pattern);
    } catch (error) {
      logger.error(`Cache keys pattern failed for ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Flush all keys (use with caution)
   */
  async flushAll(): Promise<void> {
    try {
      const client = this.getClient();
      await client.flushAll();
      logger.warn("Cache flushed all keys");
    } catch (error) {
      logger.error("Cache flush failed:", error);
      throw error;
    }
  }

  // ============================================================
  // HASH OPERATIONS
  // ============================================================

  /**
   * Set a hash field
   */
  async hset(
    key: string,
    field: string,
    value: any,
    prefix?: string,
  ): Promise<boolean> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      await client.hSet(fullKey, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Hash set failed for ${key}:${field}:`, error);
      return false;
    }
  }

  /**
   * Get a hash field
   */
  async hget<T>(
    key: string,
    field: string,
    prefix?: string,
  ): Promise<T | null> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const data = await client.hGet(fullKey, field);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Hash get failed for ${key}:${field}:`, error);
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall<T>(key: string, prefix?: string): Promise<Record<string, T>> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const data = await client.hGetAll(fullKey);

      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(value) as T;
        } catch {
          // Skip parsing errors
        }
      }

      return result;
    } catch (error) {
      logger.error(`Hash getall failed for ${key}:`, error);
      return {};
    }
  }

  /**
   * Delete a hash field
   */
  async hdel(key: string, field: string, prefix?: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const result = await client.hDel(fullKey, field);
      return result > 0;
    } catch (error) {
      logger.error(`Hash delete failed for ${key}:${field}:`, error);
      return false;
    }
  }

  // ============================================================
  // LIST OPERATIONS
  // ============================================================

  /**
   * Push to a list
   */
  async lpush<T>(key: string, value: T, prefix?: string): Promise<number> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      return await client.lPush(fullKey, JSON.stringify(value));
    } catch (error) {
      logger.error(`List push failed for ${key}:`, error);
      return 0;
    }
  }

  /**
   * Pop from a list
   */
  async rpop<T>(key: string, prefix?: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const data = await client.rPop(fullKey);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`List pop failed for ${key}:`, error);
      return null;
    }
  }

  /**
   * Get list range
   */
  async lrange<T>(
    key: string,
    start: number = 0,
    stop: number = -1,
    prefix?: string,
  ): Promise<T[]> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const data = await client.lRange(fullKey, start, stop);

      return data
        .map((item) => {
          try {
            return JSON.parse(item) as T;
          } catch {
            return null;
          }
        })
        .filter((item) => item !== null) as T[];
    } catch (error) {
      logger.error(`List range failed for ${key}:`, error);
      return [];
    }
  }

  /**
   * Get list length
   */
  async llen(key: string, prefix?: string): Promise<number> {
    try {
      const client = this.getClient();
      const fullKey = prefix ? `${prefix}:${key}` : key;
      return await client.lLen(fullKey);
    } catch (error) {
      logger.error(`List length failed for ${key}:`, error);
      return 0;
    }
  }

  // ============================================================
  // PUB/SUB OPERATIONS
  // ============================================================

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: any): Promise<number> {
    try {
      if (!this.pubSubClient) {
        throw new Error("Pub/Sub client not initialized");
      }

      const serialized = JSON.stringify({
        data: message,
        timestamp: new Date().toISOString(),
      });

      const result = await this.pubSubClient.publish(channel, serialized);
      logger.debug(`Message published to channel ${channel}`);
      return result;
    } catch (error) {
      logger.error(`Publish to ${channel} failed:`, error);
      return 0;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(
    channel: string,
    callback: (message: any) => void,
  ): Promise<void> {
    try {
      if (!this.pubSubClient) {
        throw new Error("Pub/Sub client not initialized");
      }

      // Store callback
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, []);
      }
      this.subscribers.get(channel)!.push(callback);

      // Subscribe only once per channel
      const subscriberCount = this.subscribers.get(channel)!.length;
      if (subscriberCount === 1) {
        await this.pubSubClient.subscribe(channel, (message: string) => {
          try {
            const parsed = JSON.parse(message);
            const callbacks = this.subscribers.get(channel) || [];
            callbacks.forEach((cb) => cb(parsed.data));
          } catch (error) {
            logger.error(
              `Message parsing failed for channel ${channel}:`,
              error,
            );
          }
        });
        logger.info(`Subscribed to channel ${channel}`);
      }
    } catch (error) {
      logger.error(`Subscribe to ${channel} failed:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string): Promise<void> {
    try {
      if (!this.pubSubClient) {
        throw new Error("Pub/Sub client not initialized");
      }

      this.subscribers.delete(channel);
      await this.pubSubClient.unsubscribe(channel);
      logger.info(`Unsubscribed from channel ${channel}`);
    } catch (error) {
      logger.error(`Unsubscribe from ${channel} failed:`, error);
      throw error;
    }
  }

  // ============================================================
  // RATE LIMITING
  // ============================================================

  /**
   * Check rate limit for a key
   */
  async rateLimit(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    try {
      const client = this.getClient();
      const fullKey = `ratelimit:${config.keyPrefix || "default"}:${key}`;

      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Remove expired entries
      await client.zRemRangeByScore(fullKey, 0, windowStart);

      // Count requests in current window
      const total = await client.zCard(fullKey);

      // Check if allowed
      const allowed = total < config.maxRequests;

      // Add current request
      if (allowed) {
        await client.zAdd(fullKey, {
          score: now,
          value: `${now}:${Math.random().toString(36).substring(2, 8)}`,
        });
        await client.expire(fullKey, Math.ceil(config.windowMs / 1000));
      }

      const remaining = Math.max(
        0,
        config.maxRequests - total - (allowed ? 1 : 0),
      );
      const resetAt = new Date(now + config.windowMs);

      return {
        allowed,
        remaining,
        resetAt,
        total: total + (allowed ? 1 : 0),
      };
    } catch (error) {
      logger.error(`Rate limit check failed for ${key}:`, error);
      // On error, allow the request
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(Date.now() + config.windowMs),
        total: 0,
      };
    }
  }

  /**
   * Reset rate limit for a key
   */
  async resetRateLimit(key: string, prefix?: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const fullKey = `ratelimit:${prefix || "default"}:${key}`;
      const result = await client.del(fullKey);
      return result > 0;
    } catch (error) {
      logger.error(`Rate limit reset failed for ${key}:`, error);
      return false;
    }
  }

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  /**
   * Store session data
   */
  async setSession(
    sessionId: string,
    data: any,
    ttl: number = 86400,
  ): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, { ttl, prefix: "sessions" });
  }

  /**
   * Get session data
   */
  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`, "sessions");
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    return this.delete(`session:${sessionId}`, "sessions");
  }

  /**
   * Extend session TTL
   */
  async extendSession(
    sessionId: string,
    ttl: number = 86400,
  ): Promise<boolean> {
    return this.expire(`session:${sessionId}`, ttl, "sessions");
  }

  // ============================================================
  // APPLICATION-SPECIFIC HELPERS
  // ============================================================

  /**
   * Cache a provider profile
   */
  async cacheProvider(
    providerId: string,
    data: any,
    ttl: number = 3600,
  ): Promise<boolean> {
    return this.set(`provider:${providerId}`, data, {
      ttl,
      prefix: "cache",
      tags: ["provider", `provider:${providerId}`],
    });
  }

  /**
   * Get cached provider profile
   */
  async getCachedProvider<T>(providerId: string): Promise<T | null> {
    return this.get<T>(`provider:${providerId}`, "cache");
  }

  /**
   * Cache a booking
   */
  async cacheBooking(
    bookingId: string,
    data: any,
    ttl: number = 3600,
  ): Promise<boolean> {
    return this.set(`booking:${bookingId}`, data, {
      ttl,
      prefix: "cache",
      tags: ["booking", `booking:${bookingId}`],
    });
  }

  /**
   * Get cached booking
   */
  async getCachedBooking<T>(bookingId: string): Promise<T | null> {
    return this.get<T>(`booking:${bookingId}`, "cache");
  }

  /**
   * Cache search results
   */
  async cacheSearch(
    query: string,
    results: any,
    ttl: number = 300,
  ): Promise<boolean> {
    const key = `search:${query}`;
    return this.set(key, results, {
      ttl,
      prefix: "cache",
      tags: ["search", "search:all"],
    });
  }

  /**
   * Get cached search results
   */
  async getCachedSearch<T>(query: string): Promise<T | null> {
    return this.get<T>(`search:${query}`, "cache");
  }

  /**
   * Invalidate all search cache
   */
  async invalidateSearchCache(): Promise<number> {
    return this.deleteByTag("search", "cache");
  }

  /**
   * Invalidate cache by provider
   */
  async invalidateProviderCache(providerId: string): Promise<number> {
    let deleted = 0;

    // Delete provider cache
    if (await this.delete(`provider:${providerId}`, "cache")) {
      deleted++;
    }

    // Delete associated search cache
    deleted += await this.invalidateSearchCache();

    return deleted;
  }

  /**
   * Invalidate cache by booking
   */
  async invalidateBookingCache(bookingId: string): Promise<number> {
    let deleted = 0;

    // Delete booking cache
    if (await this.delete(`booking:${bookingId}`, "cache")) {
      deleted++;
    }

    return deleted;
  }
}

// ============================================================
// EXPORTS
// ============================================================

const redisService = new RedisService();

export default redisService;
