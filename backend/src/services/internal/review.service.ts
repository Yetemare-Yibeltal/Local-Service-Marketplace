import { Review, ReviewResponse } from "@prisma/client";
import {
  createReview as createReviewRepo,
  findReviewById,
  findReviewByBookingId,
  getReviewsByProvider,
  getReviewsByReviewer,
  updateReview,
  deleteReview,
  verifyReview,
  addReviewResponse,
  updateReviewResponse,
  deleteReviewResponse,
  getReviewResponsesByReviewId,
  updateProviderRating,
  getProviderRatingStats,
  reviewExists,
  bookingHasReview,
  isReviewOwner,
  ReviewCreateData,
  ReviewUpdateData,
  ReviewWithRelations,
  ProviderRatingStats,
} from "../../repositories/review.repository";
import {
  findBookingById,
  updateBookingStatus as updateBookingStatusRepo,
} from "../../repositories/booking.repository";
import { findProviderById } from "../../repositories/provider.repository";
import { findUserById } from "../../repositories/user.repository";
import {
  sendEmail,
  getReviewNotificationEmailTemplate,
} from "../../config/email";
import { sendSMS } from "../../config/twilio";
import { createNotification } from "../../repositories/notification.repository";
import logger from "../../utils/logger";
import { validateRequired, isValidLength } from "../../utils/validator";

// ============================================================
// TYPES
// ============================================================

export interface CreateReviewData {
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string;
  images?: string[];
  isPublic?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  images?: string[];
  isPublic?: boolean;
}

export interface ReviewResponseData {
  reviewId: string;
  providerId: string;
  response: string;
}

