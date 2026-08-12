import morgan from "morgan";
import { Request, Response } from "express";
import logger from "../utils/logger";
import env from "../config/env";

// ============================================================
// TYPES
// ============================================================

export interface MorganConfig {
  format?: "combined" | "common" | "dev" | "short" | "tiny" | string;
  stream?: { write: (message: string) => void };
  skip?: (req: Request, res: Response) => boolean;
  immediate?: boolean;
}

export interface RequestLogData {
  method: string;
  url: string;
  status: number;
  responseTime: number;
  contentLength: string;
  referrer: string;
  userAgent: string;
  ip: string;
  userId?: string;
}

// ============================================================
// TOKENS
// ============================================================

/**
 * Custom Morgan tokens
 */

// User ID token
morgan.token("user-id", (req: Request) => {
  return (req as any).user?.id || "-";
});

// User role token
morgan.token("user-role", (req: Request) => {
  return (req as any).user?.role || "-";
});

// Request ID token
morgan.token("request-id", (req: Request) => {
  return (req as any).requestId || "-";
});

// Correlation ID token
morgan.token("correlation-id", (req: Request) => {
  return (req.headers["x-correlation-id"] as string) || "-";
});

// Duration in milliseconds
morgan.token("duration", (req: Request, res: Response) => {
  const start = (req as any).startTime || Date.now();
  const duration = Date.now() - start;
  return duration.toString();
});

// Response size in bytes
morgan.token("response-size", (req: Request, res: Response) => {
  return res.getHeader("content-length") || "-";
});

// JSON body (for development)
morgan.token("body", (req: Request) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return "-";
  }
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      const masked = maskSensitiveFields(req.body);
      return JSON.stringify(masked);
    } catch {
      return "-";
    }
  }
  return "-";
});

// Query parameters (for development)
morgan.token("query", (req: Request) => {
  if (req.query && Object.keys(req.query).length > 0) {
    try {
      return JSON.stringify(req.query);
    } catch {
      return "-";
    }
  }
  return "-";
});

// HTTP version
morgan.token("http-version", (req: Request) => {
  return req.httpVersion || "-";
});

