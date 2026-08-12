// ============================================================
// ANALYTICS TYPES
// Complete analytics type definitions for the application
// ============================================================

// ============================================================
// ENUMS
// ============================================================

/**
 * Analytics period enum
 */
export type AnalyticsPeriod = "today" | "week" | "month" | "quarter" | "year";

/**
 * Analytics group by enum
 */
export type AnalyticsGroupBy =
  | "day"
  | "week"
  | "month"
  | "category"
  | "provider"
  | "status";

/**
 * Analytics metric type enum
 */
export type AnalyticsMetricType =
  | "BOOKINGS"
  | "REVENUE"
  | "USERS"
  | "PROVIDERS"
  | "RATING"
  | "COMPLETION_RATE"
  | "RESPONSE_TIME"
  | "CONVERSION_RATE"
  | "RETENTION_RATE";

/**
 * Analytics dimension enum
 */
export type AnalyticsDimension =
  | "DATE"
  | "CATEGORY"
  | "PROVIDER"
  | "CUSTOMER"
  | "LOCATION"
  | "STATUS"
  | "PAYMENT_METHOD";

// ============================================================
// DATE RANGE TYPES
// ============================================================

/**
 * Date range interface
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Date range with period
 */
export interface DateRangeWithPeriod extends DateRange {
  period: AnalyticsPeriod;
  previousPeriod: DateRange;
}

/**
 * Analytics filters interface
 */
export interface AnalyticsFilters {
  period?: AnalyticsPeriod;
  startDate?: Date;
  endDate?: Date;
  providerId?: string;
  category?: string;
  status?: string;
  groupBy?: AnalyticsGroupBy;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  city?: string;
  region?: string;
  paymentMethod?: string;
}

// ============================================================
// TIME SERIES DATA TYPES
// ============================================================

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  date: string;
  count: number;
  revenue: number;
  average?: number;
  min?: number;
  max?: number;
}

/**
 * Time series data with metadata
 */
export interface TimeSeriesData {
  data: TimeSeriesDataPoint[];
  total: number;
  average: number;
  min: number;
  max: number;
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
}

/**
 * Time series comparison
 */
export interface TimeSeriesComparison {
  current: TimeSeriesData;
  previous: TimeSeriesData;
  change: {
    absolute: number;
    percentage: number;
  };
}

// ============================================================
// BOOKING ANALYTICS TYPES
// ============================================================

/**
 * Booking analytics result
 */
export interface BookingAnalyticsResult {
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  bookingsByCategory: Record<string, number>;
  bookingsOverTime: TimeSeriesDataPoint[];
  averageBookingValue: number;
  averageBookingDuration: number | null;
  peakHours: { hour: number; count: number }[];
  peakDays: { day: string; count: number }[];
  periodComparison: {
    bookingsGrowth: number;
    averageValueGrowth: number;
    durationGrowth: number | null;
  };
  statusDistribution: {
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    disputed: number;
  };
  cancellationRate: number;
  completionRate: number;
}

/**
 * Booking analytics summary
 */
export interface BookingAnalyticsSummary {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  completionRate: number;
  cancellationRate: number;
  topCategories: Array<{
    category: string;
    bookings: number;
    revenue: number;
  }>;
  topProviders: Array<{
    providerId: string;
    businessName: string;
    bookings: number;
    revenue: number;
  }>;
  bookingTrend: TimeSeriesDataPoint[];
}

// ============================================================
// REVENUE ANALYTICS TYPES
// ============================================================

/**
 * Revenue analytics result
 */
export interface RevenueAnalyticsResult {
  totalRevenue: number;
  revenueOverTime: TimeSeriesDataPoint[];
  revenueByCategory: Record<string, number>;
  revenueByProvider: Array<{
    providerId: string;
    businessName: string;
    revenue: number;
    bookings: number;
    averageValue: number;
  }>;
  revenueByPaymentMethod: Record<string, number>;
  averageRevenuePerBooking: number;
  projectedRevenue: number | null;
  projectedGrowth: number | null;
  periodComparison: {
    revenueGrowth: number;
    bookingGrowth: number;
    averageValueGrowth: number;
  };
  revenueForecast: TimeSeriesDataPoint[];
}

/**
 * Revenue analytics summary
 */
export interface RevenueAnalyticsSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  averageRevenuePerBooking: number;
  revenueGrowth: number;
  topRevenueCategories: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  topRevenueProviders: Array<{
    providerId: string;
    businessName: string;
    revenue: number;
    percentage: number;
  }>;
  revenueTrend: TimeSeriesDataPoint[];
}

