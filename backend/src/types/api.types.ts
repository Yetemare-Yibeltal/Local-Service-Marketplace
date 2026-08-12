// ============================================================
// API TYPES
// Complete API type definitions for the application
// ============================================================

// ============================================================
// HTTP STATUS CODES
// ============================================================

/**
 * HTTP status codes enum
 */
export enum HttpStatus {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 3xx Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,

  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * HTTP status messages
 */
export const HttpStatusMessages: Record<HttpStatus, string> = {
  [HttpStatus.OK]: "OK",
  [HttpStatus.CREATED]: "Created",
  [HttpStatus.ACCEPTED]: "Accepted",
  [HttpStatus.NO_CONTENT]: "No Content",
  [HttpStatus.MOVED_PERMANENTLY]: "Moved Permanently",
  [HttpStatus.FOUND]: "Found",
  [HttpStatus.NOT_MODIFIED]: "Not Modified",
  [HttpStatus.BAD_REQUEST]: "Bad Request",
  [HttpStatus.UNAUTHORIZED]: "Unauthorized",
  [HttpStatus.FORBIDDEN]: "Forbidden",
  [HttpStatus.NOT_FOUND]: "Not Found",
  [HttpStatus.METHOD_NOT_ALLOWED]: "Method Not Allowed",
  [HttpStatus.CONFLICT]: "Conflict",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "Unprocessable Entity",
  [HttpStatus.TOO_MANY_REQUESTS]: "Too Many Requests",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "Internal Server Error",
  [HttpStatus.NOT_IMPLEMENTED]: "Not Implemented",
  [HttpStatus.BAD_GATEWAY]: "Bad Gateway",
  [HttpStatus.SERVICE_UNAVAILABLE]: "Service Unavailable",
  [HttpStatus.GATEWAY_TIMEOUT]: "Gateway Timeout",
};

// ============================================================
// HTTP METHODS
// ============================================================

/**
 * HTTP methods enum
 */
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

/**
 * HTTP methods array
 */
export const HttpMethods: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
];

// ============================================================
// API RESPONSE TYPES
// ============================================================

/**
 * Success API response
 */
export interface ApiResponse<T = any> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
  statusCode: number;
  path?: string;
  requestId?: string;
  version?: string;
}

/**
 * Error API response
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
  statusCode: number;
  timestamp: string;
  path?: string;
  requestId?: string;
  errorCode?: string;
  stack?: string; // Only in development
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T = any> {
  success: true;
  message: string;
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
  statusCode: number;
  path?: string;
  requestId?: string;
}

/**
 * Empty API response
 */
export interface EmptyApiResponse {
  success: true;
  message: string;
  timestamp: string;
  statusCode: number;
  path?: string;
  requestId?: string;
}

// ============================================================
// PAGINATION TYPES
// ============================================================

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination with filter
 */
export interface PaginatedQueryParams extends PaginationParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

// ============================================================
// SORTING TYPES
// ============================================================

/**
 * Sort order enum
 */
export type SortOrder = "asc" | "desc";

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy: string;
  sortOrder: SortOrder;
}

/**
 * Sort with multiple fields
 */
export interface MultiSortParams {
  sort: Array<{
    field: string;
    order: SortOrder;
  }>;
}

// ============================================================
// FILTERING TYPES
// ============================================================

/**
 * Filter operators
 */
export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "in"
  | "nin"
  | "between"
  | "isNull"
  | "isNotNull";

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Filter group (AND/OR)
 */
export interface FilterGroup {
  type: "AND" | "OR";
  conditions: (FilterCondition | FilterGroup)[];
}

/**
 * Filter parameters
 */
export interface FilterParams {
  filters?: FilterCondition[];
  search?: string;
  searchFields?: string[];
  startDate?: string;
  endDate?: string;
  range?: {
    field: string;
    min?: any;
    max?: any;
  };
}

// ============================================================
// REQUEST TYPES
// ============================================================

/**
 * Authenticated request
 */
export interface AuthenticatedRequest {
  userId: string;
  userRole: string;
  userEmail: string;
  token: string;
}

/**
 * Request with file uploads
 */
export interface FileUploadRequest {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
  file?: Express.Multer.File;
}

/**
 * Request with pagination
 */
export interface PaginatedRequest extends PaginationParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

/**
 * Request with filters
 */
export interface FilteredRequest extends FilterParams {
  pagination?: PaginationParams;
  sort?: SortParams;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

/**
 * API response data wrapper
 */
export interface ApiResponseData<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
  statusCode: number;
}

/**
 * List response
 */
export interface ListResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// ============================================================
// ERROR TYPES
// ============================================================

/**
 * API Error codes
 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND_ERROR"
  | "CONFLICT_ERROR"
  | "RATE_LIMIT_ERROR"
  | "INTERNAL_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "BUSINESS_ERROR"
  | "CONFIGURATION_ERROR";

/**
 * API Error details
 */
