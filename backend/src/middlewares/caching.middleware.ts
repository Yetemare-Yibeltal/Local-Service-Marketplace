import { Request, Response, NextFunction } from "express";
import { getRedisClient, isRedisConnected } from "../config/redis";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
  varyBy?: string[]; // Vary cache by these request properties
  skipCache?: (req: Request) => boolean; // Skip cache condition
  onHit?: (req: Request, res: Response, key: string) => void; // Callback on cache hit
  onMiss?: (req: Request, res: Response, key: string) => void; // Callback on cache miss
  onSet?: (req: Request, res: Response, key: string, value: any) => void; // Callback on cache set
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_TTL = 300; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum number of cache keys to track

/**
 * Cache statistics
 */
const stats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

// ============================================================
// CACHE KEY GENERATION
// ============================================================

/**
 * Generate a cache key from request
 */
export function generateCacheKey(
  req: Request,
  options: CacheOptions = {},
): string {
  if (options.key) {
    return options.key;
  }

  // Build key from request components
  const parts = [req.method, req.path];

  // Add query parameters sorted for consistency
  if (req.query && Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = req.query[key];
          return acc;
        },
        {} as Record<string, any>,
      );
    parts.push(JSON.stringify(sortedQuery));
  }

  // Add varyBy properties
  if (options.varyBy && options.varyBy.length > 0) {
    const varyValues = options.varyBy.map((field) => {
      if (field === "user") {
        return (req as any).user?.id || "anonymous";
      }
      if (field === "role") {
        return (req as any).user?.role || "guest";
      }
      if (field === "ip") {
        return req.ip || "unknown";
      }
      if (field === "language") {
        return req.headers["accept-language"] || "en";
      }
      if (field === "user-agent") {
        return req.headers["user-agent"] || "unknown";
      }
      return "";
    });
    parts.push(...varyValues);
  }

  // Add user ID for authenticated requests
  if (options.varyBy?.includes("user")) {
    parts.push((req as any).user?.id || "anonymous");
  }

  // Generate hash
  const keyString = parts.join("|");
  return `cache:${hashString(keyString)}`;
}

/**
 * Simple hash function for cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================================
// CACHE MIDDLEWARE
// ============================================================

/**
 * Create caching middleware
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const ttl = options.ttl || DEFAULT_TTL;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Skip cache if Redis is not connected
    if (!isRedisConnected()) {
      return next();
    }

    // Skip cache for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip cache if skipCache function returns true
    if (options.skipCache && options.skipCache(req)) {
      return next();
    }

    const cacheKey = generateCacheKey(req, options);

    try {
      const client = getRedisClient();
      const cachedData = await client.get(cacheKey);

      if (cachedData) {
        // Cache hit
        stats.hits++;
        if (options.onHit) {
          options.onHit(req, res, cacheKey);
        }

        try {
          const parsedData = JSON.parse(cachedData);
          res.setHeader("X-Cache", "HIT");
          res.setHeader("X-Cache-Key", cacheKey);
          return res.status(200).json(parsedData);
        } catch (parseError) {
          // If parsing fails, treat as cache miss
          stats.errors++;
          logger.error("Cache parse error:", parseError);
        }
      }

      // Cache miss - store original response methods
      stats.misses++;
      if (options.onMiss) {
        options.onMiss(req, res, cacheKey);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      const originalSend = res.send;

      // Track if response has been sent
      let responseSent = false;

      // Override json
      res.json = function (body: any): Response {
        if (!responseSent) {
          responseSent = true;
          // Cache the response
          cacheResponse(cacheKey, body, ttl, options);
          // Set cache headers
          res.setHeader("X-Cache", "MISS");
          res.setHeader("X-Cache-Key", cacheKey);
        }
        return originalJson.call(this, body);
      };

      // Override send
      res.send = function (body: any): Response {
        if (!responseSent) {
          responseSent = true;
          // Try to parse body as JSON
          let cacheBody = body;
          if (typeof body === "string") {
            try {
              cacheBody = JSON.parse(body);
            } catch {
              // Not JSON, don't cache
              return originalSend.call(this, body);
            }
          }
          // Cache the response
          cacheResponse(cacheKey, cacheBody, ttl, options);
          // Set cache headers
          res.setHeader("X-Cache", "MISS");
          res.setHeader("X-Cache-Key", cacheKey);
        }
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      stats.errors++;
      logger.error("Cache middleware error:", error);
      next();
    }
  };
}

/**
 * Cache response data
 */
