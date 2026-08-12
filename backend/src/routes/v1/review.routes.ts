import { Router } from "express";
import {
  createReviewController,
  getReviewByIdController,
  getReviewByBookingIdController,
  getProviderReviewsController,
  getMyReviewsController,
  adminGetAllReviews,
  updateReviewController,
  deleteReviewController,
  verifyReviewController,
  addReviewResponseController,
  updateReviewResponseController,
  deleteReviewResponseController,
  getProviderRatingStatsController,
  checkReviewExistsController,
  checkBookingHasReviewController,
} from "../../controllers/review.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  reviewFilterSchema,
  providerReviewsFilterSchema,
  reviewResponseSchema,
} from "../../schemas/review.schema";
import { upload } from "../../middlewares/upload.middleware";
import { reviewRateLimiter } from "../../config/rateLimit";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// REVIEW ROUTES
// ============================================================

const router = Router();

// All review routes require authentication
router.use(authenticate);

// ============================================================
// USER REVIEWS
// ============================================================

/**
 * @route GET /api/v1/reviews/my-reviews
 * @description Get reviews written by authenticated user
 * @query { page, limit }
 * @returns { reviews, pagination } with 200 status
 * @access Authenticated users only
 */
router.get("/my-reviews", catchAsync(getMyReviewsController));

/**
 * @route GET /api/v1/reviews/booking/:bookingId
 * @description Get review by booking ID
 * @param {bookingId} - Booking ID
 * @returns { review } with 200 status
 * @access Authenticated users only
 */
router.get("/booking/:bookingId", catchAsync(getReviewByBookingIdController));

/**
 * @route GET /api/v1/reviews/booking/:bookingId/has-review
 * @description Check if booking has review
 * @param {bookingId} - Booking ID
 * @returns { hasReview: boolean } with 200 status
 * @access Authenticated users only
 */
router.get(
  "/booking/:bookingId/has-review",
  catchAsync(checkBookingHasReviewController),
);

/**
 * @route GET /api/v1/reviews/:id
 * @description Get review by ID
 * @param {id} - Review ID
 * @returns { review } with 200 status
 * @access Authenticated users only
 */
router.get(
  "/:id",
  validateParams(reviewIdParamSchema),
  catchAsync(getReviewByIdController),
);

/**
 * @route GET /api/v1/reviews/:id/exists
 * @description Check if review exists
 * @param {id} - Review ID
 * @returns { exists: boolean } with 200 status
 * @access Authenticated users only
 */
router.get(
  "/:id/exists",
  validateParams(reviewIdParamSchema),
  catchAsync(checkReviewExistsController),
);

// ============================================================
// REVIEW CRUD
// ============================================================

/**
 * @route POST /api/v1/reviews
 * @description Create a new review
 * @body { bookingId, rating, comment, images? }
 * @returns { review } with 201 status
 * @access Authenticated users only
 */
router.post(
  "/",
  reviewRateLimiter,
  upload.array("images", 5),
  validateBody(createReviewSchema),
  catchAsync(createReviewController),
);

/**
 * @route PUT /api/v1/reviews/:id
 * @description Update a review
 * @param {id} - Review ID
 * @body { rating?, comment?, images?, isPublic? }
 * @returns { updated review } with 200 status
 * @access Authenticated users only (review owner)
 */
router.put(
  "/:id",
  validateParams(reviewIdParamSchema),
  upload.array("images", 5),
  validateBody(updateReviewSchema),
  catchAsync(updateReviewController),
);

/**
 * @route DELETE /api/v1/reviews/:id
 * @description Delete a review
 * @param {id} - Review ID
 * @returns { success: true } with 200 status
 * @access Authenticated users only (review owner or admin)
 */
router.delete(
  "/:id",
  validateParams(reviewIdParamSchema),
  catchAsync(deleteReviewController),
);

// ============================================================
// PROVIDER REVIEWS
// ============================================================

/**
 * @route GET /api/v1/reviews/provider/:providerId
 * @description Get reviews for a provider
 * @param {providerId} - Provider ID
 * @query { page, limit, rating, sortBy, sortOrder }
 * @returns { reviews, pagination, stats } with 200 status
 * @access Public
 */
router.get(
  "/provider/:providerId",
  validateQuery(providerReviewsFilterSchema),
  catchAsync(getProviderReviewsController),
);

/**
 * @route GET /api/v1/reviews/provider/:providerId/stats
 * @description Get provider rating statistics
 * @param {providerId} - Provider ID
 * @returns { stats } with 200 status
 * @access Public
 */
router.get(
  "/provider/:providerId/stats",
  catchAsync(getProviderRatingStatsController),
);

// ============================================================
// REVIEW RESPONSES
// ============================================================

/**
 * @route POST /api/v1/reviews/:id/respond
 * @description Add response to review (provider only)
 * @param {id} - Review ID
 * @body { response }
 * @returns { response } with 200 status
 * @access Authenticated users only (provider)
 */
router.post(
  "/:id/respond",
  validateParams(reviewIdParamSchema),
  validateBody(reviewResponseSchema),
  catchAsync(addReviewResponseController),
);

/**
 * @route PUT /api/v1/reviews/:id/response
 * @description Update review response (provider only)
 * @param {id} - Review ID
 * @body { response }
 * @returns { updated response } with 200 status
 * @access Authenticated users only (provider)
 */
router.put(
  "/:id/response",
  validateParams(reviewIdParamSchema),
  validateBody(reviewResponseSchema),
  catchAsync(updateReviewResponseController),
);

/**
 * @route DELETE /api/v1/reviews/:id/response
 * @description Delete review response (provider only)
 * @param {id} - Review ID
 * @returns { success: true } with 200 status
 * @access Authenticated users only (provider)
 */
router.delete(
  "/:id/response",
  validateParams(reviewIdParamSchema),
  catchAsync(deleteReviewResponseController),
);

// ============================================================
// ADMIN REVIEWS
// ============================================================

/**
 * @route GET /api/v1/reviews/admin
 * @description Get all reviews with filters (admin only)
 * @query { page, limit, providerId, reviewerId, rating, minRating, maxRating, isVerified, startDate, endDate, search }
 * @returns { reviews, pagination, summary } with 200 status
 * @access Admin only
 */
router.get(
  "/admin",
  validateQuery(reviewFilterSchema),
  catchAsync(adminGetAllReviews),
);

/**
 * @route PATCH /api/v1/reviews/:id/verify
 * @description Verify a review (admin only)
 * @param {id} - Review ID
 * @body { isVerified }
 * @returns { updated review } with 200 status
 * @access Admin only
 */
router.patch(
  "/:id/verify",
  validateParams(reviewIdParamSchema),
  catchAsync(verifyReviewController),
);

// ============================================================
// EXPORTS
// ============================================================

export default router;
