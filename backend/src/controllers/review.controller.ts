import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import {
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
  checkReviewExists,
  checkBookingHasReview,
  checkReviewOwner,
} from "../services/internal/review.service";
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  reviewFilterSchema,
  providerReviewsFilterSchema,
  reviewResponseSchema,
} from "../schemas/review.schema";
import { USER_ROLES } from "../utils/constants";
import logger from "../utils/logger";

// ============================================================
// REVIEW CONTROLLER
// ============================================================

// ============================================================
// CREATE REVIEW
// ============================================================

/**
 * Create a new review
 * @route POST /api/v1/reviews
 * @description Creates a new review for a completed booking
 * @header Authorization: Bearer {accessToken}
 * @body { bookingId, rating, comment, images? }
 * @returns { review } with 201 status
 */
export const createReviewController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = createReviewSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get booking to get provider ID
    const { findBookingById } =
      await import("../repositories/booking.repository");
    const booking = await findBookingById(validatedData.bookingId);

    if (!booking) {
      sendError(res, "Booking not found", 404);
      return;
    }

    // Verify user is the customer
    if (booking.customerId !== userId) {
      sendError(
        res,
        "Only the customer who made the booking can submit a review",
        403,
      );
      return;
    }

    // Verify booking is completed
    if (booking.status !== "COMPLETED") {
      sendError(
        res,
        "Reviews can only be submitted for completed bookings",
        400,
      );
      return;
    }

    // Check if review already exists
    const existingReview = await checkBookingHasReview(validatedData.bookingId);
    if (existingReview) {
      sendError(res, "A review already exists for this booking", 409);
      return;
    }

    const review = await createReview({
      bookingId: validatedData.bookingId,
      reviewerId: userId,
      providerId: booking.providerId,
      rating: validatedData.rating,
      comment: validatedData.comment,
      images: validatedData.images,
      isPublic: true,
    });

    sendSuccess(res, review, "Review submitted successfully", 201);
  },
);

// ============================================================
// GET REVIEWS
// ============================================================

/**
 * Get review by ID
 * @route GET /api/v1/reviews/:id
 * @description Retrieves a specific review by ID
 * @param {id} - Review ID
 * @returns { review } with 200 status
 */
export const getReviewByIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = reviewIdParamSchema.parse(req.params);

    const review = await getReviewById(validatedParams.id);

    if (!review) {
      sendError(res, "Review not found", 404);
      return;
    }

    // Check if review is public or user is authorized
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (
      !review.isPublic &&
      review.reviewerId !== userId &&
      userRole !== "ADMIN"
    ) {
      sendError(res, "You do not have permission to view this review", 403);
      return;
    }

    sendSuccess(res, review, "Review retrieved successfully");
  },
);

/**
 * Get review by booking ID
 * @route GET /api/v1/reviews/booking/:bookingId
 * @description Retrieves a review by booking ID
 * @param {bookingId} - Booking ID
 * @returns { review } with 200 status
 */
export const getReviewByBookingIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params;

    if (!bookingId) {
      sendError(res, "Booking ID is required", 400);
      return;
    }

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const review = await getReviewByBookingId(bookingId);

    if (!review) {
      sendError(res, "Review not found for this booking", 404);
      return;
    }

    // Check authorization
    if (
      !review.isPublic &&
      review.reviewerId !== userId &&
      userRole !== "ADMIN"
    ) {
      sendError(res, "You do not have permission to view this review", 403);
      return;
    }

    sendSuccess(res, review, "Review retrieved successfully");
  },
);

/**
 * Get reviews for a provider
 * @route GET /api/v1/reviews/provider/:providerId
 * @description Retrieves all reviews for a specific provider
 * @param {providerId} - Provider ID
 * @query { page, limit, rating, sortBy, sortOrder }
 * @returns { reviews, pagination, stats } with 200 status
 */
export const getProviderReviewsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { providerId } = req.params;

    if (!providerId) {
      sendError(res, "Provider ID is required", 400);
      return;
    }

    const validatedQuery = providerReviewsFilterSchema.parse({
      ...req.query,
      providerId,
    });

    const result = await getProviderReviews(
      providerId,
      {
        rating: validatedQuery.rating,
        isPublic: true,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 10,
    );

    // Prepare response with stats
    const stats = result.stats || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    sendPaginated(
      res,
      result.data,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.totalItems,
    );
  },
);