async function cacheResponse(
  key: string,
  data: any,
  ttl: number,
  options: CacheOptions,
): Promise<void> {
  try {
    const client = getRedisClient();
    const serialized = JSON.stringify(data);
    await client.setEx(key, ttl, serialized);
    stats.sets++;
    if (options.onSet) {
      options.onSet({} as Request, {} as Response, key, data);
    }
    logger.debug(`Cached response: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    stats.errors++;
    logger.error("Cache set error:", error);
  }
}

// ============================================================
// CACHE INVALIDATION
// ============================================================

/**
 * Invalidate cache by key
 */
export async function invalidateCache(key: string): Promise<boolean> {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = getRedisClient();
    const result = await client.del(key);
    if (result > 0) {
      stats.deletes++;
      logger.debug(`Cache invalidated: ${key}`);
    }
    return result > 0;
  } catch (error) {
    stats.errors++;
    logger.error("Cache invalidation error:", error);
    return false;
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCacheByPattern(
  pattern: string,
): Promise<number> {
  try {
    if (!isRedisConnected()) {
      return 0;
    }

    const client = getRedisClient();
    const keys = await client.keys(pattern);
    let count = 0;

    for (const key of keys) {
      const result = await client.del(key);
      if (result > 0) {
        count++;
        stats.deletes++;
      }
    }

    logger.debug(`Invalidated ${count} cache keys by pattern: ${pattern}`);
    return count;
  } catch (error) {
    stats.errors++;
    logger.error("Cache invalidation by pattern error:", error);
    return 0;
  }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<number> {
  try {
    if (!isRedisConnected()) {
      return 0;
    }

    const client = getRedisClient();
    const keys = await client.keys("cache:*");
    let count = 0;

    for (const key of keys) {
      const result = await client.del(key);
      if (result > 0) {
        count++;
        stats.deletes++;
      }
    }

    logger.info(`Cleared ${count} cache entries`);
    return count;
  } catch (error) {
    stats.errors++;
    logger.error("Clear cache error:", error);
    return 0;
  }
}

// ============================================================
// CACHE HELPERS
// ============================================================

/**
 * Get cached data by key
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (!isRedisConnected()) {
      return null;
    }

    const client = getRedisClient();
    const data = await client.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as any;
    }
  } catch (error) {
    stats.errors++;
    logger.error("Get cached error:", error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL,
): Promise<boolean> {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = getRedisClient();
    const serialized = JSON.stringify(data);
    await client.setEx(key, ttl, serialized);
    stats.sets++;
    return true;
  } catch (error) {
    stats.errors++;
    logger.error("Set cached error:", error);
    return false;
  }
}

/**
 * Check if cache exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    stats.errors++;
    logger.error("Cache exists error:", error);
    return false;
  }
}

/**
 * Get cache TTL
 */
export async function getCacheTTL(key: string): Promise<number> {
  try {
    if (!isRedisConnected()) {
      return -2;
    }

    const client = getRedisClient();
    return await client.ttl(key);
  } catch (error) {
    stats.errors++;
    logger.error("Get cache TTL error:", error);
    return -2;
  }
}

/**
 * Refresh cache TTL
 */
export async function refreshCacheTTL(
  key: string,
  ttl: number,
): Promise<boolean> {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = getRedisClient();
    const result = await client.expire(key, ttl);
    return result;
  } catch (error) {
    stats.errors++;
    logger.error("Refresh cache TTL error:", error);
    return false;
  }
}

// ============================================================
// CACHE CONTROL HEADERS
// ============================================================

/**
 * Set cache control headers
 */
export function setCacheHeaders(
  res: Response,
  options: {
    maxAge?: number;
    public?: boolean;
    private?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    mustRevalidate?: boolean;
    staleWhileRevalidate?: number;
    staleIfError?: number;
  },
): void {
  const directives: string[] = [];

  if (options.noCache) {
    directives.push("no-cache");
  }

  if (options.noStore) {
    directives.push("no-store");
  }

  if (options.public) {
    directives.push("public");
  }

  if (options.private) {
    directives.push("private");
  }

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }

  if (options.mustRevalidate) {
    directives.push("must-revalidate");
  }

  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  if (options.staleIfError !== undefined) {
    directives.push(`stale-if-error=${options.staleIfError}`);
  }

  if (directives.length > 0) {
    res.setHeader("Cache-Control", directives.join(", "));
  }
}

/**
 * Set cache control for static assets
 */
export function staticCacheControl(
  res: Response,
  maxAge: number = 86400, // 1 day
): void {
  setCacheHeaders(res, {
    public: true,
    maxAge,
    staleWhileRevalidate: 86400, // 1 day
    staleIfError: 604800, // 7 days
  });
}

/**
 * Set cache control for dynamic content
 */
export function dynamicCacheControl(
  res: Response,
  maxAge: number = 300, // 5 minutes
): void {
  setCacheHeaders(res, {
    public: true,
    maxAge,
    staleWhileRevalidate: 60, // 1 minute
    staleIfError: 300, // 5 minutes
  });
}

/**
 * Set cache control for private data
 */
export function privateCacheControl(
  res: Response,
  maxAge: number = 60, // 1 minute
): void {
  setCacheHeaders(res, {
    private: true,
    maxAge,
    mustRevalidate: true,
  });
}

/**
 * Disable cache
 */
export function disableCache(res: Response): void {
  setCacheHeaders(res, {
    noCache: true,
    noStore: true,
    mustRevalidate: true,
  });
}

// ============================================================
// CACHE STATISTICS
// ============================================================

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return { ...stats };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  stats.hits = 0;
  stats.misses = 0;
  stats.sets = 0;
  stats.deletes = 0;
  stats.errors = 0;
}

// ============================================================
// CLEANUP
// ============================================================

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    if (!isRedisConnected()) {
      return 0;
    }

    const client = getRedisClient();
    const keys = await client.keys("cache:*");
    let cleaned = 0;

    for (const key of keys) {
      const ttl = await client.ttl(key);
      if (ttl === -2) {
        // Key doesn't exist (already expired)
        continue;
      }
      if (ttl === -1) {
        // Key exists but has no expiry - delete it
        await client.del(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  } catch (error) {
    stats.errors++;
    logger.error("Clean expired cache error:", error);
    return 0;
  }
}

// ============================================================
// WITH CACHE DECORATOR
// ============================================================

/**
 * Decorator for caching function results
 */
export function withCache<T>(
  fn: (...args: any[]) => Promise<T>,
  keyGenerator: (...args: any[]) => string,
  ttl: number = DEFAULT_TTL,
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    const key = `fn:${keyGenerator(...args)}`;

    // Try to get from cache
    const cached = await getCached<T>(key);
    if (cached !== null) {
      stats.hits++;
      return cached;
    }

    // Execute function
    const result = await fn(...args);
    stats.misses++;

    // Cache result
    await setCached(key, result, ttl);

    return result;
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Middleware
  cacheMiddleware,

  // Cache operations
  getCached,
  setCached,
  cacheExists,
  getCacheTTL,
  refreshCacheTTL,

  // Invalidation
  invalidateCache,
  invalidateCacheByPattern,
  clearCache,

  // Headers
  setCacheHeaders,
  staticCacheControl,
  dynamicCacheControl,
  privateCacheControl,
  disableCache,

  // Stats
  getCacheStats,
  resetCacheStats,

  // Utilities
  generateCacheKey,
  cleanExpiredCache,

  // Decorator
  withCache,
};
