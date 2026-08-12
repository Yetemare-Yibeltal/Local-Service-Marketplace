// ============================================================
// LISTENERS INDEX
// Central export point for all event listener modules
// ============================================================

// Import listener registrations
import { bookingEventListeners } from "./booking.listener";
import { notificationEventListeners } from "./notification.listener";
import { analyticsEventListeners } from "./analytics.listener";

// Export listener functions
export { bookingEventListeners } from "./booking.listener";
export { notificationEventListeners } from "./notification.listener";
export { analyticsEventListeners } from "./analytics.listener";

// Export all handler functions from booking listener
export {
  handleBookingCreated,
  handleBookingConfirmed,
  handleBookingInProgress,
  handleBookingCompleted,
  handleBookingCancelled,
  handleBookingDisputed,
  handleBookingUpdated,
  sendBookingConfirmationNotification,
  sendBookingStatusUpdateNotification,
  sendReviewReminder,
  sendDisputeNotification,
} from "./booking.listener";

// Export all handler functions from notification listener
export {
  handleNotificationSent,
  handleNotificationRead,
  handleNotificationDelivered,
  handleNotificationFailed,
  handleBulkNotificationSent,
  handleNotificationCleanup,
  handlePreferenceUpdate,
  retryNotification,
  invalidateUnreadCache,
} from "./notification.listener";

// Export all handler functions from analytics listener
export {
  trackAnalyticsEvent,
  trackDailyMetrics,
  trackRevenueMetrics,
  trackUserActivity,
  handleBookingEvent,
  handleReviewEvent,
  handlePaymentEvent,
  handleUserEvent,
  handleProviderEvent,
} from "./analytics.listener";

// ============================================================
// REGISTER ALL LISTENERS
// ============================================================

/**
 * Register all event listeners
 * This function should be called during application startup
 */
export function registerAllListeners(): void {
  bookingEventListeners();
  notificationEventListeners();
  analyticsEventListeners();
}

// ============================================================
// LISTENER STATUS
// ============================================================

export interface ListenerStatus {
  name: string;
  registered: boolean;
  eventCount: number;
}

/**
 * Get status of all listeners
 */
export function getListenersStatus(): ListenerStatus[] {
  return [
    {
      name: "Booking Listeners",
      registered: true,
      eventCount: 7, // created, confirmed, in_progress, completed, cancelled, disputed, updated
    },
    {
      name: "Notification Listeners",
      registered: true,
      eventCount: 7, // sent, read, delivered, failed, bulk, cleanup, preference
    },
    {
      name: "Analytics Listeners",
      registered: true,
      eventCount: 4, // booking, review, payment, user, provider
    },
  ];
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Registration
  registerAllListeners,
  getListenersStatus,

  // Booking
  bookingEventListeners,
  handleBookingCreated,
  handleBookingConfirmed,
  handleBookingInProgress,
  handleBookingCompleted,
  handleBookingCancelled,
  handleBookingDisputed,
  handleBookingUpdated,
  sendBookingConfirmationNotification,
  sendBookingStatusUpdateNotification,
  sendReviewReminder,
  sendDisputeNotification,

  // Notification
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

  // Analytics
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
