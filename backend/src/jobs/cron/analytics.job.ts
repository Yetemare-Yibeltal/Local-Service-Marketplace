import { CronJob } from "cron";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import logger from "../../utils/logger";
import { prisma } from "../../config/database";
import { redisService } from "../../services/redis.service";

// ============================================================
// TYPES
// ============================================================

export interface DailyAnalytics {
  date: string;
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    disputed: number;
    revenue: number;
    averageValue: number;
  };
  users: {
    new: number;
    active: number;
    total: number;
  };
  providers: {
    new: number;
    active: number;
    total: number;
    verified: number;
  };
  categories: Record<string, { bookings: number; revenue: number }>;
  topProviders: Array<{
    providerId: string;
    businessName: string;
    bookings: number;
    revenue: number;
  }>;
  disputes: {
    total: number;
    resolved: number;
    open: number;
  };
  reviews: {
    total: number;
    averageRating: number;
  };
}

export interface AnalyticsJobResult {
  date: string;
  aggregated: boolean;
  data: DailyAnalytics;
  cached: boolean;
}

// ============================================================
// JOB CONFIGURATION
// ============================================================

const JOB_NAME = "analytics-aggregation";
const CRON_EXPRESSION = "0 1 * * *"; // Run at 1:00 AM daily
const ENABLED = true;

// ============================================================
// JOB STATE
// ============================================================

let cronJob: CronJob | null = null;
let isRunning = false;
let lastRun: Date | null = null;
let nextRun: Date | null = null;

const ANALYTICS_CACHE_KEY = "job:analytics:last_run";
const ANALYTICS_LOCK_KEY = "job:analytics:lock";
const DAILY_ANALYTICS_PREFIX = "analytics:daily:";

// ============================================================
// MAIN EXECUTION FUNCTION
// ============================================================

/**
 * Execute the analytics aggregation job
 */
async function execute(): Promise<AnalyticsJobResult> {
  const date = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const startDate = startOfDay(subDays(new Date(), 1));
  const endDate = endOfDay(subDays(new Date(), 1));

  try {
    logger.info(`Starting analytics aggregation for ${date}...`);

    // Acquire lock
    const lock = await redisService.set(ANALYTICS_LOCK_KEY, "locked", 3600);
    if (!lock) {
      logger.warn("Analytics job lock already acquired, skipping");
      return {
        date,
        aggregated: false,
        data: {} as DailyAnalytics,
        cached: false,
      };
    }

    // Aggregate data
    const data = await aggregateDailyAnalytics(startDate, endDate);

    // Cache the results
    const cacheKey = `${DAILY_ANALYTICS_PREFIX}${date}`;
    await redisService.set(cacheKey, data, 604800); // 7 days TTL

    // Store in database for historical records
    await storeAnalytics(date, data);

    // Update last run
    await redisService.set(
      ANALYTICS_CACHE_KEY,
      new Date().toISOString(),
      86400,
    );

    // Release lock
    await redisService.delete(ANALYTICS_LOCK_KEY);

    logger.info(`Analytics aggregation completed for ${date}`);

    return {
      date,
      aggregated: true,
      data,
      cached: true,
    };
  } catch (error) {
    logger.error(`Analytics aggregation failed for ${date}:`, error);
    await redisService.delete(ANALYTICS_LOCK_KEY);
    throw error;
  }
}

/**
 * Aggregate daily analytics data
 */
async function aggregateDailyAnalytics(
  startDate: Date,
  endDate: Date,
): Promise<DailyAnalytics> {
  // 1. Get booking metrics
  const bookings = await getBookingMetrics(startDate, endDate);

  // 2. Get user metrics
  const users = await getUserMetrics(startDate, endDate);

  // 3. Get provider metrics
  const providers = await getProviderMetrics(startDate, endDate);

  // 4. Get category metrics
  const categories = await getCategoryMetrics(startDate, endDate);

  // 5. Get top providers
  const topProviders = await getTopProviders(startDate, endDate);

  // 6. Get dispute metrics
  const disputes = await getDisputeMetrics(startDate, endDate);

  // 7. Get review metrics
  const reviews = await getReviewMetrics(startDate, endDate);

  return {
    date: format(startDate, "yyyy-MM-dd"),
    bookings,
    users,
    providers,
    categories,
    topProviders,
    disputes,
    reviews,
  };
}

