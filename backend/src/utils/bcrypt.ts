import bcrypt from "bcrypt";
import crypto from "crypto";
import logger from "./logger";

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default number of salt rounds for bcrypt hashing
 * 12 rounds provides a good balance between security and performance
 */
export const DEFAULT_SALT_ROUNDS = 12;

/**
 * Minimum password length requirement
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Maximum password length requirement
 */
export const MAX_PASSWORD_LENGTH = 72; // bcrypt max length

// ============================================================
// PASSWORD HASHING
// ============================================================

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @param saltRounds - Number of salt rounds (default: 12)
 * @returns Promise resolving to hashed password string
 * @throws Error if hashing fails
 */
export async function hashPassword(
  password: string,
  saltRounds: number = DEFAULT_SALT_ROUNDS,
): Promise<string> {
  try {
    // Validate password
    if (!password || password.length === 0) {
      throw new Error("Password cannot be empty");
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      throw new Error(
        `Password exceeds maximum length of ${MAX_PASSWORD_LENGTH} characters`,
      );
    }

    // Generate salt and hash
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    logger.debug("Password hashed successfully");

    return hashedPassword;
  } catch (error) {
    logger.error("Password hashing failed:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Hash a password synchronously
 * Use this only when async is not available (e.g., in seed scripts)
 */
export function hashPasswordSync(
  password: string,
  saltRounds: number = DEFAULT_SALT_ROUNDS,
): string {
  try {
    if (!password || password.length === 0) {
      throw new Error("Password cannot be empty");
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      throw new Error(
        `Password exceeds maximum length of ${MAX_PASSWORD_LENGTH} characters`,
      );
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    logger.debug("Password hashed synchronously");

    return hashedPassword;
  } catch (error) {
    logger.error("Synchronous password hashing failed:", error);
    throw new Error("Failed to hash password");
  }
}

// ============================================================
// PASSWORD VERIFICATION
// ============================================================

/**
 * Compare a plain text password with a hashed password
 * @param plainPassword - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to boolean indicating if passwords match
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    if (!plainPassword || !hashedPassword) {
      logger.warn("Password comparison attempted with empty values");
      return false;
    }

    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    if (isMatch) {
      logger.debug("Password verification successful");
    } else {
      logger.debug("Password verification failed");
    }

    return isMatch;
  } catch (error) {
    logger.error("Password comparison failed:", error);
    return false;
  }
}

/**
 * Compare a plain text password with a hashed password synchronously
 */
export function comparePasswordSync(
  plainPassword: string,
  hashedPassword: string,
): boolean {
  try {
    if (!plainPassword || !hashedPassword) {
      logger.warn(
        "Synchronous password comparison attempted with empty values",
      );
      return false;
    }

    return bcrypt.compareSync(plainPassword, hashedPassword);
  } catch (error) {
    logger.error("Synchronous password comparison failed:", error);
    return false;
  }
}

// ============================================================
// PASSWORD VALIDATION
// ============================================================

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (!password) {
    return {
      isValid: false,
      message: "Password is required",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`,
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
  }

  return {
    isValid: true,
  };
}

// ============================================================
// TOKEN GENERATION
// ============================================================

/**
 * Generate a secure random token
 * @param length - Length of token in bytes (default: 32)
 * @param encoding - Output encoding (default: 'hex')
 * @returns Random token string
 */
export function generateSecureToken(
  length: number = 32,
  encoding: BufferEncoding = "hex",
): string {
  try {
    const buffer = crypto.randomBytes(length);
    return buffer.toString(encoding);
  } catch (error) {
    logger.error("Secure token generation failed:", error);
    throw new Error("Failed to generate secure token");
  }
}

/**
 * Generate a numeric OTP
 * @param length - Number of digits (default: 6)
 * @returns Numeric OTP string
 */
export function generateOTP(length: number = 6): string {
  try {
    if (length < 1 || length > 10) {
      throw new Error("OTP length must be between 1 and 10");
    }

    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;

    return otp.toString().padStart(length, "0");
  } catch (error) {
    logger.error("OTP generation failed:", error);
    throw new Error("Failed to generate OTP");
  }
}

/**
 * Generate a random alphanumeric string
 * @param length - Length of string (default: 16)
 * @returns Random alphanumeric string
 */
export function generateAlphanumericToken(length: number = 16): string {
  try {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }

    return result;
  } catch (error) {
    logger.error("Alphanumeric token generation failed:", error);
    throw new Error("Failed to generate alphanumeric token");
  }
}

/**
 * Generate a unique booking reference number
 * Format: BKG-YYYYMMDD-XXXXX (e.g., BKG-20260101-ABC12)
 */
export function generateBookingReference(): string {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePart = `${year}${month}${day}`;
    const randomPart = generateAlphanumericToken(5).toUpperCase();

    return `BKG-${datePart}-${randomPart}`;
  } catch (error) {
    logger.error("Booking reference generation failed:", error);
    // Fallback to timestamp-based reference
    const timestamp = Date.now().toString(36).toUpperCase();
    return `BKG-${timestamp}`;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  DEFAULT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  hashPassword,
  hashPasswordSync,
  comparePassword,
  comparePasswordSync,
  validatePasswordStrength,
  generateSecureToken,
  generateOTP,
  generateAlphanumericToken,
  generateBookingReference,
};
