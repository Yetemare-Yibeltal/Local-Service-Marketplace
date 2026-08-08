import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import {
  initiatePayment,
  verifyPayment,
  processRefund,
  getPaymentById,
  getPaymentByBookingId,
  getPaymentsByCustomer,
  getPaymentsByProvider,
  getPaymentStats,
  getProviderEarnings,
  savePaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  processPaymentWebhook,
  paymentExists,
  bookingHasPayment,
} from "../services/payment.service";
import { z } from "zod";
import { uuidSchema } from "../middlewares/validation.middleware";
import { USER_ROLES } from "../utils/constants";
import logger from "../utils/logger";

// ============================================================
// SCHEMAS (inline for completeness)
// ============================================================

const paymentDataSchema = z.object({
  bookingId: uuidSchema,
  amount: z.number().positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["CASH", "TELEBIRR", "CHAPA", "BANK_TRANSFER"]),
  transactionId: z.string().optional(),
  reference: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const paymentVerificationSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  status: z.enum(["SUCCESS", "FAILED", "PENDING"]),
  reference: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const refundDataSchema = z.object({
  paymentId: uuidSchema,
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  amount: z.number().positive().optional(),
});

const paymentMethodSchema = z.object({
  type: z.enum(["TELEBIRR", "CHAPA", "BANK_ACCOUNT", "CASH"]),
  provider: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const paymentIdParamSchema = z.object({
  id: uuidSchema,
});

const bookingIdParamSchema = z.object({
  bookingId: uuidSchema,
});

const paymentFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  paymentMethod: z
    .enum(["CASH", "TELEBIRR", "CHAPA", "BANK_TRANSFER"])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================
// PAYMENT CONTROLLER
// ============================================================

/**
 * Initiate a payment for a booking
 * @route POST /api/v1/payments
 * @description Initiates a payment for a booking
 * @header Authorization: Bearer {accessToken}
 * @body { bookingId, amount, paymentMethod, transactionId?, reference?, metadata? }
 * @returns { payment } with 201 status
 */
export const initiatePaymentController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = paymentDataSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get booking to validate customer
    const { findBookingById } =
      await import("../repositories/booking.repository");
    const booking = await findBookingById(validatedData.bookingId);

    if (!booking) {
      sendError(res, "Booking not found", 404);
      return;
    }

    if (booking.customerId !== userId && (req as any).user?.role !== "ADMIN") {
      sendError(
        res,
        "You are not authorized to initiate payment for this booking",
        403,
      );
      return;
    }

    // Check if payment already exists
    const existingPayment = await bookingHasPayment(validatedData.bookingId);
    if (existingPayment) {
      sendError(res, "Payment already exists for this booking", 409);
      return;
    }

    const payment = await initiatePayment({
      bookingId: validatedData.bookingId,
      customerId: userId,
      providerId: booking.providerId,
      amount: validatedData.amount,
      paymentMethod: validatedData.paymentMethod,
      transactionId: validatedData.transactionId,
      reference: validatedData.reference,
      metadata: validatedData.metadata,
    });

    sendSuccess(res, payment, "Payment initiated successfully", 201);
  },
);

/**
 * Verify a payment (manual verification)
 * @route POST /api/v1/payments/verify
 * @description Verifies a payment status (manual or webhook fallback)
 * @header Authorization: Bearer {accessToken}
 * @body { transactionId, status, reference?, metadata? }
 * @returns { updated payment } with 200 status
 */
export const verifyPaymentController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedData = paymentVerificationSchema.parse(req.body);

    const payment = await verifyPayment({
      transactionId: validatedData.transactionId,
      status: validatedData.status,
      reference: validatedData.reference,
      metadata: validatedData.metadata,
    });

    sendSuccess(res, payment, "Payment verified successfully");
  },
);

/**
 * Process a refund for a payment
 * @route POST /api/v1/payments/refund
 * @description Processes a refund for a paid payment
 * @header Authorization: Bearer {accessToken}
 * @body { paymentId, reason, amount? }
 * @returns { updated payment } with 200 status
 */
export const processRefundController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedData = refundDataSchema.parse(req.body);

    const payment = await processRefund({
      paymentId: validatedData.paymentId,
      reason: validatedData.reason,
      amount: validatedData.amount,
    });

    sendSuccess(res, payment, "Refund processed successfully");
  },
);