/**
 * Get booking metrics
 */
async function getBookingMetrics(
  startDate: Date,
  endDate: Date,
): Promise<DailyAnalytics["bookings"]> {
  try {
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      disputedBookings,
      revenueResult,
    ] = await Promise.all([
      prisma.booking.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.booking.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.booking.count({
        where: {
          status: "CANCELLED",
          cancelledAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.booking.count({
        where: {
          status: "PENDING",
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.booking.count({
        where: {
          status: "DISPUTED",
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.booking.aggregate({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalPrice: true },
        _avg: { totalPrice: true },
      }),
    ]);

    return {
      total: totalBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      pending: pendingBookings,
      disputed: disputedBookings,
      revenue: revenueResult._sum.totalPrice || 0,
      averageValue: revenueResult._avg.totalPrice || 0,
    };
  } catch (error) {
    logger.error("Failed to get booking metrics:", error);
    return {
      total: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      disputed: 0,
      revenue: 0,
      averageValue: 0,
    };
  }
}

/**
 * Get user metrics
 */
async function getUserMetrics(
  startDate: Date,
  endDate: Date,
): Promise<DailyAnalytics["users"]> {
  try {
    const [newUsers, activeUsers, totalUsers] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      new: newUsers,
      active: activeUsers,
      total: totalUsers,
    };
  } catch (error) {
    logger.error("Failed to get user metrics:", error);
    return { new: 0, active: 0, total: 0 };
  }
}

/**
 * Get provider metrics
 */
async function getProviderMetrics(
  startDate: Date,
  endDate: Date,
): Promise<DailyAnalytics["providers"]> {
  try {
    const [newProviders, activeProviders, totalProviders, verifiedProviders] =
      await Promise.all([
        prisma.providerProfile.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        prisma.providerProfile.count({
          where: {
            updatedAt: { gte: startDate, lte: endDate },
            isAvailable: true,
          },
        }),
        prisma.providerProfile.count(),
        prisma.providerProfile.count({
          where: { isVerified: true },
        }),
      ]);

    return {
      new: newProviders,
      active: activeProviders,
      total: totalProviders,
      verified: verifiedProviders,
    };
  } catch (error) {
    logger.error("Failed to get provider metrics:", error);
    return { new: 0, active: 0, total: 0, verified: 0 };
  }
}

/**
 * Get category metrics
 */
async function getCategoryMetrics(
  startDate: Date,
  endDate: Date,
): Promise<DailyAnalytics["categories"]> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { name: true },
    });

    const result: DailyAnalytics["categories"] = {};

    for (const category of categories) {
      const bookings = await prisma.booking.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startDate, lte: endDate },
          provider: { category: category.name },
        },
      });

      const revenue = await prisma.booking.aggregate({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startDate, lte: endDate },
          provider: { category: category.name },
        },
        _sum: { totalPrice: true },
      });

      if (bookings > 0 || (revenue._sum.totalPrice || 0) > 0) {
        result[category.name] = {
          bookings,
          revenue: revenue._sum.totalPrice || 0,
        };
      }
    }

    return result;
  } catch (error) {
    logger.error("Failed to get category metrics:", error);
    return {};
  }
}

/**
 * Get top providers
 */