// ============================================================
// PROVIDER PERFORMANCE TYPES
// ============================================================

/**
 * Provider performance metrics
 */
export interface ProviderPerformanceMetrics {
  providerId: string;
  businessName: string;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  disputedBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  averageRating: number;
  totalReviews: number;
  averageResponseTime: number | null;
  completionRate: number;
  cancellationRate: number;
  disputeRate: number;
  bookingTrend: TimeSeriesDataPoint[];
  revenueTrend: TimeSeriesDataPoint[];
  ratingTrend: Array<{ date: string; rating: number; count: number }>;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }>;
  performanceScore: number;
  rank: number;
  percentile: number;
}

/**
 * Provider performance summary
 */
export interface ProviderPerformanceSummary {
  providerId: string;
  businessName: string;
  performanceScore: number;
  rank: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  responseTime: number | null;
  bookingGrowth: number;
  revenueGrowth: number;
  ratingGrowth: number;
}

/**
 * Provider comparison result
 */
export interface ProviderComparisonResult {
  providers: ProviderPerformanceMetrics[];
  rankings: {
    byBookings: Array<{
      providerId: string;
      businessName: string;
      count: number;
    }>;
    byRevenue: Array<{
      providerId: string;
      businessName: string;
      revenue: number;
    }>;
    byRating: Array<{
      providerId: string;
      businessName: string;
      rating: number;
    }>;
    byCompletionRate: Array<{
      providerId: string;
      businessName: string;
      rate: number;
    }>;
    byPerformance: Array<{
      providerId: string;
      businessName: string;
      score: number;
    }>;
  };
  topPerformers: ProviderPerformanceMetrics[];
  bottomPerformers: ProviderPerformanceMetrics[];
  marketAverage: {
    averageRating: number;
    completionRate: number;
    responseTime: number;
    averageRevenue: number;
  };
}

// ============================================================
// CUSTOMER BEHAVIOR TYPES
// ============================================================

/**
 * Customer behavior metrics
 */
export interface CustomerBehaviorMetrics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  customerChurnRate: number;
  averageBookingsPerCustomer: number;
  averageRevenuePerCustomer: number;
  customerLifetimeValue: number;
  acquisitionCost: number | null;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageBookings: number;
    averageRevenue: number;
  }>;
  customerJourney: Array<{
    stage: string;
    count: number;
    conversionRate: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    fullName: string;
    bookings: number;
    totalSpent: number;
    lastBooking: Date;
    averageBookingValue: number;
  }>;
  customerAcquisitionTrend: TimeSeriesDataPoint[];
  customerActivityTrend: TimeSeriesDataPoint[];
}

/**
 * Customer behavior summary
 */
export interface CustomerBehaviorSummary {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  churnRate: number;
  customerLifetimeValue: number;
  averageBookingsPerCustomer: number;
  topSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
  customerActivity: TimeSeriesDataPoint[];
}

// ============================================================
// CATEGORY ANALYTICS TYPES
// ============================================================

/**
 * Category analytics result
 */
export interface CategoryAnalyticsResult {
  totalCategories: number;
  activeCategories: number;
  categoriesByBookings: Array<{
    category: string;
    bookings: number;
    revenue: number;
    providers: number;
    averageRating: number;
  }>;
  topCategories: Array<{
    category: string;
    bookings: number;
    revenue: number;
    growth: number;
    share: number;
  }>;
  categoryTrends: Array<{
    category: string;
    data: TimeSeriesDataPoint[];
  }>;
  categoryPerformance: Array<{
    category: string;
    bookings: number;
    revenue: number;
    completionRate: number;
    cancellationRate: number;
    averageRating: number;
  }>;
  categoryGrowthRates: Array<{
    category: string;
    growthRate: number;
    period: string;
  }>;
}

/**
 * Category analytics summary
 */
export interface CategoryAnalyticsSummary {
  totalCategories: number;
  activeCategories: number;
  topCategories: Array<{
    category: string;
    bookings: number;
    revenue: number;
  }>;
  categoryDistribution: Record<string, number>;
  categoryRevenue: Record<string, number>;
  categoryGrowth: Array<{
    category: string;
    growthRate: number;
  }>;
}

// ============================================================
// DASHBOARD ANALYTICS TYPES
// ============================================================

/**
 * Dashboard analytics
 */
