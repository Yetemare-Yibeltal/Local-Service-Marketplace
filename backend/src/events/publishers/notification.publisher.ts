import { eventBus, EVENTS, EventData } from "../index";
import logger from "../../utils/logger";

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
  deliveredAt?: Date;
  readAt?: Date;
}

export interface NotificationPublisherOptions {
  correlationId?: string;
  source?: string;
  userId?: string;
  timestamp?: Date;
}

export interface BulkNotificationPayload {
  userIds: string[];
  type: "EMAIL" | "SMS" | "PUSH";
  title: string;
  message: string;
  data?: Record<string, any>;
  count: number;
  successful: number;
  failed: number;
  errors?: Array<{ userId: string; error: string }>;
}

// ============================================================
// NOTIFICATION PUBLISHER
// ============================================================

/**
 * Notification event publisher class
 */
export class NotificationEventPublisher {
  private static instance: NotificationEventPublisher;

  public static getInstance(): NotificationEventPublisher {
    if (!NotificationEventPublisher.instance) {
      NotificationEventPublisher.instance = new NotificationEventPublisher();
    }
    return NotificationEventPublisher.instance;
  }

  /**
   * Publish notification sent event
   */
  public async publish(
    payload: NotificationEventPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.NOTIFICATION_SENT,
        payload: {
          ...payload,
          status: "SENT",
          sentAt: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.NOTIFICATION_SENT, eventData);
      logger.debug(`Notification sent event published: ${payload.id}`, {
        userId: payload.userId,
        type: payload.type,
      });

      return result;
    } catch (error) {
      logger.error("Notification sent event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish bulk notification event
   */
  public async publishBulk(
    payload: BulkNotificationPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: "notification.bulk.sent" as any,
        payload: {
          ...payload,
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit("notification.bulk.sent" as any, eventData);
      logger.info(`Bulk notification event published: ${payload.count} users`, {
        type: payload.type,
        successful: payload.successful,
        failed: payload.failed,
      });

      return result;
    } catch (error) {
      logger.error("Bulk notification event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification read event
   */
  public async publishRead(
    notificationId: string,
    userId: string,
    readAt?: Date,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const payload: NotificationEventPayload = {
        id: notificationId,
        userId,
        type: "PUSH",
        title: "",
        message: "",
        readAt: readAt || new Date(),
      };

      const eventData: Partial<EventData> = {
        type: EVENTS.NOTIFICATION_READ,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.NOTIFICATION_READ, eventData);
      logger.debug(`Notification read event published: ${notificationId}`);

      return result;
    } catch (error) {
      logger.error("Notification read event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification delivered event
   */
  public async publishDelivered(
    notificationId: string,
    userId: string,
    deliveredAt?: Date,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const payload: NotificationEventPayload = {
        id: notificationId,
        userId,
        type: "PUSH",
        title: "",
        message: "",
        deliveredAt: deliveredAt || new Date(),
      };

      const eventData: Partial<EventData> = {
        type: EVENTS.NOTIFICATION_DELIVERED,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.NOTIFICATION_DELIVERED, eventData);
      logger.debug(`Notification delivered event published: ${notificationId}`);

      return result;
    } catch (error) {
      logger.error("Notification delivered event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification failed event
   */
  public async publishFailed(
    notificationId: string,
    userId: string,
    error: string,
    retryCount: number = 0,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const payload: NotificationEventPayload = {
        id: notificationId,
        userId,
        type: "PUSH",
        title: "",
        message: "",
        error,
        retryCount,
        status: "FAILED",
      };

      const eventData: Partial<EventData> = {
        type: EVENTS.NOTIFICATION_FAILED,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.NOTIFICATION_FAILED, eventData);
      logger.warn(`Notification failed event published: ${notificationId}`, {
        error,
        retryCount,
      });

      return result;
    } catch (error) {
      logger.error("Notification failed event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification cleanup event
   */
  public async publishCleanup(
    days: number = 30,
    count?: number,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: "notification.cleanup" as any,
        payload: {
          days,
          count: count || 0,
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit("notification.cleanup" as any, eventData);
      logger.info(`Notification cleanup event published: ${days} days`);

      return result;
    } catch (error) {
      logger.error("Notification cleanup event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification preference update event
   */
  public async publishPreferenceUpdate(
    userId: string,
    preferences: Record<string, any>,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: "notification.preference.update" as any,
        payload: {
          userId,
          preferences,
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(
        "notification.preference.update" as any,
        eventData,
      );
      logger.debug(`Notification preference update event published: ${userId}`);

      return result;
    } catch (error) {
      logger.error(
        "Notification preference update event publish failed:",
        error,
      );
      return false;
    }
  }

  /**
   * Publish notification event asynchronously
   */
  public async publishAsync(
    payload: NotificationEventPayload,
    options?: NotificationPublisherOptions,
  ): Promise<void> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.NOTIFICATION_SENT,
        payload: {
          ...payload,
          status: "SENT",
          sentAt: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      await eventBus.emitAsync(EVENTS.NOTIFICATION_SENT, eventData);
      logger.debug(
        `Notification event published asynchronously: ${payload.id}`,
      );
    } catch (error) {
      logger.error(`Async notification event publish failed:`, error);
      throw error;
    }
  }

  /**
   * Publish generic notification event
   */
  public async publishEvent(
    eventType: string,
    payload: NotificationEventPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: eventType as any,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(eventType as any, eventData);
      logger.debug(`Notification event published: ${eventType}`, {
        notificationId: payload.id,
        userId: payload.userId,
      });

      return result;
    } catch (error) {
      logger.error(`Notification event ${eventType} publish failed:`, error);
      return false;
    }
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const notificationEventPublisher =
  NotificationEventPublisher.getInstance();

// ============================================================
// EXPORTS
// ============================================================

export default {
  NotificationEventPublisher,
  notificationEventPublisher,
};
