import { eventBus, EVENTS, EventData, on } from "../index";
import logger from "../../utils/logger";
import { sendEmail } from "../../config/email";
import { sendSMS } from "../../services/external/twilio.service";
import {
  createNotification,
  updateNotificationStatus,
  getUnreadCount,
  deleteOldNotifications,
} from "../../repositories/notification.repository";
import { findUserById } from "../../repositories/user.repository";
import { redisService } from "../../services/redis.service";

// ============================================================
// TYPES
// ============================================================

export interface NotificationEventPayload {
  id: string;
  userId: string;
  type: "EMAIL" | "SMS" | "PUSH";
  title: string;
  message: string;
  data?: Record<string, any>;
  status?: string;
  error?: string;
  retryCount?: number;
}

export interface NotificationDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

/**
 * Handle notification sent event
 */
async function handleNotificationSent(data: EventData): Promise<void> {
  try {
    const payload = data.payload as NotificationEventPayload;
    logger.info(`Notification sent: ${payload.id}`, {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
    });

    // Update notification status to SENT
    await updateNotificationStatus(payload.id, "SENT", new Date());

    // Emit analytics event
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "notification_sent",
        notificationId: payload.id,
        userId: payload.userId,
        type: payload.type,
      },
      timestamp: new Date(),
      source: "notification.listener",
    });

    // Update user's unread count cache
    await invalidateUnreadCache(payload.userId);
  } catch (error) {
    logger.error(`Notification sent handler error: ${data.payload?.id}`, error);
  }
}

/**
 * Handle notification read event
 */
async function handleNotificationRead(data: EventData): Promise<void> {
  try {
    const payload = data.payload as NotificationEventPayload;
    logger.debug(`Notification read: ${payload.id}`, {
      userId: payload.userId,
    });

    // Invalidate unread cache
    await invalidateUnreadCache(payload.userId);

    // Emit analytics event
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "notification_read",
        notificationId: payload.id,
        userId: payload.userId,
      },
      timestamp: new Date(),
      source: "notification.listener",
    });
  } catch (error) {
    logger.error(`Notification read handler error: ${data.payload?.id}`, error);
  }
}

/**
 * Handle notification delivered event
 */
async function handleNotificationDelivered(data: EventData): Promise<void> {
  try {
    const payload = data.payload as NotificationEventPayload;
    logger.debug(`Notification delivered: ${payload.id}`, {
      userId: payload.userId,
      type: payload.type,
    });

    // Update notification status to DELIVERED
    await updateNotificationStatus(payload.id, "SENT", new Date());
  } catch (error) {
    logger.error(
      `Notification delivered handler error: ${data.payload?.id}`,
      error,
    );
  }
}

/**
 * Handle notification failed event
 */
async function handleNotificationFailed(data: EventData): Promise<void> {
  try {
    const payload = data.payload as NotificationEventPayload;
    logger.warn(`Notification failed: ${payload.id}`, {
      userId: payload.userId,
      type: payload.type,
      error: payload.error,
      retryCount: payload.retryCount || 0,
    });

    // Update notification status to FAILED
    await updateNotificationStatus(
      payload.id,
      "FAILED",
      undefined,
      payload.error,
    );

    // Retry if retry count is less than max (3)
    const retryCount = (payload.retryCount || 0) + 1;
    if (retryCount <= 3) {
      logger.info(
        `Retrying notification: ${payload.id} (attempt ${retryCount})`,
      );
      await retryNotification(payload.id, retryCount);
    } else {
      logger.error(
        `Notification failed after ${retryCount} attempts: ${payload.id}`,
      );
    }

    // Emit analytics event
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "notification_failed",
        notificationId: payload.id,
        userId: payload.userId,
        type: payload.type,
        error: payload.error,
      },
      timestamp: new Date(),
      source: "notification.listener",
    });
  } catch (error) {
    logger.error(
      `Notification failed handler error: ${data.payload?.id}`,
      error,
    );
  }
}

// ============================================================
// RETRY FUNCTIONS
// ============================================================

/**
 * Retry failed notification
 */
