import { Prisma, Review, ReviewResponse, PrismaClient } from "@prisma/client";
import prisma from "../config/database";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface ReviewFilters {
  providerId?: string;
  reviewerId?: string;
  bookingId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
  isVerified?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ReviewCreateData {
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string;
  images?: string[];
  isPublic?: boolean;
}

export interface ReviewUpdateData {
  rating?: number;
  comment?: string;
  images?: string[];
  isPublic?: boolean;
  isVerified?: boolean;
}

export interface ReviewWithRelations extends Review {
  reviewer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  provider?: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
  };
  booking?: {
    id: string;
    bookingNumber: string;
    scheduledDate: Date;
    totalPrice: number;
  };
  responses?: ReviewResponse[];
}

export interface ReviewResponseData {
  reviewId: string;
  providerId: string;
  response: string;
}

export interface ProviderRatingStats {
  providerId: string;
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
// REVIEW REPOSITORY
// ============================================================

/**
 * Create a new review
 */
export async function createReview(data: ReviewCreateData): Promise<Review> {
  try {
    // Check if review already exists for this booking
    const existingReview = await prisma.review.findUnique({
      where: { bookingId: data.bookingId },
      select: { id: true },
    });

    if (existingReview) {
      throw new Error("A review already exists for this booking");
    }

    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        reviewerId: data.reviewerId,
        providerId: data.providerId,
        rating: data.rating,
        comment: data.comment,
        images: data.images || [],
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        isVerified: false,
      },
    });

    // Update provider rating
    await updateProviderRating(data.providerId);

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
 * Find review by ID
 */
export async function findReviewById(
  id: string,
): Promise<ReviewWithRelations | null> {
  try {
    return await prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        provider: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessLogo: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            scheduledDate: true,
            totalPrice: true,
          },
        },
        reviewResponses: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    logger.error(`Find review ${id} failed:`, error);
    throw error;
  }
}

/**
 * Find review by booking ID
 */
export async function findReviewByBookingId(
  bookingId: string,
): Promise<Review | null> {
  try {
    return await prisma.review.findUnique({
      where: { bookingId },
    });
  } catch (error) {
    logger.error(`Find review by booking ${bookingId} failed:`, error);
    throw error;
  }
}

/**
 * Get reviews by provider ID
 */
