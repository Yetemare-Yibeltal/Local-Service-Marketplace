import { Router } from "express";
import {
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
} from "../../controllers/auth.controller";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOTPSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../../schemas/auth.schema";
import { validateBody } from "../../middlewares/validation.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  authRateLimiter,
  loginRateLimiter,
  otpRateLimiter,
} from "../../config/rateLimit";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// AUTH ROUTES
// ============================================================

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @description Register a new user
 * @body { email, phone, password, fullName, role? }
 * @returns { user, tokens }
 * @access Public
 */
router.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  catchAsync(registerUser),
);

/**
 * @route POST /api/v1/auth/login
 * @description Login user
 * @body { email, password }
 * @returns { user, tokens }
 * @access Public
 */
router.post(
  "/login",
  loginRateLimiter,
  validateBody(loginSchema),
  catchAsync(loginUser),
);

/**
 * @route POST /api/v1/auth/refresh
 * @description Refresh access token
 * @body { refreshToken }
 * @returns { accessToken, refreshToken, expiresIn }
 * @access Public
 */
router.post(
  "/refresh",
  authRateLimiter,
  validateBody(refreshTokenSchema),
  catchAsync(refreshAccessToken),
);

/**
 * @route POST /api/v1/auth/logout
 * @description Logout user
 * @header Authorization: Bearer {accessToken}
 * @returns { success: true }
 * @access Private
 */
router.post("/logout", authenticate, catchAsync(logoutUser));

/**
 * @route POST /api/v1/auth/send-otp
 * @description Send OTP for phone verification
 * @body { phone }
 * @returns { success: true }
 * @access Public
 */
router.post(
  "/send-otp",
  otpRateLimiter,
  validateBody(sendOTPSchema),
  catchAsync(sendOTPCode),
);

/**
 * @route POST /api/v1/auth/verify-otp
 * @description Verify OTP
 * @header Authorization: Bearer {accessToken}
 * @body { phone, otp }
 * @returns { verified: true }
 * @access Private
 */
router.post(
  "/verify-otp",
  authenticate,
  validateBody(verifyOTPSchema),
  catchAsync(verifyOTPCode),
);

/**
 * @route POST /api/v1/auth/forgot-password
 * @description Send password reset email
 * @body { email }
 * @returns { success: true }
 * @access Public
 */
router.post(
  "/forgot-password",
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  catchAsync(forgotPassword),
);

/**
 * @route POST /api/v1/auth/reset-password
 * @description Reset password with token
 * @body { token, newPassword }
 * @returns { reset: true }
 * @access Public
 */
router.post(
  "/reset-password",
  authRateLimiter,
  validateBody(resetPasswordSchema),
  catchAsync(resetPassword),
);

/**
 * @route POST /api/v1/auth/change-password
 * @description Change password (authenticated user)
 * @header Authorization: Bearer {accessToken}
 * @body { currentPassword, newPassword }
 * @returns { changed: true }
 * @access Private
 */
router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  catchAsync(changeUserPassword),
);

/**
 * @route GET /api/v1/auth/verify-email
 * @description Verify email address
 * @query { token }
 * @returns { verified: true }
 * @access Public
 */
router.get("/verify-email", catchAsync(verifyUserEmail));

/**
 * @route GET /api/v1/auth/me
 * @description Get current user profile
 * @header Authorization: Bearer {accessToken}
 * @returns { user }
 * @access Private
 */
router.get("/me", authenticate, catchAsync(getCurrentUser));

// ============================================================
// EXPORTS
// ============================================================

export default router;
