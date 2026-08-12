import { Request, Response, NextFunction } from "express";
import cors from "cors";
import env from "../config/env";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface CorsOptions {
  origin?: string | string[] | boolean | RegExp | (string | RegExp)[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export interface CorsConfig {
  allowedOrigins: (string | RegExp)[];
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default CORS configuration
 */
const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
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
    "X-API-Key",
    "X-Correlation-ID",
    "X-Request-ID",
  ],
  exposedHeaders: [
    "Content-Length",
    "X-Total-Count",
    "X-Page",
    "X-Limit",
    "X-Total-Pages",
    "X-Cursor",
    "X-Next-Cursor",
    "X-Prev-Cursor",
    "X-Request-ID",
    "X-Cache",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Environment-specific allowed origins
 */
const ENVIRONMENT_ORIGINS: Record<string, string[]> = {
  development: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ],
  staging: [
    "https://staging.marketplace.com",
    "https://staging.api.marketplace.com",
  ],
  production: [
    "https://marketplace.com",
    "https://www.marketplace.com",
    "https://api.marketplace.com",
    "https://admin.marketplace.com",
  ],
};

// ============================================================
// ORIGIN VALIDATION
// ============================================================

/**
 * Validate and normalize origins
 */
function validateAndNormalizeOrigins(
  origins: (string | RegExp)[] | string | RegExp,
): (string | RegExp)[] {
  if (!origins) {
    return [];
  }

  if (Array.isArray(origins)) {
    return origins.map((origin) => {
      if (origin instanceof RegExp) {
        return origin;
      }
      return origin.trim();
    });
  }

  if (origins instanceof RegExp) {
    return [origins];
  }

  return [origins.trim()];
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(
  origin: string,
  allowedOrigins: (string | RegExp)[],
): boolean {
  if (!origin) {
    return false;
  }

  // Allow localhost in development
  if (env.NODE_ENV === "development") {
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return true;
    }
    if (origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
      return true;
    }
    if (origin.match(/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/)) {
      return true;
    }
  }

  // Check against allowed origins
  for (const allowed of allowedOrigins) {
    if (allowed instanceof RegExp) {
      if (allowed.test(origin)) {
        return true;
      }
    } else if (allowed === origin) {
      return true;
    }
  }

  return false;
}

/**
 * Get allowed origins for current environment
 */
export function getAllowedOrigins(): (string | RegExp)[] {
  const origins: (string | RegExp)[] = [];

  // Add environment-specific origins
  const envOrigins = ENVIRONMENT_ORIGINS[env.NODE_ENV];
  if (envOrigins) {
    origins.push(...envOrigins);
  }

  // Add custom origins from environment variable
  if (env.CORS_ORIGIN) {
    const customOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
    origins.push(...customOrigins);
  }

  // Add fallback origins
  if (origins.length === 0) {
    origins.push("http://localhost:3000");
    origins.push("http://localhost:3001");
  }

  return origins;
}

// ============================================================
// CORS OPTIONS BUILDING
// ============================================================

/**
 * Build CORS options
 */
export function buildCorsOptions(
  config: Partial<CorsConfig> = {},
): cors.CorsOptions {
  const cfg = { ...DEFAULT_CORS_CONFIG, ...config };

  const allowedOrigins = config.allowedOrigins || getAllowedOrigins();

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
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
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      // Log blocked origins in development for debugging
      if (env.NODE_ENV === "development") {
        logger.warn(`CORS blocked origin: ${origin}`);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: cfg.methods,
    allowedHeaders: cfg.allowedHeaders,
    exposedHeaders: cfg.exposedHeaders,
    credentials: cfg.credentials,
    maxAge: cfg.maxAge,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}

// ============================================================
// CORS MIDDLEWARE
// ============================================================

/**
 * Create CORS middleware with custom configuration
 */
export function createCorsMiddleware(
  config: Partial<CorsConfig> = {},
): ReturnType<typeof cors> {
  const options = buildCorsOptions(config);

  // Add logging for CORS requests
  const corsMiddleware = cors(options);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Log CORS requests in development
    if (env.NODE_ENV === "development") {
      const origin = req.headers.origin;
      if (origin) {
        logger.debug(
          `CORS request from ${origin} to ${req.method} ${req.path}`,
        );
      }
    }

    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      const origin = req.headers.origin;
      if (origin) {
        // Check if origin is allowed
        const allowedOrigins = config.allowedOrigins || getAllowedOrigins();
        if (isOriginAllowed(origin, allowedOrigins)) {
          // Set preflight headers
          res.setHeader("Access-Control-Allow-Origin", origin);
          res.setHeader(
            "Access-Control-Allow-Methods",
            DEFAULT_CORS_CONFIG.methods.join(", "),
          );
          res.setHeader(
            "Access-Control-Allow-Headers",
            DEFAULT_CORS_CONFIG.allowedHeaders.join(", "),
          );
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader(
            "Access-Control-Max-Age",
            String(DEFAULT_CORS_CONFIG.maxAge),
          );

          // Send preflight response
          res.status(204).send();
          return;
        }
      }
    }

    // Apply CORS middleware
    corsMiddleware(req, res, next);
  };
}

// ============================================================
// DEFAULT CORS MIDDLEWARE
// ============================================================

/**
 * Default CORS middleware instance
 */
export const corsMiddleware = createCorsMiddleware();

// ============================================================
// CORS HELPERS
// ============================================================

/**
 * Log CORS configuration on startup
 */
export function logCorsConfiguration(): void {
  const origins = getAllowedOrigins();
  logger.info(
    `CORS configured. Allowed origins: ${origins.length > 0 ? origins.join(", ") : "none"}`,
  );
  logger.info(`CORS credentials: ${DEFAULT_CORS_CONFIG.credentials}`);
  logger.info(`CORS methods: ${DEFAULT_CORS_CONFIG.methods.join(", ")}`);
  logger.info(`CORS max age: ${DEFAULT_CORS_CONFIG.maxAge} seconds`);
  logger.info(`Environment: ${env.NODE_ENV}`);
}

/**
 * Get CORS headers for manual response
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": DEFAULT_CORS_CONFIG.methods.join(", "),
    "Access-Control-Allow-Headers":
      DEFAULT_CORS_CONFIG.allowedHeaders.join(", "),
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": String(DEFAULT_CORS_CONFIG.maxAge),
  };

  if (origin) {
    const allowedOrigins = getAllowedOrigins();
    if (isOriginAllowed(origin, allowedOrigins)) {
      headers["Access-Control-Allow-Origin"] = origin;
    } else if (env.NODE_ENV !== "production") {
      headers["Access-Control-Allow-Origin"] = origin;
    }
  }

  return headers;
}

/**
 * Validate CORS configuration
 */
export function validateCorsConfiguration(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const origins = getAllowedOrigins();

  if (origins.length === 0) {
    errors.push("No allowed origins configured");
  }

  // Check for wildcard with credentials
  const hasWildcard = origins.some((o) => typeof o === "string" && o === "*");
  if (hasWildcard && DEFAULT_CORS_CONFIG.credentials) {
    errors.push("Cannot use wildcard origin with credentials enabled");
  }

  // Check for empty allowed headers
  if (DEFAULT_CORS_CONFIG.allowedHeaders.length === 0) {
    errors.push("No allowed headers configured");
  }

  // Check for empty methods
  if (DEFAULT_CORS_CONFIG.methods.length === 0) {
    errors.push("No methods configured");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// SELECTIVE CORS
// ============================================================

/**
 * Create CORS middleware for specific routes
 */
export function selectiveCors(
  routes: string[],
  config: Partial<CorsConfig> = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const corsMiddleware = createCorsMiddleware(config);

  return (req: Request, res: Response, next: NextFunction): void => {
    const matchesRoute = routes.some((route) => req.path.startsWith(route));

    if (matchesRoute) {
      // Apply CORS for matched routes
      corsMiddleware(req, res, next);
    } else {
      // Skip CORS for other routes
      next();
    }
  };
}

/**
 * Strict CORS middleware (more restrictive)
 */
export const strictCors = createCorsMiddleware({
  allowedOrigins: ["https://marketplace.com", "https://www.marketplace.com"],
  credentials: true,
  maxAge: 3600, // 1 hour
});

/**
 * Permissive CORS middleware (development only)
 */
export const permissiveCors = createCorsMiddleware({
  allowedOrigins: ["*"],
  credentials: false,
  maxAge: 3600,
});

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Main middleware
  corsMiddleware,

  // Custom middlewares
  createCorsMiddleware,
  selectiveCors,
  strictCors,
  permissiveCors,

  // Helpers
  isOriginAllowed,
  getAllowedOrigins,
  getCorsHeaders,
  logCorsConfiguration,
  validateCorsConfiguration,

  // Constants
  DEFAULT_CORS_CONFIG,
  ENVIRONMENT_ORIGINS,
};
