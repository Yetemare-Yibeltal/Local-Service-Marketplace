import crypto from "crypto";
import { Buffer } from "buffer";
import logger from "./logger";

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Encryption algorithms
 */
export const ENCRYPTION_ALGORITHMS = {
  AES_256_GCM: "aes-256-gcm",
  AES_256_CBC: "aes-256-cbc",
  AES_192_CBC: "aes-192-cbc",
  AES_128_CBC: "aes-128-cbc",
} as const;

export type EncryptionAlgorithm =
  (typeof ENCRYPTION_ALGORITHMS)[keyof typeof ENCRYPTION_ALGORITHMS];

/**
 * Hash algorithms
 */
export const HASH_ALGORITHMS = {
  SHA256: "sha256",
  SHA384: "sha384",
  SHA512: "sha512",
  SHA3_256: "sha3-256",
  SHA3_512: "sha3-512",
} as const;

export type HashAlgorithm =
  (typeof HASH_ALGORITHMS)[keyof typeof HASH_ALGORITHMS];

/**
 * Encoding types
 */
export const ENCODING = {
  HEX: "hex" as const,
  BASE64: "base64" as const,
  UTF8: "utf8" as const,
  ASCII: "ascii" as const,
  LATIN1: "latin1" as const,
} as const;

export type Encoding = (typeof ENCODING)[keyof typeof ENCODING];

/**
 * Default encryption configuration
 */
const DEFAULT_CONFIG = {
  algorithm: ENCRYPTION_ALGORITHMS.AES_256_GCM,
  keyEncoding: ENCODING.BASE64,
  ivLength: 16,
  saltLength: 32,
  keyLength: 32,
  iterations: 100000,
  digest: HASH_ALGORITHMS.SHA256,
};

// ============================================================
// KEY MANAGEMENT
// ============================================================

/**
 * Generate a secure encryption key
 */
export function generateKey(length: number = DEFAULT_CONFIG.keyLength): Buffer {
  try {
    return crypto.randomBytes(length);
  } catch (error) {
    logger.error("Key generation failed:", error);
    throw new Error("Failed to generate encryption key");
  }
}

/**
 * Generate a secure key from a password using PBKDF2
 */
export function deriveKeyFromPassword(
  password: string,
  salt?: Buffer,
  iterations: number = DEFAULT_CONFIG.iterations,
  keyLength: number = DEFAULT_CONFIG.keyLength,
  digest: HashAlgorithm = DEFAULT_CONFIG.digest,
): { key: Buffer; salt: Buffer } {
  try {
    const saltBuffer = salt || crypto.randomBytes(DEFAULT_CONFIG.saltLength);
    const key = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      iterations,
      keyLength,
      digest,
    );
    return { key, salt: saltBuffer };
  } catch (error) {
    logger.error("Key derivation failed:", error);
    throw new Error("Failed to derive encryption key");
  }
}

/**
 * Generate a random salt
 */
export function generateSalt(
  length: number = DEFAULT_CONFIG.saltLength,
): Buffer {
  try {
    return crypto.randomBytes(length);
  } catch (error) {
    logger.error("Salt generation failed:", error);
    throw new Error("Failed to generate salt");
  }
}

/**
 * Generate a random initialization vector (IV)
 */
export function generateIV(length: number = DEFAULT_CONFIG.ivLength): Buffer {
  try {
    return crypto.randomBytes(length);
  } catch (error) {
    logger.error("IV generation failed:", error);
    throw new Error("Failed to generate initialization vector");
  }
}

// ============================================================
// ENCRYPTION / DECRYPTION
// ============================================================

/**
 * Encrypt data using AES-GCM
 */
