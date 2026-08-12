// ============================================================
// ERROR TYPES
// Complete error type definitions for the application
// ============================================================

// ============================================================
// ERROR CODES
// ============================================================

/**
 * Application error codes
 */
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
  INVALID_TYPE = "INVALID_TYPE",
  MAX_LENGTH_EXCEEDED = "MAX_LENGTH_EXCEEDED",
  MIN_LENGTH_REQUIRED = "MIN_LENGTH_REQUIRED",
  INVALID_ENUM_VALUE = "INVALID_ENUM_VALUE",

  // Authentication errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  MISSING_TOKEN = "MISSING_TOKEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // Authorization errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_DISABLED = "ACCOUNT_DISABLED",

  // Not found errors (404)
  NOT_FOUND = "NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  PROVIDER_NOT_FOUND = "PROVIDER_NOT_FOUND",
  BOOKING_NOT_FOUND = "BOOKING_NOT_FOUND",
  REVIEW_NOT_FOUND = "REVIEW_NOT_FOUND",
  CATEGORY_NOT_FOUND = "CATEGORY_NOT_FOUND",
  SERVICE_NOT_FOUND = "SERVICE_NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",

  // Conflict errors (409)
  CONFLICT = "CONFLICT",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  BOOKING_CONFLICT = "BOOKING_CONFLICT",
  REVIEW_EXISTS = "REVIEW_EXISTS",

  // Rate limit errors (429)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Server errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  REDIS_ERROR = "REDIS_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
  EMAIL_ERROR = "EMAIL_ERROR",
  SMS_ERROR = "SMS_ERROR",
  PAYMENT_ERROR = "PAYMENT_ERROR",

  // Business logic errors
  BUSINESS_ERROR = "BUSINESS_ERROR",
  INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION",
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  ALREADY_COMPLETED = "ALREADY_COMPLETED",
}

// ============================================================
// BASE ERROR CLASS
// ============================================================

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;
  public readonly errors?: string[];

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>,
    errors?: string[],
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================
// SPECIFIC ERROR CLASSES
// ============================================================

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    errors?: string[],
    details?: Record<string, any>,
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, true, details, errors);
  }
}

/**
 * Input validation error (400)
 */
export class InvalidInputError extends AppError {
  constructor(
    message: string = "Invalid input provided",
    details?: Record<string, any>,
  ) {
    super(ErrorCode.INVALID_INPUT, message, 400, true, details);
  }
}

/**
 * Missing field error (400)
 */
export class MissingFieldError extends AppError {
  constructor(field: string) {
    super(
      ErrorCode.MISSING_FIELD,
      `Required field missing: ${field}`,
      400,
      true,
      { field },
    );
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(ErrorCode.UNAUTHORIZED, message, 401, true);
  }
}

/**
 * Invalid token error (401)
 */
export class InvalidTokenError extends AppError {
  constructor(message: string = "Invalid or expired token") {
    super(ErrorCode.INVALID_TOKEN, message, 401, true);
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(ErrorCode.FORBIDDEN, message, 403, true);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", identifier?: string) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, 404, true, { resource, identifier });
  }
}

/**
 * User not found error (404)
 */
export class UserNotFoundError extends AppError {
  constructor(identifier: string) {
    super(
      ErrorCode.USER_NOT_FOUND,
      `User not found: ${identifier}`,
      404,
      true,
      { identifier },
    );
  }
}

/**
 * Provider not found error (404)
 */
export class ProviderNotFoundError extends AppError {
  constructor(identifier: string) {
    super(
      ErrorCode.PROVIDER_NOT_FOUND,
      `Provider not found: ${identifier}`,
      404,
      true,
      { identifier },
    );
  }
}

/**
 * Booking not found error (404)
 */
export class BookingNotFoundError extends AppError {
  constructor(identifier: string) {
    super(
      ErrorCode.BOOKING_NOT_FOUND,
      `Booking not found: ${identifier}`,
      404,
      true,
      { identifier },
    );
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(
    message: string = "Resource conflict",
    details?: Record<string, any>,
  ) {
    super(ErrorCode.CONFLICT, message, 409, true, details);
  }
}

/**
 * Duplicate entry error (409)
 */
export class DuplicateEntryError extends AppError {
  constructor(field: string, value: string) {
    super(
      ErrorCode.DUPLICATE_ENTRY,
      `Duplicate entry: ${field} '${value}' already exists`,
      409,
      true,
      { field, value },
    );
  }
}

/**
 * Booking conflict error (409)
 */
export class BookingConflictError extends AppError {
  constructor(message: string = "Booking conflict - provider unavailable") {
    super(ErrorCode.BOOKING_CONFLICT, message, 409, true);
  }
}

/**
 * Review exists error (409)
 */
export class ReviewExistsError extends AppError {
  constructor() {
    super(
      ErrorCode.REVIEW_EXISTS,
      "A review already exists for this booking",
      409,
      true,
    );
  }
}

/**
 * Rate limit exceeded error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests, please try again later") {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, true);
  }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = "Internal server error",
    details?: Record<string, any>,
  ) {
    super(ErrorCode.INTERNAL_ERROR, message, 500, false, details);
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = "Database operation failed",
    details?: Record<string, any>,
  ) {
    super(ErrorCode.DATABASE_ERROR, message, 500, false, details);
  }
}

/**
 * Redis error (500)
 */
export class RedisError extends AppError {
  constructor(
    message: string = "Redis operation failed",
    details?: Record<string, any>,
  ) {
    super(ErrorCode.REDIS_ERROR, message, 500, false, details);
  }
}

/**
 * Business logic error (422)
 */
export class BusinessError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.BUSINESS_ERROR, message, 422, true, details);
  }
}

