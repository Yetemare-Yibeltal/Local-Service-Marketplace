import { Queue, Worker, Job, QueueScheduler } from "bullmq";
import { redisService } from "../../services/redis.service";
import { sendNotification } from "../../services/internal/notification.service";
import { findUserById } from "../../repositories/user.repository";
import { createNotification } from "../../repositories/notification.repository";
import { getUserNotificationPreferences } from "../../services/internal/notification.service";
import logger from "../../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface NotificationJobData {
  id?: string;
  userId: string;
  type: "EMAIL" | "SMS" | "PUSH";
  title: string;
  message: string;
  data?: Record<string, any>;
  metadata?: {
    bookingId?: string;
    providerId?: string;
    reviewId?: string;
    paymentId?: string;
    correlationId?: string;
    source?: string;
  };
  priority?: "low" | "normal" | "high" | "critical";
  retryCount?: number;
  maxRetries?: number;
  scheduledFor?: Date;
}

export interface NotificationJobResult {
  success: boolean;
  notificationId?: string;
  jobId: string;
  userId: string;
  type: string;
  error?: string;
  attempts: number;
  processedAt: Date;
}

export interface NotificationQueueConfig {
  queueName: string;
  concurrency: number;
  maxRetries: number;
  retryDelay: number;
  removeOnComplete: boolean;
  removeOnFail: boolean;
  stalledInterval: number;
  maxStalledCount: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_CONFIG: NotificationQueueConfig = {
  queueName: "notification-queue",
  concurrency: 5,
  maxRetries: 3,
  retryDelay: 5000,
  removeOnComplete: true,
  removeOnFail: false,
  stalledInterval: 30000,
  maxStalledCount: 3,
};

export const NOTIFICATION_QUEUE_NAME = "notification-queue";

// ============================================================
// QUEUE INSTANCE
// ============================================================

let notificationQueue: Queue | null = null;
let notificationWorker: Worker | null = null;
let queueScheduler: QueueScheduler | null = null;

/**
 * Get the notification queue instance
 */
export function getNotificationQueue(): Queue {
  if (!notificationQueue) {
    notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
      connection: {
        host: redisService.getHost(),
        port: redisService.getPort(),
        password: redisService.getPassword(),
      },
      defaultJobOptions: {
        attempts: DEFAULT_CONFIG.maxRetries,
        backoff: {
          type: "exponential",
          delay: DEFAULT_CONFIG.retryDelay,
        },
        removeOnComplete: DEFAULT_CONFIG.removeOnComplete,
        removeOnFail: DEFAULT_CONFIG.removeOnFail,
        priority: 3,
      },
    });

    logger.info(`Notification queue initialized: ${NOTIFICATION_QUEUE_NAME}`);
  }

  return notificationQueue;
}

/**
 * Get the notification worker instance
 */
export function getNotificationWorker(): Worker {
  if (!notificationWorker) {
    notificationWorker = new Worker(
      NOTIFICATION_QUEUE_NAME,
      async (job: Job<NotificationJobData>) => {
        return await processNotificationJob(job);
      },
      {
        connection: {
          host: redisService.getHost(),
          port: redisService.getPort(),
          password: redisService.getPassword(),
        },
        concurrency: DEFAULT_CONFIG.concurrency,
        stalledInterval: DEFAULT_CONFIG.stalledInterval,
        maxStalledCount: DEFAULT_CONFIG.maxStalledCount,
        lockDuration: 30000,
      },
    );

    // Worker event handlers
    notificationWorker.on("completed", (job: Job) => {
      logger.debug(`Notification job completed: ${job.id}`, {
        jobId: job.id,
        userId: job.data?.userId,
        type: job.data?.type,
      });
    });

    notificationWorker.on("failed", (job: Job | undefined, error: Error) => {
      if (job) {
        logger.error(`Notification job failed: ${job.id}`, {
          jobId: job.id,
          userId: job.data?.userId,
          type: job.data?.type,
          error: error.message,
          attempts: job.attemptsMade,
        });
      } else {
        logger.error("Notification job failed with no job reference:", error);
      }
    });

    notificationWorker.on("stalled", (jobId: string) => {
      logger.warn(`Notification job stalled: ${jobId}`);
    });

    notificationWorker.on("error", (error: Error) => {
      logger.error("Notification worker error:", error);
    });

    logger.info(
      `Notification worker initialized with concurrency: ${DEFAULT_CONFIG.concurrency}`,
    );
  }

  return notificationWorker;
}

