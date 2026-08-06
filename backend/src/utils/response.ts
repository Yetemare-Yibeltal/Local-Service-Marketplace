import { Response } from "express";

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
  path?: string;
  statusCode: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  statusCode: number;
  timestamp: string;
  path?: string;
}

// ============================================================
// SUCCESS RESPONSES
// ============================================================

/**
 * Send a success response with data
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = "Operation successful",
  statusCode: number = 200,
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    statusCode,
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a success response without data
 */
export function sendOk(
  res: Response,
  message: string = "Operation successful",
  statusCode: number = 200,
): Response {
  const response: ApiResponse = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    statusCode,
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = "Resource created successfully",
): Response {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send a no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

/**
 * Send a paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  totalItems: number,
  message: string = "Data retrieved successfully",
): Response {
  const totalPages = Math.ceil(totalItems / limit);

  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    message,
    data: {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
    timestamp: new Date().toISOString(),
    statusCode: 200,
  };

  return res.status(200).json(response);
}

// ============================================================
// ERROR RESPONSES
// ============================================================

/**
 * Send a bad request response (400)
 */
export function sendBadRequest(
  res: Response,
  message: string = "Bad request",
  errors: string[] = [],
): Response {
  return sendError(res, message, 400, errors);
}

/**
 * Send an unauthorized response (401)
 */
export function sendUnauthorized(
  res: Response,
  message: string = "Unauthorized",
  errors: string[] = [],
): Response {
  return sendError(res, message, 401, errors);
}

/**
 * Send a forbidden response (403)
 */
export function sendForbidden(
  res: Response,
  message: string = "Forbidden",
  errors: string[] = [],
): Response {
  return sendError(res, message, 403, errors);
}

/**
 * Send a not found response (404)
 */
export function sendNotFound(
  res: Response,
  message: string = "Resource not found",
  errors: string[] = [],
): Response {
  return sendError(res, message, 404, errors);
}

/**
 * Send a conflict response (409)
 */
export function sendConflict(
  res: Response,
  message: string = "Resource already exists",
  errors: string[] = [],
): Response {
  return sendError(res, message, 409, errors);
}

/**
 * Send a validation error response (422)
 */
export function sendValidationError(
  res: Response,
  message: string = "Validation failed",
  errors: string[] = [],
): Response {
  return sendError(res, message, 422, errors);
}

/**
 * Send an internal server error response (500)
 */
export function sendServerError(
  res: Response,
  message: string = "Internal server error",
  errors: string[] = [],
): Response {
  return sendError(res, message, 500, errors);
}

/**
 * Generic error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors: string[] = [],
): Response {
  const response: ErrorResponse = {
    success: false,
    message,
    errors,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  sendSuccess,
  sendOk,
  sendCreated,
  sendNoContent,
  sendPaginated,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
  sendServerError,
  sendError,
};
