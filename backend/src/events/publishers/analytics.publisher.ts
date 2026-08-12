import { eventBus, EVENTS, EventData } from "../index";
import logger from "../../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface AnalyticsEventPayload {
  eventType: string;
  userId?: string;
  providerId?: string;
  bookingId?: string;
  amount?: number;
  category?: string;
  rating?: number;
  status?: string;
  metadata?: Record<string, any>;
  timestamp?: Date | string;
}

export interface UserActivityPayload {
  userId: string;
  action: string;
  page?: string;
  duration?: number;
  device?: string;
  platform?: string;
  metadata?: Record<string, any>;
}

export interface RevenueEventPayload {
  amount: number;
  currency?: string;
  source: "booking" | "payment" | "refund";
  bookingId?: string;
  providerId?: string;
  customerId?: string;
  fee?: number;
  metadata?: Record<string, any>;
}

export interface ProviderPerformancePayload {
  providerId: string;
  action: "booking" | "completion" | "cancellation" | "rating" | "response";
  value?: number;
  bookingId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsPublisherOptions {
  correlationId?: string;
  source?: string;
  timestamp?: Date;
}

// ============================================================
// ANALYTICS PUBLISHER
// ============================================================

/**
 * Analytics event publisher class
 */
export class AnalyticsEventPublisher {
  private static instance: AnalyticsEventPublisher;

  public static getInstance(): AnalyticsEventPublisher {
    if (!AnalyticsEventPublisher.instance) {
      AnalyticsEventPublisher.instance = new AnalyticsEventPublisher();
    }
    return AnalyticsEventPublisher.instance;
  }

  /**
   * Publish a generic analytics event
   */
  public async track(
    eventType: string,
    payload: AnalyticsEventPayload,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          ...payload,
          eventType,
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.debug(`Analytics event tracked: ${eventType}`, {
        userId: payload.userId,
        eventType,
      });

      return result;
    } catch (error) {
      logger.error(`Analytics event ${eventType} publish failed:`, error);
      return false;
    }
  }

