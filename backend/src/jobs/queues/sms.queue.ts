import { Queue, Worker, Job, QueueScheduler } from "bullmq";
import { redisService } from "../../services/redis.service";
import { sendSMS } from "../../services/external/twilio.service";
import {
  validatePhoneNumber,
  formatPhoneNumber,
} from "../../services/external/twilio.service";
import logger from "../../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface SMSJobData {
  id?: string;
  to: string;
  body: string;
  from?: string;
  statusCallback?: string;
  metadata?: {
    userId?: string;
    bookingId?: string;
    notificationId?: string;
    correlationId?: string;
    otp?: boolean;
  };
  priority?: "low" | "normal" | "high" | "critical";
  retryCount?: number;
  maxRetries?: number;
  scheduledFor?: Date;
}

export interface SMSJobResult {
  success: boolean;
  messageId?: string;
  status?: string;
  jobId: string;
  to: string;
  error?: string;
  attempts: number;
  processedAt: Date;
}

export interface SMSQueueConfig {
  queueName: string;
  concurrency: number;
  maxRetries: number;
  retryDelay: number;
  removeOnComplete: boolean;
  removeOnFail: boolean;
  stalledInterval: number;
  maxStalledCount: number;
  rateLimiterMax: number;
  rateLimiterDuration: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_CONFIG: SMSQueueConfig = {
  queueName: "sms-queue",
  concurrency: 3,
  maxRetries: 3,
  retryDelay: 5000,
  removeOnComplete: true,
  removeOnFail: false,
  stalledInterval: 30000,
  maxStalledCount: 3,
  rateLimiterMax: 10, // Max 10 SMS per minute
  rateLimiterDuration: 60000, // 1 minute
};

export const SMS_QUEUE_NAME = "sms-queue";

// ============================================================
// QUEUE INSTANCE
// ============================================================

let smsQueue: Queue | null = null;
let smsWorker: Worker | null = null;
let queueScheduler: QueueScheduler | null = null;

/**
 * Get the SMS queue instance
 */
export function getSMSQueue(): Queue {
  if (!smsQueue) {
    smsQueue = new Queue(SMS_QUEUE_NAME, {
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

    logger.info(`SMS queue initialized: ${SMS_QUEUE_NAME}`);
  }

  return smsQueue;
}

/**
 * Get the SMS worker instance
 */
export function getSMSWorker(): Worker {
  if (!smsWorker) {
    smsWorker = new Worker(
      SMS_QUEUE_NAME,
      async (job: Job<SMSJobData>) => {
        return await processSMSJob(job);
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
    smsWorker.on("completed", (job: Job) => {
      logger.debug(`SMS job completed: ${job.id}`, {
        jobId: job.id,
        to: job.data?.to,
      });
    });

    smsWorker.on("failed", (job: Job | undefined, error: Error) => {
      if (job) {
        logger.error(`SMS job failed: ${job.id}`, {
          jobId: job.id,
          to: job.data?.to,
          error: error.message,
          attempts: job.attemptsMade,
        });
      } else {
        logger.error("SMS job failed with no job reference:", error);
      }
    });

    smsWorker.on("stalled", (jobId: string) => {
      logger.warn(`SMS job stalled: ${jobId}`);
    });

    smsWorker.on("error", (error: Error) => {
      logger.error("SMS worker error:", error);
    });

    logger.info(
      `SMS worker initialized with concurrency: ${DEFAULT_CONFIG.concurrency}`,
    );
  }

  return smsWorker;
}

/**
 * Get the queue scheduler instance
 */
export function getQueueScheduler(): QueueScheduler {
  if (!queueScheduler) {
    queueScheduler = new QueueScheduler(SMS_QUEUE_NAME, {
      connection: {
        host: redisService.getHost(),
        port: redisService.getPort(),
        password: redisService.getPassword(),
      },
    });

    logger.info(`SMS queue scheduler initialized: ${SMS_QUEUE_NAME}`);
  }

  return queueScheduler;
}

// ============================================================
// JOB PROCESSING
// ============================================================

/**
 * Process an SMS job
 */
async function processSMSJob(job: Job<SMSJobData>): Promise<SMSJobResult> {
  const startTime = Date.now();
  const data = job.data;

  logger.debug(`Processing SMS job: ${job.id}`, {
    to: data.to,
    attempts: job.attemptsMade + 1,
  });

  try {
    // Validate phone number
    const validation = validatePhoneNumber(data.to);
    if (!validation.isValid) {
      const errorMsg = `Invalid phone number: ${data.to}`;
      logger.warn(`SMS job ${job.id} failed: ${errorMsg}`);

      return {
        success: false,
        jobId: job.id || "",
        to: data.to,
        error: errorMsg,
        attempts: job.attemptsMade + 1,
        processedAt: new Date(),
      };
    }

    // Format phone number to E.164
    const formattedTo = formatPhoneNumber(data.to);

    // Check message length
    if (data.body.length > 1600) {
      logger.warn(
        `SMS message too long (${data.body.length} chars), truncating to 1600`,
      );
      data.body = data.body.substring(0, 1597) + "...";
    }

    // Send SMS
    const result = await sendSMS({
      to: formattedTo,
      body: data.body,
      from: data.from,
      statusCallback: data.statusCallback,
    });

    const duration = Date.now() - startTime;

    if (result.success) {
      logger.info(`SMS sent successfully: ${job.id}`, {
        to: formattedTo,
        messageId: result.messageId,
        status: result.status,
        duration,
      });

      return {
        success: true,
        messageId: result.messageId,
        status: result.status,
        jobId: job.id || "",
        to: formattedTo,
        attempts: job.attemptsMade + 1,
        processedAt: new Date(),
      };
    } else {
      // Send failed
      const errorMsg = result.error || "Unknown SMS error";
      logger.warn(`SMS send failed: ${job.id}`, {
        to: formattedTo,
        error: errorMsg,
        attempts: job.attemptsMade + 1,
      });

      throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if we should retry
    const attemptsMade = job.attemptsMade + 1;
    const maxRetries = data.maxRetries || DEFAULT_CONFIG.maxRetries;

    // Check for non-retryable errors
    const nonRetryableErrors = [
      "Invalid phone number",
      "Invalid phone number format",
      "Insufficient balance",
      "Account suspended",
      "Invalid from number",
    ];

    const isNonRetryable = nonRetryableErrors.some((err) =>
      errorMessage.toLowerCase().includes(err.toLowerCase()),
    );

    if (isNonRetryable) {
      logger.error(
        `SMS job ${job.id} failed with non-retryable error: ${errorMessage}`,
      );

      return {
        success: false,
        jobId: job.id || "",
        to: data.to,
        error: errorMessage,
        attempts: attemptsMade,
        processedAt: new Date(),
      };
    }

    if (attemptsMade < maxRetries) {
      logger.warn(
        `SMS job ${job.id} failed, retrying (${attemptsMade}/${maxRetries})`,
        {
          error: errorMessage,
          to: data.to,
        },
      );

      // Throw to trigger retry
      throw error;
    }

    // Max retries reached, log as failed
    logger.error(`SMS job ${job.id} failed after ${attemptsMade} attempts`, {
      error: errorMessage,
      to: data.to,
      attempts: attemptsMade,
    });

    return {
      success: false,
      jobId: job.id || "",
      to: data.to,
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
 * Add a single SMS to the queue
 */
export async function addSMSToQueue(
  data: SMSJobData,
  priority?: "low" | "normal" | "high" | "critical",
): Promise<string> {
  try {
    const queue = getSMSQueue();

    const priorityMap = {
      low: 10,
      normal: 5,
      high: 3,
      critical: 1,
    };

    const job = await queue.add("send-sms", data, {
      priority: priority ? priorityMap[priority] : 5,
      attempts: data.maxRetries || DEFAULT_CONFIG.maxRetries,
      backoff: {
        type: "exponential",
        delay: DEFAULT_CONFIG.retryDelay,
      },
      removeOnComplete: DEFAULT_CONFIG.removeOnComplete,
      removeOnFail: DEFAULT_CONFIG.removeOnFail,
    });

    logger.debug(`SMS added to queue: ${job.id}`, {
      to: data.to,
      priority: priority || "normal",
    });

    return job.id;
  } catch (error) {
    logger.error("Failed to add SMS to queue:", error);
    throw error;
  }
}

/**
 * Add bulk SMS to the queue
 */
export async function addBulkSMSToQueue(
  smsList: SMSJobData[],
  priority?: "low" | "normal" | "high" | "critical",
): Promise<{
  total: number;
  jobIds: string[];
  failed: Array<{ sms: SMSJobData; error: string }>;
}> {
  const jobIds: string[] = [];
  const failed: Array<{ sms: SMSJobData; error: string }> = [];

  try {
    const queue = getSMSQueue();

    const priorityMap = {
      low: 10,
      normal: 5,
      high: 3,
      critical: 1,
    };

    const addPromises = smsList.map(async (sms) => {
      try {
        const job = await queue.add("send-sms", sms, {
          priority: priority ? priorityMap[priority] : 5,
          attempts: sms.maxRetries || DEFAULT_CONFIG.maxRetries,
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
          sms,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(addPromises);

    logger.info(
      `Added ${jobIds.length} SMS to queue${failed.length > 0 ? ` (${failed.length} failed)` : ""}`,
    );

    return {
      total: smsList.length,
      jobIds,
      failed,
    };
  } catch (error) {
    logger.error("Failed to add bulk SMS to queue:", error);
    throw error;
  }
}

/**
 * Add OTP SMS to queue (convenience method)
 */
export async function addOTPToQueue(
  phone: string,
  otp: string,
  expiryMinutes: number = 10,
  userId?: string,
  priority?: "high" | "critical",
): Promise<string> {
  const body = `Your verification code is: ${otp}. This code expires in ${expiryMinutes} minutes. Do not share this code with anyone.`;

  return addSMSToQueue({
    to: phone,
    body,
    metadata: {
      userId,
      otp: true,
    },
    priority: priority || "high",
  });
}

/**
 * Add booking confirmation SMS to queue
 */
export async function addBookingConfirmationToQueue(
  phone: string,
  bookingNumber: string,
  providerName: string,
  scheduledDate: Date,
  location: string,
  userId?: string,
  bookingId?: string,
): Promise<string> {
  const formattedDate = scheduledDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const body = `✅ Booking Confirmed! ${bookingNumber} with ${providerName} on ${formattedDate} at ${formattedTime}. Location: ${location}. View details: ${process.env.APP_URL || "https://marketplace.com"}/dashboard/bookings/${bookingNumber}`;

  return addSMSToQueue({
    to: phone,
    body,
    metadata: {
      userId,
      bookingId,
    },
    priority: "high",
  });
}

/**
 * Add booking reminder SMS to queue
 */
export async function addBookingReminderToQueue(
  phone: string,
  bookingNumber: string,
  providerName: string,
  scheduledDate: Date,
  userId?: string,
  bookingId?: string,
): Promise<string> {
  const formattedDate = scheduledDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const body = `🔔 Reminder: Booking ${bookingNumber} with ${providerName} is scheduled for ${formattedDate} at ${formattedTime}. Please ensure you're available.`;

  return addSMSToQueue({
    to: phone,
    body,
    metadata: {
      userId,
      bookingId,
    },
    priority: "normal",
  });
}

/**
 * Add password reset SMS to queue
 */
export async function addPasswordResetToQueue(
  phone: string,
  resetToken: string,
  userId?: string,
): Promise<string> {
  const resetUrl = `${process.env.APP_URL || "https://marketplace.com"}/reset-password?token=${resetToken}`;
  const body = `Reset your password using this link: ${resetUrl}. This link expires in 1 hour.`;

  return addSMSToQueue({
    to: phone,
    body,
    metadata: {
      userId,
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
    const queue = getSMSQueue();

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
    const queue = getSMSQueue();
    await queue.pause();
    logger.info("SMS queue paused");
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
    const queue = getSMSQueue();
    await queue.resume();
    logger.info("SMS queue resumed");
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
    const queue = getSMSQueue();

    const [cleaned, failed] = await Promise.all([
      queue.clean(0, 0, "completed"),
      queue.clean(0, 0, "failed"),
    ]);

    logger.info(
      `Cleaned SMS queue: ${cleaned.length} completed, ${failed.length} failed`,
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
export async function getJob(jobId: string): Promise<Job<SMSJobData> | null> {
  try {
    const queue = getSMSQueue();
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
): Promise<SMSJobResult | null> {
  try {
    const job = await getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      success: state === "completed",
      jobId,
      to: job.data?.to || "",
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
 * Initialize the SMS queue
 */
export function initializeSMSQueue(): void {
  try {
    getSMSQueue();
    getSMSWorker();
    getQueueScheduler();
    logger.info("SMS queue initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize SMS queue:", error);
    throw error;
  }
}

// ============================================================
// SHUTDOWN
// ============================================================

/**
 * Shutdown the SMS queue
 */
export async function shutdownSMSQueue(): Promise<void> {
  try {
    if (smsWorker) {
      await smsWorker.close();
      smsWorker = null;
    }

    if (queueScheduler) {
      await queueScheduler.close();
      queueScheduler = null;
    }

    if (smsQueue) {
      await smsQueue.close();
      smsQueue = null;
    }

    logger.info("SMS queue shut down successfully");
  } catch (error) {
    logger.error("Failed to shut down SMS queue:", error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  SMS_QUEUE_NAME,
  getSMSQueue,
  getSMSWorker,
  getQueueScheduler,
  initializeSMSQueue,
  shutdownSMSQueue,
  addSMSToQueue,
  addBulkSMSToQueue,
  addOTPToQueue,
  addBookingConfirmationToQueue,
  addBookingReminderToQueue,
  addPasswordResetToQueue,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  getJob,
  getJobResult,
  retryJob,
  removeJob,
};
