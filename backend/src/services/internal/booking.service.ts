import { Booking, BookingStatus } from "@prisma/client";
import {
  createBooking as createBookingRepo,
  findBookingById,
  findBookingByNumber,
  updateBooking,
  updateBookingStatus,
  getBookings,
  getBookingsByCustomer,
  getBookingsByProvider,
  cancelBooking as cancelBookingRepo,
  confirmBooking as confirmBookingRepo,
  startBooking as startBookingRepo,
  completeBooking as completeBookingRepo,
  getProviderDashboardStats,
  getCustomerDashboardStats,
  bookingExists,
  isBookingCustomer,
  isBookingProvider,
  BookingCreateData,
  BookingUpdateData,
  BookingWithRelations,
  DashboardStats,
} from "../../repositories/booking.repository";
import {
  findProviderById,
  incrementCompletedJobs,
} from "../../repositories/provider.repository";
import { findUserById } from "../../repositories/user.repository";
import {
  sendEmail,
  getBookingConfirmationEmailTemplate,
  getBookingReminderEmailTemplate,
} from "../../config/email";
import {
  sendSMS,
  getBookingConfirmationSMSTemplate,
  getBookingReminderSMSTemplate,
  getBookingStatusSMSTemplate,
} from "../../config/twilio";
import { createNotification } from "../../repositories/notification.repository";
import logger from "../../utils/logger";
import { BOOKING_TRANSITIONS } from "../../utils/constants";
import { isDateInFuture } from "../../utils/validator";

// ============================================================
// TYPES
// ============================================================

export interface CreateBookingData {
  customerId: string;
  providerId: string;
  serviceId?: string;
  scheduledDate: Date | string;
  address: string;
  specialNotes?: string;
  totalPrice: number;
  depositAmount?: number;
}

export interface UpdateBookingData {
  status?: BookingStatus;
  scheduledDate?: Date | string;
  address?: string;
  specialNotes?: string;
  totalPrice?: number;
  depositAmount?: number;
}

export interface CancelBookingData {
  reason: string;
  cancelledBy: string;
}

export interface BookingConflictCheck {
  providerId: string;
  scheduledDate: Date;
  durationMinutes?: number;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  disputed: number;
  completionRate: number;
}

// ============================================================
// BOOKING SERVICE
// ============================================================

/**
 * Create a new booking
 */
