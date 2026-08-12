// ============================================================
// QUEUES INDEX
// Central export point for all queue modules
// ============================================================

// Import queue modules
import {
  EMAIL_QUEUE_NAME,
  getEmailQueue,
  getEmailWorker,
  getQueueScheduler as getEmailScheduler,
  initializeEmailQueue,
  shutdownEmailQueue,
  addEmailToQueue,
  addBulkEmailsToQueue,
  getQueueStatus as getEmailQueueStatus,
  pauseQueue as pauseEmailQueue,
  resumeQueue as resumeEmailQueue,
  cleanQueue as cleanEmailQueue,
  getJob as getEmailJob,
  getJobResult as getEmailJobResult,
  retryJob as retryEmailJob,
  removeJob as removeEmailJob,
} from "./email.queue";

import {
  SMS_QUEUE_NAME,
  getSMSQueue,
  getSMSWorker,
  getQueueScheduler as getSMSScheduler,
  initializeSMSQueue,
  shutdownSMSQueue,
  addSMSToQueue,
  addBulkSMSToQueue,
  addOTPToQueue,
  addBookingConfirmationToQueue,
  addBookingReminderToQueue,
  addPasswordResetToQueue,
  getQueueStatus as getSMSQueueStatus,
  pauseQueue as pauseSMSQueue,
  resumeQueue as resumeSMSQueue,
  cleanQueue as cleanSMSQueue,
  getJob as getSMSJob,
  getJobResult as getSMSJobResult,
  retryJob as retrySMSJob,
  removeJob as removeSMSJob,
} from "./sms.queue";

import {
  NOTIFICATION_QUEUE_NAME,
  getNotificationQueue,
  getNotificationWorker,
  getQueueScheduler as getNotificationScheduler,
  initializeNotificationQueue,
  shutdownNotificationQueue,
  addNotificationToQueue,
  addBulkNotificationsToQueue,
  addBookingNotificationToQueue,
  addProviderNotificationToQueue,
  addReviewNotificationToQueue,
  addPaymentNotificationToQueue,
  getQueueStatus as getNotificationQueueStatus,
  pauseQueue as pauseNotificationQueue,
  resumeQueue as resumeNotificationQueue,
  cleanQueue as cleanNotificationQueue,
  getJob as getNotificationJob,
  getJobResult as getNotificationJobResult,
  retryJob as retryNotificationJob,
  removeJob as removeNotificationJob,
} from "./notification.queue";

import logger from "../../utils/logger";

// ============================================================
// QUEUE STATUS TYPES
// ============================================================

