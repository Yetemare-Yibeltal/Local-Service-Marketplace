import { Prisma } from "@prisma/client";
import {
  getUsers,
  updateUser,
  deleteUser,
  hardDeleteUser,
  getTotalUserCount,
  getActiveUserCount,
} from "../repositories/user.repository";
import {
  findProviderById,
  getProviders,
  verifyProvider,
  getTotalProviderCount,
  getActiveProviderCount,
  getVerifiedProviderCount,
} from "../repositories/provider.repository";
import {
  getBookings,
  getBookingCountByStatus,
  getProviderDashboardStats,
} from "../repositories/booking.repository";
import {
  getReviewsByProvider,
  getProviderRatingStats,
} from "../repositories/review.repository";
import {
  getAllNotifications,
  deleteOldNotifications,
} from "../repositories/notification.repository";
import { createNotification } from "../repositories/notification.repository";
import { sendEmail } from "../config/email";
import { sendSMS } from "../config/twilio";
import logger from "../utils/logger";
import { formatCurrency, formatDate } from "../utils/helpers";

// ============================================================
// TYPES
// ============================================================

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  providers: {
    total: number;
    active: number;
    inactive: number;
    verified: number;
    pending: number;
    rejected: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    disputed: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    averagePerBooking: number;
  };
  disputes: {
    total: number;
    open: number;
    underReview: number;
    resolved: number;
    closed: number;
  };
  reviews: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    averageRating: number;
  };
}

export interface AdminUserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface AdminProviderFilters {
  search?: string;
  category?: string;
  city?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  verificationStatus?: string;
}

export interface AdminDisputeFilters {
  status?: string;
  raisedBy?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface SystemSetting {
  key: string;
  value: any;
  description?: string;
  isPublic: boolean;
}

export interface AuditLogEntry {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================
// ADMIN SERVICE
// ============================================================

/**
 * Get admin dashboard statistics
 */
export async function getDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const { prisma } = require("../config/database");

