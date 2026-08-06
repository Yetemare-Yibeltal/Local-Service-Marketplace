import jwt from "jsonwebtoken";
import env from "./env";
import logger from "../utils/logger";

// ============================================================
// JWT CONFIGURATION
// ============================================================

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate access token for authenticated user
 */
export function generateAccessToken(payload: TokenPayload): string {
  try {
    return jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.JWT_ACCESS_EXPIRY,
      },
    );
  } catch (error) {
    logger.error("Access token generation failed:", error);
    throw new Error("Failed to generate access token");
  }
}

/**
 * Generate refresh token for authenticated user
 */
export function generateRefreshToken(payload: TokenPayload): string {
  try {
    return jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRY,
      },
    );
  } catch (error) {
    logger.error("Refresh token generation failed:", error);
    throw new Error("Failed to generate refresh token");
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(payload: TokenPayload): TokenResponse {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Calculate expiry in seconds
  const expiresIn = 15 * 60; // 15 minutes in seconds

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify access token and return decoded payload
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug("Access token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.debug("Invalid access token");
    } else {
      logger.error("Access token verification failed:", error);
    }
    return null;
  }
}

/**
 * Verify refresh token and return decoded payload
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug("Refresh token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.debug("Invalid refresh token");
    } else {
      logger.error("Refresh token verification failed:", error);
    }
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken: string): string | null {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return null;
  }

  return generateAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });
}

/**
 * Decode token without verification
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.error("Token decode failed:", error);
    return null;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  decodeToken,
};
