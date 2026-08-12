import { eventBus, EVENTS, EventData, on } from "../index";
import logger from "../../utils/logger";
import { sendEmail } from "../../config/email";
import { sendSMS } from "../../services/external/twilio.service";
import { createNotification } from "../../repositories/notification.repository";
import { findUserById } from "../../repositories/user.repository";
import { findProviderById } from "../../repositories/provider.repository";
import { findBookingById } from "../../repositories/booking.repository";

// ============================================================
// TYPES
// ============================================================

export interface BookingEventPayload {
  id: string;
  bookingNumber: string;
  customerId: string;
  providerId: string;
  status: string;
  scheduledDate: Date;
  totalPrice: number;
  address: string;
  customerName?: string;
  providerName?: string;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

/**
 * Handle booking created event
 */
async function handleBookingCreated(data: EventData): Promise<void> {
  try {
    const payload = data.payload as BookingEventPayload;
    logger.info(`Booking created: ${payload.bookingNumber}`, {
      bookingId: payload.id,
      customerId: payload.customerId,
      providerId: payload.providerId,
    });

    // Send confirmation notification
    await sendBookingConfirmationNotification(payload);

    // Emit analytics event
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "booking_created",
        bookingId: payload.id,
        customerId: payload.customerId,
        providerId: payload.providerId,
        amount: payload.totalPrice,
      },
      timestamp: new Date(),
      source: "booking.listener",
    });
  } catch (error) {
    logger.error(`Booking created handler error: ${data.payload?.id}`, error);
  }
}

/**
 * Handle booking confirmed event
 */
async function handleBookingConfirmed(data: EventData): Promise<void> {
  try {
    const payload = data.payload as BookingEventPayload;
    logger.info(`Booking confirmed: ${payload.bookingNumber}`, {
      bookingId: payload.id,
      providerId: payload.providerId,
    });

    // Send confirmation notification
    await sendBookingStatusUpdateNotification(payload, "CONFIRMED");

    // Update provider stats
    await updateProviderStats(payload.providerId);

    // Emit analytics event
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "booking_confirmed",
        bookingId: payload.id,
        providerId: payload.providerId,
        amount: payload.totalPrice,
      },
      timestamp: new Date(),
      source: "booking.listener",
    });
  } catch (error) {
    logger.error(`Booking confirmed handler error: ${data.payload?.id}`, error);
  }
}

/**
 * Handle booking in progress event
 */
async function handleBookingInProgress(data: EventData): Promise<void> {
  try {
    const payload = data.payload as BookingEventPayload;
    logger.info(`Booking in progress: ${payload.bookingNumber}`, {
      bookingId: payload.id,
      providerId: payload.providerId,
    });

    await sendBookingStatusUpdateNotification(payload, "IN_PROGRESS");
  } catch (error) {
    logger.error(
      `Booking in progress handler error: ${data.payload?.id}`,
      error,
    );
  }
}

/**
 * Handle booking completed event
 */
async function handleBookingCompleted(data: EventData): Promise<void> {
  try {
    const payload = data.payload as BookingEventPayload;
    logger.info(`Booking completed: ${payload.bookingNumber}`, {
      bookingId: payload.id,
      providerId: payload.providerId,
      customerId: payload.customerId,
    });

    // Send completion notification
    await sendBookingStatusUpdateNotification(payload, "COMPLETED");

    // Update provider completed jobs
    await incrementProviderJobs(payload.providerId);

    // Trigger review reminder
    await sendReviewReminder(payload);

    // Emit analytics event for revenue
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "booking_completed",
        bookingId: payload.id,
        providerId: payload.providerId,
        customerId: payload.customerId,
        amount: payload.totalPrice,
        revenue: payload.totalPrice,
      },
      timestamp: new Date(),
      source: "booking.listener",
    });
  } catch (error) {
    logger.error(`Booking completed handler error: ${data.payload?.id}`, error);
  }
}

/**
 * Handle booking cancelled event
 */
async function handleBookingCancelled(data: EventData): Promise<void> {
  try {
    const payload = data.payload as BookingEventPayload;
    logger.info(`Booking cancelled: ${payload.bookingNumber}`, {
      bookingId: payload.id,
      customerId: payload.customerId,
      providerId: payload.providerId,
    });

    await sendBookingStatusUpdateNotification(payload, "CANCELLED");

    // Emit analytics event
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "booking_cancelled",
        bookingId: payload.id,
        customerId: payload.customerId,
        providerId: payload.providerId,
        amount: payload.totalPrice,
      },
      timestamp: new Date(),
      source: "booking.listener",
    });
  } catch (error) {
    logger.error(`Booking cancelled handler error: ${data.payload?.id}`, error);
  }
}

