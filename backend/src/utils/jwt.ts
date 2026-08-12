import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";
import env from "../config/env";
import logger from "./logger";
import { generateSecureToken } from "./encryption";
import { randomBytes } from "crypto";

// ============================================================
// TYPES
// ============================================================

/**
 * JWT payload interface
 */
export interface JwtTokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

/**
 * JWT token response
 */
export interface JwtTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

/**
 * JWT verify result
 */
export interface JwtVerifyResult<T = JwtTokenPayload> {
  valid: boolean;
  payload: T | null;
  expired: boolean;
  error?: string;
}

/**
 * JWT options
 */
export interface JwtOptions {
  algorithm?: "HS256" | "HS384" | "HS512";
  expiresIn?: string | number;
  audience?: string;
  issuer?: string;
  subject?: string;
}

/**
 * Refresh token data
 */
export interface RefreshTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  deviceInfo?: {
    ip?: string;
    userAgent?: string;
  };
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default JWT options
 */
const DEFAULT_ACCESS_OPTIONS: JwtOptions = {
  algorithm: "HS256",
  expiresIn: env.JWT_ACCESS_EXPIRY || "15m",
};

const DEFAULT_REFRESH_OPTIONS: JwtOptions = {
  algorithm: "HS256",
  expiresIn: env.JWT_REFRESH_EXPIRY || "7d",
};

/**
 * JWT audience
 */
const JWT_AUDIENCE = "local-service-marketplace";
const JWT_ISSUER = "local-service-marketplace-api";

// ============================================================
// TOKEN GENERATION
// ============================================================

/**
 * Generate an access token
 */
