import { Router } from "express";
import {
  getBookingAnalyticsController,
  getRevenueAnalyticsController,
  getProviderPerformanceController,
  getCustomerBehaviorController,
  getCategoryAnalyticsController,
  getAnalyticsDashboardController,
} from "../../controllers/analytics.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateQuery } from "../../middlewares/validation.middleware";
import {
  bookingAnalyticsSchema,
  revenueAnalyticsSchema,
  providerPerformanceSchema,
  customerBehaviorSchema,
  categoryAnalyticsSchema,
} from "../../schemas/analytics.schema";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// ANALYTICS ROUTES
// ============================================================

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// ============================================================
// BOOKING ANALYTICS
// ============================================================

/**
 * @route GET /api/v1/analytics/bookings
 * @description Get booking analytics
 * @query { period, startDate, endDate, providerId?, category?, status?, groupBy? }
 * @returns { analytics } with 200 status
 * @access Admin/Provider
 */
router.get(
  "/bookings",
  validateQuery(bookingAnalyticsSchema),
  catchAsync(getBookingAnalyticsController),
);

// ============================================================
// REVENUE ANALYTICS
// ============================================================

/**
 * @route GET /api/v1/analytics/revenue
 * @description Get revenue analytics
 * @query { period, startDate, endDate, providerId?, category?, groupBy? }
 * @returns { analytics } with 200 status
 * @access Admin/Provider
 */
router.get(
  "/revenue",
  validateQuery(revenueAnalyticsSchema),
  catchAsync(getRevenueAnalyticsController),
);

// ============================================================
// PROVIDER PERFORMANCE
// ============================================================

/**
 * @route GET /api/v1/analytics/provider-performance
 * @description Get provider performance analytics
 * @query { providerId?, period, startDate, endDate, limit?, sortBy? }
 * @returns { performance } with 200 status
 * @access Admin/Provider
 */
router.get(
  "/provider-performance",
  validateQuery(providerPerformanceSchema),
  catchAsync(getProviderPerformanceController),
);

// ============================================================
// CUSTOMER BEHAVIOR
// ============================================================

/**
 * @route GET /api/v1/analytics/customer-behavior
 * @description Get customer behavior analytics
 * @query { period, startDate, endDate, limit? }
 * @returns { analytics } with 200 status
 * @access Admin only
 */
router.get(
  "/customer-behavior",
  validateQuery(customerBehaviorSchema),
  catchAsync(getCustomerBehaviorController),
);

// ============================================================
// CATEGORY ANALYTICS
// ============================================================

/**
 * @route GET /api/v1/analytics/categories
 * @description Get category analytics
 * @query { period, startDate, endDate, limit? }
 * @returns { analytics } with 200 status
 * @access Admin only
 */
router.get(
  "/categories",
  validateQuery(categoryAnalyticsSchema),
  catchAsync(getCategoryAnalyticsController),
);

// ============================================================
// ANALYTICS DASHBOARD
// ============================================================

/**
 * @route GET /api/v1/analytics/dashboard
 * @description Get analytics dashboard summary
 * @query { period, startDate, endDate }
 * @returns { dashboard } with 200 status
 * @access Admin/Provider
 */
router.get("/dashboard", catchAsync(getAnalyticsDashboardController));

// ============================================================
// EXPORTS
// ============================================================

export default router;
