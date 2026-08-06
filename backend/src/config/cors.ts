import cors from "cors";
import env from "./env";
import logger from "../utils/logger";

// ============================================================
// CORS CONFIGURATION
// ============================================================

// Allowed origins for different environments
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Development origins
  if (env.NODE_ENV === "development") {
    origins.push("http://localhost:3000");
    origins.push("http://localhost:3001");
    origins.push("http://127.0.0.1:3000");
    origins.push("http://127.0.0.1:3001");
  }

  // Production origins from environment
  if (env.CORS_ORIGIN) {
    const customOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
    origins.push(...customOrigins);
  }

  // Default fallback
  if (origins.length === 0) {
    origins.push("http://localhost:3000");
  }

  return origins;
};

/**
 * Validate if an origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  const allowedOrigins = getAllowedOrigins();

  // Allow localhost variations in development
  if (env.NODE_ENV === "development") {
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return true;
    }
    if (origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
      return true;
    }
  }

  return allowedOrigins.includes(origin);
}

/**
 * CORS options configuration
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      if (env.NODE_ENV === "production") {
        logger.warn("Request with no origin received in production");
        callback(null, false);
        return;
      }
      callback(null, true);
      return;
    }

    // Check if origin is allowed
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    // Log blocked origins in development for debugging
    if (env.NODE_ENV === "development") {
      logger.warn(`CORS blocked origin: ${origin}`);
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Allowed HTTP methods
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],

  // Allowed headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Credentials",
  ],

  // Exposed headers (accessible from frontend)
  exposedHeaders: [
    "Content-Length",
    "X-Total-Count",
    "X-Page",
    "X-Limit",
    "X-Total-Pages",
  ],

  // Preflight cache duration (in seconds)
  maxAge: 86400, // 24 hours
};

/**
 * Create CORS middleware with logging
 */
export function createCorsMiddleware(): cors.CorsOptions {
  return corsOptions;
}

/**
 * Log CORS configuration on startup
 */
export function logCorsConfiguration(): void {
  const origins = getAllowedOrigins();
  logger.info(`CORS configured. Allowed origins: ${origins.join(", ")}`);
  logger.info(`CORS credentials: ${corsOptions.credentials}`);
  logger.info(`CORS max age: ${corsOptions.maxAge} seconds`);
}

// ============================================================
// EXPORTS
// ============================================================

export default createCorsMiddleware;