export async function getReviewsByProvider(
  providerId: string,
  filters: ReviewFilters = {},
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
  stats: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
}> {
  try {
    const where: Prisma.ReviewWhereInput = {
      providerId,
    };

    if (filters.rating !== undefined) {
      where.rating = filters.rating;
    }

    if (filters.minRating !== undefined) {
      where.rating = { ...where.rating, gte: filters.minRating };
    }

    if (filters.maxRating !== undefined) {
      where.rating = { ...where.rating, lte: filters.maxRating };
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.search) {
      where.comment = { contains: filters.search, mode: "insensitive" };
    }

    if (filters.startDate) {
      where.createdAt = { gte: filters.startDate };
    }

    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: filters.endDate };
    }

    // Get total count
    const totalItems = await prisma.review.count({ where });

    // Get paginated data
    const skip = (page - 1) * limit;
    const data = await prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        provider: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessLogo: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            scheduledDate: true,
            totalPrice: true,
          },
        },
        reviewResponses: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Calculate stats
    const stats = await getProviderRatingStats(providerId);

    const totalPages = Math.ceil(totalItems / limit);
    const pagination = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, pagination, stats };
  } catch (error) {
    logger.error(`Get reviews by provider ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get reviews by reviewer ID
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
    const where: Prisma.ReviewWhereInput = {
      reviewerId,
    };

    const totalItems = await prisma.review.count({ where });

    const skip = (page - 1) * limit;
    const data = await prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        provider: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessLogo: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            scheduledDate: true,
            totalPrice: true,
          },
        },
        reviewResponses: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const totalPages = Math.ceil(totalItems / limit);
    const pagination = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, pagination };
  } catch (error) {
    logger.error(`Get reviews by reviewer ${reviewerId} failed:`, error);
    throw error;
  }
}

/**
 * Update review
 */
export async function updateReview(
  id: string,
  data: ReviewUpdateData,
): Promise<Review> {
  try {
    const review = await prisma.review.update({
      where: { id },
      data,
    });

    // Update provider rating if rating changed
    if (data.rating !== undefined) {
      await updateProviderRating(review.providerId);
    }

    logger.info(`Review ${id} updated`);

    return review;
  } catch (error) {
    logger.error(`Update review ${id} failed:`, error);
    throw error;
  }
}

/**
 * Delete review
 */
export async function deleteReview(id: string): Promise<Review> {
  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { providerId: true },
    });

    const deleted = await prisma.review.delete({
      where: { id },
    });

    if (review) {
      await updateProviderRating(review.providerId);
    }

    logger.info(`Review ${id} deleted`);

    return deleted;
  } catch (error) {
    logger.error(`Delete review ${id} failed:`, error);
    throw error;
  }
}

/**
 * Verify review (admin only)
 */
export async function verifyReview(
  id: string,
  isVerified: boolean,
): Promise<Review> {
  try {
    return await prisma.review.update({
      where: { id },
      data: { isVerified },
    });
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
export async function addReviewResponse(
  data: ReviewResponseData,
): Promise<ReviewResponse> {
  try {
    const response = await prisma.reviewResponse.create({
      data: {
        reviewId: data.reviewId,
        providerId: data.providerId,
        response: data.response,
      },
    });

    logger.info(`Response added to review ${data.reviewId}`);

    return response;
  } catch (error) {
    logger.error("Add review response failed:", error);
    throw error;
  }
}

/**
 * Update review response
 */
export async function updateReviewResponse(
  id: string,
  response: string,
): Promise<ReviewResponse> {
  try {
    return await prisma.reviewResponse.update({
      where: { id },
      data: { response },
    });
  } catch (error) {
    logger.error(`Update review response ${id} failed:`, error);
    throw error;
  }
}

/**
 * Delete review response
 */
export async function deleteReviewResponse(
  id: string,
): Promise<ReviewResponse> {
  try {
    return await prisma.reviewResponse.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Delete review response ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get review responses by review ID
 */
export async function getReviewResponsesByReviewId(
  reviewId: string,
): Promise<ReviewResponse[]> {
  try {
    return await prisma.reviewResponse.findMany({
      where: { reviewId },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    logger.error(`Get review responses by review ${reviewId} failed:`, error);
    throw error;
  }
}

// ============================================================
// PROVIDER RATING STATS
// ============================================================

/**
 * Update provider rating
 */
export async function updateProviderRating(providerId: string): Promise<void> {
  try {
    const result = await prisma.review.aggregate({
      where: { providerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        averageRating: result._avg.rating || 0,
        totalReviews: result._count.rating || 0,
      },
    });
  } catch (error) {
    logger.error(`Update provider rating ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get provider rating stats
 */
export async function getProviderRatingStats(
  providerId: string,
): Promise<ProviderRatingStats> {
  try {
    const [averageResult, distribution] = await Promise.all([
      prisma.review.aggregate({
        where: { providerId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { providerId },
        _count: {
          rating: true,
        },
      }),
    ]);

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    distribution.forEach((item) => {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingDistribution[item.rating as 1 | 2 | 3 | 4 | 5] =
          item._count.rating;
      }
    });

    return {
      providerId,
      averageRating: averageResult._avg.rating || 0,
      totalReviews: averageResult._count.rating || 0,
      ratingDistribution,
    };
  } catch (error) {
    logger.error(`Get provider rating stats ${providerId} failed:`, error);
    throw error;
  }
}

// ============================================================
// REVIEW VALIDATION HELPERS
// ============================================================

/**
 * Check if review exists
 */
export async function reviewExists(id: string): Promise<boolean> {
  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!review;
  } catch (error) {
    logger.error(`Check review exists ${id} failed:`, error);
    return false;
  }
}

/**
 * Check if booking has review
 */
export async function bookingHasReview(bookingId: string): Promise<boolean> {
  try {
    const review = await prisma.review.findUnique({
      where: { bookingId },
      select: { id: true },
    });
    return !!review;
  } catch (error) {
    logger.error(`Check booking has review ${bookingId} failed:`, error);
    return false;
  }
}

/**
 * Check if reviewer owns review
 */
export async function isReviewOwner(
  id: string,
  reviewerId: string,
): Promise<boolean> {
  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { reviewerId: true },
    });
    return review?.reviewerId === reviewerId;
  } catch (error) {
    logger.error(`Check review owner ${id} failed:`, error);
    return false;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createReview,
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
};