export function generateAccessToken(
  payload: JwtTokenPayload,
  options: Partial<JwtOptions> = {},
): string {
  try {
    const opts: SignOptions = {
      ...DEFAULT_ACCESS_OPTIONS,
      ...options,
      audience: options.audience || JWT_AUDIENCE,
      issuer: options.issuer || JWT_ISSUER,
      expiresIn: options.expiresIn || DEFAULT_ACCESS_OPTIONS.expiresIn,
    };

    const token = jwt.sign(payload as any, env.JWT_ACCESS_SECRET, opts);

    logger.debug(`Access token generated for user ${payload.userId}`);

    return token;
  } catch (error) {
    logger.error("Access token generation failed:", error);
    throw new Error("Failed to generate access token");
  }
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(
  payload: JwtTokenPayload,
  options: Partial<JwtOptions> = {},
): string {
  try {
    const opts: SignOptions = {
      ...DEFAULT_REFRESH_OPTIONS,
      ...options,
      audience: options.audience || JWT_AUDIENCE,
      issuer: options.issuer || JWT_ISSUER,
      expiresIn: options.expiresIn || DEFAULT_REFRESH_OPTIONS.expiresIn,
    };

    // Add session ID to refresh token payload
    const refreshPayload = {
      ...payload,
      sessionId:
        payload.sessionId || `session_${randomBytes(8).toString("hex")}`,
    };

    const token = jwt.sign(refreshPayload as any, env.JWT_REFRESH_SECRET, opts);

    logger.debug(`Refresh token generated for user ${payload.userId}`);

    return token;
  } catch (error) {
    logger.error("Refresh token generation failed:", error);
    throw new Error("Failed to generate refresh token");
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(
  payload: JwtTokenPayload,
  accessOptions: Partial<JwtOptions> = {},
  refreshOptions: Partial<JwtOptions> = {},
): JwtTokenResponse {
  try {
    const accessToken = generateAccessToken(payload, accessOptions);
    const refreshToken = generateRefreshToken(payload, refreshOptions);

    const accessExpiresIn = accessOptions.expiresIn
      ? parseDuration(accessOptions.expiresIn)
      : 900; // 15 minutes default

    const refreshExpiresIn = refreshOptions.expiresIn
      ? parseDuration(refreshOptions.expiresIn)
      : 604800; // 7 days default

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
      refreshExpiresIn,
    };
  } catch (error) {
    logger.error("Token generation failed:", error);
    throw new Error("Failed to generate tokens");
  }
}

// ============================================================
// TOKEN VERIFICATION
// ============================================================

/**
 * Verify an access token
 */
export function verifyAccessToken(
  token: string,
  options: Partial<VerifyOptions> = {},
): JwtVerifyResult {
  try {
    const opts: VerifyOptions = {
      audience: options.audience || JWT_AUDIENCE,
      issuer: options.issuer || JWT_ISSUER,
      ...options,
    };

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, opts);

    return {
      valid: true,
      payload: decoded as JwtTokenPayload,
      expired: false,
    };
  } catch (error) {
    let expired = false;
    let errorMessage = "Invalid token";

    if (error instanceof jwt.TokenExpiredError) {
      expired = true;
      errorMessage = "Token expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = error.message;
    }

    logger.debug(`Access token verification failed: ${errorMessage}`);

    return {
      valid: false,
      payload: null,
      expired,
      error: errorMessage,
    };
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(
  token: string,
  options: Partial<VerifyOptions> = {},
): JwtVerifyResult {
  try {
    const opts: VerifyOptions = {
      audience: options.audience || JWT_AUDIENCE,
      issuer: options.issuer || JWT_ISSUER,
      ...options,
    };

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, opts);

    return {
      valid: true,
      payload: decoded as JwtTokenPayload,
      expired: false,
    };
  } catch (error) {
    let expired = false;
    let errorMessage = "Invalid refresh token";

    if (error instanceof jwt.TokenExpiredError) {
      expired = true;
      errorMessage = "Refresh token expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = error.message;
    }

    logger.debug(`Refresh token verification failed: ${errorMessage}`);

    return {
      valid: false,
      payload: null,
      expired,
      error: errorMessage,
    };
  }
}

/**
 * Verify any token with custom secret
 */
export function verifyToken(
  token: string,
  secret: string,
  options: Partial<VerifyOptions> = {},
): JwtVerifyResult {
  try {
    const opts: VerifyOptions = {
      audience: options.audience || JWT_AUDIENCE,
      issuer: options.issuer || JWT_ISSUER,
      ...options,
    };

    const decoded = jwt.verify(token, secret, opts);

    return {
      valid: true,
      payload: decoded as JwtTokenPayload,
      expired: false,
    };
  } catch (error) {
    let expired = false;
    let errorMessage = "Invalid token";

    if (error instanceof jwt.TokenExpiredError) {
      expired = true;
      errorMessage = "Token expired";
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

// ============================================================
// TOKEN REFRESH
// ============================================================

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(
  refreshToken: string,
): JwtTokenResponse | null {
  try {
    const result = verifyRefreshToken(refreshToken);

    if (!result.valid || !result.payload) {
      logger.warn("Refresh token verification failed for token refresh");
      return null;
    }

    const { userId, email, role } = result.payload;

    // Generate new tokens
    return generateTokens({ userId, email, role });
  } catch (error) {
    logger.error("Token refresh failed:", error);
    return null;
  }
}

/**
 * Create refresh token data for storage
 */
export function createRefreshTokenData(
  token: string,
  userId: string,
  deviceInfo?: { ip?: string; userAgent?: string },
): RefreshTokenData {
  const decoded = jwt.decode(token) as JwtPayload;
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    token,
    userId,
    expiresAt,
    createdAt: new Date(),
    deviceInfo,
  };
}

// ============================================================
// TOKEN DECODING
// ============================================================

/**
 * Decode a token without verification
 */
export function decodeToken(token: string): JwtTokenPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtTokenPayload;

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

// ============================================================
// HELPER FUNCTIONS
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

  return null;
}

/**
 * Parse duration string to seconds
 */
export function parseDuration(duration: string | number): number {
  if (typeof duration === "number") {
    return duration;
  }

  const match = duration.match(/^(\d+)([smhdw])$/);
  if (!match) {
    return 900; // default 15 minutes
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    case "w":
      return value * 7 * 24 * 60 * 60;
    default:
      return 900;
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
 * Create a short-lived token (e.g., for password reset, email verification)
 */
export function createShortLivedToken(
  payload: { userId: string; email: string; purpose: string },
  expiresIn: string | number = "1h",
): string {
  try {
    const token = jwt.sign(
      {
        ...payload,
        purpose: payload.purpose,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn,
        audience: JWT_AUDIENCE,
        issuer: JWT_ISSUER,
      },
    );

    logger.debug(`Short-lived token generated for ${payload.purpose}`);

    return token;
  } catch (error) {
    logger.error("Short-lived token generation failed:", error);
    throw new Error("Failed to generate short-lived token");
  }
}

/**
 * Verify short-lived token
 */
export function verifyShortLivedToken(
  token: string,
  expectedPurpose?: string,
  options: Partial<VerifyOptions> = {},
): JwtVerifyResult & { purpose?: string } {
  try {
    const opts: VerifyOptions = {
      audience: options.audience || JWT_AUDIENCE,
      issuer: options.issuer || JWT_ISSUER,
      ...options,
    };

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, opts) as any;

    if (expectedPurpose && decoded.purpose !== expectedPurpose) {
      return {
        valid: false,
        payload: null,
        expired: false,
        error: `Invalid token purpose: expected ${expectedPurpose}, got ${decoded.purpose}`,
      };
    }

    return {
      valid: true,
      payload: decoded,
      expired: false,
      purpose: decoded.purpose,
    };
  } catch (error) {
    let expired = false;
    let errorMessage = "Invalid token";

    if (error instanceof jwt.TokenExpiredError) {
      expired = true;
      errorMessage = "Token expired";
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

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  JwtTokenPayload,
  JwtTokenResponse,
  JwtVerifyResult,
  JwtOptions,
  RefreshTokenData,

  // Token generation
  generateAccessToken,
  generateRefreshToken,
  generateTokens,

  // Token verification
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,

  // Token refresh
  refreshAccessToken,
  createRefreshTokenData,

  // Token decoding
  decodeToken,
  getTokenExpiration,
  isTokenExpired,

  // Helper functions
  extractTokenFromHeader,
  extractTokenFromRequest,
  parseDuration,
  getTokenRemainingTime,

  // Short-lived tokens
  createShortLivedToken,
  verifyShortLivedToken,
};
