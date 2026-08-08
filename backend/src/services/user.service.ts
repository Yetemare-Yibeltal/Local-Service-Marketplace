import internalUserService from "./internal/user.service";
import { findUserById, updateUser } from "../repositories/user.repository";
import { findProviderByUserId } from "../repositories/provider.repository";
import { createNotification } from "../repositories/notification.repository";
import {
  sendEmail,
  getAccountDeactivationEmailTemplate,
  getWelcomeEmailTemplate,
} from "../config/email";
import { sendSMS, getWelcomeSMSTemplate } from "../config/sms.service";
import { uploadAvatar } from "../services/external/cloudinary.service";
import logger from "../utils/logger";
import {
  validateEmail,
  validatePhone,
  validatePassword,
} from "../utils/validator";

// ============================================================
// USER SERVICE (ROOT LEVEL)
// This service re-exports all functionality from the internal
// user service and adds application-specific convenience
// methods for user management, profile management, user
// administration, and user statistics.
// ============================================================

// Re-export all methods from the internal service
export const {
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
} = internalUserService;

// ============================================================
// TYPES
// ============================================================

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  bio?: string;
  profileImage?: string | Buffer;
}

export interface AdminCreateUserData {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role: "CUSTOMER" | "PROVIDER" | "ADMIN";
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
}

