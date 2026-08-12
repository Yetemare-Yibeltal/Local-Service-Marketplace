// ============================================================
// NOTIFICATION TYPES
// Complete notification type definitions for the application
// ============================================================

// ============================================================
// ENUMS
// ============================================================

/**
 * Notification type enum
 */
export type NotificationType = "EMAIL" | "SMS" | "PUSH";

/**
 * Notification status enum
 */
export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

/**
 * Notification priority enum
 */
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

/**
 * Notification category enum
 */
export type NotificationCategory =
  | "BOOKING"
  | "PAYMENT"
  | "PROVIDER"
  | "REVIEW"
  | "SYSTEM"
  | "SECURITY"
  | "PROMOTIONAL"
  | "REMINDER";

// ============================================================
// BASE NOTIFICATION TYPES
// ============================================================

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any> | null;
  status: NotificationStatus;
  sentAt: Date | null;
  readAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  retryCount: number;
  scheduledFor: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification with user details
 */
export interface NotificationWithUser extends Notification {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
}

// ============================================================
// NOTIFICATION CRUD TYPES
// ============================================================

/**
 * Notification creation input
 */
export interface NotificationCreateInput {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  scheduledFor?: Date;
  expiresAt?: Date;
}

/**
 * Notification update input
 */
export interface NotificationUpdateInput {
  status?: NotificationStatus;
  sentAt?: Date;
  readAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount?: number;
}

/**
 * Bulk notification creation input
 */
export interface BulkNotificationCreateInput {
  userIds: string[];
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  scheduledFor?: Date;
  expiresAt?: Date;
}

/**
 * Email notification input
 */
export interface EmailNotificationInput {
  userId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// ============================================================
// NOTIFICATION FILTERS AND QUERIES
// ============================================================

/**
 * Notification filter parameters
 */
export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  isRead?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  createdAtStart?: Date;
  createdAtEnd?: Date;
}

/**
 * Notification sort options
 */
export interface NotificationSortOptions {
  field: "createdAt" | "sentAt" | "priority" | "type" | "category";
  order: "asc" | "desc";
}

/**
 * Notification pagination parameters
 */
export interface NotificationPaginationParams {
  page: number;
  limit: number;
  filters?: NotificationFilters;
  sort?: NotificationSortOptions;
}

/**
 * User notification filter parameters
 */
