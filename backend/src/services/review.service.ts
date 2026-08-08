import internalReviewService from "./internal/review.service";
import { findUserById } from "../repositories/user.repository";
import { findProviderById } from "../repositories/provider.repository";
import { findBookingById } from "../repositories/booking.repository";
import { createNotification } from "../repositories/notification.repository";
import { sendEmail, getReviewNotificationEmailTemplate } from "../config/email";
import { sendSMS } from "../config/twilio";
import logger from "../utils/logger";
import { uploadReviewImage } from "../services/external/cloudinary.service";

// ============================================================
// REVIEW SERVICE (ROOT LEVEL)
// This service re-exports all functionality from the internal
// review service and adds application-specific convenience
// methods for review management, rating aggregation, and
// review notifications.
// ============================================================

// Re-export all methods from the internal service
export const {
  createReview,
  getReviewById,
  getReviewByBookingId,
  getProviderReviews,
  getReviewsByReviewer,
  updateReviewById,
  deleteReviewById,
  verifyReviewById,
  addResponseToReview,
  updateReviewResponseById,
  deleteReviewResponseById,
  getReviewResponses,
  getProviderRatingStatsService,
  refreshProviderRating,
  sendReviewNotification,
  checkReviewExists,
  checkBookingHasReview,
  checkReviewOwner,
  isValidRating,
  isValidComment,
} = internalReviewService;

// ============================================================
// TYPES
// ============================================================

export interface CreateReviewData {
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string;
  images?: string[] | Buffer[];
  isPublic?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  images?: string[] | Buffer[];
  isPublic?: boolean;
}

export interface ReviewResponseData {
  reviewId: string;
  providerId: string;
  response: string;
}

export interface ProviderReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ============================================================
// APPLICATION-SPECIFIC REVIEW METHODS
// ============================================================

/**
 * Create a new review with image uploads
 */
export async function createReviewWithImages(
  data: CreateReviewData,
): Promise<any> {
  try {
    // Validate booking exists and is completed
    const booking = await findBookingById(data.bookingId);
    if (!booking) {
      throw new Error(`Booking ${data.bookingId} not found`);
    }

    if (booking.status !== "COMPLETED") {
      throw new Error("Reviews can only be submitted for completed bookings");
    }

    // Check if review already exists
    const existingReview = await checkBookingHasReview(data.bookingId);
    if (existingReview) {
      throw new Error("A review already exists for this booking");
    }

    // Validate reviewer is the customer
    if (booking.customerId !== data.reviewerId) {
      throw new Error(
        "Only the customer who made the booking can submit a review",
      );
    }

    // Validate provider matches
    if (booking.providerId !== data.providerId) {
      throw new Error("Provider mismatch");
    }

    // Upload images if provided
    let imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      try {
        for (let i = 0; i < data.images.length && i < 5; i++) {
          const image = data.images[i];
          if (image instanceof Buffer) {
            const uploadResult = await uploadReviewImage(image, data.bookingId);
            imageUrls.push(uploadResult.secureUrl);
          } else if (typeof image === "string") {
            // If already a URL, use as is
            if (image.startsWith("http")) {
              imageUrls.push(image);
            }
          }
        }
      } catch (error) {
        logger.error("Review image upload failed:", error);
        // Continue without images
      }
    }

    // Create review
    const review = await createReview({
      bookingId: data.bookingId,
      reviewerId: data.reviewerId,
      providerId: data.providerId,
      rating: data.rating,
      comment: data.comment,
      images: imageUrls,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
    });

    // Send notifications
    try {
      await sendReviewNotificationToProvider(review.id, data.providerId);
    } catch (error) {
      logger.error("Failed to send review notification:", error);
    }

    logger.info(
      `Review created for booking ${data.bookingId} with rating ${data.rating}`,
    );

    return review;
  } catch (error) {
    logger.error("Create review with images failed:", error);
    throw error;
  }
}

/**
 * Update review with optional new images
 */
export async function updateReviewWithImages(
  reviewId: string,
  userId: string,
  data: UpdateReviewData,
): Promise<any> {
  try {
    // Check if review exists and user owns it
    const existing = await getReviewById(reviewId);
    if (!existing) {
      throw new Error(`Review ${reviewId} not found`);
    }

    if (existing.reviewerId !== userId) {
      throw new Error("You do not have permission to update this review");
    }

    // Upload new images if provided
    let imageUrls: string[] | undefined;
    if (data.images && data.images.length > 0) {
      imageUrls = [];
      try {
        for (let i = 0; i < data.images.length && i < 5; i++) {
          const image = data.images[i];
          if (image instanceof Buffer) {
            const uploadResult = await uploadReviewImage(
              image,
              existing.bookingId,
            );
            imageUrls.push(uploadResult.secureUrl);
          } else if (typeof image === "string" && image.startsWith("http")) {
            imageUrls.push(image);
          }
        }
      } catch (error) {
        logger.error("Review image upload failed:", error);
      }
    }

    const review = await updateReviewById(reviewId, {
      rating: data.rating,
      comment: data.comment,
      images: imageUrls,
      isPublic: data.isPublic,
    });

    // Refresh provider rating if rating changed
    if (data.rating !== undefined) {
      await refreshProviderRating(existing.providerId);
    }

    logger.info(`Review ${reviewId} updated by user ${userId}`);

    return review;
  } catch (error) {
    logger.error(`Update review with images ${reviewId} failed:`, error);
    throw error;
  }
}

