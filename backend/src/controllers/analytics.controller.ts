import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError } from "../utils/response";
import {
  getBookingAnalytics,
  getRevenueAnalytics,
  getProviderPerformanceAnalytics,
  getCustomerBehaviorAnalytics,
  getCategoryAnalytics,
} from "../services/internal/analytics.service";
import {
  bookingAnalyticsSchema,
  revenueAnalyticsSchema,
  providerPerformanceSchema,
  customerBehaviorSchema,
  categoryAnalyticsSchema,
} from "../schemas/analytics.schema";
import { USER_ROLES } from "../utils/constants";
import logger from "../utils/logger";

// ============================================================
// ANALYTICS CONTROLLER
// ============================================================

// ============================================================
// BOOKING ANALYTICS
// ============================================================

/**
 * Get booking analytics
 * @route GET /api/v1/analytics/bookings
 * @description Retrieves comprehensive booking analytics
 * @header Authorization: Bearer {accessToken}
 * @query { period, startDate, endDate, providerId?, category?, status?, groupBy? }
 * @returns { analytics } with 200 status
 */
export const getBookingAnalyticsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    if (userRole !== "ADMIN" && userRole !== "PROVIDER") {
      sendError(res, "Admin or Provider access required", 403);
      return;
    }

    const validatedQuery = bookingAnalyticsSchema.parse(req.query);

    // If user is provider, restrict to their providerId
    let providerId = validatedQuery.providerId;
    if (userRole === "PROVIDER") {
      // Get provider profile for this user
      const { findProviderByUserId } =
        await import("../repositories/provider.repository");
      const provider = await findProviderByUserId(userId);
      if (!provider) {
        sendError(res, "Provider profile not found", 404);
        return;
      }
      providerId = provider.id;
    }

    const result = await getBookingAnalytics({
      period: validatedQuery.period,
      startDate: validatedQuery.startDate,
      endDate: validatedQuery.endDate,
      providerId,
      category: validatedQuery.category,
      status: validatedQuery.status,
      groupBy: validatedQuery.groupBy,
    });

    sendSuccess(res, result, "Booking analytics retrieved successfully");
  },
);

// ============================================================
// REVENUE ANALYTICS
// ============================================================

/**
 * Get revenue analytics
 * @route GET /api/v1/analytics/revenue
 * @description Retrieves comprehensive revenue analytics
 * @header Authorization: Bearer {accessToken}
 * @query { period, startDate, endDate, providerId?, category?, groupBy? }
 * @returns { analytics } with 200 status
 */
export const getRevenueAnalyticsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    if (userRole !== "ADMIN" && userRole !== "PROVIDER") {
      sendError(res, "Admin or Provider access required", 403);
      return;
    }

    const validatedQuery = revenueAnalyticsSchema.parse(req.query);

    // If user is provider, restrict to their providerId
    let providerId = validatedQuery.providerId;
    if (userRole === "PROVIDER") {
      const { findProviderByUserId } =
        await import("../repositories/provider.repository");
      const provider = await findProviderByUserId(userId);
      if (!provider) {
        sendError(res, "Provider profile not found", 404);
        return;
      }
      providerId = provider.id;
    }

    const result = await getRevenueAnalytics({
      period: validatedQuery.period,
      startDate: validatedQuery.startDate,
      endDate: validatedQuery.endDate,
      providerId,
      category: validatedQuery.category,
      groupBy: validatedQuery.groupBy,
    });

    sendSuccess(res, result, "Revenue analytics retrieved successfully");
  },
);

// ============================================================
// PROVIDER PERFORMANCE ANALYTICS
// ============================================================

/**
 * Get provider performance analytics
 * @route GET /api/v1/analytics/provider-performance
 * @description Retrieves performance analytics for a specific provider
 * @header Authorization: Bearer {accessToken}
 * @query { providerId?, period, startDate, endDate, limit?, sortBy? }
 * @returns { performance } with 200 status
 */