export function encryptAESGCM(
  data: string | Buffer,
  key: Buffer | string,
  iv?: Buffer,
  encoding: Encoding = ENCODING.BASE64,
): { encrypted: string; iv: string; authTag: string } {
  try {
    const keyBuffer =
      typeof key === "string" ? Buffer.from(key, ENCODING.BASE64) : key;
    const ivBuffer = iv || crypto.randomBytes(DEFAULT_CONFIG.ivLength);

    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHMS.AES_256_GCM,
      keyBuffer,
      ivBuffer,
    );
    const dataBuffer =
      typeof data === "string" ? Buffer.from(data, ENCODING.UTF8) : data;

    const encrypted = Buffer.concat([
      cipher.update(dataBuffer),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString(encoding),
      iv: ivBuffer.toString(encoding),
      authTag: authTag.toString(encoding),
    };
  } catch (error) {
    logger.error("AES-GCM encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data using AES-GCM
 */
export function decryptAESGCM(
  encryptedData: string,
  key: Buffer | string,
  iv: string,
  authTag: string,
  encoding: Encoding = ENCODING.BASE64,
): string {
  try {
    const keyBuffer =
      typeof key === "string" ? Buffer.from(key, ENCODING.BASE64) : key;
    const ivBuffer = Buffer.from(iv, encoding);
    const authTagBuffer = Buffer.from(authTag, encoding);
    const encryptedBuffer = Buffer.from(encryptedData, encoding);

    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHMS.AES_256_GCM,
      keyBuffer,
      ivBuffer,
    );
    decipher.setAuthTag(authTagBuffer);

    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    return decrypted.toString(ENCODING.UTF8);
  } catch (error) {
    logger.error("AES-GCM decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Encrypt data using AES-CBC
 */
export function encryptAESCBC(
  data: string | Buffer,
  key: Buffer | string,
  iv?: Buffer,
  encoding: Encoding = ENCODING.BASE64,
): { encrypted: string; iv: string } {
  try {
    const keyBuffer =
      typeof key === "string" ? Buffer.from(key, ENCODING.BASE64) : key;
    const ivBuffer = iv || crypto.randomBytes(DEFAULT_CONFIG.ivLength);

    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHMS.AES_256_CBC,
      keyBuffer,
      ivBuffer,
    );
    const dataBuffer =
      typeof data === "string" ? Buffer.from(data, ENCODING.UTF8) : data;

    const encrypted = Buffer.concat([
      cipher.update(dataBuffer),
      cipher.final(),
    ]);

    return {
      encrypted: encrypted.toString(encoding),
      iv: ivBuffer.toString(encoding),
    };
  } catch (error) {
    logger.error("AES-CBC encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data using AES-CBC
 */
export function decryptAESCBC(
  encryptedData: string,
  key: Buffer | string,
  iv: string,
  encoding: Encoding = ENCODING.BASE64,
): string {
  try {
    const keyBuffer =
      typeof key === "string" ? Buffer.from(key, ENCODING.BASE64) : key;
    const ivBuffer = Buffer.from(iv, encoding);
    const encryptedBuffer = Buffer.from(encryptedData, encoding);

    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHMS.AES_256_CBC,
      keyBuffer,
      ivBuffer,
    );

    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    return decrypted.toString(ENCODING.UTF8);
  } catch (error) {
    logger.error("AES-CBC decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

// ============================================================
// HASHING
// ============================================================

/**
 * Hash data using SHA algorithm
 */
export function hashData(
  data: string | Buffer,
  algorithm: HashAlgorithm = HASH_ALGORITHMS.SHA256,
  encoding: Encoding = ENCODING.HEX,
): string {
  try {
    const dataBuffer =
      typeof data === "string" ? Buffer.from(data, ENCODING.UTF8) : data;
    const hash = crypto.createHash(algorithm);
    hash.update(dataBuffer);
    return hash.digest(encoding);
  } catch (error) {
    logger.error("Hashing failed:", error);
    throw new Error("Failed to hash data");
  }
}

/**
 * Hash data with salt (HMAC)
 */
export function hmacData(
  data: string | Buffer,
  secret: string | Buffer,
  algorithm: HashAlgorithm = HASH_ALGORITHMS.SHA256,
  encoding: Encoding = ENCODING.HEX,
): string {
  try {
    const dataBuffer =
      typeof data === "string" ? Buffer.from(data, ENCODING.UTF8) : data;
    const secretBuffer =
      typeof secret === "string" ? Buffer.from(secret, ENCODING.UTF8) : secret;

    const hmac = crypto.createHmac(algorithm, secretBuffer);
    hmac.update(dataBuffer);
    return hmac.digest(encoding);
  } catch (error) {
    logger.error("HMAC generation failed:", error);
    throw new Error("Failed to generate HMAC");
  }
}

/**
 * Verify HMAC
 */
export function verifyHMAC(
  data: string | Buffer,
  signature: string,
  secret: string | Buffer,
  algorithm: HashAlgorithm = HASH_ALGORITHMS.SHA256,
  encoding: Encoding = ENCODING.HEX,
): boolean {
  try {
    const computed = hmacData(data, secret, algorithm, encoding);
    return crypto.timingSafeEqual(
      Buffer.from(computed, encoding),
      Buffer.from(signature, encoding),
    );
  } catch (error) {
    logger.error("HMAC verification failed:", error);
    return false;
  }
}

// ============================================================
// TOKEN GENERATION
// ============================================================

/**
 * Generate a secure random token
 */
export function generateSecureToken(
  length: number = 32,
  encoding: Encoding = ENCODING.HEX,
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
 * Generate a URL-safe token
 */
export function generateURLSafeToken(length: number = 32): string {
  try {
    const buffer = crypto.randomBytes(length);
    return buffer
      .toString(ENCODING.BASE64)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (error) {
    logger.error("URL-safe token generation failed:", error);
    throw new Error("Failed to generate URL-safe token");
  }
}

/**
 * Generate a numeric OTP
 */
export function generateOTP(length: number = 6): string {
  try {
    if (length < 1 || length > 10) {
      throw new Error("OTP length must be between 1 and 10");
    }

    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const otp = crypto.randomInt(min, max + 1);
    return otp.toString().padStart(length, "0");
  } catch (error) {
    logger.error("OTP generation failed:", error);
    throw new Error("Failed to generate OTP");
  }
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  try {
    return crypto.randomUUID();
  } catch (error) {
    logger.error("UUID generation failed:", error);
    throw new Error("Failed to generate UUID");
  }
}

// ============================================================
// DATA MASKING
// ============================================================

/**
 * Mask sensitive data (e.g., email, phone, credit card)
 */
export function maskData(
  data: string,
  visibleStart: number = 2,
  visibleEnd: number = 2,
): string {
  if (!data) return "";
  if (data.length <= visibleStart + visibleEnd) {
    return "*".repeat(data.length);
  }

  const start = data.substring(0, visibleStart);
  const end = data.substring(data.length - visibleEnd);
  const masked = "*".repeat(data.length - visibleStart - visibleEnd);
  return start + masked + end;
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length !== 2) {
    return maskData(email, 2, 2);
  }
  const maskedLocal = maskData(parts[0], 2, 2);
  return `${maskedLocal}@${parts[1]}`;
}

/**
 * Mask phone number
 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.length <= 4) {
    return "*".repeat(cleaned.length);
  }
  const visibleStart = 2;
  const visibleEnd = 2;
  const start = cleaned.substring(0, visibleStart);
  const end = cleaned.substring(cleaned.length - visibleEnd);
  const masked = "*".repeat(cleaned.length - visibleStart - visibleEnd);
  return start + masked + end;
}

/**
 * Mask credit card number
 */
export function maskCreditCard(cardNumber: string): string {
  if (!cardNumber) return "";
  const cleaned = cardNumber.replace(/[^0-9]/g, "");
  if (cleaned.length < 4) return "****";
  const last4 = cleaned.slice(-4);
  return `****-****-****-${last4}`;
}

// ============================================================
// ENCODING / DECODING
// ============================================================

/**
 * Base64 encode
 */
export function base64Encode(
  data: string | Buffer,
  encoding: Encoding = ENCODING.UTF8,
): string {
  try {
    const buffer =
      typeof data === "string" ? Buffer.from(data, encoding) : data;
    return buffer.toString(ENCODING.BASE64);
  } catch (error) {
    logger.error("Base64 encoding failed:", error);
    throw new Error("Failed to encode data");
  }
}

/**
 * Base64 decode
 */
export function base64Decode(
  data: string,
  encoding: Encoding = ENCODING.UTF8,
): string {
  try {
    const buffer = Buffer.from(data, ENCODING.BASE64);
    return buffer.toString(encoding);
  } catch (error) {
    logger.error("Base64 decoding failed:", error);
    throw new Error("Failed to decode data");
  }
}

/**
 * URL-safe Base64 encode
 */
export function base64URLEncode(
  data: string | Buffer,
  encoding: Encoding = ENCODING.UTF8,
): string {
  try {
    const buffer =
      typeof data === "string" ? Buffer.from(data, encoding) : data;
    return buffer
      .toString(ENCODING.BASE64)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (error) {
    logger.error("URL-safe Base64 encoding failed:", error);
    throw new Error("Failed to encode data");
  }
}

/**
 * URL-safe Base64 decode
 */
export function base64URLDecode(
  data: string,
  encoding: Encoding = ENCODING.UTF8,
): string {
  try {
    let base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const buffer = Buffer.from(base64, ENCODING.BASE64);
    return buffer.toString(encoding);
  } catch (error) {
    logger.error("URL-safe Base64 decoding failed:", error);
    throw new Error("Failed to decode data");
  }
}

// ============================================================
// CONSTANT TIME COMPARISON
// ============================================================

/**
 * Compare two strings in constant time to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Compare two buffers in constant time
 */
export function constantTimeBufferCompare(a: Buffer, b: Buffer): boolean {
  try {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Constants
  ENCRYPTION_ALGORITHMS,
  HASH_ALGORITHMS,
  ENCODING,

  // Key management
  generateKey,
  deriveKeyFromPassword,
  generateSalt,
  generateIV,

  // Encryption/Decryption
  encryptAESGCM,
  decryptAESGCM,
  encryptAESCBC,
  decryptAESCBC,

  // Hashing
  hashData,
  hmacData,
  verifyHMAC,

  // Token generation
  generateSecureToken,
  generateURLSafeToken,
  generateOTP,
  generateUUID,

  // Data masking
  maskData,
  maskEmail,
  maskPhone,
  maskCreditCard,

  // Encoding/Decoding
  base64Encode,
  base64Decode,
  base64URLEncode,
  base64URLDecode,

  // Constant time comparison
  constantTimeCompare,
  constantTimeBufferCompare,
};
