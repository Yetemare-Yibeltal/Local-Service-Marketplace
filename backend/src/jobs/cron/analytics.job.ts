import { CronJob } from "cron";
import logger from "../../utils/logger";
import { prisma } from "../../config/database";
import { redisService } from "../../services/redis.service";

// ============================================================
// TYPES
// ============================================================

export interface DailyAnalytics {
  date: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  newUsers: number;
  newProviders: number;
  averageRating: number;
  totalReviews: number;
  activeBookings: number;
}

export interface WeeklyAnalytics extends DailyAnalytics {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  year: number;
}

export interface MonthlyAnalytics extends DailyAnalytics {
  month: number;
  year: number;
  monthName: string;
}

// ============================================================
// CACHE KEYS
// ============================================================

const CACHE_KEYS = {
  DAILY_ANALYTICS: "analytics:daily:",
  WEEKLY_ANALYTICS: "analytics:weekly:",
  MONTHLY_ANALYTICS: "analytics:monthly:",
  REAL_TIME_METRICS: "analytics:realtime",
};

// ============================================================
// ANALYTICS JOB FUNCTIONS
// ============================================================

/**
 * Aggregate daily analytics data
 */
export async function aggregateDailyAnalytics(): Promise<DailyAnalytics> {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const date = startOfDay.toISOString().split("T")[0];

    // Get daily metrics from database
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      newUsers,
      newProviders,
      averageRating,
      totalReviews,
      activeBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.booking.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.booking.count({
        where: {
          status: "CANCELLED",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.booking.aggregate({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { totalPrice: true },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.providerProfile.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.review.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _avg: { rating: true },
      }),
      prisma.review.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.booking.count({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
    ]);

    const dailyAnalytics: DailyAnalytics = {
      date,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      newUsers,
      newProviders,
      averageRating: averageRating._avg.rating || 0,
      totalReviews,
      activeBookings,
    };

    // Store in Redis cache
    const cacheKey = `${CACHE_KEYS.DAILY_ANALYTICS}${date}`;
    await redisService.set(cacheKey, dailyAnalytics, 86400); // 24 hours

    // Update real-time metrics
    await updateRealTimeMetrics();

    logger.info(`Daily analytics aggregated for ${date}`, dailyAnalytics);

    return dailyAnalytics;
  } catch (error) {
    logger.error("Daily analytics aggregation failed:", error);
    throw error;
  }
}

/**
 * Aggregate weekly analytics data
 */
export async function aggregateWeeklyAnalytics(): Promise<WeeklyAnalytics> {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get weekly metrics
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      newUsers,
      newProviders,
      averageRating,
      totalReviews,
      activeBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.booking.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.booking.count({
        where: {
          status: "CANCELLED",
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.booking.aggregate({
        where: {
          status: "COMPLETED",
          completedAt: { gte: weekStart, lte: weekEnd },
        },
        _sum: { totalPrice: true },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.providerProfile.count({
        where: {
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.review.aggregate({
        where: {
          createdAt: { gte: weekStart, lte: weekEnd },
        },
        _avg: { rating: true },
      }),
      prisma.review.count({
        where: {
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.booking.count({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
    ]);

    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const weeklyAnalytics: WeeklyAnalytics = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      weekNumber,
      year,
      date: weekStart.toISOString().split("T")[0],
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      newUsers,
      newProviders,
      averageRating: averageRating._avg.rating || 0,
      totalReviews,
      activeBookings,
    };

    // Store in Redis cache
    const cacheKey = `${CACHE_KEYS.WEEKLY_ANALYTICS}${year}-W${weekNumber}`;
    await redisService.set(cacheKey, weeklyAnalytics, 604800); // 7 days

    logger.info(
      `Weekly analytics aggregated for week ${weekNumber}`,
      weeklyAnalytics,
    );

    return weeklyAnalytics;
  } catch (error) {
    logger.error("Weekly analytics aggregation failed:", error);
    throw error;
  }
}

/**
 * Aggregate monthly analytics data
 */
export async function aggregateMonthlyAnalytics(): Promise<MonthlyAnalytics> {
  try {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    // Get monthly metrics
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      newUsers,
      newProviders,
      averageRating,
      totalReviews,
      activeBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.booking.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.booking.count({
        where: {
          status: "CANCELLED",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.booking.aggregate({
        where: {
          status: "COMPLETED",
          completedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalPrice: true },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.providerProfile.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.review.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _avg: { rating: true },
      }),
      prisma.review.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.booking.count({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
    ]);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyAnalytics: MonthlyAnalytics = {
      month: month + 1,
      year,
      monthName: monthNames[month],
      date: monthStart.toISOString().split("T")[0],
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      newUsers,
      newProviders,
      averageRating: averageRating._avg.rating || 0,
      totalReviews,
      activeBookings,
    };

    // Store in Redis cache
    const cacheKey = `${CACHE_KEYS.MONTHLY_ANALYTICS}${year}-${String(month + 1).padStart(2, "0")}`;
    await redisService.set(cacheKey, monthlyAnalytics, 2592000); // 30 days

    logger.info(
      `Monthly analytics aggregated for ${monthNames[month]} ${year}`,
      monthlyAnalytics,
    );

    return monthlyAnalytics;
  } catch (error) {
    logger.error("Monthly analytics aggregation failed:", error);
    throw error;
  }
}

/**
 * Update real-time metrics cache
 */
async function updateRealTimeMetrics(): Promise<void> {
  try {
    const [
      totalBookings,
      totalUsers,
      totalProviders,
      activeBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.user.count(),
      prisma.providerProfile.count(),
      prisma.booking.count({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
        },
      }),
      prisma.booking.aggregate({
        where: { status: "COMPLETED" },
        _sum: { totalPrice: true },
      }),
    ]);

    const metrics = {
      totalBookings,
      totalUsers,
      totalProviders,
      activeBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      lastUpdated: new Date().toISOString(),
    };

    await redisService.set(CACHE_KEYS.REAL_TIME_METRICS, metrics, 300); // 5 minutes

    logger.debug("Real-time metrics updated", metrics);
  } catch (error) {
    logger.error("Real-time metrics update failed:", error);
    throw error;
  }
}

/**
 * Get week number from date
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Run all analytics aggregation jobs
 */
export async function runAllAnalyticsJobs(): Promise<void> {
  try {
    logger.info("Starting all analytics aggregation jobs...");

    await Promise.all([
      aggregateDailyAnalytics(),
      aggregateWeeklyAnalytics(),
      aggregateMonthlyAnalytics(),
    ]);

    logger.info("All analytics aggregation jobs completed successfully");
  } catch (error) {
    logger.error("Analytics aggregation jobs failed:", error);
    throw error;
  }
}

/**
 * Get daily analytics from cache or database
 */
export async function getDailyAnalytics(
  date: string,
): Promise<DailyAnalytics | null> {
  try {
    const cacheKey = `${CACHE_KEYS.DAILY_ANALYTICS}${date}`;
    const cached = await redisService.get<DailyAnalytics>(cacheKey);

    if (cached) {
      return cached;
    }

    // If not in cache, aggregate from database
    return await aggregateDailyAnalytics();
  } catch (error) {
    logger.error("Get daily analytics failed:", error);
    return null;
  }
}

/**
 * Get weekly analytics from cache or database
 */
export async function getWeeklyAnalytics(
  year: number,
  weekNumber: number,
): Promise<WeeklyAnalytics | null> {
  try {
    const cacheKey = `${CACHE_KEYS.WEEKLY_ANALYTICS}${year}-W${weekNumber}`;
    const cached = await redisService.get<WeeklyAnalytics>(cacheKey);

    if (cached) {
      return cached;
    }

    // If not in cache, aggregate from database
    return await aggregateWeeklyAnalytics();
  } catch (error) {
    logger.error("Get weekly analytics failed:", error);
    return null;
  }
}

/**
 * Get monthly analytics from cache or database
 */
export async function getMonthlyAnalytics(
  year: number,
  month: number,
): Promise<MonthlyAnalytics | null> {
  try {
    const cacheKey = `${CACHE_KEYS.MONTHLY_ANALYTICS}${year}-${String(month).padStart(2, "0")}`;
    const cached = await redisService.get<MonthlyAnalytics>(cacheKey);

    if (cached) {
      return cached;
    }

    // If not in cache, aggregate from database
    return await aggregateMonthlyAnalytics();
  } catch (error) {
    logger.error("Get monthly analytics failed:", error);
    return null;
  }
}

/**
 * Get real-time metrics from cache
 */
export async function getRealTimeMetrics(): Promise<any> {
  try {
    const cached = await redisService.get(CACHE_KEYS.REAL_TIME_METRICS);
    if (cached) {
      return cached;
    }

    await updateRealTimeMetrics();
    return await redisService.get(CACHE_KEYS.REAL_TIME_METRICS);
  } catch (error) {
    logger.error("Get real-time metrics failed:", error);
    return null;
  }
}

// ============================================================
// CRON JOB DEFINITION
// ============================================================

/**
 * Analytics cron job - runs at midnight every day
 */
export const analyticsCronJob = new CronJob(
  "0 0 * * *", // At 00:00 every day
  async () => {
    logger.info("Analytics cron job started");
    try {
      await runAllAnalyticsJobs();
      logger.info("Analytics cron job completed successfully");
    } catch (error) {
      logger.error("Analytics cron job failed:", error);
    }
  },
  null, // onComplete
  true, // start
  "Africa/Addis_Ababa", // timezone
);

/**
 * Weekly analytics job - runs at midnight on Monday
 */
export const weeklyAnalyticsJob = new CronJob(
  "0 0 * * 1", // At 00:00 on Monday
  async () => {
    logger.info("Weekly analytics job started");
    try {
      await aggregateWeeklyAnalytics();
      logger.info("Weekly analytics job completed");
    } catch (error) {
      logger.error("Weekly analytics job failed:", error);
    }
  },
  null,
  true,
  "Africa/Addis_Ababa",
);

/**
 * Monthly analytics job - runs at midnight on the 1st of each month
 */
export const monthlyAnalyticsJob = new CronJob(
  "0 0 1 * *", // At 00:00 on the 1st of every month
  async () => {
    logger.info("Monthly analytics job started");
    try {
      await aggregateMonthlyAnalytics();
      logger.info("Monthly analytics job completed");
    } catch (error) {
      logger.error("Monthly analytics job failed:", error);
    }
  },
  null,
  true,
  "Africa/Addis_Ababa",
);

// ============================================================
// START ALL JOBS
// ============================================================

export function startAllAnalyticsJobs(): void {
  logger.info("Starting all analytics cron jobs...");
  analyticsCronJob.start();
  weeklyAnalyticsJob.start();
  monthlyAnalyticsJob.start();
  logger.info("All analytics cron jobs started");
}

// ============================================================
// STOP ALL JOBS
// ============================================================

export function stopAllAnalyticsJobs(): void {
  logger.info("Stopping all analytics cron jobs...");
  analyticsCronJob.stop();
  weeklyAnalyticsJob.stop();
  monthlyAnalyticsJob.stop();
  logger.info("All analytics cron jobs stopped");
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Job functions
  aggregateDailyAnalytics,
  aggregateWeeklyAnalytics,
  aggregateMonthlyAnalytics,
  runAllAnalyticsJobs,

  // Getter functions
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getRealTimeMetrics,

  // Cron jobs
  analyticsCronJob,
  weeklyAnalyticsJob,
  monthlyAnalyticsJob,

  // Control functions
  startAllAnalyticsJobs,
  stopAllAnalyticsJobs,
};
