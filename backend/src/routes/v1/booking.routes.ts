import { Router } from "express";
import {
  createBookingController,
  getBookingByIdController,
  getBookingByNumberController,
  getCustomerBookingList,
  getProviderBookingList,
  adminGetAllBookings,
  updateBookingController,
  updateBookingStatusController,
  cancelBookingController,
  confirmBookingController,
  startBookingController,
  completeBookingController,
  getProviderStatsController,
  getCustomerStatsController,
  checkBookingExistsController,
  checkCustomerBookingOwner,
  checkProviderBookingOwner,
  getCustomerBookingView,
  getProviderBookingView,
} from "../../controllers/booking.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  bookingIdParamSchema,
  bookingFilterSchema,
  providerBookingFilterSchema,
  customerBookingFilterSchema,
  cancelBookingSchema,
} from "../../schemas/booking.schema";
import { bookingRateLimiter } from "../../config/rateLimit";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// BOOKING ROUTES
// ============================================================

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// ============================================================
// CUSTOMER BOOKINGS
// ============================================================

/**
 * @route GET /api/v1/bookings/customer
 * @description Get customer bookings
 * @query { status, page, limit }
 * @returns { bookings, pagination } with 200 status
 * @access Customer/Admin
 */
router.get(
  "/customer",
  validateQuery(customerBookingFilterSchema),
  catchAsync(getCustomerBookingList),
);

/**
 * @route GET /api/v1/bookings/customer/stats
 * @description Get customer dashboard statistics
 * @returns { stats } with 200 status
 * @access Customer/Admin
 */
router.get("/customer/stats", catchAsync(getCustomerStatsController));

// ============================================================
// PROVIDER BOOKINGS
// ============================================================

/**
 * @route GET /api/v1/bookings/provider
 * @description Get provider bookings
 * @query { status, page, limit }
 * @returns { bookings, pagination } with 200 status
 * @access Provider/Admin
 */
router.get(
  "/provider",
  validateQuery(providerBookingFilterSchema),
  catchAsync(getProviderBookingList),
);

/**
 * @route GET /api/v1/bookings/provider/stats
 * @description Get provider dashboard statistics
 * @returns { stats } with 200 status
 * @access Provider/Admin
 */
router.get("/provider/stats", catchAsync(getProviderStatsController));

// ============================================================
// BOOKING CRUD
// ============================================================

/**
 * @route POST /api/v1/bookings
 * @description Create a new booking
 * @body { providerId, serviceId?, scheduledDate, address, specialNotes?, totalPrice, depositAmount? }
 * @returns { booking } with 201 status
 * @access Customer/Admin
 */
router.post(
  "/",
  bookingRateLimiter,
  validateBody(createBookingSchema),
  catchAsync(createBookingController),
);

/**
 * @route GET /api/v1/bookings/:id
 * @description Get booking by ID
 * @param {id} - Booking ID
 * @returns { booking } with 200 status
 * @access Customer/Provider/Admin
 */
router.get(
  "/:id",
  validateParams(bookingIdParamSchema),
  catchAsync(getBookingByIdController),
);

/**
 * @route GET /api/v1/bookings/:id/exists
 * @description Check if booking exists
 * @param {id} - Booking ID
 * @returns { exists: boolean } with 200 status
 * @access Public
 */
router.get(
  "/:id/exists",
  validateParams(bookingIdParamSchema),
  catchAsync(checkBookingExistsController),
);

/**
 * @route GET /api/v1/bookings/:id/customer-owner
 * @description Check if customer owns booking
 * @param {id} - Booking ID
 * @returns { isOwner: boolean } with 200 status
 * @access Customer/Admin
 */
router.get(
  "/:id/customer-owner",
  validateParams(bookingIdParamSchema),
  catchAsync(checkCustomerBookingOwner),
);

/**
 * @route GET /api/v1/bookings/:id/provider-owner
 * @description Check if provider owns booking
 * @param {id} - Booking ID
 * @returns { isOwner: boolean } with 200 status
 * @access Provider/Admin
 */
