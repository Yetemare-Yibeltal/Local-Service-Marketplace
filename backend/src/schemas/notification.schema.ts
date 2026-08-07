import { z } from "zod";
import { uuidSchema } from "../middlewares/validation.middleware";

// ============================================================
// NOTIFICATION SCHEMAS
// ============================================================

/**
 * Send notification schema
 */
export const sendNotificationSchema = z.object({
  userId: uuidSchema,
  type: z.enum(["EMAIL", "SMS", "PUSH"]),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),
  message: z
    .string()
    .min(5, "Message must be at least 5 characters")
    .max(2000, "Message must not exceed 2000 characters"),
  data: z.record(z.any()).optional(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

/**
 * Send bulk notifications schema
 */
export const sendBulkNotificationSchema = z.object({
  userIds: z.array(uuidSchema).min(1, "At least one user ID is required"),
  type: z.enum(["EMAIL", "SMS", "PUSH"]),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),
  message: z
    .string()
    .min(5, "Message must be at least 5 characters")
    .max(2000, "Message must not exceed 2000 characters"),
  data: z.record(z.any()).optional(),
});

export type SendBulkNotificationInput = z.infer<
  typeof sendBulkNotificationSchema
>;

/**
 * Mark notification as read schema
 */
export const markNotificationReadSchema = z.object({
  id: uuidSchema,
});

export type MarkNotificationReadInput = z.infer<
  typeof markNotificationReadSchema
>;

/**
 * Mark all notifications as read schema
 */
export const markAllNotificationsReadSchema = z.object({
  userId: uuidSchema,
});

export type MarkAllNotificationsReadInput = z.infer<
  typeof markAllNotificationsReadSchema
>;

/**
 * Notification ID param schema
 */
export const notificationIdParamSchema = z.object({
  id: uuidSchema,
});

export type NotificationIdParamInput = z.infer<
  typeof notificationIdParamSchema
>;

/**
 * Notification filter schema
 */
export const notificationFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  type: z.enum(["EMAIL", "SMS", "PUSH"]).optional(),
  status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
  isRead: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "sentAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;

/**
 * User notification filter schema
 */
export const userNotificationFilterSchema = z.object({
  userId: uuidSchema,
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  type: z.enum(["EMAIL", "SMS", "PUSH"]).optional(),
  isRead: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  sortBy: z.enum(["createdAt", "sentAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type UserNotificationFilterInput = z.infer<
  typeof userNotificationFilterSchema
>;

/**
 * Notification response schema
 */
export const notificationResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(["EMAIL", "SMS", "PUSH"]),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).nullable(),
  status: z.enum(["PENDING", "SENT", "FAILED"]),
  sentAt: z.string().datetime().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

/**
 * Notification with user response schema
 */
export const notificationWithUserSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(["EMAIL", "SMS", "PUSH"]),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).nullable(),
  status: z.enum(["PENDING", "SENT", "FAILED"]),
  sentAt: z.string().datetime().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  user: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
});

export type NotificationWithUser = z.infer<typeof notificationWithUserSchema>;

/**
 * Notification preferences schema
 */
export const notificationPreferencesSchema = z.object({
  userId: uuidSchema,
  emailEnabled: z.boolean().optional().default(true),
  smsEnabled: z.boolean().optional().default(true),
  pushEnabled: z.boolean().optional().default(true),
  bookingUpdates: z.boolean().optional().default(true),
  promotionalEmails: z.boolean().optional().default(false),
  providerUpdates: z.boolean().optional().default(true),
  systemAlerts: z.boolean().optional().default(true),
});

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;

/**
 * Update notification preferences schema
 */
export const updateNotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  bookingUpdates: z.boolean().optional(),
  promotionalEmails: z.boolean().optional(),
  providerUpdates: z.boolean().optional(),
  systemAlerts: z.boolean().optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

/**
 * Unread notification count schema
 */
export const unreadNotificationCountSchema = z.object({
  userId: uuidSchema,
});

export type UnreadNotificationCountInput = z.infer<
  typeof unreadNotificationCountSchema
>;

/**
 * Notification templates schema
 */
export const notificationTemplateSchema = z.object({
  name: z
    .string()
    .min(3, "Template name must be at least 3 characters")
    .max(50, "Template name must not exceed 50 characters"),
  type: z.enum(["EMAIL", "SMS", "PUSH"]),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must not exceed 200 characters")
    .optional(),
  body: z
    .string()
    .min(5, "Body must be at least 5 characters")
    .max(5000, "Body must not exceed 5000 characters"),
  variables: z.array(z.string()).optional(),
});

export type NotificationTemplateInput = z.infer<
  typeof notificationTemplateSchema
>;

// ============================================================
// HELPER VALIDATORS
// ============================================================

/**
 * Validate notification type
 */
export function isValidNotificationType(type: string): boolean {
  return ["EMAIL", "SMS", "PUSH"].includes(type);
}

/**
 * Validate notification status
 */
export function isValidNotificationStatus(status: string): boolean {
  return ["PENDING", "SENT", "FAILED"].includes(status);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  sendNotificationSchema,
  sendBulkNotificationSchema,
  markNotificationReadSchema,
  markAllNotificationsReadSchema,
  notificationIdParamSchema,
  notificationFilterSchema,
  userNotificationFilterSchema,
  notificationResponseSchema,
  notificationWithUserSchema,
  notificationPreferencesSchema,
  updateNotificationPreferencesSchema,
  unreadNotificationCountSchema,
  notificationTemplateSchema,
  isValidNotificationType,
  isValidNotificationStatus,
};