// Protocol
morgan.token("protocol", (req: Request) => {
  return req.protocol || "-";
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Mask sensitive fields in request body
 */
function maskSensitiveFields(body: any): any {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sensitiveFields = [
    "password",
    "passwordHash",
    "currentPassword",
    "newPassword",
    "confirmPassword",
    "token",
    "refreshToken",
    "accessToken",
    "secret",
    "apiKey",
    "authorization",
  ];

  const result = { ...body };

  for (const field of sensitiveFields) {
    if (result[field] !== undefined) {
      result[field] = "[REDACTED]";
    }
  }

  return result;
}

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// ============================================================
// LOG FORMATS
// ============================================================

/**
 * Standard log format with all tokens
 */
export const LOG_FORMATS = {
  /**
   * Full format with all details
   */
  FULL: ":method :url :status :response-time ms - :res[content-length] - :user-id :user-role - :request-id - :referrer - :user-agent - :remote-addr",

  /**
   * JSON format for structured logging
   */
  JSON: (tokens: any, req: Request, res: Response): string => {
    const data = {
      timestamp: new Date().toISOString(),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      responseTime: Number(tokens["response-time"](req, res)),
      contentLength: tokens.res(req, res, "content-length") || "-",
      userAgent: tokens["user-agent"](req, res),
      referrer: tokens.referrer(req, res),
      ip: getClientIp(req),
      userId: tokens["user-id"](req, res),
      userRole: tokens["user-role"](req, res),
      requestId: tokens["request-id"](req, res),
      correlationId: tokens["correlation-id"](req, res),
      httpVersion: tokens["http-version"](req, res),
      protocol: tokens.protocol(req, res),
    };

    // Add body and query in development
    if (env.NODE_ENV === "development") {
      (data as any).body = tokens.body(req, res);
      (data as any).query = tokens.query(req, res);
    }

    return JSON.stringify(data);
  },

  /**
   * Short format for development
   */
  DEV: ":method :url :status :response-time ms - :user-id",

  /**
   * Combined format (Apache combined log format)
   */
  COMBINED:
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',

  /**
   * Custom format for API monitoring
   */
  API: ":method :url :status :duration ms - :user-id :user-role - :request-id",
};

// ============================================================
// SKIP FUNCTIONS
// ============================================================

/**
 * Default skip function
 */
export function defaultSkip(req: Request, res: Response): boolean {
  // Skip health checks and static assets
  const skipPaths = ["/health", "/ping", "/robots.txt", "/favicon.ico"];
  if (skipPaths.includes(req.path)) {
    return true;
  }

  // Skip if status code is 304 (Not Modified)
  if (res.statusCode === 304) {
    return true;
  }

  // Skip OPTIONS requests
  if (req.method === "OPTIONS") {
    return true;
  }

  return false;
}

/**
 * Skip in test environment
 */
export function skipInTest(req: Request, res: Response): boolean {
  return env.NODE_ENV === "test" || defaultSkip(req, res);
}

/**
 * Skip in production for performance
 */
export function skipInProduction(req: Request, res: Response): boolean {
  if (env.NODE_ENV === "production") {
    // Only log errors and slow requests
    if (
      res.statusCode < 400 &&
      (res.statusCode < 200 || res.statusCode >= 300)
    ) {
      return true;
    }
  }
  return defaultSkip(req, res);
}

// ============================================================
// STREAM FUNCTIONS
// ============================================================

/**
 * Default stream using Winston logger
 */
export const defaultStream = {
  write: (message: string) => {
    // Remove trailing newline
    const msg = message.trim();
    if (msg) {
      logger.http(msg);
    }
  },
};

/**
 * Stream for JSON logging
 */
export const jsonStream = {
  write: (message: string) => {
    try {
      const data = JSON.parse(message);
      logger.http("API Request", { ...data });
    } catch {
      logger.http(message.trim());
    }
  },
};

/**
 * Stream for file logging only (no console)
 */
export const fileStream = {
  write: (message: string) => {
    // Log to file via Winston file transport
    const msg = message.trim();
    if (msg) {
      logger.http(msg);
    }
  },
};

// ============================================================
// CREATE MORGAN MIDDLEWARE
// ============================================================

/**
 * Create Morgan middleware with custom configuration
 */
export function createMorganMiddleware(
  config: Partial<MorganConfig> = {},
): ReturnType<typeof morgan> {
  const format = config.format || LOG_FORMATS.FULL;
  const stream = config.stream || defaultStream;
  const skip = config.skip || defaultSkip;
  const immediate = config.immediate || false;

  return morgan(format, {
    stream,
    skip,
    immediate,
  });
}

// ============================================================
// MORGAN MIDDLEWARES
// ============================================================

/**
 * Default Morgan middleware
 */
export const morganMiddleware = createMorganMiddleware();

/**
 * Development Morgan middleware (detailed)
 */
export const devMorgan = createMorganMiddleware({
  format: LOG_FORMATS.DEV,
  skip: defaultSkip,
});

/**
 * JSON Morgan middleware (structured logging)
 */
export const jsonMorgan = createMorganMiddleware({
  format: LOG_FORMATS.JSON,
  stream: jsonStream,
  skip: defaultSkip,
});

/**
 * Production Morgan middleware (minimal)
 */
export const prodMorgan = createMorganMiddleware({
  format: LOG_FORMATS.API,
  skip: skipInProduction,
});

/**
 * Combined log format Morgan
 */
export const combinedMorgan = createMorganMiddleware({
  format: LOG_FORMATS.COMBINED,
});

/**
 * Error-only Morgan middleware
 */
export const errorMorgan = createMorganMiddleware({
  format: ":method :url :status :response-time ms - :user-id",
  skip: (req: Request, res: Response) => {
    return res.statusCode < 400 || defaultSkip(req, res);
  },
});

/**
 * Slow request Morgan middleware
 */
export const slowRequestMorgan = createMorganMiddleware({
  format: "SLOW REQUEST: :method :url :status :duration ms - :user-id",
  skip: (req: Request, res: Response) => {
    const start = (req as any).startTime || Date.now();
    const duration = Date.now() - start;
    return duration < 1000 || defaultSkip(req, res);
  },
});

// ============================================================
// REQUEST LOGGING HELPERS
// ============================================================

/**
 * Log request details manually
 */
export function logRequest(
  req: Request,
  res: Response,
  startTime: number,
): void {
  const duration = Date.now() - startTime;
  const data: RequestLogData = {
    method: req.method,
    url: req.originalUrl || req.url,
    status: res.statusCode,
    responseTime: duration,
    contentLength: (res.getHeader("content-length") as string) || "0",
    referrer: req.headers.referer || req.headers.referrer || "-",
    userAgent: req.headers["user-agent"] || "-",
    ip: getClientIp(req),
    userId: (req as any).user?.id,
  };

  logger.http(
    `${data.method} ${data.url} ${data.status} ${data.responseTime}ms`,
    {
      ...data,
      metadata: {
        request: {
          method: data.method,
          url: data.url,
          ip: data.ip,
          userId: data.userId,
        },
        response: {
          status: data.status,
          duration: data.responseTime,
          size: data.contentLength,
        },
      },
    },
  );
}

/**
 * Log request start
 */
export function logRequestStart(req: Request): void {
  logger.debug(`Request started: ${req.method} ${req.originalUrl || req.url}`, {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"],
  });
}

/**
 * Log request completion
 */
export function logRequestComplete(
  req: Request,
  res: Response,
  startTime: number,
): void {
  const duration = Date.now() - startTime;
  const status = res.statusCode;

  // Log level based on status code
  if (status >= 500) {
    logger.error(
      `Request failed: ${req.method} ${req.originalUrl || req.url} ${status} ${duration}ms`,
    );
  } else if (status >= 400) {
    logger.warn(
      `Request error: ${req.method} ${req.originalUrl || req.url} ${status} ${duration}ms`,
    );
  } else {
    logger.http(
      `Request completed: ${req.method} ${req.originalUrl || req.url} ${status} ${duration}ms`,
    );
  }
}

// ============================================================
// REQUEST LOGGING MIDDLEWARE (manual)
// ============================================================

/**
 * Manual request logging middleware (alternative to Morgan)
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: Function,
): void {
  const startTime = Date.now();

  // Store start time for later use
  (req as any).startTime = startTime;

  // Log request start
  logRequestStart(req);

  // Override end to log completion
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any, cb?: any): any {
    logRequestComplete(req, res, startTime);
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Main middleware
  morganMiddleware,

  // Custom middlewares
  createMorganMiddleware,
  devMorgan,
  jsonMorgan,
  prodMorgan,
  combinedMorgan,
  errorMorgan,
  slowRequestMorgan,

  // Log formats
  LOG_FORMATS,

  // Skip functions
  defaultSkip,
  skipInTest,
  skipInProduction,

  // Streams
  defaultStream,
  jsonStream,
  fileStream,

  // Helpers
  logRequest,
  logRequestStart,
  logRequestComplete,
  requestLoggerMiddleware,
  maskSensitiveFields,
  getClientIp,
};
