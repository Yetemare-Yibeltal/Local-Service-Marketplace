import { Request, Response, NextFunction } from "express";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { RateLimiterMemory } from "rate-limiter-flexible";
import Redis from "ioredis";
import { getRedisClient, isRedisConnected } from "../config/redis";
import { sendError } from "../utils/response";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface RateLimitOptions {
  points: number; // Number of requests allowed
  duration: number; // Time window in seconds
  blockDuration?: number; // Block duration in seconds after exceeding
  keyPrefix?: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  storeClient?: Redis;
  useRedis?: boolean;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request, res: Response, next: NextFunction) => void;
  onLimitReached?: (req: Request, res: Response, retryAfter: number) => void;
}

export interface RateLimitStats {
  total: number;
  blocked: number;
  allowed: number;
  byType: Record<string, { total: number; blocked: number; allowed: number }>;
}

export interface RateLimitResult {
  success: boolean;
  remainingPoints: number;
  msBeforeNext: number;
  consumedPoints: number;
  isFirstInDuration: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default rate limit configurations
 */
export const DEFAULT_RATE_LIMITS = {
  GLOBAL: { points: 100, duration: 60 }, // 100 requests per minute
  AUTH: { points: 10, duration: 300 }, // 10 attempts per 5 minutes
  LOGIN: { points: 5, duration: 300 }, // 5 attempts per 5 minutes
  OTP: { points: 3, duration: 600 }, // 3 attempts per 10 minutes
  BOOKING: { points: 20, duration: 300 }, // 20 bookings per 5 minutes
  UPLOAD: { points: 10, duration: 300 }, // 10 uploads per 5 minutes
  SEARCH: { points: 50, duration: 60 }, // 50 searches per minute
  API: { points: 1000, duration: 60 }, // 1000 API requests per minute
};

/**
 * Rate limit statistics
 */
const stats: RateLimitStats = {
  total: 0,
  blocked: 0,
  allowed: 0,
  byType: {},
};

// ============================================================
// RATE LIMITER SERVICE
// ============================================================

/**
 * Rate limiter service class
 */
class RateLimiterService {
  private limiters: Map<string, any> = new Map();
  private redisClient: Redis | null = null;
  private useRedis: boolean = false;

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    try {
      if (isRedisConnected()) {
        this.redisClient = getRedisClient();
        this.useRedis = true;
        logger.info("Rate limiter using Redis for distributed limiting");
      } else {
        logger.warn("Redis not available, rate limiter using memory store");
      }
    } catch (error) {
      logger.warn("Failed to initialize Redis for rate limiter:", error);
    }
  }

  /**
   * Get or create rate limiter
   */
  public getLimiter(keyPrefix: string, options: RateLimitOptions): any {
    const key = `${keyPrefix}:${options.points}:${options.duration}`;

    if (this.limiters.has(key)) {
      return this.limiters.get(key);
    }

    const limiter = this.createLimiter(keyPrefix, options);
    this.limiters.set(key, limiter);

    return limiter;
  }

  /**
   * Create rate limiter instance
   */
  private createLimiter(keyPrefix: string, options: RateLimitOptions): any {
    const config = {
      points: options.points,
      duration: options.duration,
      blockDuration: options.blockDuration || 0,
      keyPrefix: options.keyPrefix || `rl:${keyPrefix}`,
      skipFailedRequests: options.skipFailedRequests || false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    };

    if (this.useRedis && this.redisClient) {
      return new RateLimiterRedis({
        ...config,
        storeClient: this.redisClient,
        inMemoryBlockOnConsumed: options.points,
        insuranceLimiter: new RateLimiterMemory({
          points: options.points,
          duration: options.duration,
          blockDuration: options.blockDuration || 0,
        }),
      });
    }

    return new RateLimiterMemory(config);
  }

