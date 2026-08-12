import { randomBytes } from "crypto";
import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";
import { generateSecureToken } from "./encryption";
import { hashData } from "./encryption";
import env from "../config/env";
import logger from "./logger";

// ============================================================
// TYPES
// ============================================================

/**
 * Token types
 */
export type TokenType = "access" | "refresh" | "reset" | "verify" | "invite";

/**
 * Token configuration
 */
export interface TokenConfig {
  type: TokenType;
  expiresIn: string | number;
  secret: string;
  audience?: string;
  issuer?: string;
}

/**
 * Token payload
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: TokenType;
  sessionId?: string;
  purpose?: string;
  metadata?: Record<string, any>;
}

/**
 * Token result
 */
export interface TokenResult {
  token: string;
  expiresAt: Date;
  type: TokenType;
  payload: TokenPayload;
}

/**
 * Verify token result
 */
export interface VerifyTokenResult {
  valid: boolean;
  payload: TokenPayload | null;
  expired: boolean;
  error?: string;
  type?: TokenType;
}

/**
 * Token blacklist entry
 */
export interface BlacklistEntry {
  token: string;
  userId: string;
  type: TokenType;
  expiresAt: Date;
  createdAt: Date;
  reason?: string;
}

/**
 * Token generation options
 */
export interface TokenGenerationOptions {
  expiresIn?: string | number;
  secret?: string;
  audience?: string;
  issuer?: string;
  sessionId?: string;
  purpose?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Token expiry times
 */
export const TOKEN_EXPIRY = {
  ACCESS: "15m",
  REFRESH: "7d",
  RESET: "1h",
  VERIFY: "24h",
  INVITE: "7d",
} as const;

/**
 * Token types array
 */
export const TOKEN_TYPES: TokenType[] = [
  "access",
  "refresh",
  "reset",
  "verify",
  "invite",
];

/**
 * Token secrets
 */
export const TOKEN_SECRETS: Record<TokenType, string> = {
  access: env.JWT_ACCESS_SECRET,
  refresh: env.JWT_REFRESH_SECRET,
  reset: env.JWT_ACCESS_SECRET,
  verify: env.JWT_ACCESS_SECRET,
  invite: env.JWT_ACCESS_SECRET,
};

/**
 * Token audiences
 */
export const TOKEN_AUDIENCES: Record<TokenType, string> = {
  access: "local-service-marketplace-api",
  refresh: "local-service-marketplace-api-refresh",
  reset: "local-service-marketplace-reset",
  verify: "local-service-marketplace-verify",
  invite: "local-service-marketplace-invite",
};

/**
 * Token issuers
 */
export const TOKEN_ISSUERS: Record<TokenType, string> = {
  access: "local-service-marketplace-api",
  refresh: "local-service-marketplace-api",
  reset: "local-service-marketplace-reset",
  verify: "local-service-marketplace-verify",
  invite: "local-service-marketplace-invite",
};

// ============================================================
// TOKEN GENERATION
// ============================================================

/**
 * Generate a token with configuration
 */
export function generateToken(
  payload: Omit<TokenPayload, "type">,
  type: TokenType = "access",
  options: TokenGenerationOptions = {},
): TokenResult {
  try {
    const secret = options.secret || TOKEN_SECRETS[type];
    const expiresIn = options.expiresIn || TOKEN_EXPIRY[type];
    const audience = options.audience || TOKEN_AUDIENCES[type];
    const issuer = options.issuer || TOKEN_ISSUERS[type];

    const fullPayload: TokenPayload = {
      ...payload,
      type,
      sessionId: options.sessionId,
      purpose: options.purpose,
      metadata: options.metadata,
    };

    const signOptions: SignOptions = {
      expiresIn,
      audience,
      issuer,
      algorithm: "HS256",
    };

    const token = jwt.sign(fullPayload as any, secret, signOptions);

    // Calculate expiration date
    let expiresAt: Date;
    if (typeof expiresIn === "number") {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    } else {
      const match = expiresIn.match(/^(\d+)([smhdw])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        const multipliers: Record<string, number> = {
          s: 1,
          m: 60,
          h: 3600,
          d: 86400,
          w: 604800,
        };
        expiresAt = new Date(Date.now() + value * multipliers[unit] * 1000);
      } else {
        expiresAt = new Date(Date.now() + 900000); // default 15 minutes
      }
    }

    logger.debug(`Generated ${type} token for user ${payload.userId}`);

    return {
      token,
      expiresAt,
      type,
      payload: fullPayload,
    };
  } catch (error) {
    logger.error(`Token generation failed (${type}):`, error);
    throw new Error(`Failed to generate ${type} token`);
  }
}

/**
 * Generate an access token
 */
export function generateAccessToken(
  payload: Omit<TokenPayload, "type">,
  options: TokenGenerationOptions = {},
): TokenResult {
  return generateToken(payload, "access", options);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(
  payload: Omit<TokenPayload, "type">,
  options: TokenGenerationOptions = {},
): TokenResult {
  return generateToken(payload, "refresh", options);
}

/**
 * Generate a password reset token
 */
export function generateResetToken(
  payload: Omit<TokenPayload, "type">,
  options: TokenGenerationOptions = {},
): TokenResult {
  return generateToken(payload, "reset", {
    ...options,
    purpose: "password_reset",
  });
}

/**
 * Generate an email verification token
 */
export function generateVerifyToken(
  payload: Omit<TokenPayload, "type">,
  options: TokenGenerationOptions = {},
): TokenResult {
  return generateToken(payload, "verify", {
    ...options,
    purpose: "email_verification",
  });
}

/**
 * Generate an invite token
 */
export function generateInviteToken(
  payload: Omit<TokenPayload, "type">,
  options: TokenGenerationOptions = {},
): TokenResult {
  return generateToken(payload, "invite", {
    ...options,
    purpose: "user_invite",
  });
}

// ============================================================
// TOKEN VERIFICATION
// ============================================================

/**
 * Verify a token
 */
export function verifyToken(
  token: string,
  type: TokenType,
  options: { secret?: string; purpose?: string } = {},
): VerifyTokenResult {
  try {
    const secret = options.secret || TOKEN_SECRETS[type];
    const audience = TOKEN_AUDIENCES[type];
    const issuer = TOKEN_ISSUERS[type];

    const verifyOptions: VerifyOptions = {
      audience,
      issuer,
      algorithms: ["HS256"],
    };

    const decoded = jwt.verify(token, secret, verifyOptions) as TokenPayload;

    // Verify token type matches expected type
    if (decoded.type !== type) {
      return {
        valid: false,
        payload: null,
        expired: false,
        error: `Invalid token type: expected ${type}, got ${decoded.type}`,
      };
    }

    // Verify purpose if specified
    if (options.purpose && decoded.purpose !== options.purpose) {
      return {
        valid: false,
        payload: null,
        expired: false,
        error: `Invalid token purpose: expected ${options.purpose}, got ${decoded.purpose}`,
      };
    }

    return {
      valid: true,
      payload: decoded,
      expired: false,
      type: decoded.type,
    };
  } catch (error) {
    let expired = false;
    let errorMessage = "Invalid token";

    if (error instanceof jwt.TokenExpiredError) {
      expired = true;
      errorMessage = `Token expired at ${error.expiredAt}`;
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = error.message;
    }

    return {
      valid: false,
      payload: null,
      expired,
      error: errorMessage,
    };
  }
}

/**
 * Verify an access token
 */
export function verifyAccessToken(
  token: string,
  options: { purpose?: string } = {},
): VerifyTokenResult {
  return verifyToken(token, "access", options);
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(
  token: string,
  options: { purpose?: string } = {},
): VerifyTokenResult {
  return verifyToken(token, "refresh", options);
}

/**
 * Verify a password reset token
 */
export function verifyResetToken(
  token: string,
  options: { purpose?: string } = {},
): VerifyTokenResult {
  return verifyToken(token, "reset", { ...options, purpose: "password_reset" });
}

/**
 * Verify an email verification token
 */
export function verifyVerifyToken(
  token: string,
  options: { purpose?: string } = {},
): VerifyTokenResult {
  return verifyToken(token, "verify", {
    ...options,
    purpose: "email_verification",
  });
}

/**
 * Verify an invite token
 */
export function verifyInviteToken(
  token: string,
  options: { purpose?: string } = {},
): VerifyTokenResult {
  return verifyToken(token, "invite", { ...options, purpose: "user_invite" });
}

// ============================================================
// TOKEN EXTRACTION
// ============================================================

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Extract token from request
 */
export function extractTokenFromRequest(req: any): string | null {
  // Check Authorization header
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      return token;
    }
  }

  // Check cookie
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // Check query param
  if (req.query?.token) {
    return req.query.token;
  }

  // Check body
  if (req.body?.token) {
    return req.body.token;
  }

  return null;
}

// ============================================================
// TOKEN BLACKLIST
// ============================================================

/**
 * In-memory token blacklist (for demo)
 * In production, use Redis or database
 */
const tokenBlacklist: Map<string, BlacklistEntry> = new Map();

/**
 * Add token to blacklist
 */
export function blacklistToken(
  token: string,
  userId: string,
  type: TokenType,
  expiresAt: Date,
  reason?: string,
): void {
  const entry: BlacklistEntry = {
    token,
    userId,
    type,
    expiresAt,
    createdAt: new Date(),
    reason,
  };

  tokenBlacklist.set(token, entry);

  // Clean expired tokens
  cleanBlacklist();

  logger.debug(
    `Token blacklisted: ${token.substring(0, 10)}... for user ${userId}`,
  );
}

/**
 * Check if token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  if (tokenBlacklist.has(token)) {
    const entry = tokenBlacklist.get(token)!;

    // Check if expired
    if (entry.expiresAt < new Date()) {
      tokenBlacklist.delete(token);
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Clean expired blacklist entries
 */
export function cleanBlacklist(): void {
  const now = new Date();
  let count = 0;

  for (const [key, entry] of tokenBlacklist) {
    if (entry.expiresAt < now) {
      tokenBlacklist.delete(key);
      count++;
    }
  }

  if (count > 0) {
    logger.debug(`Cleaned ${count} expired blacklist entries`);
  }
}

/**
 * Get blacklist entry
 */
export function getBlacklistEntry(token: string): BlacklistEntry | null {
  const entry = tokenBlacklist.get(token);
  if (entry && entry.expiresAt < new Date()) {
    tokenBlacklist.delete(token);
    return null;
  }
  return entry || null;
}

// ============================================================
// TOKEN HELPERS
// ============================================================

/**
 * Decode token without verification
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    if (!decoded || typeof decoded === "string") {
      return null;
    }
    return decoded;
  } catch (error) {
    logger.error("Token decode failed:", error);
    return null;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    logger.error("Get token expiration failed:", error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const expiration = getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration < new Date();
  } catch (error) {
    return true;
  }
}

/**
 * Get token remaining time
 */
export function getTokenRemainingTime(token: string): number {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return 0;
    }
    const now = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - now;
    return remaining > 0 ? remaining : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Get token type from payload
 */
export function getTokenType(token: string): TokenType | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    if (!decoded || typeof decoded === "string") {
      return null;
    }
    return decoded.type || null;
  } catch (error) {
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken: string): TokenResult | null {
  try {
    const result = verifyRefreshToken(refreshToken);

    if (!result.valid || !result.payload) {
      logger.warn("Refresh token verification failed");
      return null;
    }

    const { userId, email, role } = result.payload;

    return generateAccessToken({ userId, email, role });
  } catch (error) {
    logger.error("Token refresh failed:", error);
    return null;
  }
}

