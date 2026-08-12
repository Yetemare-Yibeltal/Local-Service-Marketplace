// ============================================================
// WEBHOOK TYPES
// Complete webhook type definitions for the application
// ============================================================

// ============================================================
// ENUMS
// ============================================================

/**
 * Webhook event type enum
 */
export type WebhookEventType =
  // Booking events
  | "booking.created"
  | "booking.confirmed"
  | "booking.in_progress"
  | "booking.completed"
  | "booking.cancelled"
  | "booking.disputed"
  | "booking.updated"
  // Review events
  | "review.created"
  | "review.updated"
  | "review.deleted"
  // Provider events
  | "provider.registered"
  | "provider.verified"
  | "provider.updated"
  | "provider.deleted"
  // User events
  | "user.registered"
  | "user.updated"
  | "user.deleted"
  // Payment events
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded"
  // Dispute events
  | "dispute.created"
  | "dispute.resolved"
  | "dispute.updated";

/**
 * Webhook delivery status enum
 */
export type WebhookDeliveryStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "RETRYING";

/**
 * Webhook HTTP method enum
 */
export type WebhookMethod = "POST" | "PUT" | "PATCH";

/**
 * Webhook authentication type enum
 */
export type WebhookAuthType = "NONE" | "BASIC" | "BEARER" | "API_KEY" | "HMAC";

// ============================================================
// WEBHOOK REGISTRATION TYPES
// ============================================================

/**
 * Webhook registration input
 */
export interface WebhookRegistrationInput {
  url: string;
  events: WebhookEventType[];
  method?: WebhookMethod;
  headers?: Record<string, string>;
  authType?: WebhookAuthType;
  authCredentials?: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    secret?: string;
  };
  isActive?: boolean;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  description?: string;
}

/**
 * Webhook update input
 */
export interface WebhookUpdateInput {
  url?: string;
  events?: WebhookEventType[];
  method?: WebhookMethod;
  headers?: Record<string, string>;
  authType?: WebhookAuthType;
  authCredentials?: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    secret?: string;
  };
  isActive?: boolean;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  description?: string;
}

/**
 * Webhook interface
 */
export interface Webhook {
  id: string;
  service: string;
  url: string;
  events: WebhookEventType[];
  method: WebhookMethod;
  headers: Record<string, string> | null;
  authType: WebhookAuthType;
  authCredentials: Record<string, string> | null;
  isActive: boolean;
  retryCount: number;
  retryDelay: number;
  timeout: number;
  description: string | null;
  lastDeliveryAt: Date | null;
  lastDeliveryStatus: WebhookDeliveryStatus | null;
  failureCount: number;
  successCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// WEBHOOK PAYLOAD TYPES
// ============================================================

/**
 * Webhook payload interface
 */
export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  data: any;
  webhookId?: string;
  signature?: string;
  retryCount?: number;
}

/**
 * Booking webhook payload
 */
export interface BookingWebhookPayload extends WebhookPayload {
  event:
    | "booking.created"
    | "booking.confirmed"
    | "booking.in_progress"
    | "booking.completed"
    | "booking.cancelled"
    | "booking.disputed"
    | "booking.updated";
  data: {
    id: string;
    bookingNumber: string;
    customerId: string;
    providerId: string;
    status: string;
    scheduledDate: string;
    totalPrice: number;
    address: string;
    customer: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
    };
    provider: {
      id: string;
      businessName: string;
      category: string;
    };
  };
}

/**
 * Review webhook payload
 */
export interface ReviewWebhookPayload extends WebhookPayload {
  event: "review.created" | "review.updated" | "review.deleted";
  data: {
    id: string;
    bookingId: string;
    reviewerId: string;
    providerId: string;
    rating: number;
    comment: string;
    reviewer: {
      id: string;
      fullName: string;
      email: string;
    };
    provider: {
      id: string;
      businessName: string;
    };
  };
}

/**
 * Provider webhook payload
 */