export interface DashboardAnalytics {
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalUsers: number;
    totalProviders: number;
    averageRating: number;
    completionRate: number;
    bookingGrowth: number;
    revenueGrowth: number;
    userGrowth: number;
    providerGrowth: number;
  };
  bookingTrend: TimeSeriesDataPoint[];
  revenueTrend: TimeSeriesDataPoint[];
  userTrend: TimeSeriesDataPoint[];
  topCategories: Array<{
    category: string;
    bookings: number;
    revenue: number;
  }>;
  topProviders: Array<{
    providerId: string;
    businessName: string;
    bookings: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    user: string;
  }>;
  alerts: Array<{
    id: string;
    type: "INFO" | "WARNING" | "CRITICAL";
    message: string;
    timestamp: Date;
  }>;
}

/**
 * Admin dashboard analytics
 */
export interface AdminDashboardAnalytics {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalProviders: number;
    activeProviders: number;
    verifiedProviders: number;
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingProviders: number;
    totalDisputes: number;
    openDisputes: number;
  };
  userGrowth: TimeSeriesDataPoint[];
  revenueGrowth: TimeSeriesDataPoint[];
  topCategories: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
  platformMetrics: {
    responseTime: number;
    satisfactionScore: number;
    retentionRate: number;
    conversionRate: number;
  };
}

// ============================================================
// EXPORT ANALYTICS TYPES
// ============================================================

/**
 * Analytics export data
 */
export interface AnalyticsExportData {
  date: string;
  bookings: number;
  revenue: number;
  users: number;
  providers: number;
  averageRating: number;
  completionRate: number;
  category: string | null;
  providerId: string | null;
}

/**
 * Analytics export options
 */
export interface AnalyticsExportOptions {
  type: "BOOKINGS" | "REVENUE" | "PROVIDERS" | "CUSTOMERS" | "CATEGORIES";
  period: AnalyticsPeriod;
  startDate?: Date;
  endDate?: Date;
  providerId?: string;
  category?: string;
  format: "csv" | "json" | "excel";
  includeHeaders?: boolean;
}

// ============================================================
// ANALYTICS HELPER TYPES
// ============================================================

/**
 * Analytics metric calculation result
 */
export interface AnalyticsMetricResult {
  value: number;
  previousValue: number | null;
  change: number | null;
  changePercentage: number | null;
  trend: "UP" | "DOWN" | "STABLE" | "UNKNOWN";
  confidence: number | null;
}

/**
 * Analytics comparison result
 */
export interface AnalyticsComparisonResult {
  current: number;
  previous: number;
  absoluteChange: number;
  percentageChange: number;
  isPositive: boolean;
  period: string;
}

/**
 * Analytics benchmark result
 */
export interface AnalyticsBenchmarkResult {
  value: number;
  benchmark: number;
  difference: number;
  percentageDifference: number;
  isAbove: boolean;
  percentile: number;
  rank: number;
}

/**
 * Analytics forecast result
 */
export interface AnalyticsForecastResult {
  forecast: TimeSeriesDataPoint[];
  lowerBound: TimeSeriesDataPoint[];
  upperBound: TimeSeriesDataPoint[];
  confidence: number;
  method: "ARIMA" | "PROPHET" | "SIMPLE" | "EXPONENTIAL";
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Enums
  AnalyticsPeriod,
  AnalyticsGroupBy,
  AnalyticsMetricType,
  AnalyticsDimension,

  // Date range types
  DateRange,
  DateRangeWithPeriod,
  AnalyticsFilters,

  // Time series types
  TimeSeriesDataPoint,
  TimeSeriesData,
  TimeSeriesComparison,

  // Booking analytics
  BookingAnalyticsResult,
  BookingAnalyticsSummary,

  // Revenue analytics
  RevenueAnalyticsResult,
  RevenueAnalyticsSummary,

  // Provider performance
  ProviderPerformanceMetrics,
  ProviderPerformanceSummary,
  ProviderComparisonResult,

  // Customer behavior
  CustomerBehaviorMetrics,
  CustomerBehaviorSummary,

  // Category analytics
  CategoryAnalyticsResult,
  CategoryAnalyticsSummary,

  // Dashboard analytics
  DashboardAnalytics,
  AdminDashboardAnalytics,

  // Export types
  AnalyticsExportData,
  AnalyticsExportOptions,

  // Helper types
  AnalyticsMetricResult,
  AnalyticsComparisonResult,
  AnalyticsBenchmarkResult,
  AnalyticsForecastResult,
};