/**
 * Create short-lived token for specific purpose
 */
export function createShortLivedToken(
  payload: Omit<TokenPayload, "type">,
  expiresIn: string | number = "1h",
  purpose: string = "short_lived",
): TokenResult {
  return generateToken(payload, "access", {
    expiresIn,
    purpose,
  });
}

/**
 * Verify short-lived token
 */
export function verifyShortLivedToken(
  token: string,
  expectedPurpose?: string,
): VerifyTokenResult {
  return verifyAccessToken(token, { purpose: expectedPurpose });
}

// ============================================================
// TOKEN HASHING (for storage)
// ============================================================

/**
 * Hash a token for secure storage
 */
export function hashToken(token: string): string {
  return hashData(token, "sha256", "hex");
}

/**
 * Verify a hashed token
 */
export function verifyHashedToken(token: string, hashedToken: string): boolean {
  const computedHash = hashToken(token);
  return computedHash === hashedToken;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  TokenType,
  TokenConfig,
  TokenPayload,
  TokenResult,
  VerifyTokenResult,
  BlacklistEntry,
  TokenGenerationOptions,

  // Constants
  TOKEN_EXPIRY,
  TOKEN_TYPES,
  TOKEN_SECRETS,
  TOKEN_AUDIENCES,
  TOKEN_ISSUERS,

  // Generation
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  generateVerifyToken,
  generateInviteToken,

  // Verification
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetToken,
  verifyVerifyToken,
  verifyInviteToken,

  // Extraction
  extractTokenFromHeader,
  extractTokenFromRequest,

  // Blacklist
  blacklistToken,
  isTokenBlacklisted,
  cleanBlacklist,
  getBlacklistEntry,

  // Helpers
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  getTokenRemainingTime,
  getTokenType,
  refreshAccessToken,
  createShortLivedToken,
  verifyShortLivedToken,

  // Hashing
  hashToken,
  verifyHashedToken,
};
