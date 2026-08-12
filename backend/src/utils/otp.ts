import { randomBytes } from "crypto";
import {
  generateSecureToken,
  generateOTP as generateNumericOTP,
} from "./encryption";
import logger from "./logger";

// ============================================================
// TYPES
// ============================================================

/**
 * OTP type enum
 */
export type OTPType =
  | "VERIFICATION"
  | "PASSWORD_RESET"
  | "LOGIN"
  | "TRANSACTION"
  | "TWO_FACTOR";

/**
 * OTP configuration
 */
export interface OTPConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
  lockoutMinutes: number;
  resendCooldownSeconds: number;
  type: OTPType;
}

/**
 * OTP data
 */
export interface OTPData {
  otp: string;
  userId?: string;
  phone?: string;
  email?: string;
  type: OTPType;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  usedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * OTP send result
 */
export interface OTPSendResult {
  success: boolean;
  message: string;
  otp?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * OTP verify result
 */
export interface OTPVerifyResult {
  success: boolean;
  verified: boolean;
  message: string;
  remainingAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: Date;
}

/**
 * OTP rate limit result
 */
export interface OTPRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  waitSeconds: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default OTP configurations by type
 */
export const OTP_CONFIGS: Record<OTPType, OTPConfig> = {
  VERIFICATION: {
    length: 6,
    expiryMinutes: 10,
    maxAttempts: 5,
    lockoutMinutes: 30,
    resendCooldownSeconds: 60,
    type: "VERIFICATION",
  },
  PASSWORD_RESET: {
    length: 8,
    expiryMinutes: 15,
    maxAttempts: 3,
    lockoutMinutes: 60,
    resendCooldownSeconds: 120,
    type: "PASSWORD_RESET",
  },
  LOGIN: {
    length: 6,
    expiryMinutes: 5,
    maxAttempts: 5,
    lockoutMinutes: 15,
    resendCooldownSeconds: 30,
    type: "LOGIN",
  },
  TRANSACTION: {
    length: 6,
    expiryMinutes: 5,
    maxAttempts: 3,
    lockoutMinutes: 30,
    resendCooldownSeconds: 60,
    type: "TRANSACTION",
  },
  TWO_FACTOR: {
    length: 6,
    expiryMinutes: 5,
    maxAttempts: 3,
    lockoutMinutes: 15,
    resendCooldownSeconds: 30,
    type: "TWO_FACTOR",
  },
};

/**
 * OTP expiry buffer (extra time after expiry for verification)
 */
const OTP_EXPIRY_BUFFER_SECONDS = 30;

// ============================================================
// GENERATION FUNCTIONS
// ============================================================

/**
 * Generate a numeric OTP
 */
export function generateOTP(length: number = 6): string {
  try {
    return generateNumericOTP(length);
  } catch (error) {
    logger.error("OTP generation failed:", error);
    throw new Error("Failed to generate OTP");
  }
}

/**
 * Generate an alphanumeric OTP
 */
export function generateAlphaNumericOTP(length: number = 8): string {
  try {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  } catch (error) {
    logger.error("Alphanumeric OTP generation failed:", error);
    throw new Error("Failed to generate alphanumeric OTP");
  }
}

/**
 * Generate OTP with specific configuration
 */
export function generateOTPWithConfig(type: OTPType = "VERIFICATION"): {
  otp: string;
  config: OTPConfig;
} {
  const config = OTP_CONFIGS[type];
  const otp =
    type === "PASSWORD_RESET"
      ? generateAlphaNumericOTP(config.length)
      : generateOTP(config.length);

  return { otp, config };
}

/**
 * Create OTP data object
 */
export function createOTPData(
  otp: string,
  type: OTPType = "VERIFICATION",
  identifier?: { userId?: string; phone?: string; email?: string },
  metadata?: Record<string, any>,
): OTPData {
  const config = OTP_CONFIGS[type];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.expiryMinutes * 60 * 1000);