/**
 * Get reviews by the authenticated user (as reviewer)
 * @route GET /api/v1/reviews/my-reviews
 * @description Retrieves all reviews written by the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit }
 * @returns { reviews, pagination } with 200 status
 */
export const getMyReviewsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const { page = 1, limit = 10 } = req.query;

    const result = await getReviewsByReviewer(
      userId,
      Number(page),
      Number(limit),
    );

    sendPaginated(
      res,
      result.data,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.totalItems,
    );
  },
);

/**
 * Get all reviews (admin only)
 * @route GET /api/v1/reviews/admin
 * @description Retrieves all reviews with filters (admin only)
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, providerId, reviewerId, rating, minRating, maxRating, isVerified, startDate, endDate, search }
 * @returns { reviews, pagination, summary } with 200 status
 */
export const adminGetAllReviews = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedQuery = reviewFilterSchema.parse(req.query);

    const { getAdminReviews } = await import("../services/review.service");

    const result = await getAdminReviews(
      {
        providerId: validatedQuery.providerId,
        reviewerId: validatedQuery.reviewerId,
        rating: validatedQuery.rating,
        minRating: validatedQuery.minRating,
        maxRating: validatedQuery.maxRating,
        isVerified: validatedQuery.isVerified,
        search: validatedQuery.search,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 10,
    );

    sendPaginated(
      res,
      result.data,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.totalItems,
    );
  },
);

// ============================================================
// UPDATE REVIEW
// ============================================================

/**
 * Update a review
 * @route PUT /api/v1/reviews/:id
 * @description Updates a review (only the reviewer can update)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Review ID
 * @body { rating?, comment?, images?, isPublic? }
 * @returns { updated review } with 200 status
 */
export const updateReviewController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = reviewIdParamSchema.parse(req.params);
    const validatedData = updateReviewSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Check if review exists and user owns it
    const existing = await getReviewById(validatedParams.id);

    if (!existing) {
      sendError(res, "Review not found", 404);
      return;
    }

    if (existing.reviewerId !== userId) {
      sendError(res, "You do not have permission to update this review", 403);
      return;
    }

    const review = await updateReviewById(
      validatedParams.id,
      validatedData,
      userId,
    );

    sendSuccess(res, review, "Review updated successfully");
  },
);

// ============================================================
// DELETE REVIEW
// ============================================================

/**
 * Delete a review
 * @route DELETE /api/v1/reviews/:id
 * @description Deletes a review (only the reviewer or admin can delete)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Review ID
 * @returns { success: true } with 200 status
 */
export const deleteReviewController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = reviewIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Check if review exists
    const existing = await getReviewById(validatedParams.id);

    if (!existing) {
      sendError(res, "Review not found", 404);
      return;
    }

    // Check authorization
    if (existing.reviewerId !== userId && userRole !== "ADMIN") {
      sendError(res, "You do not have permission to delete this review", 403);
      return;
    }

    const review = await deleteReviewById(validatedParams.id, userId);

    sendSuccess(res, null, "Review deleted successfully");
  },
);

// ============================================================
// VERIFY REVIEW (ADMIN)
// ============================================================

/**
 * Verify a review (admin only)
 * @route PATCH /api/v1/reviews/:id/verify
 * @description Verifies a review (admin only)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Review ID
 * @body { isVerified }
 * @returns { updated review } with 200 status
 */
export const verifyReviewController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = reviewIdParamSchema.parse(req.params);
    const { isVerified } = req.body;

    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    if (isVerified === undefined || typeof isVerified !== "boolean") {
      sendError(res, "isVerified boolean is required", 400);
      return;
    }

    const existing = await getReviewById(validatedParams.id);

    if (!existing) {
      sendError(res, "Review not found", 404);
      return;
    }

    const review = await verifyReviewById(validatedParams.id, isVerified);

    sendSuccess(
      res,
      review,
      `Review ${isVerified ? "verified" : "unverified"} successfully`,
    );
  },
);

// ============================================================
// REVIEW RESPONSES
// ============================================================

