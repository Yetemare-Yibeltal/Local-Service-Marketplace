import { z } from "zod";
import { uuidSchema, urlSchema } from "../middlewares/validation.middleware";

// ============================================================
// WEBHOOK EVENT TYPES
// ============================================================

export const WEBHOOK_EVENTS = [
  "booking.created",
  "booking.confirmed",
  "booking.in_progress",
  "booking.completed",
  "booking.cancelled",
  "booking.disputed",
  "booking.updated",
  "review.created",
  "review.updated",
  "review.deleted",
  "provider.registered",
  "provider.verified",
  "provider.updated",
  "provider.deleted",
  "user.registered",
  "user.updated",
  "user.deleted",
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
  "dispute.created",
  "dispute.resolved",
  "dispute.updated",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

// ============================================================
// WEBHOOK SCHEMAS
// ============================================================

/**
 * Webhook registration schema
 */
export const registerWebhookSchema = z.object({
  url: urlSchema,
  events: z
    .array(z.enum(WEBHOOK_EVENTS))
    .min(1, "At least one event is required"),
  secret: z
    .string()
    .min(32, "Secret must be at least 32 characters")
    .max(256, "Secret must not exceed 256 characters")
    .optional(),
  isActive: z.boolean().optional().default(true),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

export type RegisterWebhookInput = z.infer<typeof registerWebhookSchema>;

/**
 * Update webhook schema
 */
export const updateWebhookSchema = z.object({
  url: urlSchema.optional(),
  events: z
    .array(z.enum(WEBHOOK_EVENTS))
    .min(1, "At least one event is required")
    .optional(),
  secret: z
    .string()
    .min(32, "Secret must be at least 32 characters")
    .max(256, "Secret must not exceed 256 characters")
    .optional(),
  isActive: z.boolean().optional(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;

/**
 * Webhook ID param schema
 */
export const webhookIdParamSchema = z.object({
  id: uuidSchema,
});

export type WebhookIdParamInput = z.infer<typeof webhookIdParamSchema>;

/**
 * Webhook filter schema
 */
export const webhookFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  event: z.enum(WEBHOOK_EVENTS).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type WebhookFilterInput = z.infer<typeof webhookFilterSchema>;

// ============================================================
// WEBHOOK DELIVERY SCHEMAS
// ============================================================

/**
 * Webhook delivery log schema
 */
export const webhookDeliveryLogSchema = z.object({
  webhookId: uuidSchema,
  event: z.enum(WEBHOOK_EVENTS),
  payload: z.record(z.any()),
  url: urlSchema,
  status: z.number().int(),
  response: z.string().optional(),
  duration: z.number().int().min(0, "Duration cannot be negative"),
  attempt: z.number().int().min(1, "Attempt must be at least 1"),
  success: z.boolean(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type WebhookDeliveryLog = z.infer<typeof webhookDeliveryLogSchema>;

/**
 * Webhook delivery filter schema
 */
export const webhookDeliveryFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  webhookId: uuidSchema.optional(),
  event: z.enum(WEBHOOK_EVENTS).optional(),
  success: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z
    .enum(["createdAt", "duration", "status"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type WebhookDeliveryFilterInput = z.infer<
  typeof webhookDeliveryFilterSchema
>;

// ============================================================
// WEBHOOK PAYLOAD SCHEMAS
// ============================================================

/**
 * Base webhook payload schema
 */
export const webhookPayloadSchema = z.object({
  id: z.string().uuid(),
  event: z.enum(WEBHOOK_EVENTS),
  timestamp: z.string().datetime(),
  data: z.record(z.any()),
  webhookId: z.string().uuid().optional(),
  signature: z.string().optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

/**
 * Webhook signature schema
 */
export const webhookSignatureSchema = z.object({
  signature: z.string().min(32, "Signature must be at least 32 characters"),
  timestamp: z.string().datetime(),
});

export type WebhookSignatureInput = z.infer<typeof webhookSignatureSchema>;

/**
 * Webhook retry schema
 */
export const webhookRetrySchema = z.object({
  deliveryId: uuidSchema,
  maxAttempts: z.number().int().min(1).max(10).optional().default(3),
});

export type WebhookRetryInput = z.infer<typeof webhookRetrySchema>;

/**
 * Webhook test schema
 */
export const webhookTestSchema = z.object({
  url: urlSchema,
  event: z.enum(WEBHOOK_EVENTS),
  payload: z.record(z.any()).optional(),
});

export type WebhookTestInput = z.infer<typeof webhookTestSchema>;

// ============================================================
// WEBHOOK RESPONSE SCHEMAS
// ============================================================

/**
 * Webhook response schema
 */
export const webhookResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  events: z.array(z.enum(WEBHOOK_EVENTS)),
  secret: z.string().nullable(),
  isActive: z.boolean(),
  description: z.string().nullable(),
  lastDeliveryAt: z.string().datetime().nullable(),
  lastDeliveryStatus: z.number().int().nullable(),
  failureCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WebhookResponse = z.infer<typeof webhookResponseSchema>;

/**
 * Webhook delivery response schema
 */
export const webhookDeliveryResponseSchema = z.object({
  id: z.string().uuid(),
  webhookId: z.string().uuid(),
  event: z.enum(WEBHOOK_EVENTS),
  url: z.string(),
  status: z.number().int(),
  response: z.string().nullable(),
  duration: z.number().int(),
  attempt: z.number().int(),
  success: z.boolean(),
  error: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type WebhookDeliveryResponse = z.infer<
  typeof webhookDeliveryResponseSchema
>;

/**
 * Webhook stats response schema
 */
export const webhookStatsSchema = z.object({
  totalWebhooks: z.number().int(),
  activeWebhooks: z.number().int(),
  totalDeliveries: z.number().int(),
  successfulDeliveries: z.number().int(),
  failedDeliveries: z.number().int(),
  successRate: z.number(),
  averageResponseTime: z.number(),
  deliveriesByEvent: z.record(z.number().int()),
  recentFailures: z.array(
    z.object({
      deliveryId: z.string().uuid(),
      webhookId: z.string().uuid(),
      url: z.string(),
      status: z.number().int(),
      error: z.string().nullable(),
      createdAt: z.string().datetime(),
    }),
  ),
});

export type WebhookStats = z.infer<typeof webhookStatsSchema>;

// ============================================================
// SPECIFIC WEBHOOK EVENT PAYLOADS
// ============================================================

/**
 * Booking webhook payload schema
 */
export const bookingWebhookPayloadSchema = z.object({
  id: z.string().uuid(),
  bookingNumber: z.string(),
  customerId: z.string().uuid(),
  providerId: z.string().uuid(),
  status: z.string(),
  scheduledDate: z.string().datetime(),
  totalPrice: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type BookingWebhookPayload = z.infer<typeof bookingWebhookPayloadSchema>;

/**
 * Payment webhook payload schema
 */
export const paymentWebhookPayloadSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  amount: z.number(),
  status: z.string(),
  paymentMethod: z.string(),
  transactionId: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type PaymentWebhookPayload = z.infer<typeof paymentWebhookPayloadSchema>;

/**
 * Provider webhook payload schema
 */
export const providerWebhookPayloadSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  businessName: z.string(),
  category: z.string(),
  isVerified: z.boolean(),
  averageRating: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProviderWebhookPayload = z.infer<
  typeof providerWebhookPayloadSchema
>;

/**
 * Review webhook payload schema
 */
export const reviewWebhookPayloadSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  providerId: z.string().uuid(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ReviewWebhookPayload = z.infer<typeof reviewWebhookPayloadSchema>;

/**
 * User webhook payload schema
 */
export const userWebhookPayloadSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string(),
  fullName: z.string(),
  role: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserWebhookPayload = z.infer<typeof userWebhookPayloadSchema>;

// ============================================================
// HELPER VALIDATORS
// ============================================================

/**
 * Validate webhook event
 */
export function isValidWebhookEvent(event: string): boolean {
  return (WEBHOOK_EVENTS as readonly string[]).includes(event);
}

/**
 * Validate webhook URL
 */
export function isValidWebhookUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

/**
 * Validate webhook secret strength
 */
export function isValidWebhookSecret(secret: string): boolean {
  if (!secret) return false;
  return secret.length >= 32 && secret.length <= 256;
}

/**
 * Validate webhook payload signature
 */
export function isValidWebhookSignature(signature: string): boolean {
  if (!signature) return false;
  return signature.length >= 32 && /^[a-fA-F0-9]+$/.test(signature);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  WEBHOOK_EVENTS,
  registerWebhookSchema,
  updateWebhookSchema,
  webhookIdParamSchema,
  webhookFilterSchema,
  webhookDeliveryLogSchema,
  webhookDeliveryFilterSchema,
  webhookPayloadSchema,
  webhookSignatureSchema,
  webhookRetrySchema,
  webhookTestSchema,
  webhookResponseSchema,
  webhookDeliveryResponseSchema,
  webhookStatsSchema,
  bookingWebhookPayloadSchema,
  paymentWebhookPayloadSchema,
  providerWebhookPayloadSchema,
  reviewWebhookPayloadSchema,
  userWebhookPayloadSchema,
  isValidWebhookEvent,
  isValidWebhookUrl,
  isValidWebhookSecret,
  isValidWebhookSignature,
};
