import {
  Prisma,
  Notification,
  NotificationStatus,
  NotificationType,
} from "@prisma/client";
import prisma from "../config/database";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface NotificationCreateData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  status?: NotificationStatus;
}

export interface NotificationUpdateData {
  status?: NotificationStatus;
  readAt?: Date;
  sentAt?: Date;
}

export interface NotificationWithUser extends Notification {
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  bookingUpdates: boolean;
  promotionalEmails: boolean;
  providerUpdates: boolean;
  systemAlerts: boolean;
}

export interface UnreadCount {
  total: number;
  byType: {
    EMAIL: number;
    SMS: number;
    PUSH: number;
  };
}

// ============================================================
// NOTIFICATION REPOSITORY
// ============================================================

/**
 * Create a new notification
 */
export async function createNotification(
  data: NotificationCreateData,
): Promise<Notification> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        status: data.status || "PENDING",
      },
    });

    logger.info(`Notification created for user ${data.userId}: ${data.title}`);

    return notification;
  } catch (error) {
    logger.error("Create notification failed:", error);
    throw error;
  }
}

/**
 * Create multiple notifications (bulk)
 */
export async function createBulkNotifications(
  data: Omit<NotificationCreateData, "status">[],
): Promise<Notification[]> {
  try {
    const notifications = await prisma.notification.createMany({
      data: data.map((item) => ({
        userId: item.userId,
        type: item.type,
        title: item.title,
        message: item.message,
        data: item.data || {},
        status: "PENDING",
      })),
    });

    // Fetch created notifications
    const created = await prisma.notification.findMany({
      where: {
        userId: { in: data.map((d) => d.userId) },
        createdAt: { gte: new Date(Date.now() - 5000) },
      },
      orderBy: { createdAt: "desc" },
      take: notifications.count,
    });

    logger.info(`Created ${notifications.count} notifications`);

    return created;
  } catch (error) {
    logger.error("Create bulk notifications failed:", error);
    throw error;
  }
}

/**
 * Find notification by ID
 */
