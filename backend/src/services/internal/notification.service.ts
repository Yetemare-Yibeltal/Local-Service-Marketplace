import {
  Notification,
  NotificationStatus,
  NotificationType,
} from "@prisma/client";
import {
  createNotification as createNotificationRepo,
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
  NotificationCreateData,
  NotificationWithUser,
  NotificationPreferences,
  UnreadCount,
} from "../../repositories/notification.repository";
import { findUserById } from "../../repositories/user.repository";
import { sendEmail } from "../../config/email";
import { sendSMS } from "../../config/twilio";
import logger from "../../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface SendNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export interface SendBulkNotificationData {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export interface SendEmailNotificationData {
  userId: string;
  to: string;
  subject: string;
  html: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

// ============================================================
// NOTIFICATION SERVICE
// ============================================================

/**
 * Send a notification to a single user
 */
export async function sendNotification(
  data: SendNotificationData,
): Promise<Notification> {
  try {
    // Validate user exists
    const user = await findUserById(data.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user preferences
    const preferences = await getNotificationPreferences(data.userId);

    // Check if user has enabled this notification type
    let shouldSend = true;

    if (data.type === "EMAIL" && !preferences.emailEnabled) {
      shouldSend = false;
    } else if (data.type === "SMS" && !preferences.smsEnabled) {
      shouldSend = false;
    } else if (data.type === "PUSH" && !preferences.pushEnabled) {
      shouldSend = false;
    }

    if (!shouldSend) {
      logger.debug(
        `Notification suppressed: ${data.type} disabled for user ${data.userId}`,
      );
      // Still create notification in database but mark as sent
      const notification = await createNotificationRepo({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        status: "SENT",
      });

      return notification;
    }

    // Create notification in database
    const notification = await createNotificationRepo({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      status: "PENDING",
    });

    // Send via appropriate channel
    try {
      if (data.type === "EMAIL") {
        await sendEmail({
          to: user.email,
          subject: data.title,
          html: `
            <h2>${data.title}</h2>
            <p>${data.message}</p>
            ${data.data ? `<p><pre>${JSON.stringify(data.data, null, 2)}</pre></p>` : ""}
          `,
        });

        await updateNotificationStatus(notification.id, "SENT");
      } else if (data.type === "SMS") {
        await sendSMS({
          to: user.phone,
          body: `${data.title}: ${data.message}`,
        });

        await updateNotificationStatus(notification.id, "SENT");
      } else {
        // Push notification - mark as sent immediately
        await updateNotificationStatus(notification.id, "SENT");
      }

      logger.info(`Notification sent to user ${data.userId}: ${data.title}`);
    } catch (error) {
      logger.error(`Failed to send notification ${notification.id}:`, error);
      await updateNotificationStatus(notification.id, "FAILED");
      throw error;
    }

    return notification;
  } catch (error) {
    logger.error("Send notification failed:", error);
    throw error;
  }
}

/**
 * Send notifications to multiple users (bulk)
 */
export async function sendBulkNotifications(
  data: SendBulkNotificationData,
): Promise<Notification[]> {
  try {
    if (!data.userIds || data.userIds.length === 0) {
      throw new Error("At least one user ID is required");
    }

    // Validate all users exist
    const users = await Promise.all(
      data.userIds.map((userId) => findUserById(userId)),
    );

    const missingUsers = data.userIds.filter((_, index) => !users[index]);
    if (missingUsers.length > 0) {
      throw new Error(`Users not found: ${missingUsers.join(", ")}`);
    }

    // Get all user preferences
    const preferences = await Promise.all(
      data.userIds.map((userId) => getNotificationPreferences(userId)),
    );

    // Filter users based on preferences
    const validUsers: { userId: string; email: string; phone: string }[] = [];

    data.userIds.forEach((userId, index) => {
      const pref = preferences[index];
      let shouldSend = true;

      if (data.type === "EMAIL" && !pref.emailEnabled) {
        shouldSend = false;
      } else if (data.type === "SMS" && !pref.smsEnabled) {
        shouldSend = false;
      } else if (data.type === "PUSH" && !pref.pushEnabled) {
        shouldSend = false;
      }

      if (shouldSend && users[index]) {
        validUsers.push({
          userId,
          email: users[index]!.email,
          phone: users[index]!.phone,
        });
      }
    });

    if (validUsers.length === 0) {
      logger.info("No users with enabled notifications for bulk send");
      return [];
    }

    // Create notifications in database
    const notificationData = validUsers.map((user) => ({
      userId: user.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      status: "PENDING" as NotificationStatus,
    }));

    const notifications = await createBulkNotifications(notificationData);

    // Send notifications via appropriate channel
    if (data.type === "EMAIL") {
      await Promise.all(
        notifications.map((notification, index) => {
          const user = validUsers[index];
          return sendEmail({
            to: user.email,
            subject: data.title,
            html: `
              <h2>${data.title}</h2>
              <p>${data.message}</p>
            `,
          })
            .then(() => updateNotificationStatus(notification.id, "SENT"))
            .catch((error) => {
              logger.error(
                `Failed to send bulk email to ${user.email}:`,
                error,
              );
              return updateNotificationStatus(notification.id, "FAILED");
            });
        }),
      );
    } else if (data.type === "SMS") {
      await Promise.all(
        notifications.map((notification, index) => {
          const user = validUsers[index];
          return sendSMS({
            to: user.phone,
            body: `${data.title}: ${data.message}`,
          })
            .then(() => updateNotificationStatus(notification.id, "SENT"))
            .catch((error) => {
              logger.error(`Failed to send bulk SMS to ${user.phone}:`, error);
              return updateNotificationStatus(notification.id, "FAILED");
            });
        }),
      );
    } else {
      // Push notifications - mark all as sent
      await Promise.all(
        notifications.map((notification) =>
          updateNotificationStatus(notification.id, "SENT"),
        ),
      );
    }

    logger.info(`Bulk notifications sent to ${notifications.length} users`);

    return notifications;
  } catch (error) {
    logger.error("Send bulk notifications failed:", error);
    throw error;
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(
  id: string,
): Promise<NotificationWithUser | null> {
  try {
    return await findNotificationById(id);
  } catch (error) {
    logger.error(`Get notification ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  filters: {
    type?: NotificationType;
    status?: NotificationStatus;
    isRead?: boolean;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  } = {},
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
    return await getNotificationsByUser(userId, filters, page, limit);
  } catch (error) {
    logger.error(`Get user notifications for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUserUnreadNotifications(
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
    return await getUnreadNotificationsByUser(userId, page, limit);
  } catch (error) {
    logger.error(`Get unread notifications for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(id: string): Promise<Notification> {
  try {
    const existing = await findNotificationById(id);
    if (!existing) {
      throw new Error("Notification not found");
    }

    if (existing.readAt) {
      return existing;
    }

    const notification = await markNotificationAsRead(id);

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
export async function markAllNotificationsRead(
  userId: string,
): Promise<number> {
  try {
    const count = await markAllNotificationsAsRead(userId);

    logger.info(`Marked ${count} notifications as read for user ${userId}`);

    return count;
  } catch (error) {
    logger.error(`Mark all notifications as read for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Get unread count for a user
 */
export async function getUnreadCountService(
  userId: string,
): Promise<UnreadCount> {
  try {
    return await getUnreadCount(userId);
  } catch (error) {
    logger.error(`Get unread count for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotificationById(
  id: string,
): Promise<Notification> {
  try {
    const existing = await findNotificationById(id);
    if (!existing) {
      throw new Error("Notification not found");
    }

    const notification = await deleteNotification(id);

    logger.info(`Notification ${id} deleted`);

    return notification;
  } catch (error) {
    logger.error(`Delete notification ${id} failed:`, error);
    throw error;
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllUserNotifications(
  userId: string,
): Promise<number> {
  try {
    const count = await deleteAllNotificationsByUser(userId);

    logger.info(`Deleted ${count} notifications for user ${userId}`);

    return count;
  } catch (error) {
    logger.error(`Delete all notifications for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Cleanup old notifications
 */
export async function cleanupOldNotifications(
  days: number = 30,
): Promise<number> {
  try {
    const count = await deleteOldNotifications(days);

    logger.info(`Cleaned up ${count} notifications older than ${days} days`);

    return count;
  } catch (error) {
    logger.error("Cleanup old notifications failed:", error);
    throw error;
  }
}

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  try {
    return await getNotificationPreferences(userId);
  } catch (error) {
    logger.error(`Get notification preferences for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Update user notification preferences
 */
export async function updateUserNotificationPreferences(
  userId: string,
  preferences: Partial<Omit<NotificationPreferences, "userId">>,
): Promise<NotificationPreferences> {
  try {
    return await updateNotificationPreferences(userId, preferences);
  } catch (error) {
    logger.error(
      `Update notification preferences for ${userId} failed:`,
      error,
    );
    throw error;
  }
}

/**
 * Send email notification with full email template
 */
export async function sendEmailNotification(
  data: SendEmailNotificationData,
): Promise<Notification> {
  try {
    const user = await findUserById(data.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Send email
    await sendEmail({
      to: data.to,
      subject: data.subject,
      html: data.html,
    });

    // Create notification record
    const notification = await createNotificationRepo({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      status: "SENT",
    });

    logger.info(`Email notification sent to user ${data.userId}`);

    return notification;
  } catch (error) {
    logger.error("Send email notification failed:", error);
    throw error;
  }
}

/**
 * Check if notification exists
 */
export async function checkNotificationExists(id: string): Promise<boolean> {
  return await notificationExists(id);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  sendNotification,
  sendBulkNotifications,
  getNotificationById,
  getUserNotifications,
  getUserUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCountService,
  deleteNotificationById,
  deleteAllUserNotifications,
  cleanupOldNotifications,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  sendEmailNotification,
  checkNotificationExists,
};
