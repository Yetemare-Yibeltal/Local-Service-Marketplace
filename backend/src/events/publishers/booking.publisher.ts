import { eventBus, EVENTS, EventData } from "../index";
import logger from "../../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface BookingEventPayload {
  id: string;
  bookingNumber: string;
  customerId: string;
  providerId: string;
  status: string;
  scheduledDate: Date | string;
  totalPrice: number;
  address: string;
  customerName?: string;
  providerName?: string;
  cancellationReason?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface BookingPublisherOptions {
  correlationId?: string;
  source?: string;
  userId?: string;
}

// ============================================================
// BOOKING PUBLISHER
// ============================================================

/**
 * Booking event publisher class
 */
export class BookingEventPublisher {
  private static instance: BookingEventPublisher;

  public static getInstance(): BookingEventPublisher {
    if (!BookingEventPublisher.instance) {
      BookingEventPublisher.instance = new BookingEventPublisher();
    }
    return BookingEventPublisher.instance;
  }

  /**
   * Publish booking created event
   */
  public async bookingCreated(
    payload: BookingEventPayload,
    options?: BookingPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.BOOKING_CREATED,
        payload,
        timestamp: new Date(),
        source: options?.source || "booking.publisher",
        userId: options?.userId || payload.customerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.BOOKING_CREATED, eventData);
      logger.info(`Booking created event published: ${payload.bookingNumber}`, {
        bookingId: payload.id,
        customerId: payload.customerId,
        providerId: payload.providerId,
      });

      return result;
    } catch (error) {
      logger.error("Booking created event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish booking confirmed event
   */
  public async bookingConfirmed(
    payload: BookingEventPayload,
    options?: BookingPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.BOOKING_CONFIRMED,
        payload,
        timestamp: new Date(),
        source: options?.source || "booking.publisher",
        userId: options?.userId || payload.providerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.BOOKING_CONFIRMED, eventData);
      logger.info(
        `Booking confirmed event published: ${payload.bookingNumber}`,
        {
          bookingId: payload.id,
          providerId: payload.providerId,
        },
      );

      return result;
    } catch (error) {
      logger.error("Booking confirmed event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish booking in progress event
   */
  public async bookingInProgress(
    payload: BookingEventPayload,
    options?: BookingPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.BOOKING_IN_PROGRESS,
        payload,
        timestamp: new Date(),
        source: options?.source || "booking.publisher",
        userId: options?.userId || payload.providerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.BOOKING_IN_PROGRESS, eventData);
      logger.info(
        `Booking in progress event published: ${payload.bookingNumber}`,
        {
          bookingId: payload.id,
          providerId: payload.providerId,
        },
      );

      return result;
    } catch (error) {
      logger.error("Booking in progress event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish booking completed event
   */
  public async bookingCompleted(
    payload: BookingEventPayload,
    options?: BookingPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.BOOKING_COMPLETED,
        payload,
        timestamp: new Date(),
        source: options?.source || "booking.publisher",
        userId: options?.userId || payload.customerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.BOOKING_COMPLETED, eventData);
      logger.info(
        `Booking completed event published: ${payload.bookingNumber}`,
        {
          bookingId: payload.id,
          customerId: payload.customerId,
          providerId: payload.providerId,
        },
      );

      return result;
    } catch (error) {
      logger.error("Booking completed event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish booking cancelled event
   */
  public async bookingCancelled(
    payload: BookingEventPayload,
    options?: BookingPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.BOOKING_CANCELLED,
        payload,
        timestamp: new Date(),
        source: options?.source || "booking.publisher",
        userId: options?.userId || payload.customerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.BOOKING_CANCELLED, eventData);
      logger.info(
        `Booking cancelled event published: ${payload.bookingNumber}`,
        {
          bookingId: payload.id,
          customerId: payload.customerId,
          providerId: payload.providerId,
          reason: payload.cancellationReason,
        },
      );

      return result;
    } catch (error) {
      logger.error("Booking cancelled event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish booking disputed event
   */
  public async bookingDisputed(
    payload: BookingEventPayload,
    options?: BookingPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.BOOKING_DISPUTED,
        payload,
        timestamp: new Date(),
        source: options?.source || "booking.publisher",
        userId: options?.userId || payload.customerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.BOOKING_DISPUTED, eventData);
      logger.warn(
        `Booking disputed event published: ${payload.bookingNumber}`,
        {
          bookingId: payload.id,
          customerId: payload.customerId,
          providerId: payload.providerId,
        },
      );

      return result;
    } catch (error) {
      logger.error("Booking disputed event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish booking updated event
   */
  public async bookingUpdated(
    payload: BookingEventPayload,
    options?: BookingPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: EVENTS.BOOKING_UPDATED,
        payload,
        timestamp: new Date(),
        source: options?.source || "booking.publisher",
        userId: options?.userId || payload.customerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(EVENTS.BOOKING_UPDATED, eventData);
      logger.debug(
        `Booking updated event published: ${payload.bookingNumber}`,
        {
          bookingId: payload.id,
          status: payload.status,
        },
      );

      return result;
    } catch (error) {
      logger.error("Booking updated event publish failed:", error);
      return false;
    }
  }

  /**
   * Publish generic booking event
   */
  public async publishEvent(
    eventType: string,
    payload: BookingEventPayload,
    options?: BookingPublisherOptions,
  ): Promise<boolean> {
    try {
      const eventData: Partial<EventData> = {
        type: eventType as any,
        payload,
        timestamp: new Date(),
        source: options?.source || "booking.publisher",
        userId: options?.userId || payload.customerId,
        correlationId: options?.correlationId,
      };

      const result = eventBus.emit(eventType as any, eventData);
      logger.debug(`Booking event published: ${eventType}`, {
        bookingId: payload.id,
        bookingNumber: payload.bookingNumber,
      });

      return result;
    } catch (error) {
      logger.error(`Booking event ${eventType} publish failed:`, error);
      return false;
    }
  }

  /**
   * Publish booking event asynchronously
   */
  public async publishEventAsync(
    eventType: string,
    payload: BookingEventPayload,
    options?: BookingPublisherOptions,
  ): Promise<void> {
    try {
      const eventData: Partial<EventData> = {
        type: eventType as any,
        payload,
        timestamp: new Date(),
        source: options?.source || "booking.publisher",
        userId: options?.userId || payload.customerId,
        correlationId: options?.correlationId,
      };

      await eventBus.emitAsync(eventType as any, eventData);
      logger.debug(`Booking event published asynchronously: ${eventType}`, {
        bookingId: payload.id,
        bookingNumber: payload.bookingNumber,
      });
    } catch (error) {
      logger.error(`Booking event ${eventType} async publish failed:`, error);
      throw error;
    }
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create booking event payload from booking data
 */
export function createBookingPayload(
  booking: any,
  additionalData?: Partial<BookingEventPayload>,
): BookingEventPayload {
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    customerId: booking.customerId,
    providerId: booking.providerId,
    status: booking.status,
    scheduledDate: booking.scheduledDate,
    totalPrice: booking.totalPrice,
    address: booking.address,
    customerName: booking.customer?.fullName,
    providerName: booking.provider?.businessName,
    notes: booking.specialNotes,
    metadata: {
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      ...additionalData?.metadata,
    },
    ...additionalData,
  };
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const bookingEventPublisher = BookingEventPublisher.getInstance();

// ============================================================
// EXPORTS
// ============================================================

export default {
  BookingEventPublisher,
  bookingEventPublisher,
  createBookingPayload,
};
