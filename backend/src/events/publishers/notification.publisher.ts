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
  deliveryAttempts?: number;
}

export interface BulkNotificationEventPayload {
  userIds: string[];
  type: "EMAIL" | "SMS" | "PUSH";
  title: string;
  message: string;
  count: number;
  successful: number;
  failed: number;
  errors?: Array<{ userId: string; error: string }>;
}

export interface NotificationPublisherOptions {
  correlationId?: string;
  source?: string;
  userId?: string;
  timestamp?: Date;
}

export interface NotificationPreferencesPayload {
  userId: string;
  preferences: Record<string, any>;
}

export interface NotificationCleanupPayload {
  days: number;
  count?: number;
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
  public async notificationSent(
    payload: NotificationEventPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.NOTIFICATION_SENT,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.NOTIFICATION_SENT, eventData);
      logger.info(`Notification sent event published: ${payload.id}`, {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
      });

      return result;
    } catch (error) {
      logger.error("Notification sent event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification read event
   */
  public async notificationRead(
    payload: NotificationEventPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.NOTIFICATION_READ,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.NOTIFICATION_READ, eventData);
      logger.debug(`Notification read event published: ${payload.id}`, {
        userId: payload.userId,
      });

      return result;
    } catch (error) {
      logger.error("Notification read event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification delivered event
   */
  public async notificationDelivered(
    payload: NotificationEventPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.NOTIFICATION_DELIVERED,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.NOTIFICATION_DELIVERED, eventData);
      logger.debug(`Notification delivered event published: ${payload.id}`, {
        userId: payload.userId,
        type: payload.type,
      });

      return result;
    } catch (error) {
      logger.error("Notification delivered event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification failed event
   */
  public async notificationFailed(
    payload: NotificationEventPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.NOTIFICATION_FAILED,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.NOTIFICATION_FAILED, eventData);
      logger.warn(`Notification failed event published: ${payload.id}`, {
        userId: payload.userId,
        type: payload.type,
        error: payload.error,
        retryCount: payload.retryCount || 0,
      });

      return result;
    } catch (error) {
      logger.error("Notification failed event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish bulk notification sent event
   */
  public async bulkNotificationSent(
    payload: BulkNotificationEventPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: "notification.bulk.sent" as any,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: options?.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit("notification.bulk.sent" as any, eventData);
      logger.info(
        `Bulk notification sent event published: ${payload.count} users`,
        {
          type: payload.type,
          successful: payload.successful,
          failed: payload.failed,
        },
      );

      return result;
    } catch (error) {
      logger.error("Bulk notification sent event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification cleanup event
   */
  public async notificationCleanup(
    payload: NotificationCleanupPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: "notification.cleanup" as any,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit("notification.cleanup" as any, eventData);
      logger.info(`Notification cleanup event published: ${payload.days} days`);

      return result;
    } catch (error) {
      logger.error("Notification cleanup event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish notification preference update event
   */
  public async preferenceUpdate(
    payload: NotificationPreferencesPayload,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: "notification.preference.update" as any,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(
        "notification.preference.update" as any,
        eventData,
      );
      logger.debug(
        `Notification preference update event published: ${payload.userId}`,
      );

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
   * Publish generic notification event
   */
  public async publishEvent(
    eventType: string,
    payload: any,
    options?: NotificationPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: eventType as any,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: options?.userId || payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(eventType as any, eventData);
      logger.debug(`Notification event published: ${eventType}`);

      return result;
    } catch (error) {
      logger.error(`Notification event ${eventType} publish failed:`, error);
      return false;
    }
  }

  /**
   * Publish notification event asynchronously
   */
  public async publishEventAsync(
    eventType: string,
    payload: any,
    options?: NotificationPublisherOptions,
  ): Promise<void> {
    try {
      const eventData: Partial<EventData> = {
        type: eventType as any,
        payload,
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "notification.publisher",
        userId: options?.userId || payload.userId,
        correlationId: options?.correlationId,
      };

      await eventBus.emitAsync(eventType as any, eventData);
      logger.debug(`Notification event published asynchronously: ${eventType}`);
    } catch (error) {
      logger.error(
        `Async notification event ${eventType} publish failed:`,
        error,
      );
      throw error;
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