  return {
    otp,
    type,
    createdAt: now,
    expiresAt,
    attempts: 0,
    maxAttempts: config.maxAttempts,
    isUsed: false,
    ...identifier,
    metadata,
  };
}

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate OTP format
 */
export function isValidOTPFormat(
  otp: string,
  type: OTPType = "VERIFICATION",
): boolean {
  if (!otp || typeof otp !== "string") {
    return false;
  }

  const config = OTP_CONFIGS[type];

  if (otp.length !== config.length) {
    return false;
  }

  if (type === "PASSWORD_RESET") {
    // Alphanumeric
    return /^[A-Z0-9]+$/.test(otp);
  }

  // Numeric
  return /^[0-9]+$/.test(otp);
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(otpData: OTPData): boolean {
  const now = new Date();
  return (
    now.getTime() >
    otpData.expiresAt.getTime() + OTP_EXPIRY_BUFFER_SECONDS * 1000
  );
}

/**
 * Check if OTP is locked
 */
export function isOTPLocked(otpData: OTPData): boolean {
  return otpData.attempts >= otpData.maxAttempts;
}

/**
 * Get remaining attempts
 */
export function getRemainingAttempts(otpData: OTPData): number {
  return Math.max(0, otpData.maxAttempts - otpData.attempts);
}

/**
 * Get lockout remaining time
 */
export function getLockoutRemainingTime(
  otpData: OTPData,
  lockoutMinutes?: number,
): number {
  if (!isOTPLocked(otpData)) {
    return 0;
  }

  const config = OTP_CONFIGS[otpData.type];
  const lockoutMs = (lockoutMinutes || config.lockoutMinutes) * 60 * 1000;
  const lockedAt = new Date(otpData.expiresAt.getTime() + lockoutMs);
  const now = new Date();
  const remaining = lockedAt.getTime() - now.getTime();

  return Math.max(0, remaining);
}

// ============================================================
// VERIFICATION FUNCTIONS
// ============================================================

/**
 * Verify OTP
 */
export function verifyOTP(
  otpData: OTPData,
  inputOTP: string,
  type: OTPType = "VERIFICATION",
): OTPVerifyResult {
  // Check if OTP data exists
  if (!otpData) {
    return {
      success: false,
      verified: false,
      message: "OTP not found",
    };
  }

  // Check if OTP is already used
  if (otpData.isUsed) {
    return {
      success: false,
      verified: false,
      message: "OTP has already been used",
    };
  }

  // Check if OTP is expired
  if (isOTPExpired(otpData)) {
    return {
      success: false,
      verified: false,
      message: "OTP has expired",
    };
  }

  // Check if OTP is locked
  if (isOTPLocked(otpData)) {
    const lockoutMinutes = OTP_CONFIGS[type].lockoutMinutes;
    const remainingMs = getLockoutRemainingTime(otpData, lockoutMinutes);
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return {
      success: false,
      verified: false,
      message: `Too many attempts. Please try again in ${remainingMinutes} minutes.`,
      isLocked: true,
      lockedUntil: new Date(Date.now() + remainingMs),
    };
  }

  // Check OTP match
  if (otpData.otp !== inputOTP) {
    // Increment attempts
    const newAttempts = otpData.attempts + 1;
    const remaining = otpData.maxAttempts - newAttempts;

    // Update attempts (this would be done by the caller)
    otpData.attempts = newAttempts;

    if (remaining <= 0) {
      return {
        success: false,
        verified: false,
        message: "Too many incorrect attempts. Your OTP has been locked.",
        remainingAttempts: 0,
        isLocked: true,
      };
    }

    return {
      success: false,
      verified: false,
      message: `Invalid OTP. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`,
      remainingAttempts: remaining,
    };
  }

  // OTP is valid
  otpData.isUsed = true;
  otpData.usedAt = new Date();

  return {
    success: true,
    verified: true,
    message: "OTP verified successfully",
  };
}

/**
 * Mark OTP as used
 */
export function markOTPAsUsed(otpData: OTPData): OTPData {
  return {
    ...otpData,
    isUsed: true,
    usedAt: new Date(),
  };
}

/**
 * Increment OTP attempts
 */
export function incrementOTPAttempts(otpData: OTPData): OTPData {
  return {
    ...otpData,
    attempts: otpData.attempts + 1,
  };
}

// ============================================================
// RATE LIMITING
// ============================================================

/**
 * Check OTP rate limit
 */
export function checkOTPRateLimit(
  otpData: OTPData | null,
  type: OTPType = "VERIFICATION",
): OTPRateLimitResult {
  const config = OTP_CONFIGS[type];
  const now = Date.now();

  if (!otpData) {
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetAt: new Date(now + config.resendCooldownSeconds * 1000),
      waitSeconds: 0,
    };
  }

  // Calculate cooldown
  const cooldownMs = config.resendCooldownSeconds * 1000;
  const lastRequestAt = otpData.createdAt.getTime();
  const elapsed = now - lastRequestAt;

  if (elapsed < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
    return {
      allowed: false,
      remaining: config.maxAttempts - otpData.attempts,
      resetAt: new Date(lastRequestAt + cooldownMs),
      waitSeconds,
    };
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - otpData.attempts,
    resetAt: new Date(now + cooldownMs),
    waitSeconds: 0,
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate OTP key for storage (Redis)
 */
export function getOTPStorageKey(
  identifier: string,
  type: OTPType = "VERIFICATION",
): string {
  return `otp:${type.toLowerCase()}:${identifier}`;
}

/**
 * Generate OTP rate limit key
 */
export function getOTPRateLimitKey(
  identifier: string,
  type: OTPType = "VERIFICATION",
): string {
  return `otp:ratelimit:${type.toLowerCase()}:${identifier}`;
}

/**
 * Generate OTP from phone number
 */
export function generateOTPForPhone(
  phone: string,
  type: OTPType = "VERIFICATION",
): { otp: string; config: OTPConfig } {
  const { otp, config } = generateOTPWithConfig(type);
  return { otp, config };
}

/**
 * Generate OTP for email
 */
export function generateOTPForEmail(
  email: string,
  type: OTPType = "VERIFICATION",
): { otp: string; config: OTPConfig } {
  const { otp, config } = generateOTPWithConfig(type);
  return { otp, config };
}

/**
 * Generate OTP for user ID
 */
export function generateOTPForUser(
  userId: string,
  type: OTPType = "VERIFICATION",
): { otp: string; config: OTPConfig } {
  const { otp, config } = generateOTPWithConfig(type);
  return { otp, config };
}

/**
 * Create OTP send result
 */
export function createOTPSendResult(
  success: boolean,
  message: string,
  otp?: string,
  expiresAt?: Date,
  error?: string,
): OTPSendResult {
  return {
    success,
    message,
    otp,
    expiresAt,
    error,
  };
}

/**
 * Get OTP expiry message
 */
export function getOTPExpiryMessage(expiresAt: Date): string {
  const now = Date.now();
  const remaining = expiresAt.getTime() - now;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  if (minutes > 0) {
    return `This OTP will expire in ${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return `This OTP will expire in ${seconds} second${seconds > 1 ? "s" : ""}`;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  OTPType,
  OTPConfig,
  OTPData,
  OTPSendResult,
  OTPVerifyResult,
  OTPRateLimitResult,

  // Constants
  OTP_CONFIGS,

  // Generation
  generateOTP,
  generateAlphaNumericOTP,
  generateOTPWithConfig,
  createOTPData,

  // Validation
  isValidOTPFormat,
  isOTPExpired,
  isOTPLocked,
  getRemainingAttempts,
  getLockoutRemainingTime,

  // Verification
  verifyOTP,
  markOTPAsUsed,
  incrementOTPAttempts,

  // Rate limiting
  checkOTPRateLimit,

  // Helpers
  getOTPStorageKey,
  getOTPRateLimitKey,
  generateOTPForPhone,
  generateOTPForEmail,
  generateOTPForUser,
  createOTPSendResult,
  getOTPExpiryMessage,
};