/**
 * Get the queue scheduler instance
 */
export function getQueueScheduler(): QueueScheduler {
  if (!queueScheduler) {
    queueScheduler = new QueueScheduler(NOTIFICATION_QUEUE_NAME, {
      connection: {
        host: redisService.getHost(),
        port: redisService.getPort(),
        password: redisService.getPassword(),
      },
    });

    logger.info(
      `Notification queue scheduler initialized: ${NOTIFICATION_QUEUE_NAME}`,
    );
  }

  return queueScheduler;
}

// ============================================================
// JOB PROCESSING
// ============================================================

/**
 * Process a notification job
 */
async function processNotificationJob(
  job: Job<NotificationJobData>,
): Promise<NotificationJobResult> {
  const startTime = Date.now();
  const data = job.data;

  logger.debug(`Processing notification job: ${job.id}`, {
    userId: data.userId,
    type: data.type,
    title: data.title,
    attempts: job.attemptsMade + 1,
  });

  try {
    // Verify user exists
    const user = await findUserById(data.userId);
    if (!user) {
      const errorMsg = `User ${data.userId} not found`;
      logger.warn(`Notification job ${job.id} failed: ${errorMsg}`);

      return {
        success: false,
        jobId: job.id || "",
        userId: data.userId,
        type: data.type,
        error: errorMsg,
        attempts: job.attemptsMade + 1,
        processedAt: new Date(),
      };
    }

    // Check user notification preferences
    const preferences = await getUserNotificationPreferences(data.userId);

    // Check if user has enabled this notification type
    let shouldSend = true;
    if (data.type === "EMAIL" && !preferences.emailEnabled) {
      shouldSend = false;
    } else if (data.type === "SMS" && !preferences.smsEnabled) {
      shouldSend = false;
    } else if (data.type === "PUSH" && !preferences.pushEnabled) {
      shouldSend = false;
    }

    // Check category preferences
    const category = data.metadata?.source || "general";
    if (data.metadata?.bookingId && !preferences.bookingUpdates) {
      shouldSend = false;
    } else if (data.metadata?.reviewId && !preferences.bookingUpdates) {
      shouldSend = false;
    } else if (category === "promotional" && !preferences.promotionalEmails) {
      shouldSend = false;
    } else if (category === "system" && !preferences.systemAlerts) {
      shouldSend = false;
    }

    if (!shouldSend) {
      logger.debug(`Notification suppressed by user preferences: ${job.id}`, {
        userId: data.userId,
        type: data.type,
      });

      // Create notification record as sent (but actually suppressed)
      const notification = await createNotification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
      });

      return {
        success: true,
        notificationId: notification.id,
        jobId: job.id || "",
        userId: data.userId,
        type: data.type,
        attempts: job.attemptsMade + 1,
        processedAt: new Date(),
      };
    }

    // Send notification
    const notification = await sendNotification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
    });

    const duration = Date.now() - startTime;

    logger.info(`Notification sent successfully: ${job.id}`, {
      userId: data.userId,
      type: data.type,
      notificationId: notification.id,
      duration,
    });

    return {
      success: true,
      notificationId: notification.id,
      jobId: job.id || "",
      userId: data.userId,
      type: data.type,
      attempts: job.attemptsMade + 1,
      processedAt: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if we should retry
    const attemptsMade = job.attemptsMade + 1;
    const maxRetries = data.maxRetries || DEFAULT_CONFIG.maxRetries;

    if (attemptsMade < maxRetries) {
      logger.warn(
        `Notification job ${job.id} failed, retrying (${attemptsMade}/${maxRetries})`,
        {
          error: errorMessage,
          userId: data.userId,
          type: data.type,
        },
      );

      // Throw to trigger retry
      throw error;
    }

    // Max retries reached, log as failed
    logger.error(
      `Notification job ${job.id} failed after ${attemptsMade} attempts`,
      {
        error: errorMessage,
        userId: data.userId,
        type: data.type,
        attempts: attemptsMade,
      },
    );

    return {
      success: false,
      jobId: job.id || "",
      userId: data.userId,
      type: data.type,
      error: errorMessage,
      attempts: attemptsMade,
      processedAt: new Date(),
    };
  }
}

