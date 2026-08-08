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

// ============================================================
// AUTH CONTROLLER
// ============================================================

/**
 * Register a new user
 * @route POST /api/v1/auth/register
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
 */
export const resetPassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = resetPasswordSchema.parse(req.body);

    const { token, newPassword } = validatedData;

    // In production, you would extract userId from the token
    // This is a simplified implementation
    const result = await resetPasswordWithUserId(
      "user-id-from-token",
      token,
      newPassword,
    );

    sendSuccess(res, { reset: result }, "Password reset successfully");
  },
);

/**
 * Change password (authenticated user)
 * @route POST /api/v1/auth/change-password
 */
export const changeUserPassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = changePasswordSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const result = await changePassword({
      userId,
      currentPassword: validatedData.currentPassword,
      newPassword: validatedData.newPassword,
    });

    sendSuccess(res, { changed: result }, "Password changed successfully");
  },
);

/**
 * Verify email
 * @route GET /api/v1/auth/verify-email
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
