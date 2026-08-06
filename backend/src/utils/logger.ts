import winston from "winston";
import path from "path";
import fs from "fs";
import env from "../config/env";

// ============================================================
// LOGGER CONFIGURATION
// ============================================================

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Console format for development with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }

    // Add additional metadata if present
    if (Object.keys(meta).length > 0) {
      const metaString = JSON.stringify(meta, null, 2);
      if (metaString !== "{}") {
        log += `\n${metaString}`;
      }
    }

    return log;
  }),
);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const getLogLevel = (): string => {
  switch (env.NODE_ENV) {
    case "production":
      return "info";
    case "test":
      return "error";
    default:
      return "debug";
  }
};

// Create logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  format: logFormat,
  transports: [],
  exitOnError: false,
});

// Add transports based on environment

// Console transport for all environments
logger.add(
  new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
  }),
);

// File transport for production and development
if (env.NODE_ENV !== "test") {
  // Error log file
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
    }),
  );

  // Combined log file
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  );

  // HTTP request log file
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "http.log"),
      level: "http",
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  );
}

// ============================================================
// CUSTOM LOGGER METHODS
// ============================================================

/**
 * Log with metadata
 */
export function logWithMeta(
  level: "error" | "warn" | "info" | "http" | "debug",
  message: string,
  meta: Record<string, any> = {},
): void {
  logger.log(level, message, meta);
}

/**
 * Log an error with stack trace
 */
export function logError(
  error: Error | string,
  meta: Record<string, any> = {},
): void {
  if (error instanceof Error) {
    logger.error(error.message, { ...meta, stack: error.stack });
  } else {
    logger.error(error, meta);
  }
}

/**
 * Log an HTTP request
 */
export function logHttp(
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  meta: Record<string, any> = {},
): void {
  logger.http(`${method} ${url} ${statusCode} ${responseTime}ms`, {
    method,
    url,
    statusCode,
    responseTime,
    ...meta,
  });
}

/**
 * Log with a specific correlation ID for request tracing
 */
export function logWithCorrelation(
  correlationId: string,
  level: "error" | "warn" | "info" | "http" | "debug",
  message: string,
  meta: Record<string, any> = {},
): void {
  logger.log(level, message, { ...meta, correlationId });
}

// ============================================================
// CHILD LOGGER FOR MODULES
// ============================================================

/**
 * Create a child logger with default metadata
 */
export function createChildLogger(
  module: string,
  meta: Record<string, any> = {},
) {
  return {
    error: (message: string, extra: Record<string, any> = {}) =>
      logger.error(message, { module, ...meta, ...extra }),
    warn: (message: string, extra: Record<string, any> = {}) =>
      logger.warn(message, { module, ...meta, ...extra }),
    info: (message: string, extra: Record<string, any> = {}) =>
      logger.info(message, { module, ...meta, ...extra }),
    http: (message: string, extra: Record<string, any> = {}) =>
      logger.http(message, { module, ...meta, ...extra }),
    debug: (message: string, extra: Record<string, any> = {}) =>
      logger.debug(message, { module, ...meta, ...extra }),
  };
}

// ============================================================
// LOGGER CLEANUP
// ============================================================

/**
 * Close logger streams gracefully
 */
export function closeLogger(): void {
  logger.close();
}

// ============================================================
// EXPORTS
// ============================================================

export { logger };

export default logger;
