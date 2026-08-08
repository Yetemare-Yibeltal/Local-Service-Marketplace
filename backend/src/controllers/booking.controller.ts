import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import {
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
  checkBookingExists,
  checkBookingCustomer,
  checkBookingProvider,
} from "../services/internal/booking.service";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  bookingIdParamSchema,
  bookingFilterSchema,
  providerBookingFilterSchema,
  customerBookingFilterSchema,
  cancelBookingSchema,
} from "../schemas/booking.schema";
import { USER_ROLES } from "../utils/constants";
import logger from "../utils/logger";

// ============================================================
// BOOKING CONTROLLER
// ============================================================

/**
 * Create a new booking
 * @route POST /api/v1/bookings
 * @description Creates a new booking for a customer with a provider
 * @header Authorization: Bearer {accessToken}
 * @body { providerId, serviceId?, scheduledDate, address, specialNotes?, totalPrice, depositAmount? }
 * @returns { booking } with 201 status
 */
export const createBookingController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = createBookingSchema.parse(req.body);

    const customerId = (req as any).user?.id;

    if (!customerId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const booking = await createBooking({
      customerId,
      providerId: validatedData.providerId,
      serviceId: validatedData.serviceId,
      scheduledDate: validatedData.scheduledDate,
      address: validatedData.address,
      specialNotes: validatedData.specialNotes,
      totalPrice: validatedData.totalPrice,
      depositAmount: validatedData.depositAmount,
    });

    sendSuccess(res, booking, "Booking created successfully", 201);
  },
);

/**
 * Get booking by ID
 * @route GET /api/v1/bookings/:id
 * @description Retrieves a specific booking by ID
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @returns { booking } with 200 status
 */
export const getBookingByIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const booking = await getBookingById(validatedParams.id);

    if (!booking) {
      sendError(res, "Booking not found", 404);
      return;
    }

    // Check permissions: only customer, provider, or admin can view
    const isCustomer = booking.customerId === userId;
    const isProvider = booking.providerId === userId;

    if (!isCustomer && !isProvider && userRole !== "ADMIN") {
      sendError(res, "You do not have permission to view this booking", 403);
      return;
    }

    sendSuccess(res, booking, "Booking retrieved successfully");
  },
);

/**
 * Get booking by booking number
 * @route GET /api/v1/bookings/number/:bookingNumber
 * @description Retrieves a specific booking by booking number
 * @header Authorization: Bearer {accessToken}
 * @param {bookingNumber} - Booking number (e.g., BKG-20260101-ABC12)
 * @returns { booking } with 200 status
 */
export const getBookingByNumberController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { bookingNumber } = req.params;

    if (!bookingNumber) {
      sendError(res, "Booking number is required", 400);
      return;
    }

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const booking = await getBookingByNumber(bookingNumber);

    if (!booking) {
      sendError(res, "Booking not found", 404);
      return;
    }

    // Check permissions: only customer, provider, or admin can view
    const isCustomer = booking.customerId === userId;
    const isProvider = booking.providerId === userId;

    if (!isCustomer && !isProvider && userRole !== "ADMIN") {
      sendError(res, "You do not have permission to view this booking", 403);
      return;
    }

    sendSuccess(res, booking, "Booking retrieved successfully");
  },
);

/**
 * Get customer bookings
 * @route GET /api/v1/bookings/customer
 * @description Retrieves all bookings for the authenticated customer
 * @header Authorization: Bearer {accessToken}
 * @query { status, page, limit }
 * @returns { bookings, pagination } with 200 status
 */