export interface ReviewStats {
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
// REVIEW SERVICE
// ============================================================

/**
 * Create a new review
 */
export async function createReview(data: CreateReviewData): Promise<Review> {
  try {
    // Validate inputs
    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (!data.comment || data.comment.length < 3) {
      throw new Error("Comment must be at least 3 characters");
    }

    if (data.comment.length > 1000) {
      throw new Error("Comment must not exceed 1000 characters");
    }

    // Validate booking exists and is completed
    const booking = await findBookingById(data.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== "COMPLETED") {
      throw new Error("Reviews can only be submitted for completed bookings");
    }

    // Check if review already exists
    const existingReview = await findReviewByBookingId(data.bookingId);
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

    // Create review
    const reviewData: ReviewCreateData = {
      bookingId: data.bookingId,
      reviewerId: data.reviewerId,
      providerId: data.providerId,
      rating: data.rating,
      comment: data.comment,
      images: data.images || [],
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
    };

    const review = await createReviewRepo(reviewData);

    // Update provider rating
    await updateProviderRating(data.providerId);

    // Send notification to provider
    try {
      await sendReviewNotification(review, booking);
    } catch (error) {
      logger.error("Failed to send review notification:", error);
    }

    logger.info(
      `Review created for booking ${data.bookingId} with rating ${data.rating}`,
    );

    return review;
  } catch (error) {
    logger.error("Create review failed:", error);
    throw error;
  }
}

/**
 * Get review by ID
 */
export async function getReviewById(
  id: string,
): Promise<ReviewWithRelations | null> {
  try {
    return await findReviewById(id);
  } catch (error) {
    logger.error(`Get review ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get review by booking ID
 */
export async function getReviewByBookingId(
  bookingId: string,
): Promise<Review | null> {
  try {
    return await findReviewByBookingId(bookingId);
  } catch (error) {
    logger.error(`Get review by booking ${bookingId} failed:`, error);
    throw error;
  }
}

/**
 * Get reviews for a provider
 */
export async function getProviderReviews(
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
  data: ReviewWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: ProviderRatingStats;
}> {
  try {
    // Verify provider exists
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    return await getReviewsByProvider(providerId, filters, page, limit);
  } catch (error) {
    logger.error(`Get provider reviews for ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get reviews by reviewer
 */
export async function getReviewsByReviewer(
  reviewerId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: ReviewWithRelations[];
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
    // Verify reviewer exists
    const reviewer = await findUserById(reviewerId);
    if (!reviewer) {
      throw new Error("Reviewer not found");
    }

    return await getReviewsByReviewer(reviewerId, page, limit);
  } catch (error) {
    logger.error(`Get reviews by reviewer ${reviewerId} failed:`, error);
    throw error;
  }
}

/**
 * Update review
 */
export async function updateReviewById(
  id: string,
  data: UpdateReviewData,
  userId: string,
): Promise<Review> {
  try {
    // Check if review exists
    const existing = await findReviewById(id);
    if (!existing) {
      throw new Error("Review not found");
    }

    // Check ownership
    if (existing.reviewerId !== userId) {
      throw new Error("You do not have permission to update this review");
    }

    // Validate data
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (data.comment !== undefined && data.comment.length < 3) {
      throw new Error("Comment must be at least 3 characters");
    }

    if (data.comment !== undefined && data.comment.length > 1000) {
      throw new Error("Comment must not exceed 1000 characters");
    }

    const review = await updateReview(id, data);

    // Update provider rating if rating changed
    if (data.rating !== undefined) {
      await updateProviderRating(existing.providerId);
    }

    logger.info(`Review ${id} updated by user ${userId}`);

    return review;
  } catch (error) {
    logger.error(`Update review ${id} failed:`, error);
    throw error;
  }
}

/**
 * Delete review
 */
export async function deleteReviewById(
  id: string,
  userId: string,
): Promise<Review> {
  try {
    // Check if review exists
    const existing = await findReviewById(id);
    if (!existing) {
      throw new Error("Review not found");
    }

    // Check ownership or admin
    if (existing.reviewerId !== userId) {
      throw new Error("You do not have permission to delete this review");
    }

    const review = await deleteReview(id);

    // Update provider rating
    await updateProviderRating(existing.providerId);

    logger.info(`Review ${id} deleted by user ${userId}`);

    return review;
  } catch (error) {
    logger.error(`Delete review ${id} failed:`, error);
    throw error;
  }
}

/**
 * Verify review (admin only)
 */
export async function verifyReviewById(
  id: string,
  isVerified: boolean,
): Promise<Review> {
  try {
    const existing = await findReviewById(id);
    if (!existing) {
      throw new Error("Review not found");
    }

    const review = await verifyReview(id, isVerified);

    logger.info(`Review ${id} verification status set to ${isVerified}`);

    return review;
  } catch (error) {
    logger.error(`Verify review ${id} failed:`, error);
    throw error;
  }
}

// ============================================================
// REVIEW RESPONSE
// ============================================================

/**
 * Add response to review
 */
export async function addResponseToReview(
  data: ReviewResponseData,
): Promise<ReviewResponse> {
  try {
    // Validate review exists
    const review = await findReviewById(data.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Validate provider owns the review
    if (review.providerId !== data.providerId) {
      throw new Error("You do not have permission to respond to this review");
    }

    // Validate response length
    if (!data.response || data.response.length < 3) {
      throw new Error("Response must be at least 3 characters");
    }

    if (data.response.length > 1000) {
      throw new Error("Response must not exceed 1000 characters");
    }

    // Check if response already exists
    const existingResponses = await getReviewResponsesByReviewId(data.reviewId);
    if (existingResponses.length > 0) {
      throw new Error("A response already exists for this review");
    }

    const response = await addReviewResponse(data);

    logger.info(`Response added to review ${data.reviewId}`);

    return response;
  } catch (error) {
    logger.error("Add response to review failed:", error);
    throw error;
  }
}

/**
 * Update review response
 */
export async function updateReviewResponseById(
  id: string,
  response: string,
  providerId: string,
): Promise<ReviewResponse> {
  try {
    // Get existing response
    const existing = await getReviewResponsesByReviewId(id);
    if (existing.length === 0) {
      throw new Error("Response not found");
    }

    const responseObj = existing[0];

    // Verify provider owns the response
    if (responseObj.providerId !== providerId) {
      throw new Error("You do not have permission to update this response");
    }

    // Validate response length
    if (!response || response.length < 3) {
      throw new Error("Response must be at least 3 characters");
    }

    if (response.length > 1000) {
      throw new Error("Response must not exceed 1000 characters");
    }

    const updatedResponse = await updateReviewResponse(
      responseObj.id,
      response,
    );

    logger.info(`Review response ${responseObj.id} updated`);

    return updatedResponse;
  } catch (error) {
    logger.error(`Update review response failed:`, error);
    throw error;
  }
}

/**
 * Delete review response
 */
export async function deleteReviewResponseById(
  id: string,
  providerId: string,
): Promise<ReviewResponse> {
  try {
    // Get existing response
    const existing = await getReviewResponsesByReviewId(id);
    if (existing.length === 0) {
      throw new Error("Response not found");
    }

    const responseObj = existing[0];

    // Verify provider owns the response
    if (responseObj.providerId !== providerId) {
      throw new Error("You do not have permission to delete this response");
    }

    const deletedResponse = await deleteReviewResponse(responseObj.id);

    logger.info(`Review response ${responseObj.id} deleted`);

    return deletedResponse;
  } catch (error) {
    logger.error(`Delete review response failed:`, error);
    throw error;
  }
}

/**
 * Get review responses by review ID
 */
export async function getReviewResponses(
  reviewId: string,
): Promise<ReviewResponse[]> {
  try {
    return await getReviewResponsesByReviewId(reviewId);
  } catch (error) {
    logger.error(`Get review responses for ${reviewId} failed:`, error);
    throw error;
  }
}

// ============================================================
// PROVIDER RATING STATS
// ============================================================

/**
 * Get provider rating statistics
 */
export async function getProviderRatingStatsService(
  providerId: string,
): Promise<ProviderRatingStats> {
  try {
    // Verify provider exists
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    return await getProviderRatingStats(providerId);
  } catch (error) {
    logger.error(`Get provider rating stats for ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Refresh provider rating
 */
export async function refreshProviderRating(providerId: string): Promise<void> {
  try {
    await updateProviderRating(providerId);
    logger.info(`Provider rating refreshed for ${providerId}`);
  } catch (error) {
    logger.error(`Refresh provider rating for ${providerId} failed:`, error);
    throw error;
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

/**
 * Send review notification to provider
 */
export async function sendReviewNotification(
  review: Review,
  booking: any,
): Promise<void> {
  try {
    const provider = await findProviderById(review.providerId);
    const reviewer = await findUserById(review.reviewerId);

    if (!provider || !reviewer) {
      throw new Error("Provider or reviewer not found");
    }

    // Send email to provider
    const emailTemplate = getReviewNotificationEmailTemplate({
      providerName: provider.businessName,
      customerName: reviewer.fullName,
      rating: review.rating,
      comment: review.comment,
      bookingNumber: booking.bookingNumber,
    });

    await sendEmail({
      to: reviewer.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    // Create notification
    await createNotification({
      userId: provider.userId,
      type: "EMAIL",
      title: "New Review Received",
      message: `${reviewer.fullName} left a ${review.rating}-star review for your service`,
      data: { reviewId: review.id, bookingId: booking.id },
    });

    logger.info(`Review notification sent to provider ${review.providerId}`);
  } catch (error) {
    logger.error("Send review notification failed:", error);
    throw error;
  }
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Check if review exists
 */
export async function checkReviewExists(id: string): Promise<boolean> {
  return await reviewExists(id);
}

/**
 * Check if booking has review
 */
export async function checkBookingHasReview(
  bookingId: string,
): Promise<boolean> {
  return await bookingHasReview(bookingId);
}

/**
 * Check if user owns review
 */
export async function checkReviewOwner(
  id: string,
  userId: string,
): Promise<boolean> {
  return await isReviewOwner(id, userId);
}

/**
 * Validate review rating
 */
export function isValidRating(rating: number): boolean {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
}

/**
 * Validate review comment
 */
export function isValidComment(comment: string): boolean {
  return comment && comment.length >= 3 && comment.length <= 1000;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
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
};