    // Users stats
    const [totalUsers, activeUsers] = await Promise.all([
      getTotalUserCount(),
      getActiveUserCount(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [newToday, newThisWeek, newThisMonth] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    ]);

    // Providers stats
    const [totalProviders, activeProviders, verifiedProviders] =
      await Promise.all([
        getTotalProviderCount(),
        getActiveProviderCount(),
        getVerifiedProviderCount(),
      ]);

    const [providersNewToday, providersNewThisWeek, providersNewThisMonth] =
      await Promise.all([
        prisma.providerProfile.count({ where: { createdAt: { gte: today } } }),
        prisma.providerProfile.count({
          where: { createdAt: { gte: weekAgo } },
        }),
        prisma.providerProfile.count({
          where: { createdAt: { gte: monthAgo } },
        }),
      ]);

    const pendingProviders = await prisma.providerProfile.count({
      where: { verificationStatus: "PENDING" },
    });

    const rejectedProviders = await prisma.providerProfile.count({
      where: { verificationStatus: "REJECTED" },
    });

    // Bookings stats
    const bookingCounts = await getBookingCountByStatus();

    const [bookingsToday, bookingsThisWeek, bookingsThisMonth] =
      await Promise.all([
        prisma.booking.count({ where: { createdAt: { gte: today } } }),
        prisma.booking.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.booking.count({ where: { createdAt: { gte: monthAgo } } }),
      ]);

    // Revenue stats
    const [totalRevenue, revenueToday, revenueThisWeek, revenueThisMonth] =
      await Promise.all([
        prisma.booking.aggregate({
          where: { status: "COMPLETED" },
          _sum: { totalPrice: true },
        }),
        prisma.booking.aggregate({
          where: { status: "COMPLETED", completedAt: { gte: today } },
          _sum: { totalPrice: true },
        }),
        prisma.booking.aggregate({
          where: { status: "COMPLETED", completedAt: { gte: weekAgo } },
          _sum: { totalPrice: true },
        }),
        prisma.booking.aggregate({
          where: { status: "COMPLETED", completedAt: { gte: monthAgo } },
          _sum: { totalPrice: true },
        }),
      ]);

    const totalCompletedBookings = await prisma.booking.count({
      where: { status: "COMPLETED" },
    });

    const averagePerBooking =
      totalCompletedBookings > 0
        ? (totalRevenue._sum.totalPrice || 0) / totalCompletedBookings
        : 0;

    // Disputes stats
    const [
      totalDisputes,
      openDisputes,
      underReviewDisputes,
      resolvedDisputes,
      closedDisputes,
    ] = await Promise.all([
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.dispute.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.dispute.count({ where: { status: "RESOLVED" } }),
      prisma.dispute.count({ where: { status: "CLOSED" } }),
    ]);

    // Reviews stats
    const [
      totalReviews,
      reviewsToday,
      reviewsThisWeek,
      reviewsThisMonth,
      averageRating,
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { createdAt: { gte: today } } }),
      prisma.review.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.review.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.review.aggregate({
        _avg: { rating: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        newToday,
        newThisWeek,
        newThisMonth,
      },
      providers: {
        total: totalProviders,
        active: activeProviders,
        inactive: totalProviders - activeProviders,
        verified: verifiedProviders,
        pending: pendingProviders,
        rejected: rejectedProviders,
        newToday: providersNewToday,
        newThisWeek: providersNewThisWeek,
        newThisMonth: providersNewThisMonth,
      },
      bookings: {
        total: Object.values(bookingCounts).reduce((a, b) => a + b, 0),
        pending: bookingCounts.PENDING || 0,
        confirmed: bookingCounts.CONFIRMED || 0,
        inProgress: bookingCounts.IN_PROGRESS || 0,
        completed: bookingCounts.COMPLETED || 0,
        cancelled: bookingCounts.CANCELLED || 0,
        disputed: bookingCounts.DISPUTED || 0,
        today: bookingsToday,
        thisWeek: bookingsThisWeek,
        thisMonth: bookingsThisMonth,
      },
      revenue: {
        total: totalRevenue._sum.totalPrice || 0,
        today: revenueToday._sum.totalPrice || 0,
        thisWeek: revenueThisWeek._sum.totalPrice || 0,
        thisMonth: revenueThisMonth._sum.totalPrice || 0,
        averagePerBooking,
      },
      disputes: {
        total: totalDisputes,
        open: openDisputes,
        underReview: underReviewDisputes,
        resolved: resolvedDisputes,
        closed: closedDisputes,
      },
      reviews: {
        total: totalReviews,
        today: reviewsToday,
        thisWeek: reviewsThisWeek,
        thisMonth: reviewsThisMonth,
        averageRating: averageRating._avg.rating || 0,
      },
    };
  } catch (error) {
    logger.error("Get dashboard stats failed:", error);
    throw error;
  }
}

/**
 * Get all users with filters (admin only)
 */
export async function adminGetUsers(
  filters: AdminUserFilters,
  page: number = 1,
  limit: number = 20,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
) {
  try {
    return await getUsers(filters, page, limit, sortBy, sortOrder);
  } catch (error) {
    logger.error("Admin get users failed:", error);
    throw error;
  }
}

/**
 * Get user by ID (admin)
 */
export async function adminGetUserById(userId: string) {
  try {
    const { findUserById } = require("../repositories/user.repository");
    return await findUserById(userId);
  } catch (error) {
    logger.error(`Admin get user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Update user by admin
 */
export async function adminUpdateUser(
  userId: string,
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    bio?: string;
  },
) {
  try {
    const user = await updateUser(userId, data);

    await createAuditLog({
      userId: "admin",
      action: "UPDATE_USER",
      entity: "User",
      entityId: userId,
      changes: data,
    });

    logger.info(`Admin updated user ${userId}`);

    return user;
  } catch (error) {
    logger.error(`Admin update user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Deactivate user by admin
 */
export async function adminDeactivateUser(userId: string, reason?: string) {
  try {
    const { findUserById } = require("../repositories/user.repository");
    const user = await findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await updateUser(userId, { isActive: false });

    await createAuditLog({
      userId: "admin",
      action: "DEACTIVATE_USER",
      entity: "User",
      entityId: userId,
      changes: { reason },
    });

    try {
      const { sendAccountDeactivationEmail } = require("./email.service");
      await sendAccountDeactivationEmail({
        name: user.fullName,
        email: user.email,
        reason,
      });
    } catch (error) {
      logger.error("Failed to send deactivation email:", error);
    }

    logger.info(`Admin deactivated user ${userId}`);

    return updatedUser;
  } catch (error) {
    logger.error(`Admin deactivate user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Activate user by admin
 */
export async function adminActivateUser(userId: string) {
  try {
    const updatedUser = await updateUser(userId, { isActive: true });

    await createAuditLog({
      userId: "admin",
      action: "ACTIVATE_USER",
      entity: "User",
      entityId: userId,
    });

    logger.info(`Admin activated user ${userId}`);

    return updatedUser;
  } catch (error) {
    logger.error(`Admin activate user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get all providers with filters (admin only)
 */
export async function adminGetProviders(
  filters: AdminProviderFilters,
  page: number = 1,
  limit: number = 20,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
) {
  try {
    return await getProviders(filters, page, limit, sortBy, sortOrder);
  } catch (error) {
    logger.error("Admin get providers failed:", error);
    throw error;
  }
}

/**
 * Get provider by ID (admin)
 */
export async function adminGetProviderById(providerId: string) {
  try {
    return await findProviderById(providerId);
  } catch (error) {
    logger.error(`Admin get provider ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Verify provider (admin)
 */
export async function adminVerifyProvider(
  providerId: string,
  isVerified: boolean,
  notes?: string,
) {
  try {
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    const updatedProvider = await verifyProvider(providerId, isVerified, notes);

    await createAuditLog({
      userId: "admin",
      action: isVerified ? "VERIFY_PROVIDER" : "REJECT_PROVIDER",
      entity: "Provider",
      entityId: providerId,
      changes: { notes },
    });

    try {
      await createNotification({
        userId: provider.userId,
        type: "EMAIL",
        title: isVerified
          ? "Provider Verified"
          : "Provider Verification Rejected",
        message: isVerified
          ? `Your business "${provider.businessName}" has been verified successfully.`
          : `Your business "${provider.businessName}" verification was rejected. ${notes || ""}`,
        data: { providerId, isVerified },
      });
    } catch (error) {
      logger.error("Failed to send verification notification:", error);
    }

    logger.info(
      `Admin ${isVerified ? "verified" : "rejected"} provider ${providerId}`,
    );

    return updatedProvider;
  } catch (error) {
    logger.error(`Admin verify provider ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get disputes with filters (admin only)
 */
export async function adminGetDisputes(
  filters: AdminDisputeFilters,
  page: number = 1,
  limit: number = 20,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
) {
  try {
    const { prisma } = require("../config/database");

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.raisedBy) {
      where.raisedBy = filters.raisedBy;
    }

    if (filters.startDate) {
      where.createdAt = { gte: filters.startDate };
    }

    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: filters.endDate };
    }

    const [data, totalItems] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          booking: {
            include: {
              customer: {
                select: { id: true, fullName: true, email: true },
              },
              provider: {
                select: { id: true, businessName: true },
              },
            },
          },
          disputeMessages: {
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNext: page < Math.ceil(totalItems / limit),
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error("Admin get disputes failed:", error);
    throw error;
  }
}

/**
 * Get dispute by ID (admin)
 */
export async function adminGetDisputeById(disputeId: string) {
  try {
    const { prisma } = require("../config/database");

    return await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            customer: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
            provider: {
              select: { id: true, businessName: true },
            },
          },
        },
        disputeMessages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    logger.error(`Admin get dispute ${disputeId} failed:`, error);
    throw error;
  }
}

/**
 * Resolve dispute (admin)
 */
export async function adminResolveDispute(
  disputeId: string,
  resolution: string,
  status: string = "RESOLVED",
) {
  try {
    const { prisma } = require("../config/database");

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            customer: true,
            provider: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolution,
        resolvedAt: new Date(),
        resolvedBy: "admin",
      },
    });

    await createAuditLog({
      userId: "admin",
      action: "RESOLVE_DISPUTE",
      entity: "Dispute",
      entityId: disputeId,
      changes: { resolution, status },
    });

    try {
      await createNotification({
        userId: dispute.booking.customerId,
        type: "EMAIL",
        title: "Dispute Resolved",
        message: `Your dispute for booking ${dispute.booking.bookingNumber} has been resolved.`,
        data: { disputeId, status },
      });

      await createNotification({
        userId: dispute.booking.provider.userId,
        type: "EMAIL",
        title: "Dispute Resolved",
        message: `The dispute for booking ${dispute.booking.bookingNumber} has been resolved.`,
        data: { disputeId, status },
      });
    } catch (error) {
      logger.error("Failed to send dispute resolution notification:", error);
    }

    logger.info(`Admin resolved dispute ${disputeId}`);

    return updatedDispute;
  } catch (error) {
    logger.error(`Admin resolve dispute ${disputeId} failed:`, error);
    throw error;
  }
}

/**
 * Add message to dispute (admin)
 */
export async function adminAddDisputeMessage(
  disputeId: string,
  message: string,
  senderId: string,
) {
  try {
    const { prisma } = require("../config/database");

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    const disputeMessage = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId,
        senderRole: "ADMIN",
        message,
        isRead: false,
      },
    });

    logger.info(`Admin added message to dispute ${disputeId}`);

    return disputeMessage;
  } catch (error) {
    logger.error(`Admin add dispute message ${disputeId} failed:`, error);
    throw error;
  }
}

