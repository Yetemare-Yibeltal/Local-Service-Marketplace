// ============================================================
// ERROR TYPES
// Complete error type definitions for the application
// ============================================================

// ============================================================
// BASE ERROR TYPES
// ============================================================

/**
 * Base application error interface
 */
export interface AppError {
  name: string;
  message: string;
  statusCode: number;
  status?: string;
  isOperational: boolean;
  code?: string;
  errors?: string[];
  details?: ErrorDetail[];
  stack?: string;
  timestamp?: Date;
  path?: string;
  method?: string;
  requestId?: string;
}

/**
 * Error detail
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
  value?: any;
  constraint?: string;
  path?: string[];
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  statusCode: number;
  timestamp: string;
  path?: string;
  requestId?: string;
  errorCode?: string;
  details?: ErrorDetail[];
  stack?: string;
}

// ============================================================
// HTTP ERROR TYPES
// ============================================================

/**
 * HTTP error classes
 */
export class HttpError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public errors: string[];
  public details?: ErrorDetail[];
  public code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errors: string[] = [],
    details?: ErrorDetail[],
    code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    this.details = details;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends HttpError {
  constructor(
    message: string = "Bad request",
    errors: string[] = [],
    details?: ErrorDetail[],
  ) {
    super(message, 400, errors, details, "BAD_REQUEST");
    this.name = "BadRequestError";
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string = "Unauthorized", errors: string[] = []) {
    super(message, 401, errors, undefined, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends HttpError {
  constructor(message: string = "Forbidden", errors: string[] = []) {
    super(message, 403, errors, undefined, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends HttpError {
  constructor(message: string = "Resource not found", errors: string[] = []) {
    super(message, 404, errors, undefined, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends HttpError {
  constructor(
    message: string = "Resource already exists",
    errors: string[] = [],
    details?: ErrorDetail[],
  ) {
    super(message, 409, errors, details, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * Unprocessable Entity Error (422)
 */
export class ValidationError extends HttpError {
  constructor(
    message: string = "Validation failed",
    errors: string[] = [],
    details?: ErrorDetail[],
  ) {
    super(message, 422, errors, details, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * Too Many Requests Error (429)
 */
export class RateLimitError extends HttpError {
  public retryAfter?: number;

  constructor(message: string = "Too many requests", retryAfter?: number) {
    super(message, 429, ["Rate limit exceeded"], undefined, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends HttpError {
  constructor(
    message: string = "Internal server error",
    errors: string[] = [],
  ) {
    super(message, 500, errors, undefined, "INTERNAL_ERROR");
    this.name = "InternalServerError";
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends HttpError {
  constructor(message: string = "Service unavailable", errors: string[] = []) {
    super(message, 503, errors, undefined, "SERVICE_UNAVAILABLE");
    this.name = "ServiceUnavailableError";
  }
}

// ============================================================
// DATABASE ERROR TYPES
// ============================================================

/**
 * Database error
 */
export class DatabaseError extends Error {
  public code: string;
  public meta?: any;
  public statusCode: number;

  constructor(message: string, code: string = "DATABASE_ERROR", meta?: any) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.meta = meta;
    this.statusCode = 500;
  }
}

/**
 * Duplicate entry error
 */
export class DuplicateEntryError extends DatabaseError {
  constructor(field: string, value: any) {
    super(`${field} "${value}" already exists`, "DUPLICATE_ENTRY", {
      field,
      value,
    });
    this.name = "DuplicateEntryError";
    this.statusCode = 409;
  }
}

/**
 * Record not found error
 */
export class RecordNotFoundError extends DatabaseError {
  constructor(entity: string, id: string) {
    super(`${entity} with ID "${id}" not found`, "RECORD_NOT_FOUND", {
      entity,
      id,
    });
    this.name = "RecordNotFoundError";
    this.statusCode = 404;
  }
}

/**
 * Foreign key constraint error
 */
export class ForeignKeyError extends DatabaseError {
  constructor(message: string, meta?: any) {
    super(message, "FOREIGN_KEY_VIOLATION", meta);
    this.name = "ForeignKeyError";
    this.statusCode = 400;
  }
}

// ============================================================
// AUTHENTICATION ERROR TYPES
// ============================================================

/**
 * Authentication error
 */
export class AuthError extends HttpError {
  constructor(
    message: string = "Authentication failed",
    errors: string[] = [],
  ) {
    super(message, 401, errors, undefined, "AUTH_ERROR");
    this.name = "AuthError";
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("Invalid email or password", ["Invalid credentials provided"]);
    this.name = "InvalidCredentialsError";
    this.code = "INVALID_CREDENTIALS";
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends AuthError {
  constructor() {
    super("Token has expired", ["Please refresh your token"]);
    this.name = "TokenExpiredError";
    this.code = "TOKEN_EXPIRED";
  }
}

/**
 * Invalid token error
 */
export class InvalidTokenError extends AuthError {
  constructor() {
    super("Invalid token", ["The provided token is invalid"]);
    this.name = "InvalidTokenError";
    this.code = "INVALID_TOKEN";
  }
}

/**
 * Account locked error
 */
export class AccountLockedError extends AuthError {
  constructor() {
    super("Account is locked", [
      "Too many failed attempts. Please try again later.",
    ]);
    this.name = "AccountLockedError";
    this.code = "ACCOUNT_LOCKED";
  }
}

/**
 * Account deactivated error
 */
export class AccountDeactivatedError extends AuthError {
  constructor() {
    super("Account is deactivated", [
      "Please contact support to reactivate your account",
    ]);
    this.name = "AccountDeactivatedError";
    this.code = "ACCOUNT_DEACTIVATED";
  }
}

// ============================================================
// VALIDATION ERROR TYPES
// ============================================================

/**
 * Validation error with field details
 */
export class FieldValidationError extends ValidationError {
  constructor(fieldErrors: Array<{ field: string; message: string }>) {
    const details = fieldErrors.map((fe) => ({
      field: fe.field,
      message: fe.message,
      code: "FIELD_VALIDATION_ERROR",
    }));
    const messages = fieldErrors.map((fe) => `${fe.field}: ${fe.message}`);
    super("Validation failed", messages, details);
    this.name = "FieldValidationError";
    this.code = "FIELD_VALIDATION_ERROR";
  }
}

/**
 * Business rule validation error
 */
export class BusinessRuleError extends ValidationError {
  constructor(message: string, rule?: string) {
    super(
      message,
      [message],
      [{ field: "business", message, code: rule || "BUSINESS_RULE_VIOLATION" }],
    );
    this.name = "BusinessRuleError";
    this.code = "BUSINESS_RULE_VIOLATION";
  }
}

// ============================================================
// BUSINESS ERROR TYPES
// ============================================================

/**
 * Booking conflict error
 */
export class BookingConflictError extends HttpError {
  constructor(message: string = "Booking conflict detected") {
    super(message, 409, [message], undefined, "BOOKING_CONFLICT");
    this.name = "BookingConflictError";
  }
}

/**
 * Provider unavailable error
 */
export class ProviderUnavailableError extends HttpError {
  constructor(message: string = "Provider is not available") {
    super(message, 400, [message], undefined, "PROVIDER_UNAVAILABLE");
    this.name = "ProviderUnavailableError";
  }
}

/**
 * Payment error
 */
export class PaymentError extends HttpError {
  constructor(message: string, code: string = "PAYMENT_ERROR") {
    super(message, 400, [message], undefined, code);
    this.name = "PaymentError";
  }
}

/**
 * Payment failed error
 */
export class PaymentFailedError extends PaymentError {
  constructor(message: string = "Payment processing failed") {
    super(message, "PAYMENT_FAILED");
    this.name = "PaymentFailedError";
  }
}

/**
 * Refund error
 */
export class RefundError extends PaymentError {
  constructor(message: string = "Refund processing failed") {
    super(message, "REFUND_ERROR");
    this.name = "RefundError";
  }
}

// ============================================================
// EXTERNAL SERVICE ERROR TYPES
// ============================================================

/**
 * External service error
 */
export class ExternalServiceError extends HttpError {
  public service: string;
  public originalError?: Error;

  constructor(service: string, message: string, originalError?: Error) {
    super(
      `External service error: ${message}`,
      502,
      [message],
      undefined,
      "EXTERNAL_SERVICE_ERROR",
    );
    this.name = "ExternalServiceError";
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * SMS service error
 */
export class SMSServiceError extends ExternalServiceError {
  constructor(message: string, originalError?: Error) {
    super("SMS Service", message, originalError);
    this.name = "SMSServiceError";
    this.code = "SMS_SERVICE_ERROR";
  }
}

/**
 * Email service error
 */
export class EmailServiceError extends ExternalServiceError {
  constructor(message: string, originalError?: Error) {
    super("Email Service", message, originalError);
    this.name = "EmailServiceError";
    this.code = "EMAIL_SERVICE_ERROR";
  }
}

/**
 * Payment gateway error
 */
export class PaymentGatewayError extends ExternalServiceError {
  constructor(gateway: string, message: string, originalError?: Error) {
    super(`Payment Gateway (${gateway})`, message, originalError);
    this.name = "PaymentGatewayError";
    this.code = "PAYMENT_GATEWAY_ERROR";
  }
}

// ============================================================
// FILE UPLOAD ERROR TYPES
// ============================================================

/**
 * File upload error
 */
export class FileUploadError extends HttpError {
  constructor(message: string = "File upload failed") {
    super(message, 400, [message], undefined, "FILE_UPLOAD_ERROR");
    this.name = "FileUploadError";
  }
}

/**
 * File size exceeded error
 */
export class FileSizeExceededError extends FileUploadError {
  constructor(maxSize: number) {
    super(`File size exceeds maximum allowed (${maxSize} bytes)`);
    this.name = "FileSizeExceededError";
    this.code = "FILE_SIZE_EXCEEDED";
  }
}

/**
 * Invalid file type error
 */
export class InvalidFileTypeError extends FileUploadError {
  constructor(allowedTypes: string[]) {
    super(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`);
    this.name = "InvalidFileTypeError";
    this.code = "INVALID_FILE_TYPE";
  }
}

// ============================================================
// ERROR UTILITY FUNCTIONS
// ============================================================

/**
 * Check if error is a known application error
 */
export function isAppError(error: any): error is AppError {
  return (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    "isOperational" in error &&
    "message" in error
  );
}

/**
 * Check if error is an HttpError
 */
export function isHttpError(error: any): error is HttpError {
  return (
    error instanceof HttpError ||
    (error && error.statusCode && typeof error.statusCode === "number")
  );
}

/**
 * Get error status code
 */
export function getErrorStatusCode(error: any): number {
  if (isHttpError(error)) {
    return error.statusCode;
  }
  if (error && error.statusCode) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Get error messages
 */
export function getErrorMessages(error: any): string[] {
  if (isAppError(error) && error.errors) {
    return error.errors;
  }
  if (error && error.message) {
    return [error.message];
  }
  return ["An unknown error occurred"];
}

/**
 * Get error details
 */
export function getErrorDetails(error: any): ErrorDetail[] | undefined {
  if (isAppError(error) && error.details) {
    return error.details;
  }
  return undefined;
}

/**
 * Format error for response
 */
export function formatError(
  error: any,
  requestId?: string,
  includeStack: boolean = false,
): ErrorResponse {
  const statusCode = getErrorStatusCode(error);
  const messages = getErrorMessages(error);
  const details = getErrorDetails(error);

  const response: ErrorResponse = {
    success: false,
    message: messages[0] || "An error occurred",
    errors: messages,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId,
  };

  if (error && error.code) {
    response.errorCode = error.code;
  }

  if (details && details.length > 0) {
    response.details = details;
  }

  if (includeStack && error && error.stack) {
    response.stack = error.stack;
  }

  return response;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Base types
  AppError,
  ErrorDetail,
  ErrorResponse,

  // HTTP errors
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,

  // Database errors
  DatabaseError,
  DuplicateEntryError,
  RecordNotFoundError,
  ForeignKeyError,

  // Authentication errors
  AuthError,
  InvalidCredentialsError,
  TokenExpiredError,
  InvalidTokenError,
  AccountLockedError,
  AccountDeactivatedError,

  // Validation errors
  FieldValidationError,
  BusinessRuleError,

  // Business errors
  BookingConflictError,
  ProviderUnavailableError,
  PaymentError,
  PaymentFailedError,
  RefundError,

  // External service errors
  ExternalServiceError,
  SMSServiceError,
  EmailServiceError,
  PaymentGatewayError,

  // File upload errors
  FileUploadError,
  FileSizeExceededError,
  InvalidFileTypeError,

  // Utility functions
  isAppError,
  isHttpError,
  getErrorStatusCode,
  getErrorMessages,
  getErrorDetails,
  formatError,
};