async function getTopProviders(
  startDate: Date,
  endDate: Date,
): Promise<DailyAnalytics["topProviders"]> {
  try {
    const results = await prisma.booking.groupBy({
      by: ["providerId"],
      where: {
        status: "COMPLETED",
        completedAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: {
        _sum: {
          totalPrice: "desc",
        },
      },
      take: 10,
    });

    const topProviders = await Promise.all(
      results.map(async (item) => {
        const provider = await prisma.providerProfile.findUnique({
          where: { id: item.providerId },
          select: { businessName: true },
        });
        return {
          providerId: item.providerId,
          businessName: provider?.businessName || "Unknown",
          bookings: item._count.id,
          revenue: item._sum.totalPrice || 0,
        };
      }),
    );

    return topProviders;
  } catch (error) {
    logger.error("Failed to get top providers:", error);
    return [];
  }
}

/**
 * Get dispute metrics
 */
async function getDisputeMetrics(
  startDate: Date,
  endDate: Date,
): Promise<DailyAnalytics["disputes"]> {
  try {
    const [total, resolved, open] = await Promise.all([
      prisma.dispute.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.dispute.count({
        where: {
          status: "RESOLVED",
          resolvedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.dispute.count({
        where: {
          status: { in: ["OPEN", "UNDER_REVIEW"] },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    return { total, resolved, open };
  } catch (error) {
    logger.error("Failed to get dispute metrics:", error);
    return { total: 0, resolved: 0, open: 0 };
  }
}

/**
 * Get review metrics
 */
async function getReviewMetrics(
  startDate: Date,
  endDate: Date,
): Promise<DailyAnalytics["reviews"]> {
  try {
    const [total, avgRating] = await Promise.all([
      prisma.review.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.review.aggregate({
        where: { createdAt: { gte: startDate, lte: endDate } },
        _avg: { rating: true },
      }),
    ]);

    return {
      total,
      averageRating: avgRating._avg.rating || 0,
    };
  } catch (error) {
    logger.error("Failed to get review metrics:", error);
    return { total: 0, averageRating: 0 };
  }
}

/**
 * Store analytics in database
 */
async function storeAnalytics(
  date: string,
  data: DailyAnalytics,
): Promise<void> {
  try {
    // Store as system setting for historical data
    const existing = await prisma.systemSetting.findUnique({
      where: { key: `analytics:${date}` },
    });

    if (existing) {
      await prisma.systemSetting.update({
        where: { key: `analytics:${date}` },
        data: {
          value: data,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.systemSetting.create({
        data: {
          key: `analytics:${date}`,
          value: data,
          description: `Daily analytics for ${date}`,
          isPublic: false,
        },
      });
    }
  } catch (error) {
    logger.error(`Failed to store analytics for ${date}:`, error);
  }
}

/**
 * Get cached analytics for a specific date
 */
export async function getCachedAnalytics(
  date: string,
): Promise<DailyAnalytics | null> {
  try {
    const cacheKey = `${DAILY_ANALYTICS_PREFIX}${date}`;
    return await redisService.get<DailyAnalytics>(cacheKey);
  } catch (error) {
    logger.error(`Failed to get cached analytics for ${date}:`, error);
    return null;
  }
}

// ============================================================
// JOB MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Start the cron job
 */
export function start(): void {
  if (cronJob) {
    logger.warn("Analytics job is already running");
    return;
  }

  if (!ENABLED) {
    logger.warn("Analytics job is disabled");
    return;
  }

  try {
    cronJob = new CronJob(
      CRON_EXPRESSION,
      async () => {
        try {
          isRunning = true;
          lastRun = new Date();
          await execute();
        } catch (error) {
          logger.error("Analytics job execution failed:", error);
        } finally {
          isRunning = false;
        }
      },
      null,
      true,
      "Africa/Addis_Ababa",
    );

    nextRun = cronJob.nextDate().toDate();
    logger.info(`Analytics job started. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    logger.error("Failed to start analytics job:", error);
    throw error;
  }
}

/**
 * Stop the cron job
 */
export function stop(): void {
  if (!cronJob) {
    logger.warn("Analytics job is not running");
    return;
  }

  try {
    cronJob.stop();
    cronJob = null;
    isRunning = false;
    nextRun = null;
    logger.info("Analytics job stopped");
  } catch (error) {
    logger.error("Failed to stop analytics job:", error);
    throw error;
  }
}

/**
 * Get job status
 */
export function getStatus(): {
  name: string;
  running: boolean;
  enabled: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  cronExpression: string;
} {
  return {
    name: JOB_NAME,
    running: isRunning,
    enabled: ENABLED,
    lastRun: lastRun,
    nextRun: nextRun,
    cronExpression: CRON_EXPRESSION,
  };
}

// ============================================================
// INITIALIZATION
// ============================================================

if (ENABLED) {
  start();
}

// ============================================================
// EXPORTS
// ============================================================

export const analyticsJob = {
  name: JOB_NAME,
  cronExpression: CRON_EXPRESSION,
  enabled: ENABLED,
  running: isRunning,
  lastRun,
  nextRun,
  start,
  stop,
  execute,
  getStatus,
  getCachedAnalytics,
};

export default analyticsJob;