/**
 * Get system settings
 */
export async function getSystemSettings(): Promise<SystemSetting[]> {
  try {
    const { prisma } = require("../config/database");

    const settings = await prisma.systemSetting.findMany();

    return settings.map((setting: any) => ({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      isPublic: setting.isPublic,
    }));
  } catch (error) {
    logger.error("Get system settings failed:", error);
    throw error;
  }
}

/**
 * Get system setting by key
 */
export async function getSystemSetting(
  key: string,
): Promise<SystemSetting | null> {
  try {
    const { prisma } = require("../config/database");

    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return null;
    }

    return {
      key: setting.key,
      value: setting.value,
      description: setting.description,
      isPublic: setting.isPublic,
    };
  } catch (error) {
    logger.error(`Get system setting ${key} failed:`, error);
    throw error;
  }
}

/**
 * Update system setting
 */
export async function updateSystemSetting(
  key: string,
  value: any,
  description?: string,
): Promise<SystemSetting> {
  try {
    const { prisma } = require("../config/database");

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        description,
        isPublic: false,
      },
    });

    await createAuditLog({
      userId: "admin",
      action: "UPDATE_SETTING",
      entity: "SystemSetting",
      entityId: key,
      changes: { key, value },
    });

    logger.info(`System setting ${key} updated`);

    return {
      key: setting.key,
      value: setting.value,
      description: setting.description,
      isPublic: setting.isPublic,
    };
  } catch (error) {
    logger.error(`Update system setting ${key} failed:`, error);
    throw error;
  }
}

