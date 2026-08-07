import { z } from "zod";
import {
  uuidSchema,
  datetimeSchema,
} from "../middlewares/validation.middleware";

// ============================================================
// ANALYTICS SCHEMAS
// ============================================================

/**
 * Date range filter schema
 */
export const dateRangeSchema = z.object({
  startDate: datetimeSchema,
  endDate: datetimeSchema,
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * Dashboard metrics request schema
 */
export const dashboardMetricsSchema = z.object({
  period: z
    .enum(["today", "week", "month", "quarter", "year"])
    .optional()
    .default("month"),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
});

export type DashboardMetricsInput = z.infer<typeof dashboardMetricsSchema>;

/**
 * Booking analytics filter schema
 */
export const bookingAnalyticsSchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).optional().default("month"),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  providerId: uuidSchema.optional(),
  category: z.string().optional(),
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "DISPUTED",
    ])
    .optional(),
  groupBy: z
    .enum(["status", "category", "day", "week", "month"])
    .optional()
    .default("day"),
});

export type BookingAnalyticsInput = z.infer<typeof bookingAnalyticsSchema>;

/**
 * Revenue analytics filter schema
 */
export const revenueAnalyticsSchema = z.object({
  period: z
    .enum(["day", "week", "month", "quarter", "year"])
    .optional()
    .default("month"),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  providerId: uuidSchema.optional(),
  category: z.string().optional(),
  groupBy: z
    .enum(["day", "week", "month", "category", "provider"])
    .optional()
    .default("day"),
});

export type RevenueAnalyticsInput = z.infer<typeof revenueAnalyticsSchema>;

/**
 * Provider performance filter schema
 */