async function retryNotification(
  notificationId: string,
  retryCount: number,
): Promise<void> {
  try {
    // Get notification details
    const { findNotificationById } =
      await import("../../repositories/notification.repository");
    const notification = await findNotificationById(notificationId);

    if (!notification) {
      logger.warn(`Notification not found for retry: ${notificationId}`);
      return;
    }

    const user = await findUserById(notification.userId);
    if (!user) {
      logger.warn(`User not found for retry: ${notification.userId}`);
      return;
    }

    // Resend notification based on type
    let result: NotificationDeliveryResult;

    if (notification.type === "EMAIL") {
      result = await sendEmail({
        to: user.email,
        subject: notification.title,
        html: notification.message,
      });
    } else if (notification.type === "SMS") {
      result = await sendSMS({
        to: user.phone,
        body: `${notification.title}: ${notification.message}`,
      });
    } else {
      // PUSH notification - mark as sent
      result = { success: true };
    }

    if (result.success) {
      await updateNotificationStatus(notificationId, "SENT", new Date());
      logger.info(`Notification retry successful: ${notificationId}`);
    } else {
      // If retry failed, update retry count and keep as FAILED
      await updateNotificationStatus(
        notificationId,
        "FAILED",
        undefined,
        result.error,
      );
      logger.warn(`Notification retry failed: ${notificationId}`, result.error);
    }
  } catch (error) {
    logger.error(`Retry notification error for ${notificationId}:`, error);
  }
}

/**
 * Invalidate unread count cache
 */
async function invalidateUnreadCache(userId: string): Promise<void> {
  try {
    const key = `notifications:unread:${userId}`;
    await redisService.delete(key);
  } catch (error) {
    logger.error(`Invalidate unread cache error for ${userId}:`, error);
  }
}

// ============================================================
// BULK NOTIFICATION HANDLERS
// ============================================================

/**
 * Handle bulk notification sent event
 */
async function handleBulkNotificationSent(data: EventData): Promise<void> {
  try {
    const payload = data.payload as {
      userIds: string[];
      type: string;
      title: string;
      count: number;
      successful: number;
      failed: number;
    };

    logger.info(`Bulk notification sent: ${payload.count} users`, {
      type: payload.type,
      successful: payload.successful,
      failed: payload.failed,
    });

    // Emit analytics event
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "bulk_notification_sent",
        count: payload.count,
        type: payload.type,
        successful: payload.successful,
        failed: payload.failed,
      },
      timestamp: new Date(),
      source: "notification.listener",
    });
  } catch (error) {
    logger.error(`Bulk notification sent handler error:`, error);
  }
}

// ============================================================
// CLEANUP FUNCTIONS
// ============================================================

/**
 * Handle notification cleanup event
 */
async function handleNotificationCleanup(data: EventData): Promise<void> {
  try {
    const payload = data.payload as { days?: number };
    const days = payload.days || 30;

    logger.info(`Cleaning up notifications older than ${days} days`);

    const count = await deleteOldNotifications(days);

    logger.info(`Cleaned up ${count} old notifications`);

    // Emit analytics event
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "notification_cleanup",
        days,
        count,
      },
      timestamp: new Date(),
      source: "notification.listener",
    });
  } catch (error) {
    logger.error(`Notification cleanup handler error:`, error);
  }
}

// ============================================================
// NOTIFICATION PREFERENCE SYNC
// ============================================================

/**
 * Handle notification preference update event
 */
async function handlePreferenceUpdate(data: EventData): Promise<void> {
  try {
    const payload = data.payload as {
      userId: string;
      preferences: Record<string, any>;
    };

    logger.debug(
      `Notification preferences updated for user: ${payload.userId}`,
    );

    // Update cache
    const key = `notifications:preferences:${payload.userId}`;
    await redisService.set(key, payload.preferences, 3600);
  } catch (error) {
    logger.error(`Preference update handler error:`, error);
  }
}

// ============================================================
// LISTENER REGISTRATION
// ============================================================

/**
 * Register all notification event listeners
 */
export function notificationEventListeners(): void {
  logger.info("Registering notification event listeners...");

  // Notification lifecycle events
  on(EVENTS.NOTIFICATION_SENT, handleNotificationSent);
  on(EVENTS.NOTIFICATION_READ, handleNotificationRead);
  on(EVENTS.NOTIFICATION_DELIVERED, handleNotificationDelivered);
  on(EVENTS.NOTIFICATION_FAILED, handleNotificationFailed);

  // Custom notification events
  on("notification.bulk.sent" as any, handleBulkNotificationSent);
  on("notification.cleanup" as any, handleNotificationCleanup);
  on("notification.preference.update" as any, handlePreferenceUpdate);

  logger.info("Notification event listeners registered successfully");
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  notificationEventListeners,
  handleNotificationSent,
  handleNotificationRead,
  handleNotificationDelivered,
  handleNotificationFailed,
  handleBulkNotificationSent,
  handleNotificationCleanup,
  handlePreferenceUpdate,
  retryNotification,
  invalidateUnreadCache,
};