/**
 * Create audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const { prisma } = require("../config/database");

    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        changes: entry.changes,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    logger.error("Create audit log failed:", error);
  }
}

/**
 * Get audit logs with filters (admin only)
 */
export async function getAuditLogs(
  filters: {
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  },
  page: number = 1,
  limit: number = 50,
) {
  try {
    const { prisma } = require("../config/database");

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.startDate) {
      where.createdAt = { gte: filters.startDate };
    }

    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: filters.endDate };
    }

    const [data, totalItems] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNext: page < Math.ceil(totalItems / limit),
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error("Get audit logs failed:", error);
    throw error;
  }
}

/**
 * Get platform analytics summary
 */
export async function getPlatformAnalytics(
  period: "today" | "week" | "month" | "quarter" | "year" = "month",
) {
  try {
    const { prisma } = require("../config/database");

    const startDate = new Date();
    let dateRange: Date;

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        dateRange = startDate;
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        dateRange = startDate;
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        dateRange = startDate;
        break;
      case "quarter":
        startDate.setMonth(startDate.getMonth() - 3);
        dateRange = startDate;
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        dateRange = startDate;
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        dateRange = startDate;
    }

    const [users, providers, bookings, revenue, disputes, reviews] =
      await Promise.all([
        prisma.user.count({
          where: { createdAt: { gte: dateRange } },
        }),
        prisma.providerProfile.count({
          where: { createdAt: { gte: dateRange } },
        }),
        prisma.booking.count({
          where: { createdAt: { gte: dateRange } },
        }),
        prisma.booking.aggregate({
          where: {
            status: "COMPLETED",
            completedAt: { gte: dateRange },
          },
          _sum: { totalPrice: true },
        }),
        prisma.dispute.count({
          where: { createdAt: { gte: dateRange } },
        }),
        prisma.review.count({
          where: { createdAt: { gte: dateRange } },
        }),
      ]);

    return {
      period,
      startDate: dateRange,
      analytics: {
        newUsers: users,
        newProviders: providers,
        totalBookings: bookings,
        totalRevenue: revenue._sum.totalPrice || 0,
        totalDisputes: disputes,
        totalReviews: reviews,
      },
    };
  } catch (error) {
    logger.error("Get platform analytics failed:", error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  getDashboardStats,
  adminGetUsers,
  adminGetUserById,
  adminUpdateUser,
  adminDeactivateUser,
  adminActivateUser,
  adminGetProviders,
  adminGetProviderById,
  adminVerifyProvider,
  adminGetDisputes,
  adminGetDisputeById,
  adminResolveDispute,
  adminAddDisputeMessage,
  getSystemSettings,
  getSystemSetting,
  updateSystemSetting,
  createAuditLog,
  getAuditLogs,
  getPlatformAnalytics,
};
