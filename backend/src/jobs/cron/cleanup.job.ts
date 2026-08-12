import { CronJob } from "cron";
import { subDays, subMonths, subHours } from "date-fns";
import logger from "../../utils/logger";
import { prisma } from "../../config/database";
import { redisService } from "../../services/redis.service";
import { deleteOldNotifications } from "../../repositories/notification.repository";

// ============================================================
// TYPES
// ============================================================

export interface CleanupJobResult {
  tokensRemoved: number;
  notificationsRemoved: number;
  unverifiedUsersRemoved: number;
  abandonedBookingsRemoved: number;
  auditLogsRemoved: number;
  sessionsRemoved: number;
  cacheKeysRemoved: number;
  totalRemoved: number;
}

export interface CleanupConfig {
  tokenExpiryDays: number;
  notificationRetentionDays: number;
  unverifiedUserExpiryDays: number;
  abandonedBookingHours: number;
  auditLogRetentionMonths: number;
  sessionExpiryDays: number;
  cacheExpiryDays: number;
}

// ============================================================
// JOB CONFIGURATION
// ============================================================

const JOB_NAME = "data-cleanup";
const CRON_EXPRESSION = "0 2 * * *"; // Run at 2:00 AM daily
const ENABLED = true;

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const DEFAULT_CONFIG: CleanupConfig = {
  tokenExpiryDays: 7,
  notificationRetentionDays: 30,
  unverifiedUserExpiryDays: 30,
  abandonedBookingHours: 48,
  auditLogRetentionMonths: 6,
  sessionExpiryDays: 7,
  cacheExpiryDays: 30,
};

// ============================================================
// JOB STATE
// ============================================================

let cronJob: CronJob | null = null;
let isRunning = false;
let lastRun: Date | null = null;
let nextRun: Date | null = null;

const CLEANUP_CACHE_KEY = "job:cleanup:last_run";
const CLEANUP_LOCK_KEY = "job:cleanup:lock";

// ============================================================
// MAIN EXECUTION FUNCTION
// ============================================================

/**
 * Execute the cleanup job
 */
async function execute(
  config: CleanupConfig = DEFAULT_CONFIG,
): Promise<CleanupJobResult> {
  const result: CleanupJobResult = {
    tokensRemoved: 0,
    notificationsRemoved: 0,
    unverifiedUsersRemoved: 0,
    abandonedBookingsRemoved: 0,
    auditLogsRemoved: 0,
    sessionsRemoved: 0,
    cacheKeysRemoved: 0,
    totalRemoved: 0,
  };

  try {
    logger.info("Starting data cleanup job...");

    // 1. Clean up expired tokens
    result.tokensRemoved = await cleanupExpiredTokens(config.tokenExpiryDays);
    logger.info(`Removed ${result.tokensRemoved} expired tokens`);

    // 2. Clean up old notifications
    result.notificationsRemoved = await cleanupOldNotifications(
      config.notificationRetentionDays,
    );
    logger.info(`Removed ${result.notificationsRemoved} old notifications`);

    // 3. Clean up unverified users
    result.unverifiedUsersRemoved = await cleanupUnverifiedUsers(
      config.unverifiedUserExpiryDays,
    );
    logger.info(`Removed ${result.unverifiedUsersRemoved} unverified users`);

    // 4. Clean up abandoned bookings
    result.abandonedBookingsRemoved = await cleanupAbandonedBookings(
      config.abandonedBookingHours,
    );
    logger.info(
      `Removed ${result.abandonedBookingsRemoved} abandoned bookings`,
    );

    // 5. Clean up old audit logs
    result.auditLogsRemoved = await cleanupAuditLogs(
      config.auditLogRetentionMonths,
    );
    logger.info(`Removed ${result.auditLogsRemoved} old audit logs`);

    // 6. Clean up expired sessions
    result.sessionsRemoved = await cleanupExpiredSessions(
      config.sessionExpiryDays,
    );
    logger.info(`Removed ${result.sessionsRemoved} expired sessions`);

    // 7. Clean up expired cache keys
    result.cacheKeysRemoved = await cleanupExpiredCache(config.cacheExpiryDays);
    logger.info(`Removed ${result.cacheKeysRemoved} expired cache keys`);

    // Calculate total
    result.totalRemoved = Object.values(result).reduce((sum, val) => {
      if (typeof val === "number") return sum + val;
      return sum;
    }, 0);

    logger.info(
      `Cleanup job completed. Total items removed: ${result.totalRemoved}`,
    );

    return result;
  } catch (error) {
    logger.error("Cleanup job execution failed:", error);
    throw error;
  }
}

// ============================================================
// CLEANUP FUNCTIONS
// ============================================================

/**
 * Clean up expired tokens
 */
async function cleanupExpiredTokens(expiryDays: number): Promise<number> {
  try {
    const cutoffDate = subDays(new Date(), expiryDays);

    // Remove expired password reset tokens
    const resetTokens = await prisma.systemSetting.deleteMany({
      where: {
        key: { startsWith: "reset_" },
        updatedAt: { lt: cutoffDate },
      },
    });

    // Remove expired OTP tokens (handled via Redis)
    const otpKeys = await redisService.keys("otp:*");
    let otpCount = 0;
    for (const key of otpKeys) {
      const ttl = await redisService.ttl(key);
      if (ttl === -2 || ttl === -1) {
        await redisService.delete(key);
        otpCount++;
      }
    }

    // Remove expired verification tokens
    const verifyTokens = await prisma.systemSetting.deleteMany({
      where: {
        key: { startsWith: "verify_" },
        updatedAt: { lt: cutoffDate },
      },
    });

    return resetTokens.count + verifyTokens.count + otpCount;
  } catch (error) {
    logger.error("Failed to cleanup expired tokens:", error);
    return 0;
  }
}