/**
 * Add response to a review (provider only)
 * @route POST /api/v1/reviews/:id/respond
 * @description Adds a response to a review (provider only)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Review ID
 * @body { response }
 * @returns { response } with 200 status
 */
export const addReviewResponseController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = reviewIdParamSchema.parse(req.params);
    const validatedData = reviewResponseSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Check if review exists
    const existing = await getReviewById(validatedParams.id);

    if (!existing) {
      sendError(res, "Review not found", 404);
      return;
    }

    // Get provider profile for this user
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(
        res,
        "Provider profile not found. Only providers can respond to reviews.",
        403,
      );
      return;
    }

    // Verify provider owns the review
    if (existing.providerId !== provider.id) {
      sendError(
        res,
        "You do not have permission to respond to this review",
        403,
      );
      return;
    }

    const response = await addResponseToReview({
      reviewId: validatedParams.id,
      providerId: provider.id,
      response: validatedData.response,
    });

    sendSuccess(res, response, "Response added successfully");
  },
);

/**
 * Update review response
 * @route PUT /api/v1/reviews/:id/response
 * @description Updates a review response (provider only)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Review ID
 * @body { response }
 * @returns { updated response } with 200 status
 */
export const updateReviewResponseController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = reviewIdParamSchema.parse(req.params);
    const validatedData = reviewResponseSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get provider profile for this user
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 403);
      return;
    }

    const response = await updateReviewResponseById(
      validatedParams.id,
      validatedData.response,
      provider.id,
    );

    sendSuccess(res, response, "Response updated successfully");
  },
);

/**
 * Delete review response
 * @route DELETE /api/v1/reviews/:id/response
 * @description Deletes a review response (provider only)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Review ID
 * @returns { success: true } with 200 status
 */
export const deleteReviewResponseController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = reviewIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get provider profile for this user
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 403);
      return;
    }

    const response = await deleteReviewResponseById(
      validatedParams.id,
      provider.id,
    );

    sendSuccess(res, null, "Response deleted successfully");
  },
);

// ============================================================
// RATING STATISTICS
// ============================================================

/**
 * Get provider rating statistics
 * @route GET /api/v1/reviews/provider/:providerId/stats
 * @description Gets rating statistics for a provider
 * @param {providerId} - Provider ID
 * @returns { stats } with 200 status
 */
export const getProviderRatingStatsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { providerId } = req.params;

    if (!providerId) {
      sendError(res, "Provider ID is required", 400);
      return;
    }

    const stats = await getProviderRatingStatsService(providerId);

    sendSuccess(
      res,
      stats,
      "Provider rating statistics retrieved successfully",
    );
  },
);

// ============================================================
// REVIEW EXISTENCE CHECKS
// ============================================================

/**
 * Check if review exists
 * @route GET /api/v1/reviews/:id/exists
 * @description Checks if a review exists
 * @param {id} - Review ID
 * @returns { exists: boolean } with 200 status
 */
export const checkReviewExistsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = reviewIdParamSchema.parse(req.params);

    const exists = await checkReviewExists(validatedParams.id);

    sendSuccess(res, { exists }, "Review existence check completed");
  },
);

/**
 * Check if booking has review
 * @route GET /api/v1/reviews/booking/:bookingId/has-review
 * @description Checks if a booking has a review
 * @param {bookingId} - Booking ID
 * @returns { hasReview: boolean } with 200 status
 */
export const checkBookingHasReviewController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params;

    if (!bookingId) {
      sendError(res, "Booking ID is required", 400);
      return;
    }

    const hasReview = await checkBookingHasReview(bookingId);

    sendSuccess(res, { hasReview }, "Booking review check completed");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Create
  createReviewController,

  // Get
  getReviewByIdController,
  getReviewByBookingIdController,
  getProviderReviewsController,
  getMyReviewsController,
  adminGetAllReviews,

  // Update
  updateReviewController,

  // Delete
  deleteReviewController,

  // Verify (admin)
  verifyReviewController,

  // Responses
  addReviewResponseController,
  updateReviewResponseController,
  deleteReviewResponseController,

  // Stats
  getProviderRatingStatsController,

  // Existence checks
  checkReviewExistsController,
  checkBookingHasReviewController,
};
