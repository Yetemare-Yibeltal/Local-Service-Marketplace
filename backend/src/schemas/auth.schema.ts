import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  uuidSchema,
  otpSchema,
  userRoleSchema,
} from "../middlewares/validation.middleware";

// ============================================================
// AUTH SCHEMAS
// ============================================================

/**
 * Registration request schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  role: userRoleSchema.optional().default("CUSTOMER"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * OTP send request schema
 */
export const sendOTPSchema = z.object({
  phone: phoneSchema,
});

export type SendOTPInput = z.infer<typeof sendOTPSchema>;

/**
 * OTP verify request schema
 */
export const verifyOTPSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;

/**
 * Forgot password request schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password request schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Change password request schema (authenticated user)
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Email verification request schema
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Resend verification email request schema
 */
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

/**
 * Logout request schema (optional, just uses token)
 */
export const logoutSchema = z.object({});

export type LogoutInput = z.infer<typeof logoutSchema>;

// ============================================================
// EXPORTS
// ============================================================

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOTPSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  logoutSchema,
};