export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
  value?: any;
}

/**
 * API Error response with details
 */
export interface DetailedApiErrorResponse extends ApiErrorResponse {
  details?: ApiErrorDetail[];
  errorCode?: ApiErrorCode;
  retryAfter?: number; // For rate limit errors
}

// ============================================================
// LOGGING TYPES
// ============================================================

/**
 * API Request log
 */
export interface ApiRequestLog {
  requestId: string;
  method: string;
  path: string;
  query: Record<string, any>;
  body: any;
  headers: Record<string, string>;
  ip: string;
  userAgent: string;
  userId?: string;
  timestamp: Date;
}

/**
 * API Response log
 */
export interface ApiResponseLog {
  requestId: string;
  statusCode: number;
  duration: number;
  responseSize: number;
  error?: string;
  timestamp: Date;
}

/**
 * API Performance log
 */
export interface ApiPerformanceLog {
  requestId: string;
  method: string;
  path: string;
  duration: number;
  statusCode: number;
  dbQueries: number;
  dbTime: number;
  cacheHits: number;
  cacheMisses: number;
  timestamp: Date;
}

// ============================================================
// WEBHOOK API TYPES
// ============================================================

/**
 * Webhook API request
 */
export interface WebhookApiRequest {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
  source: string;
}

/**
 * Webhook API response
 */
export interface WebhookApiResponse {
  received: boolean;
  processed: boolean;
  event: string;
  status: string;
  message?: string;
}

// ============================================================
// HEALTH CHECK TYPES
// ============================================================

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: "ok" | "degraded" | "down";
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  dependencies: {
    database: {
      status: "ok" | "degraded" | "down";
      latency: number;
    };
    redis: {
      status: "ok" | "degraded" | "down";
      latency: number;
    };
    cloudinary?: {
      status: "ok" | "degraded" | "down";
    };
  };
}

/**
 * Environment information
 */
export interface EnvironmentInfo {
  nodeVersion: string;
  platform: string;
  environment: string;
  timezone: string;
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  cpu: {
    cores: number;
    model: string;
    speed: number;
  };
}

// ============================================================
// API DOCUMENTATION TYPES
// ============================================================

/**
 * API endpoint documentation
 */
export interface ApiEndpointDoc {
  path: string;
  method: HttpMethod;
  summary: string;
  description?: string;
  tags: string[];
  parameters?: ApiParameterDoc[];
  requestBody?: ApiRequestBodyDoc;
  responses: ApiResponseDoc[];
  security?: string[];
  deprecated?: boolean;
}

/**
 * API parameter documentation
 */
export interface ApiParameterDoc {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  schema: ApiSchemaDoc;
  description?: string;
  example?: any;
}

/**
 * API request body documentation
 */
export interface ApiRequestBodyDoc {
  required: boolean;
  content: {
    "application/json": {
      schema: ApiSchemaDoc;
      examples?: Record<string, any>;
    };
  };
}

/**
 * API response documentation
 */
export interface ApiResponseDoc {
  status: number;
  description: string;
  content?: {
    "application/json": {
      schema: ApiSchemaDoc;
      examples?: Record<string, any>;
    };
  };
}

/**
 * API schema documentation
 */
export interface ApiSchemaDoc {
  type: string;
  properties?: Record<string, ApiSchemaDoc>;
  required?: string[];
  items?: ApiSchemaDoc;
  example?: any;
  description?: string;
  enum?: any[];
  format?: string;
  nullable?: boolean;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // HTTP Status
  HttpStatus,
  HttpStatusMessages,

  // HTTP Methods
  HttpMethod,
  HttpMethods,

  // Response types
  ApiResponse,
  ApiErrorResponse,
  PaginatedApiResponse,
  EmptyApiResponse,

  // Pagination
  PaginationMeta,
  PaginationParams,
  PaginatedQueryParams,

  // Sorting
  SortOrder,
  SortParams,
  MultiSortParams,

  // Filtering
  FilterOperator,
  FilterCondition,
  FilterGroup,
  FilterParams,

  // Request types
  AuthenticatedRequest,
  FileUploadRequest,
  PaginatedRequest,
  FilteredRequest,

  // Response types
  ApiResponseData,
  ListResponse,
  BulkOperationResponse,
  FileUploadResponse,

  // Error types
  ApiErrorCode,
  ApiErrorDetail,
  DetailedApiErrorResponse,

  // Logging types
  ApiRequestLog,
  ApiResponseLog,
  ApiPerformanceLog,

  // Webhook API types
  WebhookApiRequest,
  WebhookApiResponse,

  // Health check types
  HealthCheckResponse,
  EnvironmentInfo,

  // Documentation types
  ApiEndpointDoc,
  ApiParameterDoc,
  ApiRequestBodyDoc,
  ApiResponseDoc,
  ApiSchemaDoc,
};
