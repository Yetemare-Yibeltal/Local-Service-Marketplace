// ============================================================
// PUBLISHERS INDEX
// Central export point for all event publisher modules
// ============================================================

// Import publisher instances
import {
  bookingEventPublisher,
  BookingEventPublisher,
  createBookingPayload,
} from "./booking.publisher";
import {
  notificationEventPublisher,
  NotificationEventPublisher,
} from "./notification.publisher";
import {
  analyticsEventPublisher,
  AnalyticsEventPublisher,
} from "./analytics.publisher";

// Export booking publisher
export {
  bookingEventPublisher,
  BookingEventPublisher,
  createBookingPayload,
} from "./booking.publisher";

// Export notification publisher
export {
  notificationEventPublisher,
  NotificationEventPublisher,
} from "./notification.publisher";

export type {
  NotificationEventPayload,
  NotificationPublisherOptions,
} from "./notification.publisher";

// Export analytics publisher
export {
  analyticsEventPublisher,
  AnalyticsEventPublisher,
} from "./analytics.publisher";

export type {
  AnalyticsEventPayload,
  UserActivityPayload,
  RevenueEventPayload,
  ProviderPerformancePayload,
  AnalyticsPublisherOptions,
} from "./analytics.publisher";

// Export booking event types
export type {
  BookingEventPayload,
  BookingPublisherOptions,
} from "./booking.publisher";

// ============================================================
// ALL PUBLISHERS AGGREGATED
// ============================================================

/**
 * All publishers instance
 */
export const publishers = {
  booking: bookingEventPublisher,
  notification: notificationEventPublisher,
  analytics: analyticsEventPublisher,
};

/**
 * Publisher classes (for testing and extension)
 */
export const PublisherClasses = {
  BookingEventPublisher,
  NotificationEventPublisher,
  AnalyticsEventPublisher,
};

// ============================================================
// HELPER FUNCTION - PUBLISH EVENT TO ALL PUBLISHERS
// ============================================================

/**
 * Publish an event to all publishers (broadcast)
 */
export async function broadcastEvent(
  eventType: string,
  payload: any,
  options?: { correlationId?: string; source?: string; userId?: string },
): Promise<boolean[]> {
  const results: boolean[] = [];

  // Publish to booking publisher if event is booking-related
  if (eventType.startsWith("booking.")) {
    const result = await bookingEventPublisher.publishEvent(
      eventType,
      payload,
      options,
    );
    results.push(result);
  }

  // Publish to notification publisher if event is notification-related
  if (eventType.startsWith("notification.")) {
    const result = await notificationEventPublisher.publish(
      eventType,
      payload,
      options,
    );
    results.push(result);
  }

  // Publish to analytics publisher (always)
  const result = await analyticsEventPublisher.track(
    eventType,
    payload,
    options,
  );
  results.push(result);

  return results;
}

// ============================================================
// PUBLISHER STATUS
// ============================================================

export interface PublisherStatus {
  name: string;
  available: boolean;
  methods: string[];
}

/**
 * Get status of all publishers
 */
export function getPublishersStatus(): PublisherStatus[] {
  return [
    {
      name: "Booking Publisher",
      available: true,
      methods: [
        "bookingCreated",
        "bookingConfirmed",
        "bookingInProgress",
        "bookingCompleted",
        "bookingCancelled",
        "bookingDisputed",
        "bookingUpdated",
        "publishEvent",
        "publishEventAsync",
      ],
    },
    {
      name: "Notification Publisher",
      available: true,
      methods: [
        "publish",
        "publishBulk",
        "publishAsync",
        "publishRead",
        "publishDelivered",
        "publishFailed",
      ],
    },
    {
      name: "Analytics Publisher",
      available: true,
      methods: [
        "track",
        "trackUserActivity",
        "trackRevenue",
        "trackProviderPerformance",
        "trackBooking",
        "trackReview",
        "trackPayment",
        "trackUserRegistration",
        "trackProviderRegistration",
        "trackCustom",
        "trackAsync",
      ],
    },
  ];
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Publishers
  bookingEventPublisher,
  notificationEventPublisher,
  analyticsEventPublisher,
  publishers,

  // Classes
  PublisherClasses,

  // Helpers
  broadcastEvent,
  getPublishersStatus,

  // Re-export types
  BookingEventPayload,
  BookingPublisherOptions,
  NotificationEventPayload,
  NotificationPublisherOptions,
  AnalyticsEventPayload,
  UserActivityPayload,
  RevenueEventPayload,
  ProviderPerformancePayload,
  AnalyticsPublisherOptions,
};