export interface ProviderWebhookPayload extends WebhookPayload {
  event:
    | "provider.registered"
    | "provider.verified"
    | "provider.updated"
    | "provider.deleted";
  data: {
    id: string;
    userId: string;
    businessName: string;
    category: string;
    isVerified: boolean;
    status: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
    };
  };
}

/**
 * Payment webhook payload
 */
export interface PaymentWebhookPayload extends WebhookPayload {
  event: "payment.succeeded" | "payment.failed" | "payment.refunded";
  data: {
    id: string;
    bookingId: string;
    amount: number;
    status: string;
    paymentMethod: string;
    transactionId: string | null;
    booking: {
      id: string;
      bookingNumber: string;
      customerId: string;
      providerId: string;
    };
  };
}

/**
 * User webhook payload
 */
export interface UserWebhookPayload extends WebhookPayload {
  event: "user.registered" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email: string;
    phone: string;
    fullName: string;
    role: string;
    status: string;
  };
}

/**
 * Dispute webhook payload
 */
export interface DisputeWebhookPayload extends WebhookPayload {
  event: "dispute.created" | "dispute.resolved" | "dispute.updated";
  data: {
    id: string;
    bookingId: string;
    customerId: string;
    providerId: string;
    status: string;
    reason: string;
    resolution: string | null;
    booking: {
      id: string;
      bookingNumber: string;
    };
  };
}

// ============================================================
// WEBHOOK DELIVERY TYPES
// ============================================================

/**
 * Webhook delivery log interface
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  payload: any;
  url: string;
  method: string;
  headers: Record<string, string> | null;
  status: number | null;
  response: string | null;
  duration: number | null;
  attempt: number;
  maxRetries: number;
  statusCode: number | null;
  success: boolean;
  error: string | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook delivery attempt
 */
export interface WebhookDeliveryAttempt {
  attempt: number;
  status: number | null;
  response: string | null;
  duration: number | null;
  error: string | null;
  timestamp: Date;
  success: boolean;
}

/**
 * Webhook delivery filter
 */
export interface WebhookDeliveryFilters {
  webhookId?: string;
  event?: WebhookEventType;
  success?: boolean;
  statusCode?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// ============================================================
// WEBHOOK RESPONSE TYPES
// ============================================================

/**
 * Webhook response interface
 */
export interface WebhookResponse {
  id: string;
  url: string;
  events: WebhookEventType[];
  method: WebhookMethod;
  isActive: boolean;
  description: string | null;
  lastDeliveryAt: Date | null;
  lastDeliveryStatus: WebhookDeliveryStatus | null;
  failureCount: number;
  successCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook delivery response
 */
export interface WebhookDeliveryResponse {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  url: string;
  statusCode: number | null;
  duration: number | null;
  attempt: number;
  success: boolean;
  error: string | null;
  createdAt: Date;
}

/**
 * Webhook statistics
 */
export interface WebhookStatistics {
  totalWebhooks: number;
  activeWebhooks: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  averageResponseTime: number;
  deliveriesByEvent: Record<WebhookEventType, number>;
  recentFailures: Array<{
    deliveryId: string;
    webhookId: string;
    url: string;
    statusCode: number | null;
    error: string | null;
    createdAt: Date;
  }>;
  webhookHealth: Array<{
    webhookId: string;
    url: string;
    successRate: number;
    averageResponseTime: number;
    lastDeliveryStatus: WebhookDeliveryStatus | null;
    status: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  }>;
}

// ============================================================
// WEBHOOK SIGNATURE TYPES
// ============================================================

/**
 * Webhook signature verification input
 */
export interface WebhookSignatureInput {
  signature: string;
  timestamp: string;
  payload: any;
  secret: string;
}

/**
 * Webhook signature verification result
 */
export interface WebhookSignatureResult {
  isValid: boolean;
  error?: string;
  verifiedAt: Date;
}

/**
 * Webhook signature generation input
 */
export interface WebhookSignatureGenerationInput {
  payload: any;
  secret: string;
  timestamp?: string;
  algorithm?: "HMAC-SHA256" | "HMAC-SHA512";
}

// ============================================================
// WEBHOOK TEST TYPES
// ============================================================

/**
 * Webhook test input
 */
export interface WebhookTestInput {
  url: string;
  event: WebhookEventType;
  payload?: any;
  headers?: Record<string, string>;
  authType?: WebhookAuthType;
  authCredentials?: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    secret?: string;
  };
}

/**
 * Webhook test result
 */
export interface WebhookTestResult {
  success: boolean;
  statusCode: number | null;
  response: string | null;
  duration: number | null;
  error: string | null;
  timestamp: Date;
  url: string;
  method: string;
}

// ============================================================
// WEBHOOK AUTH TYPES
// ============================================================

/**
 * Webhook authentication configuration
 */
export interface WebhookAuthConfig {
  type: WebhookAuthType;
  credentials: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    secret?: string;
  };
}

