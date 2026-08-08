import { User, UserRole } from "@prisma/client";
import {
  findUserByEmail,
  findUserByPhone,
  findUserByEmailOrPhone,
  createUser,
  updateUser,
  updateLastLogin,
  emailExists,
  phoneExists,
} from "../../repositories/user.repository";
import {
  hashPassword,
  comparePassword,
  generateOTP,
  generateSecureToken,
} from "../../utils/bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "../../config/jwt";
import {
  sendEmail,
  getOTPEmailTemplate,
  getPasswordResetEmailTemplate,
  getWelcomeEmailTemplate,
} from "../../config/email";
import { sendSMS, getOTPSMSTemplate } from "../../config/twilio";
import { cacheSet, cacheGet, cacheDelete } from "../../config/redis";
import logger from "../../utils/logger";
import {
  validateEmail,
  validatePhone,
  validatePassword,
} from "../../utils/validator";

// ============================================================
// TYPES
// ============================================================

export interface RegisterData {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    phone: string;
    fullName: string;
    role: UserRole;
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

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface OTPData {
  phone: string;
  otp: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

// ============================================================
// AUTH SERVICE
// ============================================================

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    // Validate inputs
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.message);
    }

    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.isValid) {
      throw new Error(phoneValidation.message);
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(", "));
    }

    // Check if user exists
    const [existingEmail, existingPhone] = await Promise.all([
      emailExists(data.email),
      phoneExists(data.phone),
    ]);

    if (existingEmail) {
      throw new Error("Email already registered");
    }

    if (existingPhone) {
      throw new Error("Phone number already registered");
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await createUser({
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      passwordHash,
      fullName: data.fullName.trim(),
      role: data.role || "CUSTOMER",
    });

    // Generate OTP
    const otp = generateOTP();
    const otpKey = `otp_${user.id}`;

    // Store OTP in cache (expires in 10 minutes)
    await cacheSet(otpKey, otp, 600);

    // Send OTP via SMS and Email
    try {
      await sendSMS({
        to: user.phone,
        body: getOTPSMSTemplate(otp),
      });
    } catch (error) {
      logger.error("Failed to send OTP SMS:", error);
    }

    try {
      const emailTemplate = getOTPEmailTemplate({ name: user.fullName, otp });
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    } catch (error) {
      logger.error("Failed to send OTP email:", error);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`User registered: ${user.id} (${user.email})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    };
  } catch (error) {
    logger.error("Registration failed:", error);
    throw error;
  }
}

/**
 * Login user
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    // Find user by email or phone
    const user = await findUserByEmailOrPhone(data.email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated. Please contact support.");
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await updateLastLogin(user.id);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`User logged in: ${user.id} (${user.email})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    };
  } catch (error) {
    logger.error("Login failed:", error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(
  refreshToken: string,
): Promise<TokenResponse> {
  try {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new Error("Invalid or expired refresh token");
    }

    // Verify user still exists and is active
    const user = await findUserByEmail(payload.email);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`Tokens refreshed for user: ${user.id}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  } catch (error) {
    logger.error("Refresh token failed:", error);
    throw error;
  }
}

/**
 * Logout user
 */
export async function logout(userId: string): Promise<boolean> {
  try {
    const sessionKey = `session_${userId}`;
    await cacheDelete(sessionKey);
    logger.info(`User logged out: ${userId}`);
    return true;
  } catch (error) {
    logger.error("Logout failed:", error);
    throw error;
  }
}

/**
 * Send OTP for phone verification
 */
export async function sendOTP(
  phone: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await findUserByPhone(phone);
    if (!user) {
      throw new Error("User not found with this phone number");
    }

    const otp = generateOTP();
    const otpKey = `otp_${user.id}`;
    await cacheSet(otpKey, otp, 600);

    await sendSMS({
      to: user.phone,
      body: getOTPSMSTemplate(otp),
    });

    logger.info(`OTP sent to ${phone}`);

    return {
      success: true,
      message: "OTP sent successfully",
    };
  } catch (error) {
    logger.error("Send OTP failed:", error);
    throw error;
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(userId: string, otp: string): Promise<boolean> {
  try {
    const otpKey = `otp_${userId}`;
    const storedOtp = await cacheGet<string>(otpKey);

    if (!storedOtp) {
      throw new Error("OTP expired or not found");
    }

    if (storedOtp !== otp) {
      throw new Error("Invalid OTP");
    }

    await updateUser(userId, { isPhoneVerified: true });
    await cacheDelete(otpKey);

    logger.info(`OTP verified for user: ${userId}`);

    return true;
  } catch (error) {
    logger.error("Verify OTP failed:", error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return {
        success: true,
        message:
          "If an account exists with this email, a reset link will be sent.",
      };
    }

    const resetToken = generateSecureToken(32);
    const resetKey = `reset_${user.id}`;
    await cacheSet(resetKey, resetToken, 3600);

    const emailTemplate = getPasswordResetEmailTemplate({
      name: user.fullName,
      resetToken,
    });

    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    logger.info(`Password reset email sent to ${email}`);

    return {
      success: true,
      message:
        "If an account exists with this email, a reset link will be sent.",
    };
  } catch (error) {
    logger.error("Send password reset email failed:", error);
    throw error;
  }
}

/**
 * Reset password with userId
 */
export async function resetPasswordWithUserId(
  userId: string,
  token: string,
  newPassword: string,
): Promise<boolean> {
  try {
    const resetKey = `reset_${userId}`;
    const storedToken = await cacheGet<string>(resetKey);

    if (!storedToken) {
      throw new Error("Reset token expired or not found");
    }

    if (storedToken !== token) {
      throw new Error("Invalid reset token");
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(", "));
    }

    const passwordHash = await hashPassword(newPassword);
    await updateUser(userId, { passwordHash });
    await cacheDelete(resetKey);

    logger.info(`Password reset successfully for user: ${userId}`);

    return true;
  } catch (error) {
    logger.error("Reset password failed:", error);
    throw error;
  }
}

/**
 * Change password (authenticated user)
 */
export async function changePassword(
  data: ChangePasswordData,
): Promise<boolean> {
  try {
    const user = await findUserByEmail(data.email);
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await comparePassword(
      data.currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const passwordValidation = validatePassword(data.newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(", "));
    }

    const passwordHash = await hashPassword(data.newPassword);
    await updateUser(data.userId, { passwordHash });

    logger.info(`Password changed for user: ${data.userId}`);

    return true;
  } catch (error) {
    logger.error("Change password failed:", error);
    throw error;
  }
}

/**
 * Verify email
 */
export async function verifyEmail(token: string): Promise<boolean> {
  try {
    // In production, store verification token in user record
    // For now, this is a placeholder that returns true
    logger.info("Email verified successfully");
    return true;
  } catch (error) {
    logger.error("Verify email failed:", error);
    throw error;
  }
}

/**
 * Find user by ID (for auth context)
 */
export async function findUserById(id: string): Promise<User | null> {
  try {
    return await findUserById(id);
  } catch (error) {
    logger.error("Find user by ID failed:", error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
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
  findUserById,
};
