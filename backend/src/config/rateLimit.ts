import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import env from "./env";
import { sendError } from "../utils/response";

// ============================================================
// RATE LIMIT CONFIGURATION
// ============================================================

/**
 * Create a rate limiter with custom configuration
 */
export function createRateLimiter(
  windowMs: number = env.RATE_LIMIT_WINDOW_MS,
  max: number = env.RATE_LIMIT_MAX_REQUESTS,
  message: string = "Too many requests. Please try again later.",
  skipSuccessfulRequests: boolean = false,
): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      errors: ["Rate limit exceeded"],
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res, next, options) => {
      sendError(res, message, 429, ["Too many requests from this IP"]);
    },
  });
}

/**
 * Strict rate limiter for authentication endpoints
 * 5 attempts per 15 minutes
 */
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  "Too many authentication attempts. Please try again after 15 minutes.",
);

/**
 * Standard rate limiter for API endpoints
 * 100 requests per 15 minutes
 */
export const standardRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  "Too many requests. Please slow down and try again later.",
);

/**
 * Strict rate limiter for sensitive operations
 * 20 requests per hour
 */
export const strictRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20, // 20 requests
  "Rate limit exceeded for this operation. Please try again after an hour.",
);

/**
 * Relaxed rate limiter for read-only endpoints
 * 500 requests per 15 minutes
 */
export const relaxedRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  500, // 500 requests
  "Too many requests. Please try again later.",
);

/**
 * Login rate limiter with stricter rules
 * 10 attempts per 30 minutes
 */
export const loginRateLimiter = createRateLimiter(
  30 * 60 * 1000, // 30 minutes
  10, // 10 attempts
  "Too many login attempts. Please try again after 30 minutes.",
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  createRateLimiter,
  authRateLimiter,
  standardRateLimiter,
  strictRateLimiter,
  relaxedRateLimiter,
  loginRateLimiter,
};