router.get(
  "/:id/provider-owner",
  validateParams(bookingIdParamSchema),
  catchAsync(checkProviderBookingOwner),
);

/**
 * @route GET /api/v1/bookings/:id/customer-view
 * @description Get booking with customer view
 * @param {id} - Booking ID
 * @returns { booking } with 200 status
 * @access Customer/Admin
 */
router.get(
  "/:id/customer-view",
  validateParams(bookingIdParamSchema),
  catchAsync(getCustomerBookingView),
);

/**
 * @route GET /api/v1/bookings/:id/provider-view
 * @description Get booking with provider view
 * @param {id} - Booking ID
 * @returns { booking } with 200 status
 * @access Provider/Admin
 */
router.get(
  "/:id/provider-view",
  validateParams(bookingIdParamSchema),
  catchAsync(getProviderBookingView),
);

/**
 * @route GET /api/v1/bookings/number/:bookingNumber
 * @description Get booking by booking number
 * @param {bookingNumber} - Booking number
 * @returns { booking } with 200 status
 * @access Customer/Provider/Admin
 */
router.get("/number/:bookingNumber", catchAsync(getBookingByNumberController));

/**
 * @route PUT /api/v1/bookings/:id
 * @description Update booking
 * @param {id} - Booking ID
 * @body { scheduledDate?, address?, specialNotes?, totalPrice?, depositAmount? }
 * @returns { updated booking } with 200 status
 * @access Customer/Provider/Admin
 */
router.put(
  "/:id",
  validateParams(bookingIdParamSchema),
  validateBody(createBookingSchema.partial()),
  catchAsync(updateBookingController),
);

// ============================================================
// BOOKING STATUS MANAGEMENT
// ============================================================

/**
 * @route PATCH /api/v1/bookings/:id/status
 * @description Update booking status
 * @param {id} - Booking ID
 * @body { status, cancellationReason? }
 * @returns { updated booking } with 200 status
 * @access Customer/Provider/Admin
 */
router.patch(
  "/:id/status",
  validateParams(bookingIdParamSchema),
  validateBody(updateBookingStatusSchema),
  catchAsync(updateBookingStatusController),
);

/**
 * @route POST /api/v1/bookings/:id/cancel
 * @description Cancel booking
 * @param {id} - Booking ID
 * @body { reason }
 * @returns { cancelled booking } with 200 status
 * @access Customer/Provider/Admin
 */
router.post(
  "/:id/cancel",
  validateParams(bookingIdParamSchema),
  validateBody(cancelBookingSchema),
  catchAsync(cancelBookingController),
);

/**
 * @route POST /api/v1/bookings/:id/confirm
 * @description Confirm booking (provider only)
 * @param {id} - Booking ID
 * @returns { confirmed booking } with 200 status
 * @access Provider/Admin
 */
router.post(
  "/:id/confirm",
  validateParams(bookingIdParamSchema),
  catchAsync(confirmBookingController),
);

/**
 * @route POST /api/v1/bookings/:id/start
 * @description Start booking (provider only)
 * @param {id} - Booking ID
 * @returns { started booking } with 200 status
 * @access Provider/Admin
 */
router.post(
  "/:id/start",
  validateParams(bookingIdParamSchema),
  catchAsync(startBookingController),
);

/**
 * @route POST /api/v1/bookings/:id/complete
 * @description Complete booking (provider only)
 * @param {id} - Booking ID
 * @returns { completed booking } with 200 status
 * @access Provider/Admin
 */
router.post(
  "/:id/complete",
  validateParams(bookingIdParamSchema),
  catchAsync(completeBookingController),
);

// ============================================================
// ADMIN BOOKINGS
// ============================================================

/**
 * @route GET /api/v1/bookings/admin
 * @description Get all bookings with filters (admin only)
 * @query { status, providerId, customerId, startDate, endDate, search, page, limit }
 * @returns { bookings, pagination } with 200 status
 * @access Admin only
 */
router.get(
  "/admin",
  validateQuery(bookingFilterSchema),
  catchAsync(adminGetAllBookings),
);

// ============================================================
// EXPORTS
// ============================================================

export default router;
