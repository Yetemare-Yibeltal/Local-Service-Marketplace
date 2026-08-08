import { User, UserRole } from "@prisma/client";
import {
  findUserById,
  findUserByEmail,
  findUserByPhone,
  findUserWithProviderById,
  updateUser,
  deleteUser,
  hardDeleteUser,
  getUsers,
  countUsersByRole,
  getTotalUserCount,
  getActiveUserCount,
  emailExists,
  phoneExists,
  UserFilters,
} from "../../repositories/user.repository";
import { findProviderByUserId } from "../../repositories/provider.repository";
import { hashPassword } from "../../utils/bcrypt";
import {
  validateEmail,
  validatePhone,
  validatePassword,
} from "../../utils/validator";
import {
  sendEmail,
  getAccountDeactivationEmailTemplate,
} from "../../config/email";
import { createNotification } from "../../repositories/notification.repository";
import logger from "../../utils/logger";
import { USER_ROLES } from "../../utils/constants";

// ============================================================
// TYPES
// ============================================================

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  bio?: string;
  profileImage?: string;
}

export interface AdminCreateUserData {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role: UserRole;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
}

export interface AdminUpdateUserData {
  fullName?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  bio?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  profileImage: string | null;
  bio: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  providerProfile?: {
    id: string;
    businessName: string;
    isVerified: boolean;
    averageRating: number;
    totalReviews: number;
    isAvailable: boolean;
    category: string;
  } | null;
}

// ============================================================
// USER SERVICE
// ============================================================

/**
 * Get user profile by ID
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfileResponse | null> {
  try {
    const user = await findUserWithProviderById(userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      providerProfile: user.providerProfile
        ? {
            id: user.providerProfile.id,
            businessName: user.providerProfile.businessName,
            isVerified: user.providerProfile.isVerified,
            averageRating: user.providerProfile.averageRating,
            totalReviews: user.providerProfile.totalReviews,
            isAvailable: user.providerProfile.isAvailable,
            category: user.providerProfile.category,
          }
        : null,
    };
  } catch (error) {
    logger.error(`Get user profile for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateProfileData,
): Promise<UserProfileResponse | null> {
  try {
    const existingUser = await findUserById(userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Validate phone if provided
    if (data.phone) {
      const phoneValidation = validatePhone(data.phone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.message);
      }

      // Check if phone is taken by another user
      if (data.phone !== existingUser.phone) {
        const phoneTaken = await phoneExists(data.phone);
        if (phoneTaken) {
          throw new Error("Phone number already in use by another account");
        }
      }
    }

    const updatedUser = await updateUser(userId, {
      fullName: data.fullName,
      phone: data.phone,
      bio: data.bio,
      profileImage: data.profileImage,
    });

    logger.info(`User profile updated: ${userId}`);

    return getUserProfile(userId);
  } catch (error) {
    logger.error(`Update user profile for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get all users with pagination and filters (admin only)
 */
export async function getUsersList(
  filters: UserFilters,
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<{
  data: UserProfileResponse[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    const result = await getUsers(filters, page, limit, sortBy, sortOrder);

    const data = await Promise.all(
      result.data.map(async (user) => {
        const provider = await findProviderByUserId(user.id);
        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          profileImage: user.profileImage,
          bio: user.bio,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          providerProfile: provider
            ? {
                id: provider.id,
                businessName: provider.businessName,
                isVerified: provider.isVerified,
                averageRating: provider.averageRating,
                totalReviews: provider.totalReviews,
                isAvailable: provider.isAvailable,
                category: provider.category,
              }
            : null,
        };
      }),
    );

    return {
      data,
      pagination: result.pagination,
    };
  } catch (error) {
    logger.error("Get users list failed:", error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    return await findUserByEmail(email);
  } catch (error) {
    logger.error(`Get user by email ${email} failed:`, error);
    throw error;
  }
}

/**
 * Get user by phone
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    return await findUserByPhone(phone);
  } catch (error) {
    logger.error(`Get user by phone ${phone} failed:`, error);
    throw error;
  }
}

/**
 * Check if email exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    return await emailExists(email);
  } catch (error) {
    logger.error(`Check email exists ${email} failed:`, error);
    throw error;
  }
}

/**
 * Check if phone exists
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    return await phoneExists(phone);
  } catch (error) {
    logger.error(`Check phone exists ${phone} failed:`, error);
    throw error;
  }
}

/**
 * Create user by admin
 */
export async function createUserByAdmin(
  data: AdminCreateUserData,
): Promise<User> {
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
      role: data.role,
    });

    // Update additional fields if provided
    if (
      data.isEmailVerified !== undefined ||
      data.isPhoneVerified !== undefined ||
      data.isActive !== undefined
    ) {
      await updateUser(user.id, {
        isEmailVerified: data.isEmailVerified || false,
        isPhoneVerified: data.isPhoneVerified || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
    }

    logger.info(`User created by admin: ${user.id} (${user.email})`);

    // Create welcome notification
    await createNotification({
      userId: user.id,
      type: "EMAIL",
      title: "Welcome to Marketplace",
      message: `Welcome ${user.fullName}! Your account has been created successfully.`,
    });

    return user;
  } catch (error) {
    logger.error("Create user by admin failed:", error);
    throw error;
  }
}

