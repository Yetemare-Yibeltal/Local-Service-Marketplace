import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { MulterError } from "multer";
import logger from "../utils/logger";
import { sendError } from "../utils/response";

// ============================================================
// ERROR TYPES
// ============================================================

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
  errors?: string[];
}

// ============================================================
// ERROR CLASSIFICATION
// ============================================================

/**
 * Classify error and determine appropriate status code and message
 */
export function classifyError(error: any): {
  statusCode: number;
  message: string;
  errors: string[];
} {
  // Default values
  let statusCode = 500;
  let message = "Internal server error";
  const errors: string[] = [];

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed";
    error.errors.forEach((err) => {
      errors.push(`${err.path.join(".")}: ${err.message}`);
    });
    return { statusCode, message, errors };
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2000":
        statusCode = 400;
        message = "Invalid input data";
        errors.push(error.message);
        break;
      case "P2001":
        statusCode = 404;
        message = "Record not found";
        errors.push("The requested record does not exist");
        break;
      case "P2002":
        statusCode = 409;
        message = "Duplicate entry";
        const target = error.meta?.target as string[];
        errors.push(`${target?.join(", ")} already exists`);
        break;
      case "P2003":
        statusCode = 400;
        message = "Foreign key constraint failed";
        errors.push("Referenced record does not exist");
        break;
      case "P2025":
        statusCode = 404;
        message = "Record not found";
        errors.push("The requested record does not exist");
        break;
      default:
        statusCode = 400;
        message = "Database error";
        errors.push(error.message);
    }
    return { statusCode, message, errors };
  }

  // Handle JWT errors
  if (error instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token";
    errors.push("Authentication token is invalid");
    return { statusCode, message, errors };
  }

  if (error instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Token expired";
    errors.push("Authentication token has expired");
    return { statusCode, message, errors };
  }

  // Handle Multer errors
  if (error instanceof MulterError) {
    statusCode = 400;
    message = "File upload error";

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        errors.push("File size exceeds limit");
        break;
      case "LIMIT_FILE_COUNT":
        errors.push("Too many files uploaded");
        break;
      case "LIMIT_UNEXPECTED_FILE":
        errors.push("Unexpected file field");
        break;
      default:
        errors.push(error.message);
    }
    return { statusCode, message, errors };
  }

  // Handle AppError (custom)
  if (error instanceof Error && (error as AppError).statusCode) {
    const appError = error as AppError;
    statusCode = appError.statusCode || 500;
    message = appError.message || "Internal server error";
    if (appError.errors) {
      errors.push(...appError.errors);
    } else {
      errors.push(message);
    }
    return { statusCode, message, errors };
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Extract database error messages
    if (error.message.includes("Unique constraint")) {
      statusCode = 409;
      message = "Duplicate entry";
      errors.push(error.message);
      return { statusCode, message, errors };
    }

    // Handle specific error messages
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes("not found")) {
      statusCode = 404;
      message = "Resource not found";
      errors.push(error.message);
      return { statusCode, message, errors };
    }

    if (
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("unauthenticated")
    ) {
      statusCode = 401;
      message = "Unauthorized";
      errors.push(error.message);
      return { statusCode, message, errors };
    }

    if (errorMessage.includes("forbidden")) {
      statusCode = 403;
      message = "Forbidden";
      errors.push(error.message);
      return { statusCode, message, errors };
    }

    statusCode = 400;
    message = error.message;
    errors.push(error.message);
    return { statusCode, message, errors };
  }

  // Unknown error
  return { statusCode, message, errors };
}

// ============================================================
// ERROR LOGGING
// ============================================================

/**
 * Log error with appropriate level and context
 */
export function logError(error: any, req: Request): void {
  const errorInfo = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: (error as AppError).statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"],
      userId: (req as any).user?.id,
    },
  };

  // Log with appropriate level
  const statusCode = (error as AppError).statusCode || 500;
  if (statusCode >= 500) {
    logger.error("Server error:", errorInfo);
  } else if (statusCode >= 400) {
    logger.warn("Client error:", errorInfo);
  } else {
    logger.info("Error:", errorInfo);
  }
}

// ============================================================
// SHOULD EXPOSE ERROR DETAILS
// ============================================================

/**
 * Determine if error details should be exposed to client
 */
export function shouldExposeDetails(error: any): boolean {
  // In development, expose all details
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // In production, only expose specific error types
  if (error instanceof ZodError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (["P2000", "P2002", "P2025"].includes(error.code)) {
      return true;
    }
    return false;
  }

  if (
    error instanceof JsonWebTokenError ||
    error instanceof TokenExpiredError
  ) {
    return false;
  }

  // AppError with explicit errors
  if ((error as AppError).errors) {
    return true;
  }

  return false;
}

// ============================================================
// MAIN ERROR HANDLER
// ============================================================

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void {
  // Log error
  logError(err, req);

  // Classify error
  const { statusCode, message, errors } = classifyError(err);

  // Determine if details should be exposed
  const exposeDetails = shouldExposeDetails(err);

  // Build error response
  const response: any = {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (exposeDetails && errors.length > 0) {
    response.errors = errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === "development" && err.stack) {
    response.stack = err.stack;
  }

  // Add validation errors if available
  if (err instanceof ZodError && process.env.NODE_ENV !== "production") {
    response.validationErrors = err.errors;
  }

  // Send response
  return res.status(statusCode).json(response);
}

// ============================================================
// ASYNC ERROR WRAPPER
// ============================================================

/**
 * Wrapper for async route handlers to catch errors
 */
export function catchAsync<T extends (...args: any[]) => any>(
  fn: T,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next)).catch((error) => {
      // Enhance error with request context
      (error as AppError).statusCode = (error as AppError).statusCode || 500;
      next(error);
    });
  };
}

// ============================================================
// NOT FOUND HANDLER
// ============================================================

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Response {
  const error: AppError = new Error(
    `Route ${req.method} ${req.originalUrl} not found`,
  );
  error.statusCode = 404;
  error.errors = ["The requested resource was not found"];

  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);

  return sendError(res, "Route not found", 404, [
    `${req.method} ${req.originalUrl} does not exist`,
  ]);
}

// ============================================================
// RATE LIMIT ERROR HANDLER
// ============================================================

/**
 * Rate limit error handler
 */
export function rateLimitErrorHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Response {
  return sendError(res, "Too many requests. Please try again later.", 429, [
    "Rate limit exceeded",
  ]);
}

// ============================================================
// UNHANDLED REJECTION HANDLER
// ============================================================

/**
 * Handle unhandled promise rejections
 */
export function handleUnhandledRejection(
  reason: any,
  promise: Promise<any>,
): void {
  logger.error("Unhandled Rejection:", {
    reason,
    promise,
  });
}

/**
 * Handle uncaught exceptions
 */
export function handleUncaughtException(error: Error): void {
  logger.error("Uncaught Exception:", {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });

  // Exit process after logging
  process.exit(1);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  errorHandler,
  catchAsync,
  notFoundHandler,
  rateLimitErrorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  classifyError,
  logError,
  shouldExposeDetails,
};
