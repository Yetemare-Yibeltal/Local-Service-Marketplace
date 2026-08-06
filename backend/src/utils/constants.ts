// ============================================================
// APPLICATION CONSTANTS
// ============================================================

// ============================================================
// HTTP STATUS CODES
// ============================================================

export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================================
// HTTP METHODS
// ============================================================

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
} as const;

// ============================================================
// USER ROLES
// ============================================================

export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  PROVIDER: "PROVIDER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLES_LIST = Object.values(USER_ROLES);

// ============================================================
// BOOKING STATUSES
// ============================================================

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  DISPUTED: "DISPUTED",
} as const;

export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const BOOKING_STATUS_LIST = Object.values(BOOKING_STATUS);

// Status transitions allowed
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "DISPUTED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "DISPUTED"],
  IN_PROGRESS: ["COMPLETED", "DISPUTED"],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: [],
};

// ============================================================
// PRICE TYPES
// ============================================================

export const PRICE_TYPES = {
  FIXED: "FIXED",
  HOURLY: "HOURLY",
} as const;

export type PriceType = (typeof PRICE_TYPES)[keyof typeof PRICE_TYPES];

export const PRICE_TYPES_LIST = Object.values(PRICE_TYPES);

// ============================================================
// VERIFICATION STATUSES
// ============================================================

export const VERIFICATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export const VERIFICATION_STATUS_LIST = Object.values(VERIFICATION_STATUS);

// ============================================================
// PAYMENT STATUSES
// ============================================================

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUS);

// ============================================================
// DISPUTE STATUSES
// ============================================================

export const DISPUTE_STATUS = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export type DisputeStatus =
  (typeof DISPUTE_STATUS)[keyof typeof DISPUTE_STATUS];

export const DISPUTE_STATUS_LIST = Object.values(DISPUTE_STATUS);

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export const NOTIFICATION_TYPES = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  PUSH: "PUSH",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// ============================================================
// NOTIFICATION STATUSES
// ============================================================

export const NOTIFICATION_STATUS = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
} as const;

export type NotificationStatus =
  (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

// ============================================================
// AVAILABILITY DAYS
// ============================================================

export const AVAILABILITY_DAYS = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;

export type AvailabilityDay =
  (typeof AVAILABILITY_DAYS)[keyof typeof AVAILABILITY_DAYS];

export const AVAILABILITY_DAYS_LIST = Object.values(AVAILABILITY_DAYS);

// ============================================================
// DEFAULT VALUES
// ============================================================

export const DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  RADIUS_KM: 10,
  MAX_RADIUS_KM: 50,
  DEFAULT_LATITUDE: 9.03,
  DEFAULT_LONGITUDE: 38.74,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  TOKEN_EXPIRY_DAYS: 7,
  SALT_ROUNDS: 12,
} as const;

// ============================================================
// CACHE KEYS
// ============================================================

export const CACHE_KEYS = {
  PROVIDERS: "providers",
  CATEGORIES: "categories",
  BOOKING: "booking",
  USER_SESSION: "session",
  RATE_LIMIT: "rate_limit",
} as const;

// ============================================================
// MESSAGES
// ============================================================

export const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  FETCHED: "Resource fetched successfully",
  LOGIN_SUCCESS: "Login successful",
  REGISTER_SUCCESS: "Registration successful",
  LOGOUT_SUCCESS: "Logout successful",
  OTP_SENT: "OTP sent successfully",
  OTP_VERIFIED: "OTP verified successfully",
  PASSWORD_RESET: "Password reset successfully",
  EMAIL_VERIFIED: "Email verified successfully",
  BOOKING_CREATED: "Booking created successfully",
  BOOKING_UPDATED: "Booking updated successfully",
  REVIEW_SUBMITTED: "Review submitted successfully",
  PROVIDER_REGISTERED: "Provider registered successfully",
  PROVIDER_VERIFIED: "Provider verified successfully",
} as const;

export const ERROR_MESSAGES = {
  INTERNAL_SERVER: "Internal server error",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden access",
  BAD_REQUEST: "Invalid request",
  VALIDATION_ERROR: "Validation failed",
  DUPLICATE_ENTRY: "Duplicate entry",
  INVALID_CREDENTIALS: "Invalid email or password",
  INVALID_TOKEN: "Invalid or expired token",
  INVALID_OTP: "Invalid or expired OTP",
  USER_NOT_FOUND: "User not found",
  PROVIDER_NOT_FOUND: "Provider not found",
  BOOKING_NOT_FOUND: "Booking not found",
  REVIEW_NOT_FOUND: "Review not found",
  CATEGORY_NOT_FOUND: "Category not found",
  SERVICE_NOT_FOUND: "Service not found",
  BOOKING_ALREADY_EXISTS: "Booking already exists",
  REVIEW_ALREADY_EXISTS: "Review already exists for this booking",
  INVALID_STATUS_TRANSITION: "Invalid status transition",
  PROVIDER_ALREADY_REGISTERED: "Provider already registered",
  EMAIL_ALREADY_EXISTS: "Email already registered",
  PHONE_ALREADY_EXISTS: "Phone number already registered",
  INVALID_CURRENT_PASSWORD: "Current password is incorrect",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later.",
  FILE_UPLOAD_FAILED: "File upload failed",
  INVALID_FILE_TYPE: "Invalid file type",
  FILE_TOO_LARGE: "File too large",
} as const;

// ============================================================
// REGEX PATTERNS
// ============================================================

export const REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+[1-9]\d{1,14}$/,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]).{8,72}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
} as const;

// ============================================================
// FILE CONSTANTS
// ============================================================

export const FILE_CONSTANTS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALLOWED_AVATAR_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  UPLOAD_DIRS: {
    AVATAR: "avatars",
    PROVIDER: "providers",
    SERVICE: "services",
    REVIEW: "reviews",
    DOCUMENT: "documents",
    CATEGORY: "categories",
  },
} as const;

// ============================================================
// API CONFIGURATION
// ============================================================

export const API_CONFIG = {
  VERSION: "v1",
  PREFIX: "/api",
  TIMEOUT: 30000, // 30 seconds
  MAX_PAYLOAD: 10 * 1024 * 1024, // 10MB
} as const;

// ============================================================
// CORS CONFIGURATION
// ============================================================

export const CORS_CONFIG = {
  ALLOWED_HEADERS: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-API-Key",
    "X-Correlation-ID",
  ],
  ALLOWED_METHODS: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  EXPOSED_HEADERS: ["X-Total-Count", "X-Page", "X-Limit", "X-Total-Pages"],
  MAX_AGE: 86400, // 24 hours
} as const;

// ============================================================
// EXPORTS
// ============================================================

export default {
  HTTP_STATUS,
  HTTP_METHODS,
  USER_ROLES,
  USER_ROLES_LIST,
  BOOKING_STATUS,
  BOOKING_STATUS_LIST,
  BOOKING_TRANSITIONS,
  PRICE_TYPES,
  PRICE_TYPES_LIST,
  VERIFICATION_STATUS,
  VERIFICATION_STATUS_LIST,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LIST,
  DISPUTE_STATUS,
  DISPUTE_STATUS_LIST,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  AVAILABILITY_DAYS,
  AVAILABILITY_DAYS_LIST,
  DEFAULTS,
  CACHE_KEYS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  REGEX,
  FILE_CONSTANTS,
  API_CONFIG,
  CORS_CONFIG,
};
