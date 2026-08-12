// ============================================================
// TYPES INDEX
// Central export point for all type definitions
// ============================================================

// Auth types
export * from "./auth.types";
export type {
  TokenPayload,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  OTPInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "./auth.types";

// User types
export * from "./user.types";
export type {
  User,
  UserRole,
  UserFilters,
  UserProfile,
  AdminCreateUserInput,
  AdminUpdateUserInput,
} from "./user.types";

// Provider types
export * from "./provider.types";
export type {
  Provider,
  ProviderProfile,
  ProviderFilters,
  ProviderRegistrationInput,
  ProviderUpdateInput,
  Service,
  ServiceFilters,
  ServiceCreateInput,
  ServiceUpdateInput,
  Availability,
  WorkingHours,
  ProviderSearchResult,
  ProviderWithUser,
} from "./provider.types";

// Booking types
export * from "./booking.types";
export type {
  Booking,
  BookingStatus,
  BookingFilters,
  BookingCreateInput,
  BookingUpdateInput,
  BookingWithRelations,
  DashboardStats,
  BookingStateTransition,
} from "./booking.types";

// Review types
export * from "./review.types";
export type {
  Review,
  ReviewFilters,
  ReviewCreateInput,
  ReviewUpdateInput,
  ReviewWithRelations,
  ReviewResponse,
  ReviewResponseInput,
  ProviderRatingStats,
} from "./review.types";

// Category types
export * from "./category.types";
export type {
  Category,
  CategoryFilters,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryWithChildren,
  CategoryTree,
  CategoryWithParent,
} from "./category.types";

// Notification types
export * from "./notification.types";
export type {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationFilters,
  NotificationCreateInput,
  NotificationUpdateInput,
  NotificationWithUser,
  NotificationPreferences,
  UnreadCount,
  BulkNotificationInput,
} from "./notification.types";

// Analytics types
export * from "./analytics.types";
export type {
  AnalyticsFilters,
  BookingAnalyticsResult,
  RevenueAnalyticsResult,
  ProviderPerformanceResult,
  CustomerBehaviorResult,
  CategoryAnalyticsResult,
  TimeSeriesData,
  DateRange,
} from "./analytics.types";

// Webhook types
export * from "./webhook.types";
export type {
  WebhookEvent,
  WebhookPayload,
  WebhookRegistrationInput,
  WebhookUpdateInput,
  WebhookDelivery,
  WebhookFilters,
  WebhookSignature,
} from "./webhook.types";

// API types
export * from "./api.types";
export type {
  ApiResponse,
  ApiErrorResponse,
  PaginatedResponse,
  PaginationParams,
  SortParams,
  FilterParams,
} from "./api.types";

// Config types
export * from "./config.types";
export type {
  AppConfig,
  DatabaseConfig,
  RedisConfig,
  JWTConfig,
  CloudinaryConfig,
  EmailConfig,
  TwilioConfig,
  CorsConfig,
  RateLimitConfig,
  SwaggerConfig,
  MulterConfig,
} from "./config.types";

// Error types
export * from "./error.types";
export type {
  AppError,
  ErrorResponse,
  ValidationError,
  DatabaseError,
  AuthError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from "./error.types";

// ============================================================
// RE-EXPORT ALL TYPES AS A SINGLE OBJECT
// ============================================================

import * as authTypes from "./auth.types";
import * as userTypes from "./user.types";
import * as providerTypes from "./provider.types";
import * as bookingTypes from "./booking.types";
import * as reviewTypes from "./review.types";
import * as categoryTypes from "./category.types";
import * as notificationTypes from "./notification.types";
import * as analyticsTypes from "./analytics.types";
import * as webhookTypes from "./webhook.types";
import * as apiTypes from "./api.types";
import * as configTypes from "./config.types";
import * as errorTypes from "./error.types";

export const types = {
  auth: authTypes,
  user: userTypes,
  provider: providerTypes,
  booking: bookingTypes,
  review: reviewTypes,
  category: categoryTypes,
  notification: notificationTypes,
  analytics: analyticsTypes,
  webhook: webhookTypes,
  api: apiTypes,
  config: configTypes,
  error: errorTypes,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default types;