  /**
   * Publish user activity event
   */
  public async trackUserActivity(
    payload: UserActivityPayload,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          eventType: "user.activity",
          userId: payload.userId,
          metadata: {
            action: payload.action,
            page: payload.page,
            duration: payload.duration,
            device: payload.device,
            platform: payload.platform,
            ...payload.metadata,
          },
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.debug(
        `User activity tracked: ${payload.userId} - ${payload.action}`,
      );

      return result;
    } catch (error) {
      logger.error("User activity event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish revenue event
   */
  public async trackRevenue(
    payload: RevenueEventPayload,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          eventType: "analytics.revenue",
          userId: payload.customerId,
          providerId: payload.providerId,
          bookingId: payload.bookingId,
          amount: payload.amount,
          metadata: {
            source: payload.source,
            currency: payload.currency || "ETB",
            fee: payload.fee,
            ...payload.metadata,
          },
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId: payload.customerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.info(
        `Revenue tracked: ETB ${payload.amount} from ${payload.source}`,
        {
          bookingId: payload.bookingId,
          providerId: payload.providerId,
        },
      );

      return result;
    } catch (error) {
      logger.error("Revenue event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish provider performance event
   */
  public async trackProviderPerformance(
    payload: ProviderPerformancePayload,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          eventType: "analytics.provider.performance",
          providerId: payload.providerId,
          userId: payload.customerId,
          bookingId: payload.bookingId,
          metadata: {
            action: payload.action,
            value: payload.value,
            ...payload.metadata,
          },
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId: payload.providerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.debug(
        `Provider performance tracked: ${payload.providerId} - ${payload.action}`,
      );

      return result;
    } catch (error) {
      logger.error("Provider performance event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish booking analytics event
   */
  public async trackBooking(
    bookingId: string,
    status: string,
    amount: number,
    customerId: string,
    providerId: string,
    metadata?: Record<string, any>,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          eventType: "analytics.booking",
          bookingId,
          userId: customerId,
          providerId,
          amount,
          status,
          metadata: {
            ...metadata,
            bookingStatus: status,
          },
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId: customerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.debug(`Booking analytics tracked: ${bookingId} - ${status}`);

      return result;
    } catch (error) {
      logger.error("Booking analytics event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish review analytics event
   */
  public async trackReview(
    reviewId: string,
    providerId: string,
    reviewerId: string,
    rating: number,
    bookingId?: string,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          eventType: "analytics.review",
          userId: reviewerId,
          providerId,
          bookingId,
          rating,
          metadata: {
            reviewId,
            bookingId,
          },
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId: reviewerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.debug(`Review analytics tracked: ${reviewId} - ${rating} stars`);

      return result;
    } catch (error) {
      logger.error("Review analytics event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish payment analytics event
   */
  public async trackPayment(
    paymentId: string,
    amount: number,
    status: string,
    bookingId: string,
    customerId: string,
    providerId: string,
    method?: string,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          eventType: "analytics.payment",
          userId: customerId,
          providerId,
          bookingId,
          amount,
          status,
          metadata: {
            paymentId,
            method: method || "unknown",
            paymentStatus: status,
          },
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId: customerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.info(
        `Payment analytics tracked: ${paymentId} - ${status} (ETB ${amount})`,
      );

      return result;
    } catch (error) {
      logger.error("Payment analytics event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish user registration analytics event
   */
  public async trackUserRegistration(
    userId: string,
    email: string,
    role: string,
    fullName: string,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          eventType: "analytics.user.registered",
          userId,
          metadata: {
            email,
            role,
            fullName,
            registrationDate: new Date().toISOString(),
          },
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.info(`User registration tracked: ${userId} - ${role}`);

      return result;
    } catch (error) {
      logger.error("User registration analytics event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish provider registration analytics event
   */
  public async trackProviderRegistration(
    providerId: string,
    userId: string,
    businessName: string,
    category: string,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          eventType: "analytics.provider.registered",
          userId,
          providerId,
          metadata: {
            businessName,
            category,
            registrationDate: new Date().toISOString(),
          },
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.info(
        `Provider registration tracked: ${providerId} - ${businessName}`,
      );

      return result;
    } catch (error) {
      logger.error(
        "Provider registration analytics event publish failed:",
        error,
      );
      return false;
    }
  }

  /**
   * Publish custom event
   */
  public async trackCustom(
    eventName: string,
    data: Record<string, any>,
    userId?: string,
    options?: AnalyticsPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          eventType: eventName,
          userId,
          metadata: data,
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.ANALYTICS_TRACK, eventData);
      logger.debug(`Custom analytics event tracked: ${eventName}`);

      return result;
    } catch (error) {
      logger.error(
        `Custom analytics event ${eventName} publish failed:`,
        error,
      );
      return false;
    }
  }

  /**
   * Publish analytics event asynchronously
   */
  public async trackAsync(
    eventType: string,
    payload: AnalyticsEventPayload,
    options?: AnalyticsPublisherOptions,
  ): Promise<void> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.ANALYTICS_TRACK,
        payload: {
          ...payload,
          eventType,
          timestamp: options?.timestamp || new Date(),
        },
        timestamp: options?.timestamp || new Date(),
        source: options?.source || "analytics.publisher",
        userId: payload.userId,
        correlationId: options?.correlationId,
      };

      await eventBus.emitAsync(EVENTS.ANALYTICS_TRACK, eventData);
      logger.debug(`Analytics event tracked asynchronously: ${eventType}`);
    } catch (error) {
      logger.error(`Async analytics event ${eventType} publish failed:`, error);
      throw error;
    }
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const analyticsEventPublisher = AnalyticsEventPublisher.getInstance();

// ============================================================
// EXPORTS
// ============================================================

export default {
  AnalyticsEventPublisher,
  analyticsEventPublisher,
};
