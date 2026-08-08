import internalNotificationService from "./internal/notification.service";
import { findUserById } from "../repositories/user.repository";
import { findBookingById } from "../repositories/booking.repository";
import { findProviderById } from "../repositories/provider.repository";
import logger from "../utils/logger";

// ============================================================
// NOTIFICATION SERVICE (ROOT LEVEL)
// This service re-exports all functionality from the internal
// notification service and adds application-specific convenience
// methods for common notification scenarios.
// ============================================================

// Re-export all methods from the internal service
export const {
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
} = internalNotificationService;

// ============================================================
// TYPES
// ============================================================

export interface BookingNotificationData {
  bookingId: string;
  customerId: string;
  providerId: string;
  title: string;
  message: string;
  type: "EMAIL" | "SMS" | "PUSH";
  bookingNumber: string;
}

export interface ProviderNotificationData {
  providerId: string;
  userId: string;
  title: string;
  message: string;
  type: "EMAIL" | "SMS" | "PUSH";
  businessName: string;
}

export interface UserNotificationData {
  userId: string;
  title: string;
  message: string;
  type: "EMAIL" | "SMS" | "PUSH";
  fullName: string;
}

// ============================================================
// APPLICATION-SPECIFIC NOTIFICATION METHODS
// ============================================================

/**
 * Send a booking confirmation notification to the customer
 */
