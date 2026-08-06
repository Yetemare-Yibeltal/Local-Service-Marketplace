import winston from "winston";
import path from "path";
import fs from "fs";
import env from "./env";

// ============================================================
// LOGGER CONFIGURATION
// ============================================================

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define custom log levels
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

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }

    // Add additional metadata if present
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      const filteredMeta: Record<string, any> = {};
      metaKeys.forEach((key) => {
        if (
          key !== "timestamp" &&
          key !== "level" &&
          key !== "message" &&
          key !== "stack"
        ) {
          filteredMeta[key] = meta[key];
        }
      });
      if (Object.keys(filteredMeta).length > 0) {
        log += `\n${JSON.stringify(filteredMeta, null, 2)}`;
      }
    }

    return log;
  }),
);

// Custom format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Create logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  format: fileFormat,
  transports: [],
  exitOnError: false,
});

// Console transport for all environments
logger.add(
  new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true,
  }),
);

// File transports for non-test environments
if (env.NODE_ENV !== "test") {
  // Error log file - only errors
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true,
    }),
  );

  // Combined log file - all levels
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  );

  // HTTP request log file - http level only
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "http.log"),
      level: "http",
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  );

  // Debug log file - debug level only
  if (env.NODE_ENV === "development") {
    logger.add(
      new winston.transports.File({
        filename: path.join(logDir, "debug.log"),
        level: "debug",
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 3,
      }),
    );
  }
}

// ============================================================
// STREAM FOR MORGAN
// ============================================================

/**
 * Stream for Morgan HTTP logging
 */
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create a child logger with a specific module name
 */
export function createModuleLogger(module: string) {
  return logger.child({ module });
}

/**
 * Log an error with additional context
 */
export function logError(
  error: Error | string,
  context?: Record<string, any>,
): void {
  if (error instanceof Error) {
    logger.error(error.message, {
      stack: error.stack,
      name: error.name,
      ...context,
    });
  } else {
    logger.error(error, context);
  }
}

/**
 * Log API request details
 */
export function logApiRequest(
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  ip?: string,
  userId?: string,
): void {
  logger.http(`${method} ${url} ${statusCode} ${responseTime}ms`, {
    method,
    url,
    statusCode,
    responseTime,
    ip,
    userId,
  });
}

/**
 * Log database query
 */
export function logDatabaseQuery(
  query: string,
  params?: any[],
  duration?: number,
): void {
  if (env.NODE_ENV === "development") {
    logger.debug(`DB Query: ${query}`, {
      params,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

/**
 * Close all logger transports
 */
export function closeLogger(): void {
  logger.close();
}

// Handle process termination
process.on("SIGTERM", () => {
  closeLogger();
});

process.on("SIGINT", () => {
  closeLogger();
});

// ============================================================
// EXPORTS
// ============================================================

export default logger;
export { logger };