export async function findNotificationById(
  id: string,
): Promise<NotificationWithUser | null> {
  try {
    return await prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Find notification ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get notifications by user ID
 */
export async function getNotificationsByUser(
  userId: string,
  filters: NotificationFilters = {},
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: NotificationWithUser[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
}> {
  try {
    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isRead !== undefined) {
      if (filters.isRead) {
        where.readAt = { not: null };
      } else {
        where.readAt = null;
      }
    }

    if (filters.startDate) {
      where.createdAt = { gte: filters.startDate };
    }

    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: filters.endDate };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { message: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const totalItems = await prisma.notification.count({ where });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    // Get paginated data
    const skip = (page - 1) * limit;
    const data = await prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalItems / limit);
    const pagination = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, pagination, unreadCount };
  } catch (error) {
    logger.error(`Get notifications by user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get unread notifications by user ID
 */
export async function getUnreadNotificationsByUser(
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{
  data: NotificationWithUser[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
}> {
  try {
    const where: Prisma.NotificationWhereInput = {
      userId,
      readAt: null,
    };

    const totalItems = await prisma.notification.count({ where });

    const skip = (page - 1) * limit;
    const data = await prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });

    const unreadCount = totalItems;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, pagination, unreadCount };
  } catch (error) {
    logger.error(`Get unread notifications by user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get all notifications (for admin)
 */
export async function getAllNotifications(
  filters: NotificationFilters = {},
  page: number = 1,
  limit: number = 20,
): Promise<{
  data: NotificationWithUser[];
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
    const where: Prisma.NotificationWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isRead !== undefined) {
      if (filters.isRead) {
        where.readAt = { not: null };
      } else {
        where.readAt = null;
      }
    }

    if (filters.startDate) {
      where.createdAt = { gte: filters.startDate };
    }

    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: filters.endDate };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { message: { contains: filters.search, mode: "insensitive" } },
        {
          user: { fullName: { contains: filters.search, mode: "insensitive" } },
        },
      ];
    }

    const totalItems = await prisma.notification.count({ where });

    const skip = (page - 1) * limit;
    const data = await prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalItems / limit);
    const pagination = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, pagination };
  } catch (error) {
    logger.error("Get all notifications failed:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  id: string,
): Promise<Notification> {
  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
        status: "SENT",
      },
    });

    logger.info(`Notification ${id} marked as read`);

    return notification;
  } catch (error) {
    logger.error(`Mark notification ${id} as read failed:`, error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<number> {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    logger.info(
      `Marked ${result.count} notifications as read for user ${userId}`,
    );

    return result.count;
  } catch (error) {
    logger.error(`Mark all notifications as read for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Update notification status
 */
export async function updateNotificationStatus(
  id: string,
  status: NotificationStatus,
  sentAt?: Date,
): Promise<Notification> {
  try {
    const data: any = { status };
    if (sentAt) {
      data.sentAt = sentAt;
    }
    if (status === "SENT") {
      data.sentAt = sentAt || new Date();
    }

    const notification = await prisma.notification.update({
      where: { id },
      data,
    });

    logger.info(`Notification ${id} status updated to ${status}`);

    return notification;
  } catch (error) {
    logger.error(`Update notification status ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<UnreadCount> {
  try {
    const [total, byType] = await Promise.all([
      prisma.notification.count({
        where: {
          userId,
          readAt: null,
        },
      }),
      prisma.notification.groupBy({
        by: ["type"],
        where: {
          userId,
          readAt: null,
        },
        _count: {
          type: true,
        },
      }),
    ]);

    const byTypeResult = {
      EMAIL: 0,
      SMS: 0,
      PUSH: 0,
    };

    byType.forEach((item) => {
      byTypeResult[item.type] = item._count.type;
    });

    return {
      total,
      byType: byTypeResult,
    };
  } catch (error) {
    logger.error(`Get unread count for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string): Promise<Notification> {
  try {
    return await prisma.notification.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Delete notification ${id} failed:`, error);
    throw error;
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotificationsByUser(
  userId: string,
): Promise<number> {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    logger.info(`Deleted ${result.count} notifications for user ${userId}`);

    return result.count;
  } catch (error) {
    logger.error(`Delete all notifications for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Delete old notifications (older than days)
 */
export async function deleteOldNotifications(
  days: number = 30,
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: "SENT",
      },
    });

    logger.info(
      `Deleted ${result.count} old notifications (older than ${days} days)`,
    );

    return result.count;
  } catch (error) {
    logger.error("Delete old notifications failed:", error);
    throw error;
  }
}

/**
 * Check if notification exists
 */
export async function notificationExists(id: string): Promise<boolean> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!notification;
  } catch (error) {
    logger.error(`Check notification exists ${id} failed:`, error);
    return false;
  }
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  try {
    // Check if preferences exist, if not create defaults
    const existing = await prisma.systemSetting.findFirst({
      where: {
        key: `notification_preferences_${userId}`,
      },
    });

    if (!existing) {
      // Create default preferences
      await prisma.systemSetting.create({
        data: {
          key: `notification_preferences_${userId}`,
          value: {
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            bookingUpdates: true,
            promotionalEmails: false,
            providerUpdates: true,
            systemAlerts: true,
          },
          description: `Notification preferences for user ${userId}`,
          isPublic: false,
        },
      });

      return {
        userId,
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        bookingUpdates: true,
        promotionalEmails: false,
        providerUpdates: true,
        systemAlerts: true,
      };
    }

    const value = existing.value as any;

    return {
      userId,
      emailEnabled:
        value.emailEnabled !== undefined ? value.emailEnabled : true,
      smsEnabled: value.smsEnabled !== undefined ? value.smsEnabled : true,
      pushEnabled: value.pushEnabled !== undefined ? value.pushEnabled : true,
      bookingUpdates:
        value.bookingUpdates !== undefined ? value.bookingUpdates : true,
      promotionalEmails:
        value.promotionalEmails !== undefined ? value.promotionalEmails : false,
      providerUpdates:
        value.providerUpdates !== undefined ? value.providerUpdates : true,
      systemAlerts:
        value.systemAlerts !== undefined ? value.systemAlerts : true,
    };
  } catch (error) {
    logger.error(`Get notification preferences for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<Omit<NotificationPreferences, "userId">>,
): Promise<NotificationPreferences> {
  try {
    const existing = await prisma.systemSetting.findFirst({
      where: {
        key: `notification_preferences_${userId}`,
      },
    });

    let updatedPreferences: any = {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      bookingUpdates: true,
      promotionalEmails: false,
      providerUpdates: true,
      systemAlerts: true,
    };

    if (existing) {
      updatedPreferences = {
        ...(existing.value as any),
        ...preferences,
      };
    } else {
      updatedPreferences = {
        ...updatedPreferences,
        ...preferences,
      };
    }

    await prisma.systemSetting.upsert({
      where: {
        key: `notification_preferences_${userId}`,
      },
      update: {
        value: updatedPreferences,
      },
      create: {
        key: `notification_preferences_${userId}`,
        value: updatedPreferences,
        description: `Notification preferences for user ${userId}`,
        isPublic: false,
      },
    });

    logger.info(`Updated notification preferences for user ${userId}`);

    return {
      userId,
      ...updatedPreferences,
    };
  } catch (error) {
    logger.error(
      `Update notification preferences for ${userId} failed:`,
      error,
    );
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createNotification,
  createBulkNotifications,
  findNotificationById,
  getNotificationsByUser,
  getUnreadNotificationsByUser,
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateNotificationStatus,
  getUnreadCount,
  deleteNotification,
  deleteAllNotificationsByUser,
  deleteOldNotifications,
  notificationExists,
  getNotificationPreferences,
  updateNotificationPreferences,
};
