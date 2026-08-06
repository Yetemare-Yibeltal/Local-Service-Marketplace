import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response } from "express";
import env from "./env";

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
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: message,
        errors: [
          "Rate limit exceeded. Too many requests from this IP address.",
        ],
        statusCode: 429,
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    },
    keyGenerator: (req: Request) => {
      // Use IP address as the key for rate limiting
      const ip =
        req.ip || (req.headers["x-forwarded-for"] as string) || "unknown";
      return typeof ip === "string" ? ip : ip[0] || "unknown";
    },
    skip: (req: Request) => {
      // Skip rate limiting for health check endpoints
      if (req.path === "/health" || req.path === "/") {
        return true;
      }
      return false;
    },
  });
}

/**
 * Strict rate limiter for authentication endpoints
 * 5 attempts per 15 minutes
 */
export const authRateLimiter: RateLimitRequestHandler = createRateLimiter(
  15 * 60 * 1000,
  5,
  "Too many authentication attempts. Please try again after 15 minutes.",
);

/**
 * Standard rate limiter for API endpoints
 * 100 requests per 15 minutes
 */
export const standardRateLimiter: RateLimitRequestHandler = createRateLimiter(
  15 * 60 * 1000,
  100,
  "Too many requests. Please slow down and try again later.",
);

/**
 * Strict rate limiter for sensitive operations
 * 20 requests per hour
 */
export const strictRateLimiter: RateLimitRequestHandler = createRateLimiter(
  60 * 60 * 1000,
  20,
  "Rate limit exceeded for this operation. Please try again after an hour.",
);

/**
 * Relaxed rate limiter for read-only endpoints
 * 500 requests per 15 minutes
 */
export const relaxedRateLimiter: RateLimitRequestHandler = createRateLimiter(
  15 * 60 * 1000,
  500,
  "Too many requests. Please try again later.",
);

/**
 * Login rate limiter with stricter rules
 * 10 attempts per 30 minutes
 */
export const loginRateLimiter: RateLimitRequestHandler = createRateLimiter(
  30 * 60 * 1000,
  10,
  "Too many login attempts. Please try again after 30 minutes.",
);

/**
 * OTP rate limiter for verification codes
 * 3 attempts per 10 minutes
 */
export const otpRateLimiter: RateLimitRequestHandler = createRateLimiter(
  10 * 60 * 1000,
  3,
  "Too many OTP attempts. Please try again after 10 minutes.",
);

/**
 * Booking creation rate limiter
 * 10 bookings per 5 minutes
 */
export const bookingRateLimiter: RateLimitRequestHandler = createRateLimiter(
  5 * 60 * 1000,
  10,
  "Too many booking requests. Please slow down.",
);

/**
 * Provider registration rate limiter
 * 3 registrations per 24 hours from same IP
 */
export const providerRegistrationRateLimiter: RateLimitRequestHandler =
  createRateLimiter(
    24 * 60 * 60 * 1000,
    3,
    "Too many provider registration attempts from this IP. Please try again tomorrow.",
  );

/**
 * Review submission rate limiter
 * 15 reviews per 15 minutes
 */
export const reviewRateLimiter: RateLimitRequestHandler = createRateLimiter(
  15 * 60 * 1000,
  15,
  "Too many reviews submitted. Please slow down.",
);

/**
 * File upload rate limiter
 * 10 uploads per 5 minutes
 */
export const uploadRateLimiter: RateLimitRequestHandler = createRateLimiter(
  5 * 60 * 1000,
  10,
  "Too many file uploads. Please try again later.",
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
  otpRateLimiter,
  bookingRateLimiter,
  providerRegistrationRateLimiter,
  reviewRateLimiter,
  uploadRateLimiter,
};