export const getProviderPerformanceController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    if (userRole !== "ADMIN" && userRole !== "PROVIDER") {
      sendError(res, "Admin or Provider access required", 403);
      return;
    }

    const validatedQuery = providerPerformanceSchema.parse(req.query);

    // If user is provider, force their providerId
    let providerId = validatedQuery.providerId;
    if (userRole === "PROVIDER") {
      const { findProviderByUserId } =
        await import("../repositories/provider.repository");
      const provider = await findProviderByUserId(userId);
      if (!provider) {
        sendError(res, "Provider profile not found", 404);
        return;
      }
      providerId = provider.id;
    }

    if (!providerId) {
      sendError(res, "Provider ID is required for performance analytics", 400);
      return;
    }

    const result = await getProviderPerformanceAnalytics(providerId, {
      period: validatedQuery.period,
      startDate: validatedQuery.startDate,
      endDate: validatedQuery.endDate,
    });

    sendSuccess(
      res,
      result,
      "Provider performance analytics retrieved successfully",
    );
  },
);

// ============================================================
// CUSTOMER BEHAVIOR ANALYTICS
// ============================================================

/**
 * Get customer behavior analytics
 * @route GET /api/v1/analytics/customer-behavior
 * @description Retrieves customer behavior analytics
 * @header Authorization: Bearer {accessToken}
 * @query { period, startDate, endDate, limit? }
 * @returns { analytics } with 200 status
 */
export const getCustomerBehaviorController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedQuery = customerBehaviorSchema.parse(req.query);

    const result = await getCustomerBehaviorAnalytics({
      period: validatedQuery.period,
      startDate: validatedQuery.startDate,
      endDate: validatedQuery.endDate,
    });

    sendSuccess(
      res,
      result,
      "Customer behavior analytics retrieved successfully",
    );
  },
);

// ============================================================
// CATEGORY ANALYTICS
// ============================================================

/**
 * Get category analytics
 * @route GET /api/v1/analytics/categories
 * @description Retrieves category analytics
 * @header Authorization: Bearer {accessToken}
 * @query { period, startDate, endDate, limit? }
 * @returns { analytics } with 200 status
 */
export const getCategoryAnalyticsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedQuery = categoryAnalyticsSchema.parse(req.query);

    const result = await getCategoryAnalytics({
      period: validatedQuery.period,
      startDate: validatedQuery.startDate,
      endDate: validatedQuery.endDate,
    });

    sendSuccess(res, result, "Category analytics retrieved successfully");
  },
);

// ============================================================
// SUMMARY ANALYTICS DASHBOARD
// ============================================================

/**
 * Get analytics dashboard summary (combined metrics)
 * @route GET /api/v1/analytics/dashboard
 * @description Retrieves a summary dashboard of key analytics metrics
 * @header Authorization: Bearer {accessToken}
 * @query { period, startDate, endDate }
 * @returns { dashboard } with 200 status
 */
export const getAnalyticsDashboardController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    if (userRole !== "ADMIN" && userRole !== "PROVIDER") {
      sendError(res, "Admin or Provider access required", 403);
      return;
    }

    const { period, startDate, endDate } = req.query;

    // Build filters
    const filters: any = {
      period: (period as string) || "month",
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    // If provider, restrict data
    let providerId: string | undefined;
    if (userRole === "PROVIDER") {
      const { findProviderByUserId } =
        await import("../repositories/provider.repository");
      const provider = await findProviderByUserId(userId);
      if (!provider) {
        sendError(res, "Provider profile not found", 404);
        return;
      }
      providerId = provider.id;
      filters.providerId = providerId;
    }

    // Get booking and revenue analytics in parallel
    const [bookingAnalytics, revenueAnalytics] = await Promise.all([
      getBookingAnalytics(filters),
      getRevenueAnalytics(filters),
    ]);

    // Combine into dashboard response
    const dashboard = {
      period: filters.period,
      bookingAnalytics,
      revenueAnalytics,
    };

    sendSuccess(res, dashboard, "Analytics dashboard retrieved successfully");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  getBookingAnalyticsController,
  getRevenueAnalyticsController,
  getProviderPerformanceController,
  getCustomerBehaviorController,
  getCategoryAnalyticsController,
  getAnalyticsDashboardController,
};