/**
 * Get reviews for a provider with statistics
 */
export async function getProviderReviewsWithStats(
  providerId: string,
  filters: {
    rating?: number;
    minRating?: number;
    maxRating?: number;
    isPublic?: boolean;
    isVerified?: boolean;
    search?: string;
  } = {},
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: any[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: ProviderReviewStats;
}> {
  try {
    // Verify provider exists
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const result = await getProviderReviews(providerId, filters, page, limit);

    const stats: ProviderReviewStats = {
      averageRating: result.stats.averageRating || 0,
      totalReviews: result.stats.totalReviews || 0,
      ratingDistribution: result.stats.ratingDistribution || {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };

    return {
      data: result.data,
      pagination: result.pagination,
      stats,
    };
  } catch (error) {
    logger.error(
      `Get provider reviews with stats for ${providerId} failed:`,
      error,
    );
    throw error;
  }
}

/**
 * Get a single review with all relations
 */
export async function getFullReviewById(reviewId: string): Promise<any> {
  try {
    const review = await getReviewById(reviewId);
    if (!review) {
      return null;
    }

    const responses = await getReviewResponses(reviewId);

    return {
      ...review,
      responses,
    };
  } catch (error) {
    logger.error(`Get full review ${reviewId} failed:`, error);
    throw error;
  }
}

/**
 * Send review notification to provider
 */
export async function sendReviewNotificationToProvider(
  reviewId: string,
  providerId: string,
): Promise<void> {
  try {
    const review = await getReviewById(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const reviewer = await findUserById(review.reviewerId);
    if (!reviewer) {
      throw new Error(`Reviewer ${review.reviewerId} not found`);
    }

    // Create in-app notification
    await createNotification({
      userId: provider.userId,
      type: "EMAIL",
      title: "New Review Received",
      message: `${reviewer.fullName} left a ${review.rating}-star review on your service`,
      data: {
        reviewId: review.id,
        rating: review.rating,
        reviewerName: reviewer.fullName,
      },
    });

    // Send email notification
    try {
      const emailTemplate = getReviewNotificationEmailTemplate({
        providerName: provider.businessName,
        customerName: reviewer.fullName,
        rating: review.rating,
        comment: review.comment,
        bookingNumber: review.booking?.bookingNumber || "N/A",
      });

      await sendEmail({
        to: reviewer.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    } catch (error) {
      logger.error("Failed to send review notification email:", error);
    }

    // Send SMS notification
    try {
      const booking = await findBookingById(review.bookingId);
      await sendSMS({
        to: reviewer.phone,
        body: `New review from ${reviewer.fullName}: ${review.rating} stars. View in your dashboard.`,
      });
    } catch (error) {
      logger.error("Failed to send review notification SMS:", error);
    }

    logger.info(`Review notification sent to provider ${providerId}`);
  } catch (error) {
    logger.error(
      `Send review notification to provider ${providerId} failed:`,
      error,
    );
    throw error;
  }
}

/**
 * Get provider average rating
 */
export async function getProviderAverageRating(
  providerId: string,
): Promise<number> {
  try {
    const stats = await getProviderRatingStatsService(providerId);
    return stats.averageRating || 0;
  } catch (error) {
    logger.error(`Get provider average rating ${providerId} failed:`, error);
    return 0;
  }
}

/**
 * Get provider review summary
 */
export async function getProviderReviewSummary(providerId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: any[];
}> {
  try {
    const result = await getProviderReviewsWithStats(providerId, {}, 1, 5);

    return {
      averageRating: result.stats.averageRating,
      totalReviews: result.stats.totalReviews,
      ratingDistribution: result.stats.ratingDistribution,
      recentReviews: result.data,
    };
  } catch (error) {
    logger.error(`Get provider review summary ${providerId} failed:`, error);
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentReviews: [],
    };
  }
}

/**
 * Get reviews by booking ID with details
 */
export async function getReviewForBooking(bookingId: string): Promise<any> {
  try {
    const review = await getReviewByBookingId(bookingId);
    if (!review) {
      return null;
    }

    const responses = await getReviewResponses(review.id);

    return {
      ...review,
      responses,
    };
  } catch (error) {
    logger.error(`Get review for booking ${bookingId} failed:`, error);
    return null;
  }
}

/**
 * Delete review with cleanup
 */
export async function deleteReviewWithCleanup(
  reviewId: string,
  userId: string,
): Promise<any> {
  try {
    const existing = await getReviewById(reviewId);
    if (!existing) {
      throw new Error(`Review ${reviewId} not found`);
    }

    // Check ownership or admin
    if (existing.reviewerId !== userId) {
      throw new Error("You do not have permission to delete this review");
    }

    const review = await deleteReviewById(reviewId, userId);

    // Refresh provider rating
    await refreshProviderRating(existing.providerId);

    logger.info(`Review ${reviewId} deleted by user ${userId}`);

    return review;
  } catch (error) {
    logger.error(`Delete review with cleanup ${reviewId} failed:`, error);
    throw error;
  }
}

/**
 * Verify review and update provider rating
 */
export async function verifyReviewAndUpdate(
  reviewId: string,
  isVerified: boolean,
): Promise<any> {
  try {
    const review = await verifyReviewById(reviewId, isVerified);

    // Refresh provider rating
    await refreshProviderRating(review.providerId);

    logger.info(`Review ${reviewId} verification status set to ${isVerified}`);

    return review;
  } catch (error) {
    logger.error(`Verify review and update ${reviewId} failed:`, error);
    throw error;
  }
}

/**
 * Check if user can review a booking
 */
export async function canUserReviewBooking(
  userId: string,
  bookingId: string,
): Promise<{
  canReview: boolean;
  reason?: string;
}> {
  try {
    const booking = await findBookingById(bookingId);
    if (!booking) {
      return { canReview: false, reason: "Booking not found" };
    }

    if (booking.status !== "COMPLETED") {
      return {
        canReview: false,
        reason: "Booking must be completed to review",
      };
    }

    if (booking.customerId !== userId) {
      return {
        canReview: false,
        reason: "Only the customer can review this booking",
      };
    }

    const hasReview = await checkBookingHasReview(bookingId);
    if (hasReview) {
      return {
        canReview: false,
        reason: "A review already exists for this booking",
      };
    }

    return { canReview: true };
  } catch (error) {
    logger.error(`Can user review booking ${bookingId} failed:`, error);
    return { canReview: false, reason: "Error checking review eligibility" };
  }
}

/**
 * Get all reviews for admin
 */
export async function getAdminReviews(
  filters: {
    providerId?: string;
    reviewerId?: string;
    rating?: number;
    minRating?: number;
    maxRating?: number;
    isVerified?: boolean;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  },
  page: number = 1,
  limit: number = 20,
): Promise<{
  data: any[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalReviews: number;
    averageRating: number;
    verifiedReviews: number;
    unverifiedReviews: number;
    ratingDistribution: Record<number, number>;
  };
}> {
  try {
    const { prisma } = require("../config/database");

    const where: any = {};

    if (filters.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters.reviewerId) {
      where.reviewerId = filters.reviewerId;
    }

    if (filters.rating) {
      where.rating = filters.rating;
    }

    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }

    if (filters.maxRating) {
      where.rating = { ...where.rating, lte: filters.maxRating };
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.startDate) {
      where.createdAt = { gte: filters.startDate };
    }

    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: filters.endDate };
    }

    if (filters.search) {
      where.OR = [
        { comment: { contains: filters.search, mode: "insensitive" } },
        {
          reviewer: {
            fullName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          provider: {
            businessName: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    const [data, totalItems, summary] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
          provider: {
            select: { id: true, businessName: true, businessLogo: true },
          },
          booking: {
            select: { id: true, bookingNumber: true, scheduledDate: true },
          },
          reviewResponses: true,
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.review.groupBy({
        by: ["isVerified"],
        where,
        _count: { id: true },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where,
        _count: { id: true },
      }),
    ]);

    const ratingDistribution: Record<number, number> = {};
    (summary as any[]).forEach((item: any) => {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingDistribution[item.rating] = item._count.id;
      }
    });

    const totalReviews = summary[0]?._count?.id || 0;
    const averageRating = summary[0]?._avg?.rating || 0;

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary: {
        totalReviews,
        averageRating,
        verifiedReviews: 0,
        unverifiedReviews: 0,
        ratingDistribution,
      },
    };
  } catch (error) {
    logger.error("Get admin reviews failed:", error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Re-export internal service methods
  createReview,
  getReviewById,
  getReviewByBookingId,
  getProviderReviews,
  getReviewsByReviewer,
  updateReviewById,
  deleteReviewById,
  verifyReviewById,
  addResponseToReview,
  updateReviewResponseById,
  deleteReviewResponseById,
  getReviewResponses,
  getProviderRatingStatsService,
  refreshProviderRating,
  sendReviewNotification,
  checkReviewExists,
  checkBookingHasReview,
  checkReviewOwner,
  isValidRating,
  isValidComment,

  // Application-specific methods
  createReviewWithImages,
  updateReviewWithImages,
  getProviderReviewsWithStats,
  getFullReviewById,
  sendReviewNotificationToProvider,
  getProviderAverageRating,
  getProviderReviewSummary,
  getReviewForBooking,
  deleteReviewWithCleanup,
  verifyReviewAndUpdate,
  canUserReviewBooking,
  getAdminReviews,
};
