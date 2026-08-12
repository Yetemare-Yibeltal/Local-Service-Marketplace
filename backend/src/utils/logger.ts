import winston from "winston";
import path from "path";
import fs from "fs";
import env from "../config/env";
import { createModuleLogger as createWinstonModuleLogger } from "../config/logger";

// ============================================================
// TYPES
// ============================================================

export interface LogMeta {
  [key: string]: any;
}

export interface LogOptions {
  module?: string;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  metadata?: LogMeta;
}

export interface LogEntry {
  level: "error" | "warn" | "info" | "debug" | "http";
  message: string;
  timestamp: string;
  module?: string;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  metadata?: LogMeta;
  stack?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Log levels with priorities
 */
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  HTTP: "http",
  DEBUG: "debug",
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

/**
 * Log level priorities (higher number = more severe)
 */
export const LOG_PRIORITY: Record<LogLevel, number> = {
  error: 5,
  warn: 4,
  info: 3,
  http: 2,
  debug: 1,
};

// ============================================================
// MAIN LOGGER
// ============================================================

/**
 * Main logger instance
 */
const loggerInstance = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// ============================================================
// LOGGING FUNCTIONS
// ============================================================

/**
 * Log an error message
 */
export function logError(message: string, options: LogOptions = {}): void {
  loggerInstance.error(message, {
    module: options.module,
    correlationId: options.correlationId,
    userId: options.userId,
    requestId: options.requestId,
    ...options.metadata,
  });
}

/**
 * Log a warning message
 */
export function logWarn(message: string, options: LogOptions = {}): void {
  loggerInstance.warn(message, {
    module: options.module,
    correlationId: options.correlationId,
    userId: options.userId,
    requestId: options.requestId,
    ...options.metadata,
  });
}

/**
 * Log an info message
 */
export function logInfo(message: string, options: LogOptions = {}): void {
  loggerInstance.info(message, {
    module: options.module,
    correlationId: options.correlationId,
    userId: options.userId,
    requestId: options.requestId,
    ...options.metadata,
  });
}

/**
 * Log a debug message
 */
export function logDebug(message: string, options: LogOptions = {}): void {
  loggerInstance.debug(message, {
    module: options.module,
    correlationId: options.correlationId,
    userId: options.userId,
    requestId: options.requestId,
    ...options.metadata,
  });
}

/**
 * Log an HTTP request
 */
export function logHttp(message: string, options: LogOptions = {}): void {
  loggerInstance.http(message, {
    module: options.module || "http",
    correlationId: options.correlationId,
    userId: options.userId,
    requestId: options.requestId,
    ...options.metadata,
  });
}

/**
 * Log with dynamic level
 */
export function log(
  level: LogLevel,
  message: string,
  options: LogOptions = {},
): void {
  const logFn = {
    error: logError,
    warn: logWarn,
    info: logInfo,
    http: logHttp,
    debug: logDebug,
  };

  const fn = logFn[level];
  if (fn) {
    fn(message, options);
  }
}

// ============================================================
// CHILD LOGGER
// ============================================================

/**
 * Create a child logger with preset metadata
 */
export function createChildLogger(
  module: string,
  defaultOptions: Partial<LogOptions> = {},
): {
  error: (message: string, options?: LogOptions) => void;
  warn: (message: string, options?: LogOptions) => void;
  info: (message: string, options?: LogOptions) => void;
  debug: (message: string, options?: LogOptions) => void;
  http: (message: string, options?: LogOptions) => void;
  log: (level: LogLevel, message: string, options?: LogOptions) => void;
  child: (name: string) => any;
} {
  const childOptions: LogOptions = {
    module,
    ...defaultOptions,
  };

  return {
    error: (message: string, options: LogOptions = {}) => {
      logError(message, { ...childOptions, ...options });
    },
    warn: (message: string, options: LogOptions = {}) => {
      logWarn(message, { ...childOptions, ...options });
    },
    info: (message: string, options: LogOptions = {}) => {
      logInfo(message, { ...childOptions, ...options });
    },
    debug: (message: string, options: LogOptions = {}) => {
      logDebug(message, { ...childOptions, ...options });
    },
    http: (message: string, options: LogOptions = {}) => {
      logHttp(message, { ...childOptions, ...options });
    },
    log: (level: LogLevel, message: string, options: LogOptions = {}) => {
      log(level, message, { ...childOptions, ...options });
    },
    child: (name: string) =>
      createChildLogger(`${module}:${name}`, defaultOptions),
  };
}

// ============================================================
// CONTEXT LOGGING
// ============================================================

/**
 * Log with correlation ID context
 */
export function logWithCorrelation(
  correlationId: string,
  level: LogLevel,
  message: string,
  options: Omit<LogOptions, "correlationId"> = {},
): void {
  log(level, message, {
    correlationId,
    ...options,
  });
}

/**
 * Log with user context
 */
export function logWithUser(
  userId: string,
  level: LogLevel,
  message: string,
  options: Omit<LogOptions, "userId"> = {},
): void {
  log(level, message, {
    userId,
    ...options,
  });
}

/**
 * Log with request context
 */
export function logWithRequest(
  requestId: string,
  level: LogLevel,
  message: string,
  options: Omit<LogOptions, "requestId"> = {},
): void {
  log(level, message, {
    requestId,
    ...options,
  });
}

// ============================================================
// PERFORMANCE LOGGING
// ============================================================

/**
 * Start a performance timer
 */
export function startPerformanceTimer(): { start: number; end: () => number } {
  const start = Date.now();
  return {
    start,
    end: () => Date.now() - start,
  };
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  options: LogOptions = {},
): void {
  logInfo(`Performance: ${operation} completed in ${duration}ms`, {
    ...options,
    metadata: {
      ...options.metadata,
      performance: {
        operation,
        duration,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

/**
 * Measure and log execution time of a function
 */
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  options: LogOptions = {},
): Promise<T> {
  const timer = startPerformanceTimer();
  try {
    const result = await fn();
    const duration = timer.end();
    logPerformance(operation, duration, options);
    return result;
  } catch (error) {
    const duration = timer.end();
    logError(`Performance: ${operation} failed after ${duration}ms`, {
      ...options,
      metadata: {
        ...options.metadata,
        performance: {
          operation,
          duration,
          error: error instanceof Error ? error.message : String(error),
        },
      },
    });
    throw error;
  }
}

/**
 * Measure sync function execution time
 */
export function measureTimeSync<T>(
  operation: string,
  fn: () => T,
  options: LogOptions = {},
): T {
  const timer = startPerformanceTimer();
  try {
    const result = fn();
    const duration = timer.end();
    logPerformance(operation, duration, options);
    return result;
  } catch (error) {
    const duration = timer.end();
    logError(`Performance: ${operation} failed after ${duration}ms`, {
      ...options,
      metadata: {
        ...options.metadata,
        performance: {
          operation,
          duration,
          error: error instanceof Error ? error.message : String(error),
        },
      },
    });
    throw error;
  }
}

// ============================================================
// STRUCTURED LOGGING
// ============================================================

/**
 * Create a structured log entry
 */
export function createLogEntry(
  level: LogLevel,
  message: string,
  options: LogOptions = {},
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (options.module) entry.module = options.module;
  if (options.correlationId) entry.correlationId = options.correlationId;
  if (options.userId) entry.userId = options.userId;
  if (options.requestId) entry.requestId = options.requestId;
  if (options.metadata) entry.metadata = options.metadata;

  return entry;
}

/**
 * Log structured data
 */
export function logStructured(
  level: LogLevel,
  message: string,
  data: any,
  options: LogOptions = {},
): void {
  const metadata = {
    ...options.metadata,
    structuredData: data,
  };

  log(level, message, {
    ...options,
    metadata,
  });
}

// ============================================================
// LOG LEVEL MANAGEMENT
// ============================================================

/**
 * Get current log level
 */
export function getLogLevel(): string {
  return loggerInstance.level;
}

/**
 * Set log level
 */
export function setLogLevel(level: LogLevel): void {
  loggerInstance.level = level;
  loggerInstance.transports.forEach((transport) => {
    transport.level = level;
  });
}

/**
 * Check if log level is enabled
 */
export function isLogLevelEnabled(level: LogLevel): boolean {
  const current = LOG_PRIORITY[getLogLevel() as LogLevel] || 3;
  const target = LOG_PRIORITY[level] || 3;
  return target >= current;
}

// ============================================================
// LOG FILE MANAGEMENT
// ============================================================

/**
 * Get log file path
 */
export function getLogFilePath(filename: string = "app.log"): string {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return path.join(logDir, filename);
}

/**
 * Clear log files
 */
export function clearLogFiles(): void {
  const logDir = path.join(process.cwd(), "logs");
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir);
    for (const file of files) {
      if (file.endsWith(".log")) {
        fs.unlinkSync(path.join(logDir, file));
      }
    }
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  LogMeta,
  LogOptions,
  LogEntry,
  LogLevel,

  // Constants
  LOG_LEVELS,
  LOG_PRIORITY,

  // Main logging functions
  logError,
  logWarn,
  logInfo,
  logDebug,
  logHttp,
  log,

  // Child logger
  createChildLogger,

  // Context logging
  logWithCorrelation,
  logWithUser,
  logWithRequest,

  // Performance logging
  startPerformanceTimer,
  logPerformance,
  measureTime,
  measureTimeSync,

  // Structured logging
  createLogEntry,
  logStructured,

  // Log level management
  getLogLevel,
  setLogLevel,
  isLogLevelEnabled,

  // Log file management
  getLogFilePath,
  clearLogFiles,

  // The logger instance
  logger: loggerInstance,
};
