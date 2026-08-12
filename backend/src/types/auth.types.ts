// ============================================================
// AUTH TYPES
// Complete authentication type definitions for the application
// ============================================================

// ============================================================
// REQUEST TYPES
// ============================================================

/**
 * User registration request input
 */
export interface RegisterInput {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role?: "CUSTOMER" | "PROVIDER";
}

/**
 * User login request input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Refresh token request input
 */
export interface RefreshTokenInput {
  refreshToken: string;
}

/**
 * OTP send request input
 */
export interface OTPInput {
  phone: string;
}

/**
 * OTP verification request input
 */
export interface OTPVerifyInput {
  phone: string;
  otp: string;
}

/**
 * Forgot password request input
 */
export interface ForgotPasswordInput {
  email: string;
}

/**
 * Reset password request input
 */
export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

/**
 * Change password request input
 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

/**
 * User response after authentication
 */
export interface AuthUserResponse {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: "CUSTOMER" | "PROVIDER" | "ADMIN";
  profileImage: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

/**
 * Token response from authentication
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Full authentication response
 */
export interface AuthResponse {
  user: AuthUserResponse;
  tokens: TokenResponse;
}

// ============================================================
// JWT TOKEN TYPES
// ============================================================

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Access token payload with additional JWT fields
 */
export interface AccessTokenPayload extends TokenPayload {
  iat?: number;
  exp?: number;
}

/**
 * Refresh token payload with additional JWT fields
 */
export interface RefreshTokenPayload extends TokenPayload {
  iat?: number;
  exp?: number;
}

// ============================================================
// SESSION TYPES
// ============================================================

/**
 * User session data
 */
export interface SessionData {
  userId: string;
  email: string;
  role: string;
  fullName: string;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Session creation input
 */
export interface SessionCreateInput {
  userId: string;
  email: string;
  role: string;
  fullName: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================
// OTP TYPES
// ============================================================

/**
 * OTP data stored in Redis
 */
export interface OTPData {
  otp: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
}

/**
 * OTP send result
 */
export interface OTPSendResult {
  success: boolean;
  message: string;
  expiresIn?: number;
}

/**
 * OTP verify result
 */
export interface OTPVerifyResult {
  success: boolean;
  verified: boolean;
  message?: string;
}

// ============================================================
// PASSWORD RESET TYPES
// ============================================================

/**
 * Password reset token data
 */
export interface ResetTokenData {
  token: string;
  userId: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Password reset result
 */
export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

// ============================================================
// GOOGLE/FACEBOOK AUTH TYPES
// ============================================================

/**
 * Social login provider types
 */
export type SocialProvider = "google" | "facebook";

/**
 * Social login profile data
 */
export interface SocialProfile {
  id: string;
  email: string;
  fullName: string;
  provider: SocialProvider;
  profileImage?: string;
}

/**
 * Social login request input
 */
export interface SocialLoginInput {
  provider: SocialProvider;
  token: string;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Request types
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  OTPInput,
  OTPVerifyInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,

  // Response types
  AuthUserResponse,
  TokenResponse,
  AuthResponse,

  // JWT types
  TokenPayload,
  AccessTokenPayload,
  RefreshTokenPayload,

  // Session types
  SessionData,
  SessionCreateInput,

  // OTP types
  OTPData,
  OTPSendResult,
  OTPVerifyResult,

  // Password reset types
  ResetTokenData,
  ResetPasswordResult,

  // Social login types
  SocialProvider,
  SocialProfile,
  SocialLoginInput,
};