// ============================================================
// JOB ADDITION FUNCTIONS
// ============================================================

/**
 * Add a single notification to the queue
 */
export async function addNotificationToQueue(
  data: NotificationJobData,
  priority?: "low" | "normal" | "high" | "critical",
): Promise<string> {
  try {
    const queue = getNotificationQueue();

    const priorityMap = {
      low: 10,
      normal: 5,
      high: 3,
      critical: 1,
    };

    const job = await queue.add("send-notification", data, {
      priority: priority ? priorityMap[priority] : 5,
      attempts: data.maxRetries || DEFAULT_CONFIG.maxRetries,
      backoff: {
        type: "exponential",
        delay: DEFAULT_CONFIG.retryDelay,
      },
      removeOnComplete: DEFAULT_CONFIG.removeOnComplete,
      removeOnFail: DEFAULT_CONFIG.removeOnFail,
    });

    logger.debug(`Notification added to queue: ${job.id}`, {
      userId: data.userId,
      type: data.type,
      priority: priority || "normal",
    });

    return job.id;
  } catch (error) {
    logger.error("Failed to add notification to queue:", error);
    throw error;
  }
}

/**
 * Add bulk notifications to the queue
 */
export async function addBulkNotificationsToQueue(
  notifications: NotificationJobData[],
  priority?: "low" | "normal" | "high" | "critical",
): Promise<{
  total: number;
  jobIds: string[];
  failed: Array<{ notification: NotificationJobData; error: string }>;
}> {
  const jobIds: string[] = [];
  const failed: Array<{ notification: NotificationJobData; error: string }> =
    [];

  try {
    const queue = getNotificationQueue();

    const priorityMap = {
      low: 10,
      normal: 5,
      high: 3,
      critical: 1,
    };

    const addPromises = notifications.map(async (notification) => {
      try {
        const job = await queue.add("send-notification", notification, {
          priority: priority ? priorityMap[priority] : 5,
          attempts: notification.maxRetries || DEFAULT_CONFIG.maxRetries,
          backoff: {
            type: "exponential",
            delay: DEFAULT_CONFIG.retryDelay,
          },
          removeOnComplete: DEFAULT_CONFIG.removeOnComplete,
          removeOnFail: DEFAULT_CONFIG.removeOnFail,
        });

        jobIds.push(job.id);
      } catch (error) {
        failed.push({
          notification,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(addPromises);

    logger.info(
      `Added ${jobIds.length} notifications to queue${failed.length > 0 ? ` (${failed.length} failed)` : ""}`,
    );

    return {
      total: notifications.length,
      jobIds,
      failed,
    };
  } catch (error) {
    logger.error("Failed to add bulk notifications to queue:", error);
    throw error;
  }
}

/**
 * Add booking notification to queue (convenience method)
 */
export async function addBookingNotificationToQueue(
  userId: string,
  bookingId: string,
  status: string,
  type: "EMAIL" | "SMS" | "PUSH" = "EMAIL",
  priority?: "high" | "critical",
): Promise<string> {
  const statusMessages: Record<string, { title: string; message: string }> = {
    CONFIRMED: {
      title: "Booking Confirmed",
      message: `Your booking has been confirmed.`,
    },
    IN_PROGRESS: {
      title: "Booking In Progress",
      message: `Your booking is now in progress.`,
    },
    COMPLETED: {
      title: "Booking Completed",
      message: `Your booking has been completed. Please leave a review.`,
    },
    CANCELLED: {
      title: "Booking Cancelled",
      message: `Your booking has been cancelled.`,
    },
  };

  const statusInfo = statusMessages[status] || {
    title: `Booking ${status}`,
    message: `Your booking status has been updated to ${status}.`,
  };

  return addNotificationToQueue({
    userId,
    type,
    title: statusInfo.title,
    message: statusInfo.message,
    metadata: {
      bookingId,
      source: "booking",
    },
    priority: priority || "high",
  });
}

/**
 * Add provider notification to queue
 */
export async function addProviderNotificationToQueue(
  userId: string,
  providerId: string,
  action: string,
  type: "EMAIL" | "SMS" | "PUSH" = "EMAIL",
): Promise<string> {
  const actionMessages: Record<string, { title: string; message: string }> = {
    VERIFIED: {
      title: "Provider Verified",
      message: "Your provider account has been verified successfully.",
    },
    REJECTED: {
      title: "Provider Verification",
      message:
        "Your provider verification needs review. Please check your dashboard.",
    },
    NEW_BOOKING: {
      title: "New Booking Request",
      message: "You have received a new booking request.",
    },
    RATING: {
      title: "New Rating Received",
      message: "You have received a new rating from a customer.",
    },
  };

  const actionInfo = actionMessages[action] || {
    title: `Provider ${action}`,
    message: `Your provider account has been updated.`,
  };

  return addNotificationToQueue({
    userId,
    type,
    title: actionInfo.title,
    message: actionInfo.message,
    metadata: {
      providerId,
      source: "provider",
    },
    priority: "normal",
  });
}

/**
 * Add review notification to queue
 */
export async function addReviewNotificationToQueue(
  userId: string,
  reviewId: string,
  providerId: string,
  rating: number,
  type: "EMAIL" | "SMS" | "PUSH" = "EMAIL",
): Promise<string> {
  return addNotificationToQueue({
    userId,
    type,
    title: "New Review Received",
    message: `You received a ${rating}-star review from a customer.`,
    metadata: {
      reviewId,
      providerId,
      source: "review",
    },
    priority: "normal",
  });
}

/**
 * Add payment notification to queue
 */
export async function addPaymentNotificationToQueue(
  userId: string,
  paymentId: string,
  bookingId: string,
  amount: number,
  status: string,
  type: "EMAIL" | "SMS" | "PUSH" = "EMAIL",
): Promise<string> {
  return addNotificationToQueue({
    userId,
    type,
    title: `Payment ${status}`,
    message: `Payment of ETB ${amount.toFixed(2)} for booking has been ${status}.`,
    metadata: {
      paymentId,
      bookingId,
      source: "payment",
    },
    priority: "high",
  });
}

// ============================================================
// QUEUE MANAGEMENT
// ============================================================

/**
 * Get queue status
 */
export async function getQueueStatus(): Promise<{
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}> {
  try {
    const queue = getNotificationQueue();

    const [active, waiting, completed, failed, delayed, paused] =
      await Promise.all([
        queue.getActiveCount(),
        queue.getWaitingCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused(),
      ]);

    return {
      active,
      waiting,
      completed,
      failed,
      delayed,
      paused,
    };
  } catch (error) {
    logger.error("Failed to get queue status:", error);
    return {
      active: 0,
      waiting: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: false,
    };
  }
}

/**
 * Pause the queue
 */
export async function pauseQueue(): Promise<void> {
  try {
    const queue = getNotificationQueue();
    await queue.pause();
    logger.info("Notification queue paused");
  } catch (error) {
    logger.error("Failed to pause queue:", error);
    throw error;
  }
}

/**
 * Resume the queue
 */
export async function resumeQueue(): Promise<void> {
  try {
    const queue = getNotificationQueue();
    await queue.resume();
    logger.info("Notification queue resumed");
  } catch (error) {
    logger.error("Failed to resume queue:", error);
    throw error;
  }
}

/**
 * Clean the queue
 */
export async function cleanQueue(): Promise<{
  cleaned: number;
  failed: number;
}> {
  try {
    const queue = getNotificationQueue();

    const [cleaned, failed] = await Promise.all([
      queue.clean(0, 0, "completed"),
      queue.clean(0, 0, "failed"),
    ]);

    logger.info(
      `Cleaned notification queue: ${cleaned.length} completed, ${failed.length} failed`,
    );

    return {
      cleaned: cleaned.length,
      failed: failed.length,
    };
  } catch (error) {
    logger.error("Failed to clean queue:", error);
    throw error;
  }
}

/**
 * Get job by ID
 */
export async function getJob(
  jobId: string,
): Promise<Job<NotificationJobData> | null> {
  try {
    const queue = getNotificationQueue();
    return await queue.getJob(jobId);
  } catch (error) {
    logger.error(`Failed to get job ${jobId}:`, error);
    return null;
  }
}

/**
 * Get job result
 */
export async function getJobResult(
  jobId: string,
): Promise<NotificationJobResult | null> {
  try {
    const job = await getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      success: state === "completed",
      jobId,
      userId: job.data?.userId || "",
      type: job.data?.type || "EMAIL",
      attempts: job.attemptsMade + 1,
      processedAt: job.processedOn ? new Date(job.processedOn) : new Date(),
      error: job.failedReason || undefined,
    };
  } catch (error) {
    logger.error(`Failed to get job result ${jobId}:`, error);
    return null;
  }
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<boolean> {
  try {
    const job = await getJob(jobId);
    if (!job) {
      return false;
    }

    await job.retry();
    logger.info(`Retrying job: ${jobId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to retry job ${jobId}:`, error);
    return false;
  }
}

/**
 * Remove a job
 */
export async function removeJob(jobId: string): Promise<boolean> {
  try {
    const job = await getJob(jobId);
    if (!job) {
      return false;
    }

    await job.remove();
    logger.debug(`Job removed: ${jobId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to remove job ${jobId}:`, error);
    return false;
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize the notification queue
 */
export function initializeNotificationQueue(): void {
  try {
    getNotificationQueue();
    getNotificationWorker();
    getQueueScheduler();
    logger.info("Notification queue initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize notification queue:", error);
    throw error;
  }
}

// ============================================================
// SHUTDOWN
// ============================================================

/**
 * Shutdown the notification queue
 */
export async function shutdownNotificationQueue(): Promise<void> {
  try {
    if (notificationWorker) {
      await notificationWorker.close();
      notificationWorker = null;
    }

    if (queueScheduler) {
      await queueScheduler.close();
      queueScheduler = null;
    }

    if (notificationQueue) {
      await notificationQueue.close();
      notificationQueue = null;
    }

    logger.info("Notification queue shut down successfully");
  } catch (error) {
    logger.error("Failed to shut down notification queue:", error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  NOTIFICATION_QUEUE_NAME,
  getNotificationQueue,
  getNotificationWorker,
  getQueueScheduler,
  initializeNotificationQueue,
  shutdownNotificationQueue,
  addNotificationToQueue,
  addBulkNotificationsToQueue,
  addBookingNotificationToQueue,
  addProviderNotificationToQueue,
  addReviewNotificationToQueue,
  addPaymentNotificationToQueue,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  getJob,
  getJobResult,
  retryJob,
  removeJob,
};
