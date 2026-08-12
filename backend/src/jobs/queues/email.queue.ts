import { Queue, Worker, Job, QueueScheduler } from "bullmq";
import { redisService } from "../../services/redis.service";
import { sendEmail, EmailData } from "../../config/email";
import logger from "../../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface EmailJobData {
  id?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  metadata?: {
    userId?: string;
    bookingId?: string;
    notificationId?: string;
    correlationId?: string;
  };
  priority?: "low" | "normal" | "high" | "critical";
  retryCount?: number;
  maxRetries?: number;
}

export interface EmailJobResult {
  success: boolean;
  messageId?: string;
  jobId: string;
  to: string | string[];
  subject: string;
  error?: string;
  attempts: number;
  processedAt: Date;
}

export interface EmailQueueConfig {
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

const DEFAULT_CONFIG: EmailQueueConfig = {
  queueName: "email-queue",
  concurrency: 5,
  maxRetries: 3,
  retryDelay: 5000,
  removeOnComplete: true,
  removeOnFail: false,
  stalledInterval: 30000,
  maxStalledCount: 3,
};

export const EMAIL_QUEUE_NAME = "email-queue";

// ============================================================
// QUEUE INSTANCE
// ============================================================

let emailQueue: Queue | null = null;
let emailWorker: Worker | null = null;
let queueScheduler: QueueScheduler | null = null;

/**
 * Get the email queue instance
 */
export function getEmailQueue(): Queue {
  if (!emailQueue) {
    emailQueue = new Queue(EMAIL_QUEUE_NAME, {
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

    logger.info(`Email queue initialized: ${EMAIL_QUEUE_NAME}`);
  }

  return emailQueue;
}

/**
 * Get the email worker instance
 */
export function getEmailWorker(): Worker {
  if (!emailWorker) {
    emailWorker = new Worker(
      EMAIL_QUEUE_NAME,
      async (job: Job<EmailJobData>) => {
        return await processEmailJob(job);
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
    emailWorker.on("completed", (job: Job) => {
      logger.debug(`Email job completed: ${job.id}`, {
        jobId: job.id,
        data: job.data,
      });
    });

    emailWorker.on("failed", (job: Job | undefined, error: Error) => {
      if (job) {
        logger.error(`Email job failed: ${job.id}`, {
          jobId: job.id,
          error: error.message,
          attempts: job.attemptsMade,
          data: job.data,
        });
      } else {
        logger.error("Email job failed with no job reference:", error);
      }
    });

    emailWorker.on("stalled", (jobId: string) => {
      logger.warn(`Email job stalled: ${jobId}`);
    });

    emailWorker.on("error", (error: Error) => {
      logger.error("Email worker error:", error);
    });

    logger.info(
      `Email worker initialized with concurrency: ${DEFAULT_CONFIG.concurrency}`,
    );
  }

  return emailWorker;
}

/**
 * Get the queue scheduler instance
 */
export function getQueueScheduler(): QueueScheduler {
  if (!queueScheduler) {
    queueScheduler = new QueueScheduler(EMAIL_QUEUE_NAME, {
      connection: {
        host: redisService.getHost(),
        port: redisService.getPort(),
        password: redisService.getPassword(),
      },
    });

    logger.info(`Email queue scheduler initialized: ${EMAIL_QUEUE_NAME}`);
  }

  return queueScheduler;
}

// ============================================================
// JOB PROCESSING
// ============================================================

/**
 * Process an email job
 */
async function processEmailJob(
  job: Job<EmailJobData>,
): Promise<EmailJobResult> {
  const startTime = Date.now();
  const data = job.data;

  logger.debug(`Processing email job: ${job.id}`, {
    to: data.to,
    subject: data.subject,
    attempts: job.attemptsMade + 1,
  });

  try {
    // Prepare email data
    const emailData: EmailData = {
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      from: data.from,
      fromName: data.fromName,
      cc: data.cc,
      bcc: data.bcc,
      replyTo: data.replyTo,
      attachments: data.attachments,
    };

    // Send email
    const result = await sendEmail(emailData);

    const duration = Date.now() - startTime;

    logger.info(`Email sent successfully: ${job.id}`, {
      to: data.to,
      subject: data.subject,
      messageId: result.messageId,
      duration,
    });

    return {
      success: true,
      messageId: result.messageId,
      jobId: job.id || "",
      to: data.to,
      subject: data.subject,
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
        `Email job ${job.id} failed, retrying (${attemptsMade}/${maxRetries})`,
        {
          error: errorMessage,
          to: data.to,
          subject: data.subject,
        },
      );

      // Throw to trigger retry
      throw error;
    }

    // Max retries reached, log as failed
    logger.error(`Email job ${job.id} failed after ${attemptsMade} attempts`, {
      error: errorMessage,
      to: data.to,
      subject: data.subject,
      attempts: attemptsMade,
    });

    return {
      success: false,
      jobId: job.id || "",
      to: data.to,
      subject: data.subject,
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
 * Add a single email to the queue
 */
export async function addEmailToQueue(
  data: EmailJobData,
  priority?: "low" | "normal" | "high" | "critical",
): Promise<string> {
  try {
    const queue = getEmailQueue();

    const priorityMap = {
      low: 10,
      normal: 5,
      high: 3,
      critical: 1,
    };

    const job = await queue.add("send-email", data, {
      priority: priority ? priorityMap[priority] : 5,
      attempts: data.maxRetries || DEFAULT_CONFIG.maxRetries,
      backoff: {
        type: "exponential",
        delay: DEFAULT_CONFIG.retryDelay,
      },
      removeOnComplete: DEFAULT_CONFIG.removeOnComplete,
      removeOnFail: DEFAULT_CONFIG.removeOnFail,
    });

    logger.debug(`Email added to queue: ${job.id}`, {
      to: data.to,
      subject: data.subject,
      priority: priority || "normal",
    });

    return job.id;
  } catch (error) {
    logger.error("Failed to add email to queue:", error);
    throw error;
  }
}

/**
 * Add bulk emails to the queue
 */
export async function addBulkEmailsToQueue(
  emails: EmailJobData[],
  priority?: "low" | "normal" | "high" | "critical",
): Promise<{
  total: number;
  jobIds: string[];
  failed: Array<{ email: EmailJobData; error: string }>;
}> {
  const jobIds: string[] = [];
  const failed: Array<{ email: EmailJobData; error: string }> = [];

  try {
    const queue = getEmailQueue();

    const priorityMap = {
      low: 10,
      normal: 5,
      high: 3,
      critical: 1,
    };

    const addPromises = emails.map(async (email) => {
      try {
        const job = await queue.add("send-email", email, {
          priority: priority ? priorityMap[priority] : 5,
          attempts: email.maxRetries || DEFAULT_CONFIG.maxRetries,
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
          email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(addPromises);

    logger.info(
      `Added ${jobIds.length} emails to queue${failed.length > 0 ? ` (${failed.length} failed)` : ""}`,
    );

    return {
      total: emails.length,
      jobIds,
      failed,
    };
  } catch (error) {
    logger.error("Failed to add bulk emails to queue:", error);
    throw error;
  }
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
    const queue = getEmailQueue();

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
    const queue = getEmailQueue();
    await queue.pause();
    logger.info("Email queue paused");
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
    const queue = getEmailQueue();
    await queue.resume();
    logger.info("Email queue resumed");
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
    const queue = getEmailQueue();

    const [cleaned, failed] = await Promise.all([
      queue.clean(0, 0, "completed"),
      queue.clean(0, 0, "failed"),
    ]);

    logger.info(
      `Cleaned email queue: ${cleaned.length} completed, ${failed.length} failed`,
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
export async function getJob(jobId: string): Promise<Job<EmailJobData> | null> {
  try {
    const queue = getEmailQueue();
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
): Promise<EmailJobResult | null> {
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
      subject: job.data?.subject || "",
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
 * Initialize the email queue
 */
export function initializeEmailQueue(): void {
  try {
    getEmailQueue();
    getEmailWorker();
    getQueueScheduler();
    logger.info("Email queue initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize email queue:", error);
    throw error;
  }
}

// ============================================================
// SHUTDOWN
// ============================================================

/**
 * Shutdown the email queue
 */
export async function shutdownEmailQueue(): Promise<void> {
  try {
    if (emailWorker) {
      await emailWorker.close();
      emailWorker = null;
    }

    if (queueScheduler) {
      await queueScheduler.close();
      queueScheduler = null;
    }

    if (emailQueue) {
      await emailQueue.close();
      emailQueue = null;
    }

    logger.info("Email queue shut down successfully");
  } catch (error) {
    logger.error("Failed to shut down email queue:", error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  EMAIL_QUEUE_NAME,
  getEmailQueue,
  getEmailWorker,
  getQueueScheduler,
  initializeEmailQueue,
  shutdownEmailQueue,
  addEmailToQueue,
  addBulkEmailsToQueue,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  getJob,
  getJobResult,
  retryJob,
  removeJob,
};