/**
 * Get payment by ID
 * @route GET /api/v1/payments/:id
 * @description Retrieves a specific payment by ID
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Payment ID
 * @returns { payment } with 200 status
 */
export const getPaymentByIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = paymentIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const payment = await getPaymentById(validatedParams.id);

    if (!payment) {
      sendError(res, "Payment not found", 404);
      return;
    }

    // Check authorization: only customer, provider, or admin
    const booking = await findBookingById(payment.bookingId);
    if (!booking) {
      sendError(res, "Booking not found", 404);
      return;
    }

    const isCustomer = booking.customerId === userId;
    const isProvider = booking.providerId === userId;

    if (!isCustomer && !isProvider && userRole !== "ADMIN") {
      sendError(res, "You do not have permission to view this payment", 403);
      return;
    }

    sendSuccess(res, payment, "Payment retrieved successfully");
  },
);

/**
 * Get payment by booking ID
 * @route GET /api/v1/payments/booking/:bookingId
 * @description Retrieves a payment by booking ID
 * @header Authorization: Bearer {accessToken}
 * @param {bookingId} - Booking ID
 * @returns { payment } with 200 status
 */
export const getPaymentByBookingIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const payment = await getPaymentByBookingId(validatedParams.bookingId);

    if (!payment) {
      sendError(res, "Payment not found for this booking", 404);
      return;
    }

    // Check authorization
    const booking = await findBookingById(payment.bookingId);
    if (!booking) {
      sendError(res, "Booking not found", 404);
      return;
    }

    const isCustomer = booking.customerId === userId;
    const isProvider = booking.providerId === userId;

    if (!isCustomer && !isProvider && userRole !== "ADMIN") {
      sendError(res, "You do not have permission to view this payment", 403);
      return;
    }

    sendSuccess(res, payment, "Payment retrieved successfully");
  },
);

/**
 * Get payments for authenticated customer
 * @route GET /api/v1/payments/customer
 * @description Retrieves all payments for the authenticated customer
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, status, paymentMethod, startDate, endDate }
 * @returns { payments, pagination } with 200 status
 */
export const getCustomerPaymentsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const validatedQuery = paymentFilterSchema.parse(req.query);

    const result = await getPaymentsByCustomer(
      userId,
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
 * Get payments for authenticated provider
 * @route GET /api/v1/payments/provider
 * @description Retrieves all payments for the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, status, paymentMethod, startDate, endDate }
 * @returns { payments, pagination } with 200 status
 */
export const getProviderPaymentsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    if (userRole !== "PROVIDER" && userRole !== "ADMIN") {
      sendError(res, "Provider access required", 403);
      return;
    }

    // Get provider profile
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const validatedQuery = paymentFilterSchema.parse(req.query);

    const result = await getPaymentsByProvider(
      provider.id,
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
 * Get payment statistics (admin only)
 * @route GET /api/v1/payments/stats
 * @description Retrieves payment statistics
 * @header Authorization: Bearer {accessToken}
 * @query { startDate, endDate, providerId? }
 * @returns { stats } with 200 status
 */
export const getPaymentStatsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { startDate, endDate, providerId } = req.query;

    const stats = await getPaymentStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      providerId as string,
    );

    sendSuccess(res, stats, "Payment statistics retrieved successfully");
  },
);

/**
 * Get provider earnings
 * @route GET /api/v1/payments/earnings
 * @description Retrieves earnings for the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @query { period }
 * @returns { earnings } with 200 status
 */
export const getProviderEarningsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    if (userRole !== "PROVIDER" && userRole !== "ADMIN") {
      sendError(res, "Provider access required", 403);
      return;
    }

    // Get provider profile
    const { findProviderByUserId } =
      await import("../repositories/provider.repository");
    const provider = await findProviderByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const { period } = req.query;

    const earnings = await getProviderEarnings(
      provider.id,
      (period as "today" | "week" | "month" | "year") || "month",
    );

    sendSuccess(res, earnings, "Provider earnings retrieved successfully");
  },
);

// ============================================================
// PAYMENT METHODS
// ============================================================