/**
 * Webhook authenticated request
 */
export interface WebhookAuthenticatedRequest {
  url: string;
  method: WebhookMethod;
  headers: Record<string, string>;
  body: any;
  auth: WebhookAuthConfig;
  timeout: number;
}

// ============================================================
// WEBHOOK EVENT HANDLER TYPES
// ============================================================

/**
 * Webhook event handler interface
 */
export interface WebhookEventHandler {
  event: WebhookEventType;
  handler: (payload: WebhookPayload) => Promise<WebhookDelivery>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffFactor: number;
  };
}

/**
 * Webhook event listener
 */
export interface WebhookEventListener {
  event: WebhookEventType;
  callback: (payload: WebhookPayload) => void;
  once?: boolean;
  id: string;
}

// ============================================================
// WEBHOOK FILTERS AND QUERIES
// ============================================================

/**
 * Webhook filter parameters
 */
export interface WebhookFilters {
  service?: string;
  event?: WebhookEventType;
  isActive?: boolean;
  search?: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
}

/**
 * Webhook sort options
 */
export interface WebhookSortOptions {
  field: "createdAt" | "updatedAt" | "name" | "url" | "lastDeliveryAt";
  order: "asc" | "desc";
}

/**
 * Webhook pagination parameters
 */
export interface WebhookPaginationParams {
  page: number;
  limit: number;
  filters?: WebhookFilters;
  sort?: WebhookSortOptions;
}

// ============================================================
// WEBHOOK EXPORT TYPES
// ============================================================

/**
 * Webhook export data
 */
export interface WebhookExportData {
  id: string;
  service: string;
  url: string;
  events: string;
  isActive: boolean;
  successCount: number;
  failureCount: number;
  createdAt: string;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: string | null;
}

/**
 * Webhook export options
 */
export interface WebhookExportOptions {
  includeDeliveries?: boolean;
  format: "csv" | "json" | "excel";
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Enums
  WebhookEventType,
  WebhookDeliveryStatus,
  WebhookMethod,
  WebhookAuthType,

  // Registration types
  WebhookRegistrationInput,
  WebhookUpdateInput,
  Webhook,

  // Payload types
  WebhookPayload,
  BookingWebhookPayload,
  ReviewWebhookPayload,
  ProviderWebhookPayload,
  PaymentWebhookPayload,
  UserWebhookPayload,
  DisputeWebhookPayload,

  // Delivery types
  WebhookDelivery,
  WebhookDeliveryAttempt,
  WebhookDeliveryFilters,

  // Response types
  WebhookResponse,
  WebhookDeliveryResponse,
  WebhookStatistics,

  // Signature types
  WebhookSignatureInput,
  WebhookSignatureResult,
  WebhookSignatureGenerationInput,

  // Test types
  WebhookTestInput,
  WebhookTestResult,

  // Auth types
  WebhookAuthConfig,
  WebhookAuthenticatedRequest,

  // Handler types
  WebhookEventHandler,
  WebhookEventListener,

  // Filter types
  WebhookFilters,
  WebhookSortOptions,
  WebhookPaginationParams,

  // Export types
  WebhookExportData,
  WebhookExportOptions,
};