/**
 * Handle booking disputed event
 */
async function handleBookingDisputed(data: EventData): Promise<void> {
  try {
    const payload = data.payload as BookingEventPayload;
    logger.warn(`Booking disputed: ${payload.bookingNumber}`, {
      bookingId: payload.id,
      customerId: payload.customerId,
      providerId: payload.providerId,
    });

    // Send dispute notification
    await sendDisputeNotification(payload);

    // Create dispute record in system
    await createDisputeRecord(payload);

    // Emit analytics event
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "booking_disputed",
        bookingId: payload.id,
        customerId: payload.customerId,
        providerId: payload.providerId,
      },
      timestamp: new Date(),
      source: "booking.listener",
    });
  } catch (error) {
    logger.error(`Booking disputed handler error: ${data.payload?.id}`, error);
  }
}

/**
 * Handle booking updated event
 */
async function handleBookingUpdated(data: EventData): Promise<void> {
  try {
    const payload = data.payload as BookingEventPayload;
    logger.debug(`Booking updated: ${payload.bookingNumber}`, {
      bookingId: payload.id,
      status: payload.status,
    });

    // Track booking update
    eventBus.emit(EVENTS.ANALYTICS_TRACK, {
      type: EVENTS.ANALYTICS_TRACK,
      payload: {
        event: "booking_updated",
        bookingId: payload.id,
        status: payload.status,
      },
      timestamp: new Date(),
      source: "booking.listener",
    });
  } catch (error) {
    logger.error(`Booking updated handler error: ${data.payload?.id}`, error);
  }
}

// ============================================================
// NOTIFICATION HELPERS
// ============================================================

/**
 * Send booking confirmation notification
 */
async function sendBookingConfirmationNotification(
  payload: BookingEventPayload,
): Promise<void> {
  try {
    const [customer, provider] = await Promise.all([
      findUserById(payload.customerId),
      findProviderById(payload.providerId),
    ]);

    if (!customer || !provider) {
      logger.warn(
        "Cannot send confirmation notification - user/provider not found",
        {
          customerId: payload.customerId,
          providerId: payload.providerId,
        },
      );
      return;
    }

    // Create in-app notification
    await createNotification({
      userId: customer.id,
      type: "EMAIL",
      title: "Booking Created",
      message: `Your booking ${payload.bookingNumber} has been created and is pending confirmation.`,
      data: { bookingId: payload.id, bookingNumber: payload.bookingNumber },
    });

    // Send email
    await sendEmail({
      to: customer.email,
      subject: `Booking Created - ${payload.bookingNumber}`,
      html: `
        <h2>Booking Created</h2>
        <p>Hello ${customer.fullName},</p>
        <p>Your booking with ${provider.businessName} has been created.</p>
        <p><strong>Booking Number:</strong> ${payload.bookingNumber}</p>
        <p><strong>Service Date:</strong> ${new Date(payload.scheduledDate).toLocaleString()}</p>
        <p><strong>Total Price:</strong> ETB ${payload.totalPrice.toFixed(2)}</p>
        <p><strong>Address:</strong> ${payload.address}</p>
        <p>Please wait for the provider to confirm your booking.</p>
      `,
    });

    // Send SMS
    await sendSMS({
      to: customer.phone,
      body: `Booking ${payload.bookingNumber} created with ${provider.businessName} on ${new Date(payload.scheduledDate).toLocaleString()}. Waiting for confirmation.`,
    });
  } catch (error) {
    logger.error("Send booking confirmation notification error:", error);
  }
}

/**
 * Send booking status update notification
 */
async function sendBookingStatusUpdateNotification(
  payload: BookingEventPayload,
  status: string,
): Promise<void> {
  try {
    const [customer, provider] = await Promise.all([
      findUserById(payload.customerId),
      findProviderById(payload.providerId),
    ]);

    if (!customer || !provider) {
      logger.warn(
        "Cannot send status update notification - user/provider not found",
      );
      return;
    }

    const statusMessages: Record<string, { title: string; message: string }> = {
      CONFIRMED: {
        title: "Booking Confirmed",
        message: `Your booking ${payload.bookingNumber} with ${provider.businessName} has been confirmed.`,
      },
      IN_PROGRESS: {
        title: "Booking In Progress",
        message: `Your booking ${payload.bookingNumber} with ${provider.businessName} is now in progress.`,
      },
      COMPLETED: {
        title: "Booking Completed",
        message: `Your booking ${payload.bookingNumber} with ${provider.businessName} has been completed. Please leave a review.`,
      },
      CANCELLED: {
        title: "Booking Cancelled",
        message: `Your booking ${payload.bookingNumber} with ${provider.businessName} has been cancelled.`,
      },
    };

    const statusInfo = statusMessages[status];
    if (!statusInfo) {
      logger.warn(`Unknown status for notification: ${status}`);
      return;
    }

    // Create in-app notification
    await createNotification({
      userId: customer.id,
      type: "EMAIL",
      title: statusInfo.title,
      message: statusInfo.message,
      data: {
        bookingId: payload.id,
        bookingNumber: payload.bookingNumber,
        status,
      },
    });

    // Send SMS
    await sendSMS({
      to: customer.phone,
      body: `${statusInfo.title}: ${statusInfo.message}`,
    });
  } catch (error) {
    logger.error("Send booking status update notification error:", error);
  }
}