export interface AdminUpdateUserData {
  fullName?: string;
  phone?: string;
  email?: string;
  role?: "CUSTOMER" | "PROVIDER" | "ADMIN";
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
  role: string;
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
// APPLICATION-SPECIFIC USER METHODS
// ============================================================

/**
 * Get user profile with provider details if applicable
 */
export async function getUserFullProfile(
  userId: string,
): Promise<UserProfileResponse | null> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      return null;
    }

    let providerProfile = null;
    if (user.role === "PROVIDER") {
      const provider = await findProviderByUserId(userId);
      if (provider) {
        providerProfile = {
          id: provider.id,
          businessName: provider.businessName,
          isVerified: provider.isVerified,
          averageRating: provider.averageRating,
          totalReviews: provider.totalReviews,
          isAvailable: provider.isAvailable,
          category: provider.category,
        };
      }
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
      providerProfile,
    };
  } catch (error) {
    logger.error(`Get user full profile ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Update user profile with avatar upload
 */
export async function updateProfileWithAvatar(
  userId: string,
  data: UpdateProfileData,
): Promise<UserProfileResponse | null> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Upload avatar if provided
    let avatarUrl: string | undefined;
    if (data.profileImage && data.profileImage instanceof Buffer) {
      try {
        // Delete old avatar if exists
        if (user.profileImage) {
          const publicId = user.profileImage.split("/").pop()?.split(".")[0];
          if (publicId) {
            // Delete from cloudinary
          }
        }

        const uploadResult = await uploadAvatar(data.profileImage, userId);
        avatarUrl = uploadResult.secureUrl;
      } catch (error) {
        logger.error("Avatar upload failed:", error);
      }
    } else if (
      typeof data.profileImage === "string" &&
      data.profileImage.startsWith("http")
    ) {
      avatarUrl = data.profileImage;
    }

    // Validate phone if provided
    if (data.phone) {
      const phoneValidation = validatePhone(data.phone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.message);
      }
    }

    const updatedUser = await updateUser(userId, {
      fullName: data.fullName,
      phone: data.phone,
      bio: data.bio,
      profileImage: avatarUrl,
    });

    logger.info(`User profile with avatar updated: ${userId}`);

    return getUserFullProfile(userId);
  } catch (error) {
    logger.error(`Update profile with avatar ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Create user by admin with welcome notification
 */
export async function createUserWithWelcome(
  data: AdminCreateUserData,
): Promise<any> {
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

    const user = await createUserByAdmin(data);

    // Send welcome email
    try {
      const emailTemplate = getWelcomeEmailTemplate({
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });

      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    } catch (error) {
      logger.error("Failed to send welcome email:", error);
    }

    // Send welcome SMS
    try {
      await sendSMS({
        to: user.phone,
        body: getWelcomeSMSTemplate(user.fullName),
      });
    } catch (error) {
      logger.error("Failed to send welcome SMS:", error);
    }

    // Create welcome notification
    await createNotification({
      userId: user.id,
      type: "EMAIL",
      title: "Welcome to Marketplace",
      message: `Welcome ${user.fullName}! Your account has been created successfully.`,
    });

    logger.info(`User created with welcome: ${user.id}`);

    return user;
  } catch (error) {
    logger.error("Create user with welcome failed:", error);
    throw error;
  }
}

/**
 * Deactivate user with reason and notification
 */
export async function deactivateUserWithReason(
  userId: string,
  reason?: string,
): Promise<any> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await deactivateUser(userId, reason);

    // Send deactivation email
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

    logger.info(`User deactivated with reason: ${userId}`);

    return updatedUser;
  } catch (error) {
    logger.error(`Deactivate user with reason ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get user by ID with provider profile
 */
export async function getUserWithProvider(userId: string): Promise<any> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      return null;
    }

    let provider = null;
    if (user.role === "PROVIDER") {
      provider = await findProviderByUserId(userId);
    }

    return {
      ...user,
      provider,
    };
  } catch (error) {
    logger.error(`Get user with provider ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get user dashboard statistics
 */
export async function getUserDashboardStats(userId: string): Promise<{
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    profileImage: string | null;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  stats: {
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    providerStats?: {
      totalBookings: number;
      completedBookings: number;
      pendingBookings: number;
      totalEarnings: number;
      averageRating: number;
      totalReviews: number;
    };
  };
}> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const { prisma } = require("../config/database");

    // Get customer booking stats
    const [
      totalBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      totalSpent,
    ] = await Promise.all([
      prisma.booking.count({ where: { customerId: userId } }),
      prisma.booking.count({
        where: { customerId: userId, status: "PENDING" },
      }),
      prisma.booking.count({
        where: { customerId: userId, status: "COMPLETED" },
      }),
      prisma.booking.count({
        where: { customerId: userId, status: "CANCELLED" },
      }),
      prisma.booking.aggregate({
        where: { customerId: userId, status: "COMPLETED" },
        _sum: { totalPrice: true },
      }),
    ]);

    let providerStats = undefined;

    // If user is a provider, get provider stats
    if (user.role === "PROVIDER") {
      const provider = await findProviderByUserId(userId);
      if (provider) {
        const [
          providerTotalBookings,
          providerCompletedBookings,
          providerPendingBookings,
          providerTotalEarnings,
        ] = await Promise.all([
          prisma.booking.count({ where: { providerId: provider.id } }),
          prisma.booking.count({
            where: { providerId: provider.id, status: "COMPLETED" },
          }),
          prisma.booking.count({
            where: { providerId: provider.id, status: "PENDING" },
          }),
          prisma.booking.aggregate({
            where: { providerId: provider.id, status: "COMPLETED" },
            _sum: { totalPrice: true },
          }),
        ]);

        providerStats = {
          totalBookings: providerTotalBookings,
          completedBookings: providerCompletedBookings,
          pendingBookings: providerPendingBookings,
          totalEarnings: providerTotalEarnings._sum.totalPrice || 0,
          averageRating: provider.averageRating || 0,
          totalReviews: provider.totalReviews || 0,
        };
      }
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
      stats: {
        totalBookings,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        totalSpent: totalSpent._sum.totalPrice || 0,
        providerStats,
      },
    };
  } catch (error) {
    logger.error(`Get user dashboard stats ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get all users with filters and search (admin)
 */
export async function adminGetUsersList(
  filters: {
    search?: string;
    role?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
  },
  page: number = 1,
  limit: number = 20,
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
    const result = await getUsersList(filters, page, limit, sortBy, sortOrder);

    // Enhance with provider profiles
    const data = await Promise.all(
      result.data.map(async (user: UserProfileResponse) => {
        let providerProfile = null;
        if (user.role === "PROVIDER") {
          const provider = await findProviderByUserId(user.id);
          if (provider) {
            providerProfile = {
              id: provider.id,
              businessName: provider.businessName,
              isVerified: provider.isVerified,
              averageRating: provider.averageRating,
              totalReviews: provider.totalReviews,
              isAvailable: provider.isAvailable,
              category: provider.category,
            };
          }
        }
        return {
          ...user,
          providerProfile,
        };
      }),
    );

    return {
      data,
      pagination: result.pagination,
    };
  } catch (error) {
    logger.error("Admin get users list failed:", error);
    throw error;
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId: string): Promise<{
  lastLogin: Date | null;
  totalLogins: number;
  lastAction: string;
  lastActionAt: Date | null;
  accountAge: number;
  isActive: boolean;
}> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const { prisma } = require("../config/database");

    // Get last action from audit logs
    const lastLog = await prisma.auditLog.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const accountAge = Math.floor(
      (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Get total logins (approximate from audit logs)
    const totalLogins = await prisma.auditLog.count({
      where: {
        userId,
        action: "LOGIN",
      },
    });

    return {
      lastLogin: user.lastLoginAt || null,
      totalLogins: totalLogins || 0,
      lastAction: lastLog?.action || "N/A",
      lastActionAt: lastLog?.createdAt || null,
      accountAge,
      isActive: user.isActive,
    };
  } catch (error) {
    logger.error(`Get user activity summary ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Bulk update user status
 */
export async function bulkUpdateUserStatus(
  userIds: string[],
  isActive: boolean,
  reason?: string,
): Promise<{
  updated: number;
  failed: number;
  errors: { userId: string; error: string }[];
}> {
  try {
    let updated = 0;
    let failed = 0;
    const errors: { userId: string; error: string }[] = [];

    for (const userId of userIds) {
      try {
        if (isActive) {
          await activateUser(userId);
        } else {
          await deactivateUser(userId, reason);
        }
        updated++;
      } catch (error) {
        failed++;
        errors.push({
          userId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    logger.info(
      `Bulk update user status: ${updated} updated, ${failed} failed`,
    );

    return { updated, failed, errors };
  } catch (error) {
    logger.error("Bulk update user status failed:", error);
    throw error;
  }
}

/**
 * Get user count statistics with breakdown
 */
export async function getUserCountStatistics(): Promise<{
  total: number;
  active: number;
  inactive: number;
  customers: number;
  providers: number;
  admins: number;
  verified: number;
  unverified: number;
}> {
  try {
    const { prisma } = require("../config/database");

    const [total, active, roleStats, verifiedStats] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.user.count({
        where: {
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      }),
    ]);

    const roleCounts: Record<string, number> = {};
    roleStats.forEach((item: any) => {
      roleCounts[item.role] = item._count.id;
    });

    return {
      total,
      active,
      inactive: total - active,
      customers: roleCounts.CUSTOMER || 0,
      providers: roleCounts.PROVIDER || 0,
      admins: roleCounts.ADMIN || 0,
      verified: verifiedStats,
      unverified: total - verifiedStats,
    };
  } catch (error) {
    logger.error("Get user count statistics failed:", error);
    throw error;
  }
}

/**
 * Check if email is available
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  try {
    return !(await checkEmailExists(email));
  } catch (error) {
    logger.error("Check email available failed:", error);
    return false;
  }
}

/**
 * Check if phone is available
 */
export async function isPhoneAvailable(phone: string): Promise<boolean> {
  try {
    return !(await checkPhoneExists(phone));
  } catch (error) {
    logger.error("Check phone available failed:", error);
    return false;
  }
}

/**
 * Search users by email or phone
 */
export async function searchUsersByContact(
  searchTerm: string,
  limit: number = 10,
): Promise<any[]> {
  try {
    const { prisma } = require("../config/database");

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm } },
          { fullName: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        profileImage: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return users;
  } catch (error) {
    logger.error("Search users by contact failed:", error);
    return [];
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Re-export internal service methods
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

  // Application-specific methods
  getUserFullProfile,
  updateProfileWithAvatar,
  createUserWithWelcome,
  deactivateUserWithReason,
  getUserWithProvider,
  getUserDashboardStats,
  adminGetUsersList,
  getUserActivitySummary,
  bulkUpdateUserStatus,
  getUserCountStatistics,
  isEmailAvailable,
  isPhoneAvailable,
  searchUsersByContact,
};