export const getCustomerBookingList = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const validatedQuery = customerBookingFilterSchema.parse(req.query);

    const result = await getCustomerBookings(
      userId,
      validatedQuery.status,
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

/**
 * Get provider bookings
 * @route GET /api/v1/bookings/provider
 * @description Retrieves all bookings for the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @query { status, page, limit }
 * @returns { bookings, pagination } with 200 status
 */
export const getProviderBookingList = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Verify user is a provider
    if (userRole !== "PROVIDER" && userRole !== "ADMIN") {
      sendError(res, "Only providers can access provider bookings", 403);
      return;
    }

    // Get provider profile for this user
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const validatedQuery = providerBookingFilterSchema.parse(req.query);

    const result = await getProviderBookings(
      provider.id,
      validatedQuery.status,
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

/**
 * Get all bookings (admin only)
 * @route GET /api/v1/bookings/admin
 * @description Retrieves all bookings with filters (admin only)
 * @header Authorization: Bearer {accessToken}
 * @query { status, providerId, customerId, startDate, endDate, search, page, limit }
 * @returns { bookings, pagination } with 200 status
 */
export const adminGetAllBookings = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedQuery = bookingFilterSchema.parse(req.query);

    const { getAllBookings } =
      await import("../services/internal/booking.service");

    const result = await getAllBookings(
      {
        status: validatedQuery.status,
        providerId: validatedQuery.providerId,
        customerId: validatedQuery.customerId,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
        search: validatedQuery.search,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 10,
      validatedQuery.sortBy || "createdAt",
      validatedQuery.sortOrder || "desc",
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
 * Update booking
 * @route PUT /api/v1/bookings/:id
 * @description Updates a booking (customer or provider can update certain fields)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @body { scheduledDate?, address?, specialNotes?, totalPrice?, depositAmount? }
 * @returns { updated booking } with 200 status
 */
export const updateBookingController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);
    const validatedData = createBookingSchema.partial().parse(req.body);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const booking = await updateBookingData(
      validatedParams.id,
      validatedData,
      userId,
      userRole,
    );

    sendSuccess(res, booking, "Booking updated successfully");
  },
);

/**
 * Update booking status
 * @route PATCH /api/v1/bookings/:id/status
 * @description Updates the status of a booking
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @body { status, cancellationReason? }
 * @returns { updated booking } with 200 status
 */
export const updateBookingStatusController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);
    const validatedData = updateBookingStatusSchema.parse(req.body);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const booking = await updateBookingStatusService(
      validatedParams.id,
      validatedData.status,
      userId,
      userRole,
      validatedData.cancellationReason,
    );

    sendSuccess(res, booking, "Booking status updated successfully");
  },
);

/**
 * Cancel booking
 * @route POST /api/v1/bookings/:id/cancel
 * @description Cancels a booking with a reason
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @body { reason }
 * @returns { cancelled booking } with 200 status
 */
export const cancelBookingController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);
    const validatedData = cancelBookingSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const booking = await cancelBookingService(validatedParams.id, {
      reason: validatedData.reason,
      cancelledBy: userId,
    });

    sendSuccess(res, booking, "Booking cancelled successfully");
  },
);

/**
 * Confirm booking (provider only)
 * @route POST /api/v1/bookings/:id/confirm
 * @description Confirms a pending booking (provider only)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @returns { confirmed booking } with 200 status
 */
export const confirmBookingController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Only provider or admin can confirm
    if (userRole !== "PROVIDER" && userRole !== "ADMIN") {
      sendError(res, "Only providers can confirm bookings", 403);
      return;
    }

    // Get provider profile for this user
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const booking = await confirmBookingService(
      validatedParams.id,
      provider.id,
    );

    sendSuccess(res, booking, "Booking confirmed successfully");
  },
);

/**
 * Start booking (provider only)
 * @route POST /api/v1/bookings/:id/start
 * @description Starts a confirmed booking (provider only)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @returns { started booking } with 200 status
 */
export const startBookingController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Only provider or admin can start
    if (userRole !== "PROVIDER" && userRole !== "ADMIN") {
      sendError(res, "Only providers can start bookings", 403);
      return;
    }

    // Get provider profile for this user
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const booking = await startBookingService(validatedParams.id, provider.id);

    sendSuccess(res, booking, "Booking started successfully");
  },
);

/**
 * Complete booking (provider only)
 * @route POST /api/v1/bookings/:id/complete
 * @description Completes an in-progress booking (provider only)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @returns { completed booking } with 200 status
 */
export const completeBookingController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Only provider or admin can complete
    if (userRole !== "PROVIDER" && userRole !== "ADMIN") {
      sendError(res, "Only providers can complete bookings", 403);
      return;
    }

    // Get provider profile for this user
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const booking = await completeBookingService(
      validatedParams.id,
      provider.id,
    );

    sendSuccess(res, booking, "Booking completed successfully");
  },
);

/**
 * Get provider dashboard statistics
 * @route GET /api/v1/bookings/provider/stats
 * @description Gets statistics for the provider dashboard
 * @header Authorization: Bearer {accessToken}
 * @returns { stats } with 200 status
 */
