// ============================================================
// UTILITIES INDEX
// Central export point for all utility modules
// ============================================================

// Logger
export {
  default as logger,
  logError,
  logApiRequest,
  logDatabaseQuery,
  createModuleLogger,
  morganStream,
} from "./logger";

// Response formatter
export {
  default as response,
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
} from "./response";
export type { ApiResponse, PaginatedResponse, ErrorResponse } from "./response";

// Bcrypt and password utilities
export {
  default as bcrypt,
  hashPassword,
  hashPasswordSync,
  comparePassword,
  comparePasswordSync,
  validatePasswordStrength,
  generateSecureToken,
  generateOTP,
  generateAlphanumericToken,
  generateBookingReference,
  DEFAULT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "./bcrypt";

// Validation utilities
export {
  default as validator,
  VALIDATION_PATTERNS,
  isValidEmail,
  validateEmail,
  isValidPhone,
  isValidEthiopianPhone,
  isValidPhoneAny,
  validatePhone,
  formatPhoneToE164,
  isValidPassword,
  validatePassword,
  isValidUUID,
  isValidURL,
  isValidSlug,
  isAlphanumeric,
  isValidOTP,
  isValidLatitude,
  isValidLongitude,
  isValidDate,
  isValidDateTime,
  isDateInFuture,
  isDateStringInFuture,
  isInRange,
  validateRange,
  isValidLength,
  validateLength,
  isRequired,
  validateRequired,
  isValidArray,
  validateArray,
  isInEnum,
  validateEnum,
  isObject,
} from "./validator";

// Constants
export {
  default as constants,
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
} from "./constants";
export type {
  UserRole,
  BookingStatus,
  PriceType,
  VerificationStatus,
  PaymentStatus,
  DisputeStatus,
  NotificationType,
  NotificationStatus,
  AvailabilityDay,
} from "./constants";

// Helper utilities
export {
  default as helpers,
  omit,
  pick,
  deepMerge,
  isEmptyObject,
  cleanObject,
  truncate,
  capitalize,
  toTitleCase,
  generateSlug,
  maskString,
  maskEmail,
  maskPhone,
  escapeHtml,
  unescapeHtml,
  chunkArray,
  uniqueArray,
  groupBy,
  shuffleArray,
  formatNumber,
  formatCurrency,
  randomNumber,
  clampNumber,
  formatDate,
  timeAgo,
  isToday,
  getDayRange,
  sleep,
  retry,
  withTimeout,
  sequence,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isNil,
  isValidDate,
} from "./helpers";

// ============================================================
// RE-EXPORT ALL UTILITIES AS NAMED EXPORTS FOR CONVENIENCE
// ============================================================

import logger from "./logger";
import response from "./response";
import bcrypt from "./bcrypt";
import validator from "./validator";
import constants from "./constants";
import helpers from "./helpers";

export const utils = {
  logger,
  response,
  bcrypt,
  validator,
  constants,
  helpers,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  ...utils,
};
