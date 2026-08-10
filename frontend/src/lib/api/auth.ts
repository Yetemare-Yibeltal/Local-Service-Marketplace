'use client';

import { getApiClient } from './client';

// ============================================================
// TYPES
// ============================================================

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: 'CUSTOMER' | 'PROVIDER';
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    phone: string;
    fullName: string;
    role: string;
    profileImage: string | null;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    phone: string;
    fullName: string;
    role: string;
    profileImage: string | null;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface OTPData {
  phone: string;
  otp: string;
}

export interface VerifyEmailData {
  token: string;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Login user
 */
export async function login(data: LoginData): Promise<LoginResponse> {
  const client = getApiClient();
  return await client.post<LoginResponse>('/auth/login', data);
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<RegisterResponse> {
  const client = getApiClient();
  return await client.post<RegisterResponse>('/auth/register', data);
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const client = getApiClient();
  return await client.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const client = getApiClient();
  try {
    await client.post('/auth/logout');
  } catch (error) {
    // Ignore errors on logout
  }
}

/**
 * Send OTP for phone verification
 */
export async function sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
  const client = getApiClient();
  return await client.post<{ success: boolean; message: string }>('/auth/send-otp', { phone });
}

/**
 * Verify OTP
 */
export async function verifyOTP(phone: string, otp: string): Promise<{ verified: boolean }> {
  const client = getApiClient();
  return await client.post<{ verified: boolean }>('/auth/verify-otp', { phone, otp });
}

/**
 * Send password reset email
 */
export async function forgotPassword(
  email: string
): Promise<{ success: boolean; message: string }> {
  const client = getApiClient();
  return await client.post<{ success: boolean; message: string }>('/auth/forgot-password', {
    email,
  });
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordData): Promise<{ reset: boolean }> {
  const client = getApiClient();
  return await client.post<{ reset: boolean }>('/auth/reset-password', data);
}

/**
 * Change password (authenticated user)
 */
export async function changePassword(data: ChangePasswordData): Promise<{ changed: boolean }> {
  const client = getApiClient();
  return await client.post<{ changed: boolean }>('/auth/change-password', data);
}

/**
 * Verify email
 */
export async function verifyEmail(token: string): Promise<{ verified: boolean }> {
  const client = getApiClient();
  return await client.get<{ verified: boolean }>(`/auth/verify-email?token=${token}`);
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  profileImage: string | null;
  bio: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}> {
  const client = getApiClient();
  return await client.get('/auth/me');
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  login,
  register,
  refreshToken,
  logout,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  getCurrentUser,
};