export const getProviderStatsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    if (userRole !== "PROVIDER" && userRole !== "ADMIN") {
      sendError(res, "Only providers can access provider stats", 403);
      return;
    }

    // Get provider profile for this user
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const stats = await getProviderStats(provider.id);

    sendSuccess(res, stats, "Provider stats retrieved successfully");
  },
);

/**
 * Get customer dashboard statistics
 * @route GET /api/v1/bookings/customer/stats
 * @description Gets statistics for the customer dashboard
 * @header Authorization: Bearer {accessToken}
 * @returns { stats } with 200 status
 */
export const getCustomerStatsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const stats = await getCustomerStats(userId);

    sendSuccess(res, stats, "Customer stats retrieved successfully");
  },
);

/**
 * Check if booking exists
 * @route GET /api/v1/bookings/:id/exists
 * @description Checks if a booking exists
 * @param {id} - Booking ID
 * @returns { exists: boolean } with 200 status
 */
export const checkBookingExistsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const exists = await checkBookingExists(validatedParams.id);

    sendSuccess(res, { exists }, "Booking existence check completed");
  },
);

/**
 * Check if customer owns booking
 * @route GET /api/v1/bookings/:id/customer-owner
 * @description Checks if the authenticated customer owns the booking
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @returns { isOwner: boolean } with 200 status
 */
export const checkCustomerBookingOwner = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const isOwner = await checkBookingCustomer(validatedParams.id, userId);

    sendSuccess(res, { isOwner }, "Booking ownership check completed");
  },
);

/**
 * Check if provider owns booking
 * @route GET /api/v1/bookings/:id/provider-owner
 * @description Checks if the authenticated provider owns the booking
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @returns { isOwner: boolean } with 200 status
 */
export const checkProviderBookingOwner = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

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
      sendSuccess(res, { isOwner: false }, "Provider not found");
      return;
    }

    const isOwner = await checkBookingProvider(validatedParams.id, provider.id);

    sendSuccess(res, { isOwner }, "Booking ownership check completed");
  },
);

/**
 * Get booking by ID with full details (customer view)
 * @route GET /api/v1/bookings/:id/customer-view
 * @description Retrieves a specific booking with customer view (includes provider details)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @returns { booking } with 200 status
 */
export const getCustomerBookingView = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const booking = await getBookingById(validatedParams.id);

    if (!booking) {
      sendError(res, "Booking not found", 404);
      return;
    }

    // Check permission: only customer or admin can view customer view
    if (booking.customerId !== userId && (req as any).user?.role !== "ADMIN") {
      sendError(res, "You do not have permission to view this booking", 403);
      return;
    }

    // Get provider details
    const { findProviderById } =
      await import("../repositories/provider.repository");
    const provider = await findProviderById(booking.providerId);

    const customerView = {
      ...booking,
      providerDetails: provider
        ? {
            id: provider.id,
            businessName: provider.businessName,
            businessLogo: provider.businessLogo,
            category: provider.category,
            averageRating: provider.averageRating,
            totalReviews: provider.totalReviews,
            isVerified: provider.isVerified,
          }
        : null,
    };

    sendSuccess(res, customerView, "Booking retrieved successfully");
  },
);

/**
 * Get booking by ID with full details (provider view)
 * @route GET /api/v1/bookings/:id/provider-view
 * @description Retrieves a specific booking with provider view (includes customer details)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Booking ID
 * @returns { booking } with 200 status
 */
export const getProviderBookingView = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const booking = await getBookingById(validatedParams.id);

    if (!booking) {
      sendError(res, "Booking not found", 404);
      return;
    }

    // Get provider profile for this user
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider not found", 404);
      return;
    }

    // Check permission: only provider or admin can view provider view
    if (
      booking.providerId !== provider.id &&
      (req as any).user?.role !== "ADMIN"
    ) {
      sendError(res, "You do not have permission to view this booking", 403);
      return;
    }

    // Get customer details
    const { findUserById } = await import("../repositories/user.repository");
    const customer = await findUserById(booking.customerId);

    const providerView = {
      ...booking,
      customerDetails: customer
        ? {
            id: customer.id,
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone,
            profileImage: customer.profileImage,
          }
        : null,
    };

    sendSuccess(res, providerView, "Booking retrieved successfully");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
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
};
