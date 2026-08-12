// ============================================================
// CRON JOBS INDEX
// Central export point for all cron job modules
// ============================================================

import { reminderJob } from "./reminder.job";
import { cleanupJob } from "./cleanup.job";
import { analyticsJob } from "./analytics.job";
import { backupJob } from "./backup.job";
import logger from "../../utils/logger";

// Export individual jobs
export { reminderJob } from "./reminder.job";
export { cleanupJob } from "./cleanup.job";
export { analyticsJob } from "./analytics.job";
export { backupJob } from "./backup.job";

// ============================================================
// JOB STATUS
// ============================================================

export interface JobStatus {
  name: string;
  running: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  cronExpression: string;
  enabled: boolean;
}

export interface JobResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  duration: number;
}

// ============================================================
// JOB REGISTRATION
// ============================================================

/**
 * All cron jobs registered in the application
 */
const cronJobs = [reminderJob, cleanupJob, analyticsJob, backupJob];

/**
 * Start all cron jobs
 */
export function startAllJobs(): void {
  logger.info("Starting all cron jobs...");
  cronJobs.forEach((job) => {
    try {
      job.start();
      logger.info(`Job started: ${job.name}`);
    } catch (error) {
      logger.error(`Failed to start job ${job.name}:`, error);
    }
  });
  logger.info("All cron jobs started successfully");
}

/**
 * Stop all cron jobs
 */
export function stopAllJobs(): void {
  logger.info("Stopping all cron jobs...");
  cronJobs.forEach((job) => {
    try {
      job.stop();
      logger.info(`Job stopped: ${job.name}`);
    } catch (error) {
      logger.error(`Failed to stop job ${job.name}:`, error);
    }
  });
  logger.info("All cron jobs stopped successfully");
}

/**
 * Get status of all cron jobs
 */
export function getAllJobsStatus(): JobStatus[] {
  return cronJobs.map((job) => ({
    name: job.name,
    running: job.running,
    lastRun: job.lastRun || null,
    nextRun: job.nextRun || null,
    cronExpression: job.cronExpression,
    enabled: job.enabled,
  }));
}

/**
 * Get status of a specific job
 */
export function getJobStatus(name: string): JobStatus | null {
  const job = cronJobs.find((j) => j.name === name);
  if (!job) {
    return null;
  }
  return {
    name: job.name,
    running: job.running,
    lastRun: job.lastRun || null,
    nextRun: job.nextRun || null,
    cronExpression: job.cronExpression,
    enabled: job.enabled,
  };
}

/**
 * Run a specific job manually
 */
export async function runJobManually(name: string): Promise<JobResult> {
  const job = cronJobs.find((j) => j.name === name);
  if (!job) {
    return {
      success: false,
      message: `Job ${name} not found`,
      duration: 0,
    };
  }

  if (!job.enabled) {
    return {
      success: false,
      message: `Job ${name} is disabled`,
      duration: 0,
    };
  }

  try {
    const startTime = Date.now();
    const result = await job.execute();
    const duration = Date.now() - startTime;

    return {
      success: true,
      message: `Job ${name} executed successfully`,
      data: result,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - Date.now();
    return {
      success: false,
      message: `Job ${name} execution failed`,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

// ============================================================
// JOB SCHEDULER HELPER
// ============================================================

/**
 * Validate cron expression
 */
export function validateCronExpression(expression: string): boolean {
  // Simple validation - checks for 5 or 6 parts
  const parts = expression.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 6;
}

/**
 * Get next run time for a cron expression
 */
export function getNextRunTime(cronExpression: string): Date | null {
  try {
    const parser = require("cron-parser");
    const interval = parser.parseExpression(cronExpression);
    return interval.next().toDate();
  } catch (error) {
    logger.error(`Failed to parse cron expression: ${cronExpression}`, error);
    return null;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Jobs
  reminderJob,
  cleanupJob,
  analyticsJob,
  backupJob,

  // Management
  startAllJobs,
  stopAllJobs,
  getAllJobsStatus,
  getJobStatus,
  runJobManually,

  // Helpers
  validateCronExpression,
  getNextRunTime,
};