export async function createBooking(data: CreateBookingData): Promise<Booking> {
  try {
    // Validate inputs
    const scheduledDate =
      typeof data.scheduledDate === "string"
        ? new Date(data.scheduledDate)
        : data.scheduledDate;

    if (isNaN(scheduledDate.getTime())) {
      throw new Error("Invalid scheduled date");
    }

    if (!isDateInFuture(scheduledDate)) {
      throw new Error("Scheduled date must be in the future");
    }

    // Validate provider exists
    const provider = await findProviderById(data.providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    if (!provider.isAvailable) {
      throw new Error("Provider is currently unavailable");
    }

    // Validate customer exists
    const customer = await findUserById(data.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    if (!customer.isActive) {
      throw new Error("Customer account is deactivated");
    }

    // Check for scheduling conflicts
    const hasConflict = await checkBookingConflict({
      providerId: data.providerId,
      scheduledDate,
    });

    if (hasConflict) {
      throw new Error("Provider is already booked at this time");
    }

    // Create booking
    const bookingData: BookingCreateData = {
      customerId: data.customerId,
      providerId: data.providerId,
      serviceId: data.serviceId,
      scheduledDate,
      address: data.address,
      specialNotes: data.specialNotes,
      totalPrice: data.totalPrice,
      depositAmount: data.depositAmount || 0,
    };

    const booking = await createBookingRepo(bookingData);

    // Send notifications
    try {
      await sendBookingConfirmation(booking);
    } catch (error) {
      logger.error("Failed to send booking confirmation:", error);
    }

    logger.info(
      `Booking created: ${booking.bookingNumber} for provider ${data.providerId}`,
    );

    return booking;
  } catch (error) {
    logger.error("Create booking failed:", error);
    throw error;
  }
}

/**
 * Get booking by ID
 */
export async function getBookingById(
  id: string,
): Promise<BookingWithRelations | null> {
  try {
    return await findBookingById(id);
  } catch (error) {
    logger.error(`Get booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get booking by booking number
 */
export async function getBookingByNumber(
  bookingNumber: string,
): Promise<BookingWithRelations | null> {
  try {
    return await findBookingByNumber(bookingNumber);
  } catch (error) {
    logger.error(`Get booking by number ${bookingNumber} failed:`, error);
    throw error;
  }
}

/**
 * Get bookings for a customer
 */
export async function getCustomerBookings(
  customerId: string,
  status?: BookingStatus,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: BookingWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    return await getBookingsByCustomer(customerId, status, page, limit);
  } catch (error) {
    logger.error(`Get customer bookings for ${customerId} failed:`, error);
    throw error;
  }
}

/**
 * Get bookings for a provider
 */
export async function getProviderBookings(
  providerId: string,
  status?: BookingStatus,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: BookingWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    return await getBookingsByProvider(providerId, status, page, limit);
  } catch (error) {
    logger.error(`Get provider bookings for ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Update booking
 */
export async function updateBookingData(
  id: string,
  data: UpdateBookingData,
  userId: string,
  userRole: string,
): Promise<Booking> {
  try {
    // Check if booking exists
    const existing = await findBookingById(id);
    if (!existing) {
      throw new Error("Booking not found");
    }

    // Check permissions
    if (userRole !== "ADMIN") {
      const isCustomer = existing.customerId === userId;
      const isProvider = existing.providerId === userId;

      if (!isCustomer && !isProvider) {
        throw new Error("You do not have permission to update this booking");
      }

      // Customers can only update certain fields
      if (isCustomer && data.status) {
        throw new Error("Customers cannot update booking status directly");
      }
    }

    // Prepare update data
    const updateData: BookingUpdateData = {};

    if (data.scheduledDate) {
      const scheduledDate =
        typeof data.scheduledDate === "string"
          ? new Date(data.scheduledDate)
          : data.scheduledDate;

      if (isNaN(scheduledDate.getTime())) {
        throw new Error("Invalid scheduled date");
      }

      if (!isDateInFuture(scheduledDate)) {
        throw new Error("Scheduled date must be in the future");
      }

      // Check for conflicts
      const hasConflict = await checkBookingConflict({
        providerId: existing.providerId,
        scheduledDate,
      });

      if (hasConflict) {
        throw new Error("Provider is already booked at this time");
      }

      updateData.scheduledDate = scheduledDate;
    }

    if (data.address) {
      updateData.address = data.address;
    }

    if (data.specialNotes !== undefined) {
      updateData.specialNotes = data.specialNotes;
    }

    if (data.totalPrice) {
      updateData.totalPrice = data.totalPrice;
    }

    if (data.depositAmount !== undefined) {
      updateData.depositAmount = data.depositAmount;
    }

    const booking = await updateBooking(id, updateData);

    logger.info(`Booking ${id} updated by user ${userId}`);

    return booking;
  } catch (error) {
    logger.error(`Update booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Update booking status
 */
export async function updateBookingStatusService(
  id: string,
  status: BookingStatus,
  userId: string,
  userRole: string,
  cancellationReason?: string,
): Promise<Booking> {
  try {
    // Check if booking exists
    const existing = await findBookingById(id);
    if (!existing) {
      throw new Error("Booking not found");
    }

    // Validate status transition
    const isValidTransition = validateBookingStatusTransition(
      existing.status,
      status,
      userRole,
    );

    if (!isValidTransition) {
      throw new Error(
        `Invalid status transition from ${existing.status} to ${status}`,
      );
    }

    // Check permissions based on status
    if (status === "CANCELLED") {
      const isCustomer = existing.customerId === userId;
      const isProvider = existing.providerId === userId;

      if (userRole !== "ADMIN" && !isCustomer && !isProvider) {
        throw new Error("You do not have permission to cancel this booking");
      }
    }

    if (status === "CONFIRMED" && userRole !== "ADMIN") {
      const isProvider = existing.providerId === userId;
      if (!isProvider) {
        throw new Error("Only the provider can confirm a booking");
      }
    }

    if (status === "IN_PROGRESS" && userRole !== "ADMIN") {
      const isProvider = existing.providerId === userId;
      if (!isProvider) {
        throw new Error("Only the provider can start a booking");
      }
    }

    if (status === "COMPLETED" && userRole !== "ADMIN") {
      const isProvider = existing.providerId === userId;
      if (!isProvider) {
        throw new Error("Only the provider can complete a booking");
      }
    }

    // Update status
    let booking: Booking;

    if (status === "CANCELLED") {
      if (!cancellationReason) {
        throw new Error("Cancellation reason is required");
      }
      booking = await cancelBookingRepo(id, cancellationReason, userId);
    } else if (status === "CONFIRMED") {
      booking = await confirmBookingRepo(id);
    } else if (status === "IN_PROGRESS") {
      booking = await startBookingRepo(id);
    } else if (status === "COMPLETED") {
      booking = await completeBookingRepo(id);

      // Increment provider completed jobs count
      await incrementCompletedJobs(existing.providerId);
    } else {
      booking = await updateBookingStatus(id, status);
    }

    // Send notifications
    try {
      await sendStatusUpdateNotification(booking, status);
    } catch (error) {
      logger.error("Failed to send status update notification:", error);
    }

    logger.info(`Booking ${id} status updated to ${status} by user ${userId}`);

    return booking;
  } catch (error) {
    logger.error(`Update booking status ${id} failed:`, error);
    throw error;
  }
}

/**
 * Cancel booking
 */
export async function cancelBookingService(
  id: string,
  data: CancelBookingData,
): Promise<Booking> {
  try {
    const existing = await findBookingById(id);
    if (!existing) {
      throw new Error("Booking not found");
    }

    // Check if booking can be cancelled
    if (existing.status === "COMPLETED") {
      throw new Error("Completed bookings cannot be cancelled");
    }

    if (existing.status === "CANCELLED") {
      throw new Error("Booking is already cancelled");
    }

    if (existing.status === "DISPUTED") {
      throw new Error("Disputed bookings cannot be cancelled");
    }

    // Validate user has permission
    const isCustomer = existing.customerId === data.cancelledBy;
    const isProvider = existing.providerId === data.cancelledBy;

    if (!isCustomer && !isProvider) {
      throw new Error("You do not have permission to cancel this booking");
    }

    const booking = await cancelBookingRepo(id, data.reason, data.cancelledBy);

    // Send cancellation notification
    try {
      await sendStatusUpdateNotification(booking, "CANCELLED");
    } catch (error) {
      logger.error("Failed to send cancellation notification:", error);
    }

    logger.info(`Booking ${id} cancelled by user ${data.cancelledBy}`);

    return booking;
  } catch (error) {
    logger.error(`Cancel booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Confirm booking
 */
export async function confirmBookingService(
  id: string,
  providerId: string,
): Promise<Booking> {
  try {
    const existing = await findBookingById(id);
    if (!existing) {
      throw new Error("Booking not found");
    }

    // Verify provider owns the booking
    if (existing.providerId !== providerId) {
      throw new Error("You do not have permission to confirm this booking");
    }

    if (existing.status !== "PENDING") {
      throw new Error(`Cannot confirm booking with status ${existing.status}`);
    }

    const booking = await confirmBookingRepo(id);

    // Send confirmation notifications
    try {
      await sendBookingConfirmation(existing);
    } catch (error) {
      logger.error("Failed to send booking confirmation:", error);
    }

    logger.info(`Booking ${id} confirmed by provider ${providerId}`);

    return booking;
  } catch (error) {
    logger.error(`Confirm booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Start booking
 */
export async function startBookingService(
  id: string,
  providerId: string,
): Promise<Booking> {
  try {
    const existing = await findBookingById(id);
    if (!existing) {
      throw new Error("Booking not found");
    }

    // Verify provider owns the booking
    if (existing.providerId !== providerId) {
      throw new Error("You do not have permission to start this booking");
    }

    if (existing.status !== "CONFIRMED") {
      throw new Error(`Cannot start booking with status ${existing.status}`);
    }

    const booking = await startBookingRepo(id);

    // Send notification
    try {
      await sendStatusUpdateNotification(booking, "IN_PROGRESS");
    } catch (error) {
      logger.error("Failed to send start notification:", error);
    }

    logger.info(`Booking ${id} started by provider ${providerId}`);

    return booking;
  } catch (error) {
    logger.error(`Start booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Complete booking
 */
export async function completeBookingService(
  id: string,
  providerId: string,
): Promise<Booking> {
  try {
    const existing = await findBookingById(id);
    if (!existing) {
      throw new Error("Booking not found");
    }

    // Verify provider owns the booking
    if (existing.providerId !== providerId) {
      throw new Error("You do not have permission to complete this booking");
    }

    if (existing.status !== "IN_PROGRESS") {
      throw new Error(`Cannot complete booking with status ${existing.status}`);
    }

    const booking = await completeBookingRepo(id);

    // Increment provider completed jobs
    await incrementCompletedJobs(existing.providerId);

    // Send notification
    try {
      await sendStatusUpdateNotification(booking, "COMPLETED");
    } catch (error) {
      logger.error("Failed to send completion notification:", error);
    }

    logger.info(`Booking ${id} completed by provider ${providerId}`);

    return booking;
  } catch (error) {
    logger.error(`Complete booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get provider dashboard statistics
 */
export async function getProviderStats(
  providerId: string,
): Promise<DashboardStats> {
  try {
    // Verify provider exists
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    return await getProviderDashboardStats(providerId);
  } catch (error) {
    logger.error(`Get provider stats for ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get customer dashboard statistics
 */
export async function getCustomerStats(customerId: string): Promise<{
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  disputedBookings: number;
  totalSpent: number;
}> {
  try {
    // Verify customer exists
    const customer = await findUserById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    return await getCustomerDashboardStats(customerId);
  } catch (error) {
    logger.error(`Get customer stats for ${customerId} failed:`, error);
    throw error;
  }
}

/**
 * Check for booking conflicts
 */
export async function checkBookingConflict(
  data: BookingConflictCheck,
): Promise<boolean> {
  try {
    const scheduledDate = new Date(data.scheduledDate);
    const durationMinutes = data.durationMinutes || 60;

    // Calculate end time
    const endTime = new Date(scheduledDate.getTime() + durationMinutes * 60000);

    // Find overlapping bookings using Prisma
    const { prisma } = require("../../config/database");

    const overlappingBookings = await prisma.booking.findMany({
      where: {
        providerId: data.providerId,
        status: {
          in: ["PENDING", "CONFIRMED", "IN_PROGRESS"],
        },
        OR: [
          {
            scheduledDate: {
              gte: scheduledDate,
              lt: endTime,
            },
          },
          {
            estimatedEndDate: {
              gt: scheduledDate,
              lte: endTime,
            },
          },
          {
            AND: [
              { scheduledDate: { lte: scheduledDate } },
              { estimatedEndDate: { gte: endTime } },
            ],
          },
        ],
      },
    });

    return overlappingBookings.length > 0;
  } catch (error) {
    logger.error("Check booking conflict failed:", error);
    throw error;
  }
}

/**
 * Validate booking status transition
 */
export function validateBookingStatusTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus,
  userRole: string,
): boolean {
  // Admin can do any transition
  if (userRole === "ADMIN") {
    return true;
  }

  const allowedTransitions = BOOKING_TRANSITIONS[currentStatus] || [];

  return allowedTransitions.includes(newStatus);
}

/**
 * Send booking confirmation notifications
 */
export async function sendBookingConfirmation(
  booking: BookingWithRelations,
): Promise<void> {
  try {
    const provider = await findProviderById(booking.providerId);
    const customer = await findUserById(booking.customerId);

    if (!provider || !customer) {
      throw new Error("Provider or customer not found");
    }

    const scheduledDate = new Date(booking.scheduledDate);
    const formattedDate = scheduledDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send email to customer
    const emailTemplate = getBookingConfirmationEmailTemplate({
      customerName: customer.fullName,
      providerName: provider.businessName,
      bookingNumber: booking.bookingNumber,
      scheduledDate,
      serviceTitle: booking.service?.title || "Service",
      totalPrice: booking.totalPrice,
      address: booking.address,
      providerPhone: customer.phone,
      providerEmail: customer.email,
    });

    await sendEmail({
      to: customer.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    // Send SMS to customer
    await sendSMS({
      to: customer.phone,
      body: getBookingConfirmationSMSTemplate(
        booking.bookingNumber,
        provider.businessName,
        formattedDate,
        formattedTime,
      ),
    });

    // Create notification
    await createNotification({
      userId: customer.id,
      type: "EMAIL",
      title: "Booking Confirmed",
      message: `Your booking ${booking.bookingNumber} has been confirmed with ${provider.businessName}`,
      data: { bookingId: booking.id },
    });

    logger.info(`Booking confirmation sent for ${booking.bookingNumber}`);
  } catch (error) {
    logger.error("Send booking confirmation failed:", error);
    throw error;
  }
}

/**
 * Send status update notification
 */
export async function sendStatusUpdateNotification(
  booking: Booking,
  status: BookingStatus,
): Promise<void> {
  try {
    const provider = await findProviderById(booking.providerId);
    const customer = await findUserById(booking.customerId);

    if (!provider || !customer) {
      throw new Error("Provider or customer not found");
    }

    const statusMap: Record<string, string> = {
      CONFIRMED: "confirmed",
      IN_PROGRESS: "is in progress",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
    };

    const statusText = statusMap[status] || status.toLowerCase();

    // Send SMS to customer
    await sendSMS({
      to: customer.phone,
      body: getBookingStatusSMSTemplate(
        booking.bookingNumber,
        statusText,
        provider.businessName,
      ),
    });

    // Create notification
    await createNotification({
      userId: customer.id,
      type: "EMAIL",
      title: `Booking ${statusText}`,
      message: `Your booking ${booking.bookingNumber} has been ${statusText}`,
      data: { bookingId: booking.id, status },
    });

    logger.info(`Status update notification sent for ${booking.bookingNumber}`);
  } catch (error) {
    logger.error("Send status update notification failed:", error);
    throw error;
  }
}

/**
 * Get all bookings with filters (admin only)
 */
export async function getAllBookings(
  filters: {
    status?: BookingStatus;
    providerId?: string;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  },
  page: number = 1,
  limit: number = 20,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<{
  data: BookingWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    return await getBookings(filters, page, limit, sortBy, sortOrder);
  } catch (error) {
    logger.error("Get all bookings failed:", error);
    throw error;
  }
}

/**
 * Check if booking exists
 */
export async function checkBookingExists(id: string): Promise<boolean> {
  return await bookingExists(id);
}

/**
 * Check if customer owns booking
 */
export async function checkBookingCustomer(
  id: string,
  customerId: string,
): Promise<boolean> {
  return await isBookingCustomer(id, customerId);
}

/**
 * Check if provider owns booking
 */
export async function checkBookingProvider(
  id: string,
  providerId: string,
): Promise<boolean> {
  return await isBookingProvider(id, providerId);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createBooking,
  getBookingById,
  getBookingByNumber,
  getCustomerBookings,
  getProviderBookings,
  updateBookingData,
  updateBookingStatusService,
  cancelBookingService,
  confirmBookingService,
  startBookingService,
  completeBookingService,
  getProviderStats,
  getCustomerStats,
  checkBookingConflict,
  validateBookingStatusTransition,
  sendBookingConfirmation,
  sendStatusUpdateNotification,
  getAllBookings,
  checkBookingExists,
  checkBookingCustomer,
  checkBookingProvider,
};