/**
 * Send review reminder notification
 */
async function sendReviewReminder(payload: BookingEventPayload): Promise<void> {
  try {
    const customer = await findUserById(payload.customerId);
    if (!customer) {
      logger.warn("Cannot send review reminder - customer not found");
      return;
    }

    // Create notification
    await createNotification({
      userId: customer.id,
      type: "EMAIL",
      title: "Review Your Experience",
      message: `How was your experience with booking ${payload.bookingNumber}? Please leave a review.`,
      data: { bookingId: payload.id, bookingNumber: payload.bookingNumber },
    });

    // Send SMS
    await sendSMS({
      to: customer.phone,
      body: `How was your experience with booking ${payload.bookingNumber}? Please leave a review on our platform.`,
    });
  } catch (error) {
    logger.error("Send review reminder error:", error);
  }
}

/**
 * Send dispute notification
 */
async function sendDisputeNotification(
  payload: BookingEventPayload,
): Promise<void> {
  try {
    const [customer, provider] = await Promise.all([
      findUserById(payload.customerId),
      findProviderById(payload.providerId),
    ]);

    if (!customer || !provider) {
      logger.warn("Cannot send dispute notification - user/provider not found");
      return;
    }

    // Notify both parties
    const message = `A dispute has been opened for booking ${payload.bookingNumber}. Our team will review the case.`;

    // Create notifications for both parties
    await Promise.all([
      createNotification({
        userId: customer.id,
        type: "EMAIL",
        title: "Booking Dispute",
        message,
        data: { bookingId: payload.id, bookingNumber: payload.bookingNumber },
      }),
      createNotification({
        userId: provider.userId,
        type: "EMAIL",
        title: "Booking Dispute",
        message,
        data: { bookingId: payload.id, bookingNumber: payload.bookingNumber },
      }),
    ]);
  } catch (error) {
    logger.error("Send dispute notification error:", error);
  }
}

// ============================================================
// DATABASE HELPERS
// ============================================================

/**
 * Update provider statistics
 */
async function updateProviderStats(providerId: string): Promise<void> {
  try {
    // In production, this would update provider stats in database
    logger.debug(`Updating provider stats for ${providerId}`);
  } catch (error) {
    logger.error("Update provider stats error:", error);
  }
}

/**
 * Increment provider completed jobs
 */
async function incrementProviderJobs(providerId: string): Promise<void> {
  try {
    // In production, this would increment completed jobs count
    logger.debug(`Incrementing completed jobs for provider ${providerId}`);
  } catch (error) {
    logger.error("Increment provider jobs error:", error);
  }
}

/**
 * Create dispute record
 */
async function createDisputeRecord(
  payload: BookingEventPayload,
): Promise<void> {
  try {
    // In production, this would create a dispute record in the database
    logger.debug(`Creating dispute record for booking ${payload.id}`);
  } catch (error) {
    logger.error("Create dispute record error:", error);
  }
}

// ============================================================
// LISTENER REGISTRATION
// ============================================================

/**
 * Register all booking event listeners
 */
export function bookingEventListeners(): void {
  logger.info("Registering booking event listeners...");

  on(EVENTS.BOOKING_CREATED, handleBookingCreated);
  on(EVENTS.BOOKING_CONFIRMED, handleBookingConfirmed);
  on(EVENTS.BOOKING_IN_PROGRESS, handleBookingInProgress);
  on(EVENTS.BOOKING_COMPLETED, handleBookingCompleted);
  on(EVENTS.BOOKING_CANCELLED, handleBookingCancelled);
  on(EVENTS.BOOKING_DISPUTED, handleBookingDisputed);
  on(EVENTS.BOOKING_UPDATED, handleBookingUpdated);

  logger.info("Booking event listeners registered successfully");
}

// ============================================================
// EXPORTS
// ============================================================

export default {
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
};