export interface QueueStatus {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface AllQueuesStatus {
  email: QueueStatus;
  sms: QueueStatus;
  notification: QueueStatus;
}

// ============================================================
// EMAIL QUEUE EXPORTS
// ============================================================

export {
  EMAIL_QUEUE_NAME,
  getEmailQueue,
  getEmailWorker,
  getEmailScheduler as getEmailQueueScheduler,
  initializeEmailQueue,
  shutdownEmailQueue,
  addEmailToQueue,
  addBulkEmailsToQueue,
  getEmailQueueStatus,
  pauseEmailQueue,
  resumeEmailQueue,
  cleanEmailQueue,
  getEmailJob,
  getEmailJobResult,
  retryEmailJob,
  removeEmailJob,
};

export type { EmailJobData, EmailJobResult } from "./email.queue";

// ============================================================
// SMS QUEUE EXPORTS
// ============================================================

export {
  SMS_QUEUE_NAME,
  getSMSQueue,
  getSMSWorker,
  getSMSScheduler as getSMSQueueScheduler,
  initializeSMSQueue,
  shutdownSMSQueue,
  addSMSToQueue,
  addBulkSMSToQueue,
  addOTPToQueue,
  addBookingConfirmationToQueue,
  addBookingReminderToQueue,
  addPasswordResetToQueue,
  getSMSQueueStatus,
  pauseSMSQueue,
  resumeSMSQueue,
  cleanSMSQueue,
  getSMSJob,
  getSMSJobResult,
  retrySMSJob,
  removeSMSJob,
};

export type { SMSJobData, SMSJobResult } from "./sms.queue";

// ============================================================
// NOTIFICATION QUEUE EXPORTS
// ============================================================

export {
  NOTIFICATION_QUEUE_NAME,
  getNotificationQueue,
  getNotificationWorker,
  getNotificationScheduler as getNotificationQueueScheduler,
  initializeNotificationQueue,
  shutdownNotificationQueue,
  addNotificationToQueue,
  addBulkNotificationsToQueue,
  addBookingNotificationToQueue,
  addProviderNotificationToQueue,
  addReviewNotificationToQueue,
  addPaymentNotificationToQueue,
  getNotificationQueueStatus,
  pauseNotificationQueue,
  resumeNotificationQueue,
  cleanNotificationQueue,
  getNotificationJob,
  getNotificationJobResult,
  retryNotificationJob,
  removeNotificationJob,
};

export type {
  NotificationJobData,
  NotificationJobResult,
} from "./notification.queue";

// ============================================================
// QUEUE INITIALIZATION
// ============================================================

/**
 * Initialize all queues
 */
export function initializeAllQueues(): void {
  logger.info("Initializing all queues...");

  try {
    initializeEmailQueue();
    initializeSMSQueue();
    initializeNotificationQueue();

    logger.info("All queues initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize queues:", error);
    throw error;
  }
}

/**
 * Shutdown all queues
 */
export async function shutdownAllQueues(): Promise<void> {
  logger.info("Shutting down all queues...");

  try {
    await shutdownEmailQueue();
    await shutdownSMSQueue();
    await shutdownNotificationQueue();

    logger.info("All queues shut down successfully");
  } catch (error) {
    logger.error("Failed to shut down queues:", error);
    throw error;
  }
}

/**
 * Get status of all queues
 */
export async function getAllQueuesStatus(): Promise<AllQueuesStatus> {
  const [email, sms, notification] = await Promise.all([
    getEmailQueueStatus(),
    getSMSQueueStatus(),
    getNotificationQueueStatus(),
  ]);

  return {
    email: {
      name: EMAIL_QUEUE_NAME,
      ...email,
    },
    sms: {
      name: SMS_QUEUE_NAME,
      ...sms,
    },
    notification: {
      name: NOTIFICATION_QUEUE_NAME,
      ...notification,
    },
  };
}

/**
 * Pause all queues
 */
export async function pauseAllQueues(): Promise<void> {
  logger.info("Pausing all queues...");

  await Promise.all([
    pauseEmailQueue(),
    pauseSMSQueue(),
    pauseNotificationQueue(),
  ]);

  logger.info("All queues paused");
}

/**
 * Resume all queues
 */
export async function resumeAllQueues(): Promise<void> {
  logger.info("Resuming all queues...");

  await Promise.all([
    resumeEmailQueue(),
    resumeSMSQueue(),
    resumeNotificationQueue(),
  ]);

  logger.info("All queues resumed");
}

/**
 * Clean all queues
 */
export async function cleanAllQueues(): Promise<{
  email: { cleaned: number; failed: number };
  sms: { cleaned: number; failed: number };
  notification: { cleaned: number; failed: number };
}> {
  logger.info("Cleaning all queues...");

  const [email, sms, notification] = await Promise.all([
    cleanEmailQueue(),
    cleanSMSQueue(),
    cleanNotificationQueue(),
  ]);

  logger.info("All queues cleaned");

  return { email, sms, notification };
}

// ============================================================
// QUEUE STATISTICS
// ============================================================

export interface QueueStatistics {
  totalJobs: number;
  totalActive: number;
  totalWaiting: number;
  totalCompleted: number;
  totalFailed: number;
  totalDelayed: number;
  totalPaused: boolean;
  byQueue: AllQueuesStatus;
}

/**
 * Get comprehensive queue statistics
 */
export async function getQueueStatistics(): Promise<QueueStatistics> {
  const status = await getAllQueuesStatus();

  return {
    totalJobs:
      status.email.active +
      status.email.waiting +
      status.email.completed +
      status.email.failed +
      status.email.delayed +
      status.sms.active +
      status.sms.waiting +
      status.sms.completed +
      status.sms.failed +
      status.sms.delayed +
      status.notification.active +
      status.notification.waiting +
      status.notification.completed +
      status.notification.failed +
      status.notification.delayed,
    totalActive:
      status.email.active + status.sms.active + status.notification.active,
    totalWaiting:
      status.email.waiting + status.sms.waiting + status.notification.waiting,
    totalCompleted:
      status.email.completed +
      status.sms.completed +
      status.notification.completed,
    totalFailed:
      status.email.failed + status.sms.failed + status.notification.failed,
    totalDelayed:
      status.email.delayed + status.sms.delayed + status.notification.delayed,
    totalPaused:
      status.email.paused || status.sms.paused || status.notification.paused,
    byQueue: status,
  };
}

// ============================================================
// JOB MANAGEMENT HELPERS
// ============================================================

/**
 * Retry all failed jobs across all queues
 */
export async function retryAllFailedJobs(): Promise<{
  email: number;
  sms: number;
  notification: number;
}> {
  logger.info("Retrying all failed jobs...");

  const result = {
    email: 0,
    sms: 0,
    notification: 0,
  };

  try {
    // Get failed jobs from email queue
    const emailQueue = getEmailQueue();
    const emailFailed = await emailQueue.getFailed();
    for (const job of emailFailed) {
      try {
        await job.retry();
        result.email++;
      } catch (error) {
        logger.error(`Failed to retry email job ${job.id}:`, error);
      }
    }

    // Get failed jobs from SMS queue
    const smsQueue = getSMSQueue();
    const smsFailed = await smsQueue.getFailed();
    for (const job of smsFailed) {
      try {
        await job.retry();
        result.sms++;
      } catch (error) {
        logger.error(`Failed to retry SMS job ${job.id}:`, error);
      }
    }

    // Get failed jobs from notification queue
    const notificationQueue = getNotificationQueue();
    const notificationFailed = await notificationQueue.getFailed();
    for (const job of notificationFailed) {
      try {
        await job.retry();
        result.notification++;
      } catch (error) {
        logger.error(`Failed to retry notification job ${job.id}:`, error);
      }
    }

    logger.info(
      `Retried ${result.email} email, ${result.sms} SMS, ${result.notification} notification jobs`,
    );

    return result;
  } catch (error) {
    logger.error("Failed to retry all failed jobs:", error);
    return result;
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if a queue is healthy
 */
export async function isQueueHealthy(queueName: string): Promise<boolean> {
  try {
    const status = await getQueueStatistics();
    const queue = status.byQueue[queueName as keyof AllQueuesStatus];

    if (!queue) {
      return false;
    }

    // Consider healthy if not paused and has reasonable number of jobs
    return !queue.paused && queue.active < 100;
  } catch (error) {
    logger.error(`Failed to check queue health for ${queueName}:`, error);
    return false;
  }
}

/**
 * Get queue names
 */
export function getQueueNames(): string[] {
  return [EMAIL_QUEUE_NAME, SMS_QUEUE_NAME, NOTIFICATION_QUEUE_NAME];
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Initialization
  initializeAllQueues,
  shutdownAllQueues,

  // Status
  getAllQueuesStatus,
  getQueueStatistics,
  isQueueHealthy,

  // Queue management
  pauseAllQueues,
  resumeAllQueues,
  cleanAllQueues,

  // Job management
  retryAllFailedJobs,

  // Helpers
  getQueueNames,

  // Queue exports
  email: {
    EMAIL_QUEUE_NAME,
    getEmailQueue,
    getEmailWorker,
    getEmailQueueScheduler: getEmailScheduler,
    initializeEmailQueue,
    shutdownEmailQueue,
    addEmailToQueue,
    addBulkEmailsToQueue,
    getQueueStatus: getEmailQueueStatus,
    pauseQueue: pauseEmailQueue,
    resumeQueue: resumeEmailQueue,
    cleanQueue: cleanEmailQueue,
    getJob: getEmailJob,
    getJobResult: getEmailJobResult,
    retryJob: retryEmailJob,
    removeJob: removeEmailJob,
  },
  sms: {
    SMS_QUEUE_NAME,
    getSMSQueue,
    getSMSWorker,
    getSMSQueueScheduler: getSMSScheduler,
    initializeSMSQueue,
    shutdownSMSQueue,
    addSMSToQueue,
    addBulkSMSToQueue,
    addOTPToQueue,
    addBookingConfirmationToQueue,
    addBookingReminderToQueue,
    addPasswordResetToQueue,
    getQueueStatus: getSMSQueueStatus,
    pauseQueue: pauseSMSQueue,
    resumeQueue: resumeSMSQueue,
    cleanQueue: cleanSMSQueue,
    getJob: getSMSJob,
    getJobResult: getSMSJobResult,
    retryJob: retrySMSJob,
    removeJob: removeSMSJob,
  },
  notification: {
    NOTIFICATION_QUEUE_NAME,
    getNotificationQueue,
    getNotificationWorker,
    getNotificationQueueScheduler: getNotificationScheduler,
    initializeNotificationQueue,
    shutdownNotificationQueue,
    addNotificationToQueue,
    addBulkNotificationsToQueue,
    addBookingNotificationToQueue,
    addProviderNotificationToQueue,
    addReviewNotificationToQueue,
    addPaymentNotificationToQueue,
    getQueueStatus: getNotificationQueueStatus,
    pauseQueue: pauseNotificationQueue,
    resumeQueue: resumeNotificationQueue,
    cleanQueue: cleanNotificationQueue,
    getJob: getNotificationJob,
    getJobResult: getNotificationJobResult,
    retryJob: retryNotificationJob,
    removeJob: removeNotificationJob,
  },
};