export interface UserNotificationFilters {
  type?: NotificationType;
  category?: NotificationCategory;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Admin notification filter parameters
 */
export interface AdminNotificationFilters {
  userId?: string;
  type?: NotificationType;
  category?: NotificationCategory;
  status?: NotificationStatus;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// ============================================================
// NOTIFICATION PREFERENCES TYPES
// ============================================================

/**
 * Notification channel preferences
 */
export interface NotificationChannelPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}

/**
 * Notification category preferences
 */
export interface NotificationCategoryPreferences {
  bookingUpdates: boolean;
  paymentUpdates: boolean;
  providerUpdates: boolean;
  reviewUpdates: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
  promotionalEmails: boolean;
  reminders: boolean;
}

/**
 * Complete notification preferences
 */
export interface NotificationPreferences {
  userId: string;
  channels: NotificationChannelPreferences;
  categories: NotificationCategoryPreferences;
  quietHours: {
    enabled: boolean;
    start: string; // Format: "22:00"
    end: string; // Format: "07:00"
  };
  frequency: {
    digest: boolean;
    digestFrequency: "daily" | "weekly";
  };
}

/**
 * Notification preferences update input
 */
export interface NotificationPreferencesUpdateInput {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  bookingUpdates?: boolean;
  paymentUpdates?: boolean;
  providerUpdates?: boolean;
  reviewUpdates?: boolean;
  systemAlerts?: boolean;
  securityAlerts?: boolean;
  promotionalEmails?: boolean;
  reminders?: boolean;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  digest?: boolean;
  digestFrequency?: "daily" | "weekly";
}

// ============================================================
// NOTIFICATION STATISTICS TYPES
// ============================================================

/**
 * Unread notification count
 */
export interface UnreadNotificationCount {
  total: number;
  byType: {
    EMAIL: number;
    SMS: number;
    PUSH: number;
  };
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
}

/**
 * Notification statistics
 */
export interface NotificationStatistics {
  totalSent: number;
  totalFailed: number;
  totalRead: number;
  totalPending: number;
  sentByType: Record<NotificationType, number>;
  sentByCategory: Record<NotificationCategory, number>;
  readRate: number;
  averageReadTime: number | null; // in minutes
  openRate: number;
  clickRate: number;
  dailySent: Array<{ date: string; count: number }>;
}

/**
 * Notification delivery statistics
 */
export interface NotificationDeliveryStats {
  totalDelivered: number;
  deliveryRate: number;
  failedDeliveries: number;
  failureRate: number;
  averageDeliveryTime: number | null; // in milliseconds
  failedByReason: Record<string, number>;
  retrySuccessRate: number;
}

// ============================================================
// NOTIFICATION TEMPLATE TYPES
// ============================================================

/**
 * Notification template interface
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification template creation input
 */
export interface NotificationTemplateCreateInput {
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  subject?: string;
  body: string;
  variables: string[];
  isActive?: boolean;
}

/**
 * Notification template update input
 */
export interface NotificationTemplateUpdateInput {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  isActive?: boolean;
}

// ============================================================
// NOTIFICATION RESPONSE TYPES
// ============================================================

/**
 * Notification list response
 */
export interface NotificationListResponse {
  data: NotificationWithUser[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: UnreadNotificationCount;
}

/**
 * User notification list response
 */
export interface UserNotificationListResponse {
  data: NotificationWithUser[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
  unreadByType: Record<NotificationType, number>;
}

/**
 * Unread notification count response
 */
export interface UnreadCountResponse {
  total: number;
  byType: Record<NotificationType, number>;
}

/**
 * Mark read response
 */
export interface MarkReadResponse {
  count: number;
  message: string;
}

/**
 * Notification send response
 */
export interface NotificationSendResponse {
  success: boolean;
  notificationId: string;
  message: string;
  error?: string;
}

/**
 * Bulk notification send response
 */
export interface BulkNotificationSendResponse {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  notifications: Array<{
    userId: string;
    notificationId: string;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================
// NOTIFICATION WEBHOOK TYPES
// ============================================================

/**
 * Notification webhook payload
 */
export interface NotificationWebhookPayload {
  event: "notification.sent" | "notification.read" | "notification.failed";
  notificationId: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data: Record<string, any> | null;
  timestamp: Date;
}

// ============================================================
// NOTIFICATION EXPORT TYPES
// ============================================================

/**
 * Notification export data
 */
export interface NotificationExportData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  category: string;
  title: string;
  message: string;
  status: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * Notification export options
 */
export interface NotificationExportOptions {
  userId?: string;
  type?: NotificationType;
  category?: NotificationCategory;
  startDate?: Date;
  endDate?: Date;
  format: "csv" | "json" | "excel";
}

// ============================================================
// NOTIFICATION HELPER TYPES
// ============================================================

/**
 * Notification delivery status
 */
export interface NotificationDeliveryStatus {
  success: boolean;
  method: NotificationType;
  deliveredAt: Date | null;
  error?: string;
}

/**
 * Notification validation result
 */
export interface NotificationValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Notification channel status
 */
export interface NotificationChannelStatus {
  email: {
    configured: boolean;
    enabled: boolean;
    lastTested: Date | null;
    status: "OK" | "ERROR" | "DISABLED";
  };
  sms: {
    configured: boolean;
    enabled: boolean;
    lastTested: Date | null;
    status: "OK" | "ERROR" | "DISABLED";
  };
  push: {
    configured: boolean;
    enabled: boolean;
    lastTested: Date | null;
    status: "OK" | "ERROR" | "DISABLED";
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Enums
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationCategory,

  // Base types
  Notification,
  NotificationWithUser,

  // CRUD types
  NotificationCreateInput,
  NotificationUpdateInput,
  BulkNotificationCreateInput,
  EmailNotificationInput,

  // Filter types
  NotificationFilters,
  NotificationSortOptions,
  NotificationPaginationParams,
  UserNotificationFilters,
  AdminNotificationFilters,

  // Preferences types
  NotificationChannelPreferences,
  NotificationCategoryPreferences,
  NotificationPreferences,
  NotificationPreferencesUpdateInput,

  // Statistics types
  UnreadNotificationCount,
  NotificationStatistics,
  NotificationDeliveryStats,

  // Template types
  NotificationTemplate,
  NotificationTemplateCreateInput,
  NotificationTemplateUpdateInput,

  // Response types
  NotificationListResponse,
  UserNotificationListResponse,
  UnreadCountResponse,
  MarkReadResponse,
  NotificationSendResponse,
  BulkNotificationSendResponse,

  // Webhook types
  NotificationWebhookPayload,

  // Export types
  NotificationExportData,
  NotificationExportOptions,

  // Helper types
  NotificationDeliveryStatus,
  NotificationValidationResult,
  NotificationChannelStatus,
};