/**
 * Clean up old notifications
 */
async function cleanupOldNotifications(retentionDays: number): Promise<number> {
  try {
    return await deleteOldNotifications(retentionDays);
  } catch (error) {
    logger.error("Failed to cleanup old notifications:", error);
    return 0;
  }
}

/**
 * Clean up unverified users
 */
async function cleanupUnverifiedUsers(expiryDays: number): Promise<number> {
  try {
    const cutoffDate = subDays(new Date(), expiryDays);

    // Find users who haven't verified their email/phone
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { isEmailVerified: false },
          { isPhoneVerified: false },
          { createdAt: { lt: cutoffDate } },
          { role: "CUSTOMER" }, // Only delete customer accounts
          { bookingsAsCustomer: { none: {} } }, // No bookings
        ],
      },
      select: { id: true },
    });

    if (users.length === 0) return 0;

    // Delete unverified users
    const userIds = users.map((u) => u.id);
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });

    return result.count;
  } catch (error) {
    logger.error("Failed to cleanup unverified users:", error);
    return 0;
  }
}

/**
 * Clean up abandoned bookings
 */
async function cleanupAbandonedBookings(hours: number): Promise<number> {
  try {
    const cutoffDate = subHours(new Date(), hours);

    // Find pending bookings that haven't been updated in the cutoff time
    const bookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        updatedAt: { lt: cutoffDate },
      },
      select: { id: true },
    });

    if (bookings.length === 0) return 0;

    // Soft delete abandoned bookings (set status to CANCELLED)
    const bookingIds = bookings.map((b) => b.id);
    const result = await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
      },
      data: {
        status: "CANCELLED",
        cancellationReason: "Automatically cancelled due to inactivity",
        cancelledAt: new Date(),
        cancelledBy: "system",
      },
    });

    return result.count;
  } catch (error) {
    logger.error("Failed to cleanup abandoned bookings:", error);
    return 0;
  }
}

/**
 * Clean up old audit logs
 */
async function cleanupAuditLogs(retentionMonths: number): Promise<number> {
  try {
    const cutoffDate = subMonths(new Date(), retentionMonths);

    // Check if audit logs table exists
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  } catch (error) {
    logger.error("Failed to cleanup audit logs:", error);
    return 0;
  }
}

/**
 * Clean up expired sessions
 */
async function cleanupExpiredSessions(expiryDays: number): Promise<number> {
  try {
    const cutoffDate = subDays(new Date(), expiryDays);

    // Remove expired sessions from Redis
    const sessionKeys = await redisService.keys("session:*");
    let count = 0;

    for (const key of sessionKeys) {
      const ttl = await redisService.ttl(key);
      if (ttl === -2 || ttl === -1) {
        await redisService.delete(key);
        count++;
      }
    }

    // Remove old session records from database
    const sessionResult = await prisma.systemSetting.deleteMany({
      where: {
        key: { startsWith: "session_" },
        updatedAt: { lt: cutoffDate },
      },
    });

    return count + sessionResult.count;
  } catch (error) {
    logger.error("Failed to cleanup expired sessions:", error);
    return 0;
  }
}

/**
 * Clean up expired cache keys
 */
async function cleanupExpiredCache(expiryDays: number): Promise<number> {
  try {
    const cutoffDate = subDays(new Date(), expiryDays);

    // Remove old cache keys
    const cacheKeys = await redisService.keys("cache:*");
    let count = 0;

    for (const key of cacheKeys) {
      const ttl = await redisService.ttl(key);
      if (ttl === -2 || ttl === -1) {
        await redisService.delete(key);
        count++;
      }
    }

    // Remove old search cache
    const searchKeys = await redisService.keys("search:*");
    for (const key of searchKeys) {
      const ttl = await redisService.ttl(key);
      if (ttl === -2 || ttl === -1) {
        await redisService.delete(key);
        count++;
      }
    }

    return count;
  } catch (error) {
    logger.error("Failed to cleanup expired cache:", error);
    return 0;
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
    logger.warn("Cleanup job is already running");
    return;
  }

  if (!ENABLED) {
    logger.warn("Cleanup job is disabled");
    return;
  }

  try {
    cronJob = new CronJob(
      CRON_EXPRESSION,
      async () => {
        try {
          isRunning = true;
          lastRun = new Date();

          // Acquire lock to prevent duplicate runs
          const lock = await redisService.set(CLEANUP_LOCK_KEY, "locked", 3600);
          if (!lock) {
            logger.warn("Cleanup job lock already acquired, skipping");
            return;
          }

          const result = await execute();

          // Update last run cache
          await redisService.set(
            CLEANUP_CACHE_KEY,
            lastRun.toISOString(),
            86400,
          );

          // Release lock
          await redisService.delete(CLEANUP_LOCK_KEY);
        } catch (error) {
          logger.error("Cleanup job execution failed:", error);
          await redisService.delete(CLEANUP_LOCK_KEY);
        } finally {
          isRunning = false;
        }
      },
      null, // onComplete
      true, // start
      "Africa/Addis_Ababa", // timezone
    );

    nextRun = cronJob.nextDate().toDate();
    logger.info(`Cleanup job started. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    logger.error("Failed to start cleanup job:", error);
    throw error;
  }
}

/**
 * Stop the cron job
 */
export function stop(): void {
  if (!cronJob) {
    logger.warn("Cleanup job is not running");
    return;
  }

  try {
    cronJob.stop();
    cronJob = null;
    isRunning = false;
    nextRun = null;
    logger.info("Cleanup job stopped");
  } catch (error) {
    logger.error("Failed to stop cleanup job:", error);
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

export const cleanupJob = {
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
};

export default cleanupJob;