/**
 * Update user by admin
 */
export async function updateUserByAdmin(
  userId: string,
  data: AdminUpdateUserData,
): Promise<UserProfileResponse | null> {
  try {
    const existingUser = await findUserById(userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Validate email if provided
    if (data.email) {
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.message);
      }

      if (data.email !== existingUser.email) {
        const emailTaken = await emailExists(data.email);
        if (emailTaken) {
          throw new Error("Email already in use by another account");
        }
      }
    }

    // Validate phone if provided
    if (data.phone) {
      const phoneValidation = validatePhone(data.phone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.message);
      }

      if (data.phone !== existingUser.phone) {
        const phoneTaken = await phoneExists(data.phone);
        if (phoneTaken) {
          throw new Error("Phone number already in use by another account");
        }
      }
    }

    const updatedUser = await updateUser(userId, {
      email: data.email,
      phone: data.phone,
      fullName: data.fullName,
      role: data.role,
      isEmailVerified: data.isEmailVerified,
      isPhoneVerified: data.isPhoneVerified,
      isActive: data.isActive,
      bio: data.bio,
    });

    logger.info(`User updated by admin: ${userId}`);

    return getUserProfile(userId);
  } catch (error) {
    logger.error(`Update user by admin ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(
  userId: string,
  reason?: string,
): Promise<User> {
  try {
    const user = await findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isActive) {
      throw new Error("User is already deactivated");
    }

    // Deactivate user
    const updatedUser = await deleteUser(userId);

    // Send email notification
    try {
      const emailTemplate = getAccountDeactivationEmailTemplate({
        name: user.fullName,
        reason,
      });

      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    } catch (error) {
      logger.error("Failed to send deactivation email:", error);
    }

    // Create notification
    await createNotification({
      userId: userId,
      type: "EMAIL",
      title: "Account Deactivated",
      message: `Your account has been deactivated. ${reason ? `Reason: ${reason}` : ""}`,
    });

    logger.info(`User deactivated: ${userId}`);

    return updatedUser;
  } catch (error) {
    logger.error(`Deactivate user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Activate user
 */
export async function activateUser(userId: string): Promise<User> {
  try {
    const user = await findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isActive) {
      throw new Error("User is already active");
    }

    const updatedUser = await updateUser(userId, { isActive: true });

    // Create notification
    await createNotification({
      userId: userId,
      type: "EMAIL",
      title: "Account Activated",
      message:
        "Your account has been reactivated. You can now access the platform.",
    });

    logger.info(`User activated: ${userId}`);

    return updatedUser;
  } catch (error) {
    logger.error(`Activate user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Hard delete user (permanent)
 */
export async function permanentlyDeleteUser(userId: string): Promise<User> {
  try {
    const user = await findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has provider profile
    const provider = await findProviderByUserId(userId);
    if (provider) {
      throw new Error(
        "User has an associated provider profile. Delete provider first.",
      );
    }

    const deletedUser = await hardDeleteUser(userId);

    logger.info(`User permanently deleted: ${userId}`);

    return deletedUser;
  } catch (error) {
    logger.error(`Permanently delete user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics(): Promise<{
  totalUsers: number;
  activeUsers: number;
  customers: number;
  providers: number;
  admins: number;
}> {
  try {
    const [totalUsers, activeUsers, roles] = await Promise.all([
      getTotalUserCount(),
      getActiveUserCount(),
      countUsersByRole(),
    ]);

    return {
      totalUsers,
      activeUsers,
      customers: roles.CUSTOMER || 0,
      providers: roles.PROVIDER || 0,
      admins: roles.ADMIN || 0,
    };
  } catch (error) {
    logger.error("Get user statistics failed:", error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  getUserProfile,
  updateUserProfile,
  getUsersList,
  getUserByEmail,
  getUserByPhone,
  checkEmailExists,
  checkPhoneExists,
  createUserByAdmin,
  updateUserByAdmin,
  deactivateUser,
  activateUser,
  permanentlyDeleteUser,
  getUserStatistics,
};
