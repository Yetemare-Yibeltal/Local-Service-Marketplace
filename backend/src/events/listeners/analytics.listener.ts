import { eventBus, EVENTS, EventData, on } from "../index";
import logger from "../../utils/logger";
import { createAuditLog } from "../../services/internal/admin.service";

// ============================================================
// TYPES
// ============================================================

export interface AnalyticsEventData {
  eventType: string;
  userId?: string;
  providerId?: string;
  bookingId?: string;
  amount?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// ============================================================
// ANALYTICS TRACKING FUNCTIONS
// ============================================================

/**
 * Track a generic analytics event
 */
async function trackAnalyticsEvent(data: EventData): Promise<void> {
  try {
    const { type, payload, timestamp, userId } = data;

    // Extract relevant data for analytics
    const analyticsData: AnalyticsEventData = {
      eventType: type,
      userId: userId || payload?.userId || payload?.customerId,
      providerId: payload?.providerId,
      bookingId: payload?.bookingId || payload?.id,
      amount: payload?.totalPrice || payload?.amount,
      metadata: {
        ...payload,
        source: data.source || "system",
        correlationId: data.correlationId,
      },
      timestamp: timestamp || new Date(),
    };

    // In a real implementation, this would send to an analytics service
    // like Segment, Mixpanel, or a custom analytics database
    // For now, we log and store in audit system

    // Log for debugging
    logger.debug(`Analytics event tracked: ${type}`, analyticsData);

    // Store in audit log for analytics
    await createAuditLog({
      userId: analyticsData.userId,
      action: `ANALYTICS_${type.toUpperCase()}`,
      entity: "Analytics",
      changes: {
        eventType: type,
        analyticsData,
      },
    });

    // Track daily metrics
    await trackDailyMetrics(type, analyticsData);
  } catch (error) {
    logger.error("Failed to track analytics event:", error);
    // Don't throw - analytics should not break the main flow
  }
}

/**
 * Track daily metrics aggregation
 */
async function trackDailyMetrics(
  eventType: string,
  data: AnalyticsEventData,
): Promise<void> {
  try {
    // In production, this would update daily aggregations in Redis or a database
    // For now, we log the metric
    const date = new Date().toISOString().split("T")[0];
    const key = `metrics:${date}:${eventType}`;

    logger.debug(`Daily metric update: ${key}`, {
      date,
      eventType,
      userId: data.userId,
      amount: data.amount,
    });

    // Track revenue for revenue analytics
    if (data.amount && eventType.includes("payment")) {
      await trackRevenueMetrics(date, data.amount);
    }

    // Track user activity
    if (data.userId) {
      await trackUserActivity(date, data.userId, eventType);
    }
  } catch (error) {
    logger.error("Failed to track daily metrics:", error);
  }
}

/**
 * Track revenue metrics
 */
async function trackRevenueMetrics(
  date: string,
  amount: number,
): Promise<void> {
  // In production, this would update daily revenue in Redis
  logger.debug(`Revenue tracked for ${date}: ETB ${amount}`);
}

/**
 * Track user activity
 */
async function trackUserActivity(
  date: string,
  userId: string,
  eventType: string,
): Promise<void> {
  // In production, this would update user activity log
  logger.debug(`User activity tracked: ${userId} - ${eventType} on ${date}`);
}

// ============================================================
// EVENT HANDLERS
// ============================================================

/**
 * Handle booking events for analytics
 */
function handleBookingEvent(data: EventData): void {
  const { type, payload } = data;

  // Track booking status changes
  const statusMap: Record<string, string> = {
    "booking.created": "created",
    "booking.confirmed": "confirmed",
    "booking.in_progress": "in_progress",
    "booking.completed": "completed",
    "booking.cancelled": "cancelled",
    "booking.disputed": "disputed",
    "booking.updated": "updated",
  };

  const status = statusMap[type] || "unknown";

  // Track booking analytics
  trackAnalyticsEvent({
    ...data,
    payload: {
      ...payload,
      bookingStatus: status,
      eventType: type,
    },
  });

  // If booking is completed, track completion analytics
  if (type === "booking.completed") {
    trackCompletedBooking(payload);
  }

  // If booking is cancelled, track cancellation analytics
  if (type === "booking.cancelled") {
    trackCancelledBooking(payload);
  }
}

/**
 * Track completed booking for analytics
 */
function trackCompletedBooking(payload: any): void {
  const { providerId, customerId, totalPrice, scheduledDate, id } = payload;

  // Track provider performance
  trackAnalyticsEvent({
    type: "analytics.provider.performance",
    payload: {
      providerId,
      bookingId: id,
      amount: totalPrice,
      scheduledDate,
    },
    timestamp: new Date(),
    userId: customerId,
    source: "booking.completed",
  });
}

/**
 * Track cancelled booking for analytics
 */
function trackCancelledBooking(payload: any): void {
  const { providerId, customerId, cancellationReason, id } = payload;

  // Track cancellation reasons
  trackAnalyticsEvent({
    type: "analytics.booking.cancelled",
    payload: {
      providerId,
      bookingId: id,
      cancellationReason,
    },
    timestamp: new Date(),
    userId: customerId,
    source: "booking.cancelled",
  });
}

/**
 * Handle review events for analytics
 */
function handleReviewEvent(data: EventData): void {
  const { payload } = data;

  // Track review ratings
  trackAnalyticsEvent({
    ...data,
    payload: {
      ...payload,
      rating: payload.rating,
      providerId: payload.providerId,
      reviewerId: payload.reviewerId,
    },
  });

  // Update provider average rating in analytics
  if (payload.providerId && payload.rating) {
    trackProviderRating(payload.providerId, payload.rating);
  }
}

/**
 * Track provider rating for analytics
 */
function trackProviderRating(providerId: string, rating: number): void {
  // In production, this would update provider rating in Redis/DB
  logger.debug(`Provider rating tracked: ${providerId} - ${rating} stars`);
}

/**
 * Handle payment events for analytics
 */
function handlePaymentEvent(data: EventData): void {
  const { type, payload } = data;

  // Track payment status
  const statusMap: Record<string, string> = {
    "payment.processed": "processed",
    "payment.completed": "completed",
    "payment.failed": "failed",
    "payment.refunded": "refunded",
  };

  const status = statusMap[type] || "unknown";

  // Track payment analytics
  trackAnalyticsEvent({
    ...data,
    payload: {
      ...payload,
      paymentStatus: status,
      amount: payload.amount,
      bookingId: payload.bookingId,
    },
  });

  // Track revenue for completed payments
  if (type === "payment.completed" && payload.amount) {
    trackRevenueMetrics(new Date().toISOString().split("T")[0], payload.amount);
  }
}

/**
 * Handle user events for analytics
 */
function handleUserEvent(data: EventData): void {
  const { type, payload } = data;

  // Track user registration
  if (type === "user.registered") {
    trackNewUser(payload);
  }

  // Track user updates
  if (type === "user.updated") {
    trackUserUpdate(payload);
  }

  // Track user deactivation
  if (type === "user.deactivated") {
    trackUserDeactivation(payload);
  }
}

/**
 * Track new user registration
 */
function trackNewUser(payload: any): void {
  const { id, email, role, fullName } = payload;

  trackAnalyticsEvent({
    type: "analytics.user.registered",
    payload: {
      userId: id,
      email,
      role,
      fullName,
    },
    timestamp: new Date(),
    userId: id,
    source: "user.registered",
  });
}

/**
 * Track user update
 */
function trackUserUpdate(payload: any): void {
  const { id, email, role, fullName, changes } = payload;

  trackAnalyticsEvent({
    type: "analytics.user.updated",
    payload: {
      userId: id,
      email,
      role,
      fullName,
      changes,
    },
    timestamp: new Date(),
    userId: id,
    source: "user.updated",
  });
}

/**
 * Track user deactivation
 */
function trackUserDeactivation(payload: any): void {
  const { id, email, role, reason } = payload;

  trackAnalyticsEvent({
    type: "analytics.user.deactivated",
    payload: {
      userId: id,
      email,
      role,
      reason,
    },
    timestamp: new Date(),
    userId: id,
    source: "user.deactivated",
  });
}

/**
 * Handle provider events for analytics
 */
function handleProviderEvent(data: EventData): void {
  const { type, payload } = data;

  if (type === "provider.registered") {
    // Track new provider registration
    trackAnalyticsEvent({
      type: "analytics.provider.registered",
      payload: {
        providerId: payload.id,
        userId: payload.userId,
        businessName: payload.businessName,
        category: payload.category,
      },
      timestamp: new Date(),
      userId: payload.userId,
      source: "provider.registered",
    });
  }

  if (type === "provider.verified") {
    // Track provider verification
    trackAnalyticsEvent({
      type: "analytics.provider.verified",
      payload: {
        providerId: payload.id,
        businessName: payload.businessName,
        category: payload.category,
      },
      timestamp: new Date(),
      userId: payload.userId,
      source: "provider.verified",
    });
  }
}

// ============================================================
// LISTENER REGISTRATION
// ============================================================

/**
 * Register all analytics event listeners
 */
export function analyticsEventListeners(): void {
  logger.info("Registering analytics event listeners...");

  // Booking event listeners
  on(EVENTS.BOOKING_CREATED, handleBookingEvent);
  on(EVENTS.BOOKING_CONFIRMED, handleBookingEvent);
  on(EVENTS.BOOKING_IN_PROGRESS, handleBookingEvent);
  on(EVENTS.BOOKING_COMPLETED, handleBookingEvent);
  on(EVENTS.BOOKING_CANCELLED, handleBookingEvent);
  on(EVENTS.BOOKING_DISPUTED, handleBookingEvent);
  on(EVENTS.BOOKING_UPDATED, handleBookingEvent);

  // Review event listeners
  on(EVENTS.REVIEW_CREATED, handleReviewEvent);
  on(EVENTS.REVIEW_UPDATED, handleReviewEvent);
  on(EVENTS.REVIEW_DELETED, handleReviewEvent);

  // Payment event listeners
  on(EVENTS.PAYMENT_PROCESSED, handlePaymentEvent);
  on(EVENTS.PAYMENT_COMPLETED, handlePaymentEvent);
  on(EVENTS.PAYMENT_FAILED, handlePaymentEvent);
  on(EVENTS.PAYMENT_REFUNDED, handlePaymentEvent);

  // User event listeners
  on(EVENTS.USER_REGISTERED, handleUserEvent);
  on(EVENTS.USER_UPDATED, handleUserEvent);
  on(EVENTS.USER_ACTIVATED, handleUserEvent);
  on(EVENTS.USER_DEACTIVATED, handleUserEvent);

  // Provider event listeners
  on(EVENTS.PROVIDER_REGISTERED, handleProviderEvent);
  on(EVENTS.PROVIDER_VERIFIED, handleProviderEvent);
  on(EVENTS.PROVIDER_UPDATED, handleProviderEvent);

  // Direct analytics track event
  on(EVENTS.ANALYTICS_TRACK, trackAnalyticsEvent);

  logger.info("Analytics event listeners registered successfully");
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  analyticsEventListeners,
  trackAnalyticsEvent,
  trackDailyMetrics,
  trackRevenueMetrics,
  trackUserActivity,
  handleBookingEvent,
  handleReviewEvent,
  handlePaymentEvent,
  handleUserEvent,
  handleProviderEvent,
};