/**
 * Save a payment method for the authenticated user
 * @route POST /api/v1/payments/methods
 * @description Saves a payment method for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @body { type, provider?, accountNumber?, accountName?, isDefault?, metadata? }
 * @returns { paymentMethod } with 201 status
 */
export const savePaymentMethodController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const validatedData = paymentMethodSchema.parse(req.body);

    const method = await savePaymentMethod({
      userId,
      type: validatedData.type,
      provider: validatedData.provider,
      accountNumber: validatedData.accountNumber,
      accountName: validatedData.accountName,
      isDefault: validatedData.isDefault,
      metadata: validatedData.metadata,
    });

    sendSuccess(res, method, "Payment method saved successfully", 201);
  },
);

/**
 * Get payment methods for the authenticated user
 * @route GET /api/v1/payments/methods
 * @description Retrieves all payment methods for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @returns { paymentMethods } with 200 status
 */
export const getPaymentMethodsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const methods = await getPaymentMethods(userId);

    sendSuccess(res, methods, "Payment methods retrieved successfully");
  },
);

/**
 * Delete a payment method
 * @route DELETE /api/v1/payments/methods/:type
 * @description Deletes a payment method for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @param {type} - Payment method type
 * @returns { success: true } with 200 status
 */
export const deletePaymentMethodController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const { type } = req.params;

    if (!type) {
      sendError(res, "Payment method type is required", 400);
      return;
    }

    const success = await deletePaymentMethod(userId, type);

    if (!success) {
      sendError(res, "Payment method not found", 404);
      return;
    }

    sendSuccess(res, null, "Payment method deleted successfully");
  },
);

// ============================================================
// WEBHOOK
// ============================================================

/**
 * Process payment webhook (external gateway)
 * @route POST /api/v1/payments/webhook
 * @description Processes a webhook from a payment gateway
 * @body { payload } (gateway specific)
 * @returns { handled, status } with 200 status
 */
export const processPaymentWebhookController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // Identify gateway from headers or body
    const gateway = (req.headers["x-gateway"] as string) || "TELEBIRR";
    const payload = req.body;

    if (!payload) {
      sendError(res, "Webhook payload is required", 400);
      return;
    }

    const result = await processPaymentWebhook(
      gateway as "TELEBIRR" | "CHAPA",
      payload,
    );

    sendSuccess(res, result, "Webhook processed");
  },
);

// ============================================================
// EXISTENCE CHECKS
// ============================================================

/**
 * Check if a payment exists for a booking
 * @route GET /api/v1/payments/booking/:bookingId/exists
 * @description Checks if a payment exists for a booking
 * @header Authorization: Bearer {accessToken}
 * @param {bookingId} - Booking ID
 * @returns { exists: boolean } with 200 status
 */
export const checkBookingPaymentExistsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = bookingIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Check authorization: only customer, provider, or admin
    const booking = await findBookingById(validatedParams.bookingId);
    if (!booking) {
      sendError(res, "Booking not found", 404);
      return;
    }

    const isCustomer = booking.customerId === userId;
    const isProvider = booking.providerId === userId;

    if (!isCustomer && !isProvider && userRole !== "ADMIN") {
      sendError(res, "You do not have permission to check this", 403);
      return;
    }

    const exists = await bookingHasPayment(validatedParams.bookingId);

    sendSuccess(res, { exists }, "Payment existence check completed");
  },
);

/**
 * Check if a payment exists by ID
 * @route GET /api/v1/payments/:id/exists
 * @description Checks if a payment exists by ID
 * @param {id} - Payment ID
 * @returns { exists: boolean } with 200 status
 */
export const checkPaymentExistsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = paymentIdParamSchema.parse(req.params);

    const exists = await paymentExists(validatedParams.id);

    sendSuccess(res, { exists }, "Payment existence check completed");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  initiatePaymentController,
  verifyPaymentController,
  processRefundController,
  getPaymentByIdController,
  getPaymentByBookingIdController,
  getCustomerPaymentsController,
  getProviderPaymentsController,
  getPaymentStatsController,
  getProviderEarningsController,
  savePaymentMethodController,
  getPaymentMethodsController,
  deletePaymentMethodController,
  processPaymentWebhookController,
  checkBookingPaymentExistsController,
  checkPaymentExistsController,
};