/**
 * Invalid status transition error (422)
 */
export class InvalidStatusTransitionError extends AppError {
  constructor(currentStatus: string, newStatus: string) {
    super(
      ErrorCode.INVALID_STATUS_TRANSITION,
      `Invalid status transition from ${currentStatus} to ${newStatus}`,
      422,
      true,
      { currentStatus, newStatus },
    );
  }
}

/**
 * Operation not allowed error (403)
 */
export class OperationNotAllowedError extends AppError {
  constructor(message: string = "Operation not allowed") {
    super(ErrorCode.OPERATION_NOT_ALLOWED, message, 403, true);
  }
}

/**
 * Payment error (422)
 */
export class PaymentError extends AppError {
  constructor(
    message: string = "Payment processing failed",
    details?: Record<string, any>,
  ) {
    super(ErrorCode.PAYMENT_ERROR, message, 422, true, details);
  }
}

/**
 * External service error (503)
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = "External service unavailable",
  ) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service}: ${message}`,
      503,
      false,
      { service },
    );
  }
}

/**
 * File upload error (400)
 */
export class FileUploadError extends AppError {
  constructor(
    message: string = "File upload failed",
    details?: Record<string, any>,
  ) {
    super(ErrorCode.FILE_UPLOAD_ERROR, message, 400, true, details);
  }
}

/**
 * Email error (500)
 */
export class EmailError extends AppError {
  constructor(
    message: string = "Email sending failed",
    details?: Record<string, any>,
  ) {
    super(ErrorCode.EMAIL_ERROR, message, 500, false, details);
  }
}

/**
 * SMS error (500)
 */
export class SMSError extends AppError {
  constructor(
    message: string = "SMS sending failed",
    details?: Record<string, any>,
  ) {
    super(ErrorCode.SMS_ERROR, message, 500, false, details);
  }
}

// ============================================================
// ERROR RESPONSE TYPES
// ============================================================

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse {
  code: ErrorCode.VALIDATION_ERROR;
  message: string;
  errors: ValidationErrorDetail[];
  timestamp: string;
  path: string;
}

/**
 * Error response with details
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: Record<string, any>;
  errors?: string[];
  requestId?: string;
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  code: ErrorCode;
  message: string;
  stack?: string;
  statusCode: number;
  path: string;
  method: string;
  ip: string;
  userId?: string;
  userAgent: string;
  timestamp: Date;
  details?: Record<string, any>;
}

// ============================================================
// ERROR HANDLER TYPES
// ============================================================

/**
 * Error handler function
 */
export type ErrorHandler = (
  error: Error | AppError,
  req: any,
  res: any,
  next: any,
) => void;

/**
 * Async error handler wrapper
 */
export type AsyncHandler = (req: any, res: any, next: any) => Promise<void>;

/**
 * Error classification result
 */
export interface ErrorClassification {
  code: ErrorCode;
  statusCode: number;
  message: string;
  isOperational: boolean;
  shouldLog: boolean;
  shouldNotify: boolean;
}

/**
 * Error response options
 */
export interface ErrorResponseOptions {
  includeStack?: boolean;
  includeDetails?: boolean;
  hideSensitiveData?: boolean;
  customMessage?: string;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Error codes
  ErrorCode,

  // Base error
  AppError,

  // Specific errors
  ValidationError,
  InvalidInputError,
  MissingFieldError,
  UnauthorizedError,
  InvalidTokenError,
  ForbiddenError,
  NotFoundError,
  UserNotFoundError,
  ProviderNotFoundError,
  BookingNotFoundError,
  ConflictError,
  DuplicateEntryError,
  BookingConflictError,
  ReviewExistsError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  RedisError,
  BusinessError,
  InvalidStatusTransitionError,
  OperationNotAllowedError,
  PaymentError,
  ExternalServiceError,
  FileUploadError,
  EmailError,
  SMSError,

  // Response types
  ValidationErrorDetail,
  ValidationErrorResponse,
  ErrorResponse,
  ErrorLogEntry,

  // Handler types
  ErrorHandler,
  AsyncHandler,
  ErrorClassification,
  ErrorResponseOptions,
};
