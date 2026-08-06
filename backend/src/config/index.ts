// ============================================================
// CONFIGURATION INDEX
// Central export point for all configuration modules
// ============================================================

// Environment configuration
export { default as env, env as environment } from "./env";
export type { Env } from "./env";

// Database configuration
export {
  default as prisma,
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  healthCheck,
  transaction,
  transactionWithRetry,
  rawQuery,
  paginate,
} from "./database";

// JWT configuration
export {
  default as jwt,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  decodeToken,
} from "./jwt";
export type { TokenPayload, TokenResponse } from "./jwt";

// CORS configuration
export {
  default as cors,
  corsOptions,
  isOriginAllowed,
  createCorsMiddleware,
  logCorsConfiguration,
} from "./cors";

// Rate limiting configuration
export {
  default as rateLimit,
  createRateLimiter,
  authRateLimiter,
  standardRateLimiter,
  strictRateLimiter,
  relaxedRateLimiter,
  loginRateLimiter,
  otpRateLimiter,
  bookingRateLimiter,
  providerRegistrationRateLimiter,
  reviewRateLimiter,
  uploadRateLimiter,
} from "./rateLimit";

// Multer file upload configuration
export {
  default as multer,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_AVATAR_TYPES,
  imageFilter,
  documentFilter,
  avatarFilter,
  memoryStorage,
  avatarUpload,
  imageUpload,
  documentUpload,
  singleImageUpload,
  multipleImagesUpload,
  providerDocumentUpload,
  serviceImageUpload,
  reviewImageUpload,
  generateFileName,
  generateAvatarFileName,
  generateServiceImageFileName,
  generateDocumentFileName,
  generateReviewImageFileName,
  handleMulterError,
} from "./multer";

// Swagger configuration
export {
  default as swagger,
  swaggerDefinition,
  swaggerPaths,
  setupSwagger,
} from "./swagger";

// ============================================================
// RE-EXPORT ALL CONFIGURATIONS AS NAMED EXPORTS FOR CONVENIENCE
// ============================================================

import env from "./env";
import database from "./database";
import jwt from "./jwt";
import cors from "./cors";
import rateLimit from "./rateLimit";
import multer from "./multer";
import swagger from "./swagger";

export const config = {
  env,
  database,
  jwt,
  cors,
  rateLimit,
  multer,
  swagger,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default config;
