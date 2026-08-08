import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError } from "../utils/response";
import {
  register,
  login,
  refreshToken,
  logout,
  sendOTP,
  verifyOTP,
  sendPasswordResetEmail,
  resetPasswordWithUserId,
  changePassword,
  verifyEmail,
} from "../services/internal/auth.service";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOTPSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../schemas/auth.schema";
import { verifyAccessToken } from "../config/jwt";
import logger from "../utils/logger";

// ============================================================
// AUTH CONTROLLER
// ============================================================

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 * @description Creates a new user account with email, phone, and password
 * @body { email, phone, password, fullName, role? }
 * @returns { user, tokens } with 201 status
 */
export const registerUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = registerSchema.parse(req.body);

    const result = await register(validatedData);

    sendSuccess(
      res,
      result,
      "User registered successfully. Please verify your OTP.",
      201,
    );
  },
);

/**
 * Login user
 * @route POST /api/v1/auth/login
 * @description Authenticates user and returns access and refresh tokens
 * @body { email, password }
 * @returns { user, tokens } with 200 status
 */
export const loginUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = loginSchema.parse(req.body);

    const result = await login(validatedData);

    sendSuccess(res, result, "Login successful");
  },
);

/**
 * Refresh access token
 * @route POST /api/v1/auth/refresh
 * @description Generates new access token using refresh token
 * @body { refreshToken }
 * @returns { accessToken, refreshToken, expiresIn } with 200 status
 */
export const refreshAccessToken = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = refreshTokenSchema.parse(req.body);

    const result = await refreshToken(validatedData.refreshToken);

    sendSuccess(res, result, "Token refreshed successfully");
  },
);

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 * @description Invalidates refresh token and clears session
 * @header Authorization: Bearer {accessToken}
 * @returns { success: true } with 200 status
 */
export const logoutUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    await logout(userId);

    sendSuccess(res, null, "Logout successful");
  },
);

/**
 * Send OTP for phone verification
 * @route POST /api/v1/auth/send-otp
 * @description Sends a one-time password to user's phone
 * @body { phone }
 * @returns { success: true } with 200 status
 */
export const sendOTPCode = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = sendOTPSchema.parse(req.body);

    const result = await sendOTP(validatedData.phone);

    sendSuccess(res, result, "OTP sent successfully");
  },
);

/**
 * Verify OTP
 * @route POST /api/v1/auth/verify-otp
 * @description Verifies the one-time password
 * @header Authorization: Bearer {accessToken}
 * @body { phone, otp }
 * @returns { verified: true } with 200 status
 */
export const verifyOTPCode = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = verifyOTPSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const result = await verifyOTP(userId, validatedData.otp);

    sendSuccess(res, { verified: result }, "OTP verified successfully");
  },
);

/**
 * Send password reset email
 * @route POST /api/v1/auth/forgot-password
 * @description Sends password reset link to user's email
 * @body { email }
 * @returns { success: true } with 200 status
 */
export const forgotPassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = forgotPasswordSchema.parse(req.body);

    const result = await sendPasswordResetEmail(validatedData.email);

    sendSuccess(res, result, "Password reset email sent");
  },
);

/**
 * Reset password with token
 * @route POST /api/v1/auth/reset-password
 * @description Resets user password using reset token
 * @body { token, newPassword }
 * @returns { reset: true } with 200 status
 */
export const resetPassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = resetPasswordSchema.parse(req.body);

    const { token, newPassword } = validatedData;

    // Decode token to get userId
    let decodedToken: any = null;
    try {
      // Extract userId from the reset token
      // The token is stored with userId in Redis, so we need to find the userId
      // For this implementation, we'll use the token to lookup the userId
      // In production, you would store token:userId mapping in Redis

      // Alternative: Use JWT verification if the reset token is a JWT
      // decodedToken = verifyAccessToken(token);
      // const userId = decodedToken?.userId;

      // For now, we'll use a simplified approach:
      // The token is stored with key: reset_{userId}
      // We need to find the userId by scanning or storing token:userId mapping

      // This is a placeholder - you need to implement token:userId lookup
      // For example: const userId = await getUserIdFromResetToken(token);
      // Then call resetPasswordWithUserId with the actual userId

      const userId = await getUserIdFromResetToken(token);

      if (!userId) {
        sendError(res, "Invalid or expired reset token", 400);
        return;
      }

      const result = await resetPasswordWithUserId(userId, token, newPassword);

      sendSuccess(res, { reset: result }, "Password reset successfully");
    } catch (error) {
      logger.error("Reset password error:", error);
      sendError(res, "Invalid or expired reset token", 400);
    }
  },
);

/**
 * Helper function to get userId from reset token
 * This is a placeholder - implement with your Redis storage
 */
async function getUserIdFromResetToken(token: string): Promise<string | null> {
  try {
    // In production, you would have a Redis key: token:userId
    // Example: const userId = await redisService.get(`reset_token:${token}`);
    // For now, return a placeholder
    // You need to implement this based on your token storage strategy

    // Option 1: Store token:userId in Redis when sending reset email
    // Option 2: Use JWT and store userId in the token
    // Option 3: Store reset token in the user record

    // For demonstration, we'll return null and let the caller handle
    // In production, implement proper token:userId lookup

    // Example implementation:
    // const { redisService } = require('../services/redis.service');
    // return await redisService.get(`reset_token:${token}`);

    return null;
  } catch (error) {
    logger.error("Get userId from reset token failed:", error);
    return null;
  }
}

/**
 * Change password (authenticated user)
 * @route POST /api/v1/auth/change-password
 * @description Changes user password after verifying current password
 * @header Authorization: Bearer {accessToken}
 * @body { currentPassword, newPassword }
 * @returns { changed: true } with 200 status
 */
export const changeUserPassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = changePasswordSchema.parse(req.body);

    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (!userId || !userEmail) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const result = await changePassword({
      userId,
      email: userEmail,
      currentPassword: validatedData.currentPassword,
      newPassword: validatedData.newPassword,
    });

    sendSuccess(res, { changed: result }, "Password changed successfully");
  },
);

/**
 * Verify email
 * @route GET /api/v1/auth/verify-email
 * @description Verifies user email address using verification token
 * @query { token }
 * @returns { verified: true } with 200 status
 */
export const verifyUserEmail = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      sendError(res, "Verification token is required", 400);
      return;
    }

    const result = await verifyEmail(token);

    sendSuccess(res, { verified: result }, "Email verified successfully");
  },
);

/**
 * Get current user profile
 * @route GET /api/v1/auth/me
 * @description Returns the current authenticated user's profile
 * @header Authorization: Bearer {accessToken}
 * @returns { user } with 200 status
 */
export const getCurrentUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const { getUserProfile } =
      await import("../services/internal/user.service");
    const user = await getUserProfile(userId);

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user, "User profile retrieved successfully");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  sendOTPCode,
  verifyOTPCode,
  forgotPassword,
  resetPassword,
  changeUserPassword,
  verifyUserEmail,
  getCurrentUser,
};