  /**
   * Consume a point from the rate limiter
   */
  public async consume(
    key: string,
    limiter: any,
    points: number = 1,
  ): Promise<RateLimitResult> {
    try {
      const result = await limiter.consume(key, points);

      return {
        success: true,
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext || 0,
        consumedPoints: result.consumedPoints || 0,
        isFirstInDuration: result.isFirstInDuration || false,
      };
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        return {
          success: false,
          remainingPoints: error.remainingPoints || 0,
          msBeforeNext: error.msBeforeNext || 0,
          consumedPoints: error.consumedPoints || 0,
          isFirstInDuration: error.isFirstInDuration || false,
        };
      }
      throw error;
    }
  }

  /**
   * Check rate limit without consuming
   */
  public async check(
    key: string,
    limiter: any,
  ): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const result = await limiter.get(key);
      const remaining = result ? result.remainingPoints : 0;
      return { allowed: remaining > 0, remaining };
    } catch (error) {
      return { allowed: true, remaining: 0 };
    }
  }

  /**
   * Reset rate limit for a key
   */
  public async reset(key: string, limiter: any): Promise<boolean> {
    try {
      await limiter.delete(key);
      return true;
    } catch (error) {
      logger.error(`Failed to reset rate limit for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining points for a key
   */
  public async getRemaining(key: string, limiter: any): Promise<number> {
    try {
      const result = await limiter.get(key);
      return result ? result.remainingPoints : 0;
    } catch (error) {
      return 0;
    }
  }
}

// ============================================================
// INSTANCE
// ============================================================

const rateLimiterService = new RateLimiterService();

// ============================================================
// MIDDLEWARE FACTORY
// ============================================================

/**
 * Create rate limit middleware
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    points = DEFAULT_RATE_LIMITS.GLOBAL.points,
    duration = DEFAULT_RATE_LIMITS.GLOBAL.duration,
    blockDuration = 0,
    keyPrefix = "rl",
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    keyGenerator = defaultKeyGenerator,
    skip = () => false,
    handler = defaultRateLimitHandler,
    onLimitReached,
  } = options;

  const limiter = rateLimiterService.getLimiter(keyPrefix, {
    points,
    duration,
    blockDuration,
    keyPrefix,
    skipFailedRequests,
    skipSuccessfulRequests,
  });

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Skip rate limiting
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const keyType = `${keyPrefix}:${key}`;

    try {
      const result = await rateLimiterService.consume(keyType, limiter);

      // Track stats
      trackRateLimit("allowed", keyPrefix);

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", points);
      res.setHeader("X-RateLimit-Remaining", result.remainingPoints);
      res.setHeader("X-RateLimit-Reset", Math.ceil(result.msBeforeNext / 1000));

      // If remaining points is low, add warning header
      if (result.remainingPoints < Math.ceil(points * 0.1)) {
        res.setHeader("X-RateLimit-Warning", "Low remaining requests");
      }

      next();
    } catch (error) {
      trackRateLimit("blocked", keyPrefix);

      // Handle rate limit exceeded
      if (error instanceof RateLimiterRes) {
        const retryAfter = Math.ceil(error.msBeforeNext / 1000);

        res.setHeader("Retry-After", retryAfter);
        res.setHeader("X-RateLimit-Limit", points);
        res.setHeader("X-RateLimit-Remaining", 0);
        res.setHeader("X-RateLimit-Reset", retryAfter);

        if (onLimitReached) {
          onLimitReached(req, res, retryAfter);
        }

        return handler(req, res, next);
      }

      // Other errors
      logger.error("Rate limiter error:", error);
      next();
    }
  };
}

// ============================================================
// DEFAULT HANDLERS
// ============================================================

/**
 * Default rate limit handler
 */
export function defaultRateLimitHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const retryAfter = parseInt(
    (res.getHeader("Retry-After") as string) || "60",
    10,
  );
  const message = `Too many requests. Please try again in ${retryAfter} seconds.`;

  sendError(res, message, 429, ["Rate limit exceeded"]);
}

/**
 * Custom JSON rate limit handler
 */
export function jsonRateLimitHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const retryAfter = parseInt(
    (res.getHeader("Retry-After") as string) || "60",
    10,
  );

  res.status(429).json({
    success: false,
    message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
    errors: ["Too many requests from this IP"],
    statusCode: 429,
    timestamp: new Date().toISOString(),
    path: req.path,
    retryAfter,
  });
}

// ============================================================
// KEY GENERATORS
// ============================================================

/**
 * Default key generator using IP address
 */
export function defaultKeyGenerator(req: Request): string {
  const ip =
    req.ip ||
    (req.headers["x-forwarded-for"] as string) ||
    req.connection?.remoteAddress ||
    "unknown";

  return typeof ip === "string" ? ip : ip[0] || "unknown";
}

/**
 * Key generator using user ID (for authenticated requests)
 */
export function userKeyGenerator(req: Request): string {
  const userId = (req as any).user?.id || "anonymous";
  return `user:${userId}`;
}

/**
 * Key generator using IP and user ID combination
 */
export function combinedKeyGenerator(req: Request): string {
  const ip = defaultKeyGenerator(req);
  const userId = (req as any).user?.id || "anonymous";
  return `combined:${ip}:${userId}`;
}

/**
 * Key generator using API key or IP
 */
export function apiKeyGenerator(req: Request): string {
  const apiKey = req.headers["x-api-key"] as string;
  if (apiKey) {
    return `apikey:${apiKey}`;
  }
  return defaultKeyGenerator(req);
}

/**
 * Key generator for booking endpoints (IP + provider ID)
 */
export function bookingKeyGenerator(req: Request): string {
  const ip = defaultKeyGenerator(req);
  const providerId =
    req.body?.providerId || req.params?.providerId || "unknown";
  return `booking:${ip}:${providerId}`;
}

// ============================================================
// PRE-CONFIGURED RATE LIMITERS
// ============================================================

/**
 * Global rate limiter
 */
export const globalRateLimiter = rateLimit({
  points: DEFAULT_RATE_LIMITS.GLOBAL.points,
  duration: DEFAULT_RATE_LIMITS.GLOBAL.duration,
  keyPrefix: "global",
});

/**
 * Authentication rate limiter
 */
export const authRateLimiter = rateLimit({
  points: DEFAULT_RATE_LIMITS.AUTH.points,
  duration: DEFAULT_RATE_LIMITS.AUTH.duration,
  blockDuration: 600, // 10 minutes block
  keyPrefix: "auth",
  keyGenerator: combinedKeyGenerator,
  handler: jsonRateLimitHandler,
});

/**
 * Login rate limiter (stricter)
 */
export const loginRateLimiter = rateLimit({
  points: DEFAULT_RATE_LIMITS.LOGIN.points,
  duration: DEFAULT_RATE_LIMITS.LOGIN.duration,
  blockDuration: 900, // 15 minutes block
  keyPrefix: "login",
  keyGenerator: defaultKeyGenerator,
  handler: jsonRateLimitHandler,
});

/**
 * OTP rate limiter
 */
export const otpRateLimiter = rateLimit({
  points: DEFAULT_RATE_LIMITS.OTP.points,
  duration: DEFAULT_RATE_LIMITS.OTP.duration,
  blockDuration: 600, // 10 minutes block
  keyPrefix: "otp",
  keyGenerator: defaultKeyGenerator,
  handler: jsonRateLimitHandler,
});

/**
 * Booking rate limiter
 */
export const bookingRateLimiter = rateLimit({
  points: DEFAULT_RATE_LIMITS.BOOKING.points,
  duration: DEFAULT_RATE_LIMITS.BOOKING.duration,
  keyPrefix: "booking",
  keyGenerator: bookingKeyGenerator,
});

/**
 * File upload rate limiter
 */
export const uploadRateLimiter = rateLimit({
  points: DEFAULT_RATE_LIMITS.UPLOAD.points,
  duration: DEFAULT_RATE_LIMITS.UPLOAD.duration,
  keyPrefix: "upload",
  keyGenerator: userKeyGenerator,
});

/**
 * Search rate limiter
 */
export const searchRateLimiter = rateLimit({
  points: DEFAULT_RATE_LIMITS.SEARCH.points,
  duration: DEFAULT_RATE_LIMITS.SEARCH.duration,
  keyPrefix: "search",
  keyGenerator: combinedKeyGenerator,
});

/**
 * API rate limiter (higher limits)
 */
export const apiRateLimiter = rateLimit({
  points: DEFAULT_RATE_LIMITS.API.points,
  duration: DEFAULT_RATE_LIMITS.API.duration,
  keyPrefix: "api",
  keyGenerator: combinedKeyGenerator,
});

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimiter = rateLimit({
  points: 5,
  duration: 300,
  blockDuration: 3600, // 1 hour block
  keyPrefix: "strict",
  keyGenerator: userKeyGenerator,
  handler: jsonRateLimitHandler,
});

/**
 * Relaxed rate limiter for public endpoints
 */
export const relaxedRateLimiter = rateLimit({
  points: 500,
  duration: 60,
  keyPrefix: "relaxed",
  keyGenerator: defaultKeyGenerator,
});

// ============================================================
// TRACKING AND STATISTICS
// ============================================================

/**
 * Track rate limit events
 */
function trackRateLimit(status: "allowed" | "blocked", type: string): void {
  stats.total++;

  if (status === "allowed") {
    stats.allowed++;
  } else {
    stats.blocked++;
  }

  if (!stats.byType[type]) {
    stats.byType[type] = { total: 0, blocked: 0, allowed: 0 };
  }

  stats.byType[type].total++;
  if (status === "allowed") {
    stats.byType[type].allowed++;
  } else {
    stats.byType[type].blocked++;
  }
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): RateLimitStats {
  return { ...stats };
}

/**
 * Reset rate limit statistics
 */
export function resetRateLimitStats(): void {
  stats.total = 0;
  stats.blocked = 0;
  stats.allowed = 0;
  stats.byType = {};
}

// ============================================================
// RESET FUNCTIONS
// ============================================================

/**
 * Reset rate limit for a key
 */
export async function resetRateLimit(
  key: string,
  limiterType: string = "global",
): Promise<boolean> {
  try {
    const limiter = rateLimiterService.getLimiter(limiterType, {
      points: DEFAULT_RATE_LIMITS.GLOBAL.points,
      duration: DEFAULT_RATE_LIMITS.GLOBAL.duration,
      keyPrefix: limiterType,
    });

    return await rateLimiterService.reset(key, limiter);
  } catch (error) {
    logger.error(`Failed to reset rate limit for ${key}:`, error);
    return false;
  }
}

/**
 * Reset all rate limits for a user
 */
export async function resetUserRateLimits(userId: string): Promise<void> {
  const types = [
    "auth",
    "login",
    "otp",
    "booking",
    "upload",
    "search",
    "api",
    "strict",
  ];
  const keys = types.map((type) => `rl:${type}:user:${userId}`);

  for (const key of keys) {
    await resetRateLimit(key, "user");
  }
}

// ============================================================
// HELPER MIDDLEWARE
// ============================================================

/**
 * Middleware to skip rate limiting for admins
 */
export function skipForAdmins(req: Request): boolean {
  return (req as any).user?.role === "ADMIN";
}

/**
 * Middleware to skip rate limiting for internal requests
 */
export function skipForInternal(req: Request): boolean {
  return req.headers["x-internal-request"] === "true";
}

/**
 * Middleware to skip rate limiting for whitelisted IPs
 */
const whitelistedIPs = new Set<string>();

export function addWhitelistedIP(ip: string): void {
  whitelistedIPs.add(ip);
}

export function removeWhitelistedIP(ip: string): void {
  whitelistedIPs.delete(ip);
}

export function isIPWhitelisted(ip: string): boolean {
  return whitelistedIPs.has(ip);
}

export function skipForWhitelistedIPs(req: Request): boolean {
  const ip = defaultKeyGenerator(req);
  return isIPWhitelisted(ip);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Main middleware
  rateLimit,

  // Pre-configured limiters
  globalRateLimiter,
  authRateLimiter,
  loginRateLimiter,
  otpRateLimiter,
  bookingRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  apiRateLimiter,
  strictRateLimiter,
  relaxedRateLimiter,

  // Handlers
  defaultRateLimitHandler,
  jsonRateLimitHandler,

  // Key generators
  defaultKeyGenerator,
  userKeyGenerator,
  combinedKeyGenerator,
  apiKeyGenerator,
  bookingKeyGenerator,

  // Skip functions
  skipForAdmins,
  skipForInternal,
  skipForWhitelistedIPs,

  // Whitelist functions
  addWhitelistedIP,
  removeWhitelistedIP,
  isIPWhitelisted,

  // Statistics
  getRateLimitStats,
  resetRateLimitStats,

  // Reset functions
  resetRateLimit,
  resetUserRateLimits,

  // Service
  rateLimiterService,
};