export async function sendBookingConfirmationNotification(
  bookingId: string,
): Promise<void> {
  try {
    const booking = await findBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const provider = await findProviderById(booking.providerId);
    if (!provider) {
      throw new Error(`Provider ${booking.providerId} not found`);
    }

    const customer = await findUserById(booking.customerId);
    if (!customer) {
      throw new Error(`Customer ${booking.customerId} not found`);
    }

    const title = "Booking Confirmed";
    const message = `Your booking ${booking.bookingNumber} with ${provider.businessName} has been confirmed.`;

    await sendNotification({
      userId: customer.id,
      type: "EMAIL",
      title,
      message,
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        providerName: provider.businessName,
        scheduledDate: booking.scheduledDate,
        totalPrice: booking.totalPrice,
      },
    });

    logger.info(`Booking confirmation notification sent for ${bookingNumber}`);
  } catch (error) {
    logger.error(
      `Failed to send booking confirmation notification for ${bookingId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Send a booking status update notification
 */
export async function sendBookingStatusUpdateNotification(
  bookingId: string,
  status: string,
): Promise<void> {
  try {
    const booking = await findBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const provider = await findProviderById(booking.providerId);
    if (!provider) {
      throw new Error(`Provider ${booking.providerId} not found`);
    }

    const customer = await findUserById(booking.customerId);
    if (!customer) {
      throw new Error(`Customer ${booking.customerId} not found`);
    }

    const statusMap: Record<string, string> = {
      CONFIRMED: "confirmed",
      IN_PROGRESS: "is in progress",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
      DISPUTED: "disputed",
    };

    const statusText = statusMap[status] || status.toLowerCase();

    const title = `Booking ${statusText}`;
    const message = `Your booking ${booking.bookingNumber} with ${provider.businessName} has been ${statusText}.`;

    await sendNotification({
      userId: customer.id,
      type: "EMAIL",
      title,
      message,
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        providerName: provider.businessName,
        status,
        scheduledDate: booking.scheduledDate,
      },
    });

    logger.info(
      `Booking status update notification sent for ${booking.bookingNumber}`,
    );
  } catch (error) {
    logger.error(
      `Failed to send booking status update notification for ${bookingId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Send a provider verification notification
 */
export async function sendProviderVerificationNotification(
  providerId: string,
  isVerified: boolean,
  notes?: string,
): Promise<void> {
  try {
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const user = await findUserById(provider.userId);
    if (!user) {
      throw new Error(`User ${provider.userId} not found`);
    }

    const title = isVerified
      ? "Provider Verified"
      : "Provider Verification Review";
    const message = isVerified
      ? `Your business "${provider.businessName}" has been verified successfully.`
      : `Your business "${provider.businessName}" verification needs review. ${notes || ""}`;

    await sendNotification({
      userId: user.id,
      type: "EMAIL",
      title,
      message,
      data: {
        providerId: provider.id,
        businessName: provider.businessName,
        isVerified,
        notes,
      },
    });

    logger.info(
      `Provider verification notification sent for ${provider.businessName}`,
    );
  } catch (error) {
    logger.error(
      `Failed to send provider verification notification for ${providerId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Send a welcome notification to a new user
 */
export async function sendWelcomeNotification(userId: string): Promise<void> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const title = "Welcome to Marketplace";
    const message = `Welcome ${user.fullName}! Thank you for joining Marketplace. Get started by exploring services in your area.`;

    await sendNotification({
      userId: user.id,
      type: "EMAIL",
      title,
      message,
      data: {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });

    logger.info(`Welcome notification sent to user ${userId}`);
  } catch (error) {
    logger.error(`Failed to send welcome notification to ${userId}:`, error);
    throw error;
  }
}

/**
 * Send a booking reminder notification
 */
export async function sendBookingReminderNotification(
  bookingId: string,
  hoursBefore: number = 24,
): Promise<void> {
  try {
    const booking = await findBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const provider = await findProviderById(booking.providerId);
    if (!provider) {
      throw new Error(`Provider ${booking.providerId} not found`);
    }

    const customer = await findUserById(booking.customerId);
    if (!customer) {
      throw new Error(`Customer ${booking.customerId} not found`);
    }

    const title = `Booking Reminder (${hoursBefore} hours)`;
    const message = `Reminder: Your booking ${booking.bookingNumber} with ${provider.businessName} is scheduled in ${hoursBefore} hours.`;

    await sendNotification({
      userId: customer.id,
      type: "EMAIL",
      title,
      message,
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        providerName: provider.businessName,
        scheduledDate: booking.scheduledDate,
        hoursBefore,
      },
    });

    logger.info(
      `Booking reminder notification sent for ${booking.bookingNumber}`,
    );
  } catch (error) {
    logger.error(
      `Failed to send booking reminder notification for ${bookingId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Send a dispute resolution notification
 */
export async function sendDisputeResolutionNotification(
  disputeId: string,
  resolution: string,
  userId: string,
): Promise<void> {
  try {
    const { prisma } = require("../config/database");

    const user = await findUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const title = "Dispute Resolved";
    const message = `The dispute has been resolved. Resolution: ${resolution}`;

    await sendNotification({
      userId: user.id,
      type: "EMAIL",
      title,
      message,
      data: {
        disputeId,
        resolution,
      },
    });

    logger.info(`Dispute resolution notification sent to user ${userId}`);
  } catch (error) {
    logger.error(
      `Failed to send dispute resolution notification for ${disputeId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Send a review notification
 */
export async function sendReviewNotification(
  reviewId: string,
  providerId: string,
): Promise<void> {
  try {
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const user = await findUserById(provider.userId);
    if (!user) {
      throw new Error(`User ${provider.userId} not found`);
    }

    const title = "New Review Received";
    const message = `You have received a new review for your business "${provider.businessName}".`;

    await sendNotification({
      userId: user.id,
      type: "EMAIL",
      title,
      message,
      data: {
        reviewId,
        providerId,
        businessName: provider.businessName,
      },
    });

    logger.info(`Review notification sent to provider ${providerId}`);
  } catch (error) {
    logger.error(`Failed to send review notification for ${reviewId}:`, error);
    throw error;
  }
}

/**
 * Send a payment notification
 */
export async function sendPaymentNotification(
  bookingId: string,
  amount: number,
  status: string,
): Promise<void> {
  try {
    const booking = await findBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const customer = await findUserById(booking.customerId);
    if (!customer) {
      throw new Error(`Customer ${booking.customerId} not found`);
    }

    const title = `Payment ${status}`;
    const message = `Payment of ${amount} for booking ${booking.bookingNumber} has been ${status}.`;

    await sendNotification({
      userId: customer.id,
      type: "EMAIL",
      title,
      message,
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        amount,
        status,
      },
    });

    logger.info(`Payment notification sent for booking ${bookingNumber}`);
  } catch (error) {
    logger.error(
      `Failed to send payment notification for ${bookingId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Send a custom notification with application-specific data
 */
export async function sendCustomNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>,
  type: "EMAIL" | "SMS" | "PUSH" = "EMAIL",
): Promise<void> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    await sendNotification({
      userId: user.id,
      type,
      title,
      message,
      data,
    });

    logger.info(`Custom notification sent to user ${userId}: ${title}`);
  } catch (error) {
    logger.error(`Failed to send custom notification to ${userId}:`, error);
    throw error;
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkCustomNotification(
  userIds: string[],
  title: string,
  message: string,
  data?: Record<string, any>,
  type: "EMAIL" | "SMS" | "PUSH" = "EMAIL",
): Promise<void> {
  try {
    if (!userIds || userIds.length === 0) {
      throw new Error("At least one user ID is required");
    }

    await sendBulkNotifications({
      userIds,
      type,
      title,
      message,
      data,
    });

    logger.info(
      `Bulk custom notification sent to ${userIds.length} users: ${title}`,
    );
  } catch (error) {
    logger.error("Failed to send bulk custom notification:", error);
    throw error;
  }
}

/**
 * Get all notifications for a user with summary
 */
export async function getUserNotificationSummary(userId: string): Promise<{
  total: number;
  unread: number;
  recent: any[];
  hasUnread: boolean;
}> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const unreadCount = await getUnreadCountService(userId);
    const recentNotifications = await getUserNotifications(userId, {}, 1, 5);

    return {
      total: recentNotifications.pagination.totalItems + unreadCount.total,
      unread: unreadCount.total,
      recent: recentNotifications.data,
      hasUnread: unreadCount.total > 0,
    };
  } catch (error) {
    logger.error(`Failed to get notification summary for ${userId}:`, error);
    throw error;
  }
}

/**
 * Send booking cancellation notification
 */
export async function sendBookingCancellationNotification(
  bookingId: string,
  reason: string,
): Promise<void> {
  try {
    const booking = await findBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const provider = await findProviderById(booking.providerId);
    if (!provider) {
      throw new Error(`Provider ${booking.providerId} not found`);
    }

    const customer = await findUserById(booking.customerId);
    if (!customer) {
      throw new Error(`Customer ${booking.customerId} not found`);
    }

    const title = "Booking Cancelled";
    const message = `Booking ${booking.bookingNumber} with ${provider.businessName} has been cancelled. Reason: ${reason}`;

    await sendNotification({
      userId: customer.id,
      type: "EMAIL",
      title,
      message,
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        providerName: provider.businessName,
        reason,
      },
    });

    logger.info(
      `Booking cancellation notification sent for ${booking.bookingNumber}`,
    );
  } catch (error) {
    logger.error(
      `Failed to send booking cancellation notification for ${bookingId}:`,
      error,
    );
    throw error;
  }
}

// ============================================================
// CHECK FUNCTIONS
// ============================================================

/**
 * Check if a notification exists
 */
export async function checkNotificationExistsRoot(
  id: string,
): Promise<boolean> {
  return checkNotificationExists(id);
}

/**
 * Check if a user has any unread notifications
 */
export async function userHasUnreadNotifications(
  userId: string,
): Promise<boolean> {
  try {
    const count = await getUnreadCountService(userId);
    return count.total > 0;
  } catch (error) {
    logger.error(`Failed to check unread notifications for ${userId}:`, error);
    return false;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Re-export internal service methods
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

  // Application-specific methods
  sendBookingConfirmationNotification,
  sendBookingStatusUpdateNotification,
  sendProviderVerificationNotification,
  sendWelcomeNotification,
  sendBookingReminderNotification,
  sendDisputeResolutionNotification,
  sendReviewNotification,
  sendPaymentNotification,
  sendCustomNotification,
  sendBulkCustomNotification,
  sendBookingCancellationNotification,
  getUserNotificationSummary,
  checkNotificationExistsRoot,
  userHasUnreadNotifications,
};