export const providerPerformanceSchema = z.object({
  providerId: uuidSchema.optional(),
  period: z
    .enum(["week", "month", "quarter", "year"])
    .optional()
    .default("month"),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z
    .enum(["bookings", "revenue", "rating", "responseTime", "completionRate"])
    .optional()
    .default("revenue"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ProviderPerformanceInput = z.infer<
  typeof providerPerformanceSchema
>;

/**
 * Customer behavior analytics filter schema
 */
export const customerBehaviorSchema = z.object({
  period: z
    .enum(["week", "month", "quarter", "year"])
    .optional()
    .default("month"),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  segment: z.enum(["new", "returning", "active", "inactive"]).optional(),
});

export type CustomerBehaviorInput = z.infer<typeof customerBehaviorSchema>;

/**
 * Category analytics filter schema
 */
export const categoryAnalyticsSchema = z.object({
  period: z
    .enum(["week", "month", "quarter", "year"])
    .optional()
    .default("month"),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  sortBy: z
    .enum(["bookings", "revenue", "providers"])
    .optional()
    .default("bookings"),
});

export type CategoryAnalyticsInput = z.infer<typeof categoryAnalyticsSchema>;

/**
 * Top providers schema
 */
export const topProvidersSchema = z.object({
  period: z
    .enum(["week", "month", "quarter", "year"])
    .optional()
    .default("month"),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  category: z.string().optional(),
  sortBy: z
    .enum(["bookings", "revenue", "rating", "completedJobs"])
    .optional()
    .default("revenue"),
});

export type TopProvidersInput = z.infer<typeof topProvidersSchema>;

// ============================================================
// ANALYTICS RESPONSE SCHEMAS
// ============================================================

/**
 * Dashboard metrics response schema
 */
export const dashboardMetricsResponseSchema = z.object({
  totalUsers: z.number().int(),
  totalProviders: z.number().int(),
  totalBookings: z.number().int(),
  totalRevenue: z.number(),
  pendingBookings: z.number().int(),
  confirmedBookings: z.number().int(),
  completedBookings: z.number().int(),
  cancelledBookings: z.number().int(),
  newUsersThisPeriod: z.number().int(),
  newProvidersThisPeriod: z.number().int(),
  bookingsThisPeriod: z.number().int(),
  revenueThisPeriod: z.number(),
  averageBookingValue: z.number(),
  averageRating: z.number(),
  completionRate: z.number(),
  periodComparison: z
    .object({
      bookingsGrowth: z.number(),
      revenueGrowth: z.number(),
      usersGrowth: z.number(),
    })
    .optional(),
});

export type DashboardMetricsResponse = z.infer<
  typeof dashboardMetricsResponseSchema
>;

/**
 * Booking analytics response schema
 */
export const bookingAnalyticsResponseSchema = z.object({
  totalBookings: z.number().int(),
  bookingsByStatus: z.record(z.number().int()),
  bookingsByCategory: z.record(z.number().int()),
  bookingsOverTime: z.array(
    z.object({
      date: z.string(),
      count: z.number().int(),
    }),
  ),
  averageBookingValue: z.number(),
  peakBookingTimes: z.array(
    z.object({
      hour: z.number().int(),
      count: z.number().int(),
    }),
  ),
  periodComparison: z
    .object({
      bookingsGrowth: z.number(),
      averageValueGrowth: z.number(),
    })
    .optional(),
});

export type BookingAnalyticsResponse = z.infer<
  typeof bookingAnalyticsResponseSchema
>;

/**
 * Revenue analytics response schema
 */
export const revenueAnalyticsResponseSchema = z.object({
  totalRevenue: z.number(),
  revenueOverTime: z.array(
    z.object({
      date: z.string(),
      amount: z.number(),
    }),
  ),
  revenueByCategory: z.record(z.number()),
  revenueByProvider: z.array(
    z.object({
      providerId: z.string().uuid(),
      businessName: z.string(),
      revenue: z.number(),
    }),
  ),
  averageRevenuePerBooking: z.number(),
  projectedRevenue: z.number().optional(),
  periodComparison: z
    .object({
      revenueGrowth: z.number(),
      bookingGrowth: z.number(),
    })
    .optional(),
});

export type RevenueAnalyticsResponse = z.infer<
  typeof revenueAnalyticsResponseSchema
>;

/**
 * Provider performance response schema
 */
export const providerPerformanceResponseSchema = z.object({
  providerId: z.string().uuid(),
  businessName: z.string(),
  totalBookings: z.number().int(),
  completedBookings: z.number().int(),
  totalRevenue: z.number(),
  averageRating: z.number(),
  averageResponseTime: z.number().nullable(),
  completionRate: z.number(),
  bookingTrend: z.array(
    z.object({
      date: z.string(),
      count: z.number().int(),
    }),
  ),
  revenueTrend: z.array(
    z.object({
      date: z.string(),
      amount: z.number(),
    }),
  ),
  topServices: z.array(
    z.object({
      serviceName: z.string(),
      count: z.number().int(),
      revenue: z.number(),
    }),
  ),
  performanceScore: z.number(),
});

export type ProviderPerformanceResponse = z.infer<
  typeof providerPerformanceResponseSchema
>;

/**
 * Customer behavior response schema
 */
export const customerBehaviorResponseSchema = z.object({
  totalCustomers: z.number().int(),
  activeCustomers: z.number().int(),
  newCustomers: z.number().int(),
  returningCustomers: z.number().int(),
  customerRetentionRate: z.number(),
  averageBookingsPerCustomer: z.number(),
  customerLifetimeValue: z.number(),
  customersBySegment: z.array(
    z.object({
      segment: z.string(),
      count: z.number().int(),
      percentage: z.number(),
    }),
  ),
  topCustomers: z.array(
    z.object({
      customerId: z.string().uuid(),
      fullName: z.string(),
      bookings: z.number().int(),
      totalSpent: z.number(),
      lastBooking: z.string().datetime(),
    }),
  ),
});

export type CustomerBehaviorResponse = z.infer<
  typeof customerBehaviorResponseSchema
>;

/**
 * Category analytics response schema
 */
export const categoryAnalyticsResponseSchema = z.object({
  totalCategories: z.number().int(),
  categoriesByBookings: z.array(
    z.object({
      category: z.string(),
      bookings: z.number().int(),
      revenue: z.number(),
      providers: z.number().int(),
    }),
  ),
  topCategories: z.array(
    z.object({
      category: z.string(),
      bookings: z.number().int(),
      revenue: z.number(),
      growth: z.number(),
    }),
  ),
  categoryTrends: z.array(
    z.object({
      category: z.string(),
      data: z.array(
        z.object({
          date: z.string(),
          bookings: z.number().int(),
          revenue: z.number(),
        }),
      ),
    }),
  ),
});

export type CategoryAnalyticsResponse = z.infer<
  typeof categoryAnalyticsResponseSchema
>;

/**
 * Top providers response schema
 */
export const topProvidersResponseSchema = z.object({
  providers: z.array(
    z.object({
      providerId: z.string().uuid(),
      businessName: z.string(),
      category: z.string(),
      bookings: z.number().int(),
      revenue: z.number(),
      rating: z.number(),
      completionRate: z.number(),
    }),
  ),
  period: z.string(),
  totalProviders: z.number().int(),
  averageRevenue: z.number(),
});

export type TopProvidersResponse = z.infer<typeof topProvidersResponseSchema>;

// ============================================================
// EXPORTS
// ============================================================

export default {
  dateRangeSchema,
  dashboardMetricsSchema,
  bookingAnalyticsSchema,
  revenueAnalyticsSchema,
  providerPerformanceSchema,
  customerBehaviorSchema,
  categoryAnalyticsSchema,
  topProvidersSchema,
  dashboardMetricsResponseSchema,
  bookingAnalyticsResponseSchema,
  revenueAnalyticsResponseSchema,
  providerPerformanceResponseSchema,
  customerBehaviorResponseSchema,
  categoryAnalyticsResponseSchema,
  topProvidersResponseSchema,
};
