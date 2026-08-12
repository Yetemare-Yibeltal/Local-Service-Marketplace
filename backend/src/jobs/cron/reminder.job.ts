import { CronJob } from "cron";
import { subHours, addHours, isWithinInterval } from "date-fns";
import logger from "../../utils/logger";
import { sendEmail, getBookingReminderEmailTemplate } from "../../config/email";
import {
  sendSMS,
  getBookingReminderSMSTemplate,
} from "../../services/external/twilio.service";
import { createNotification } from "../../repositories/notification.repository";
import { findUserById } from "../../repositories/user.repository";
import { findProviderById } from "../../repositories/provider.repository";
import { getBookings } from "../../repositories/booking.repository";
import { redisService } from "../../services/redis.service";

// ============================================================
// TYPES
// ============================================================

export interface ReminderJobResult {
  remindersSent: number;
  emailsSent: number;
  smsSent: number;
  errors: Array<{ bookingId: string; error: string }>;
}

// ============================================================
// JOB CONFIGURATION
// ============================================================

const JOB_NAME = "booking-reminder";
const CRON_EXPRESSION = "*/30 * * * *"; // Every 30 minutes
const ENABLED = true;

// ============================================================
// JOB STATE
// ============================================================

let cronJob: CronJob | null = null;
let isRunning = false;
let lastRun: Date | null = null;
let nextRun: Date | null = null;

// ============================================================
// CACHE KEYS
// ============================================================

const REMINDER_CACHE_KEY = "job:reminder:last_run";
const REMINDER_LOCK_KEY = "job:reminder:lock";

// ============================================================
// MAIN EXECUTION FUNCTION
// ============================================================

/**
 * Execute the reminder job
 */
async function execute(): Promise<ReminderJobResult> {
  const result: ReminderJobResult = {
    remindersSent: 0,
    emailsSent: 0,
    smsSent: 0,
    errors: [],
  };

  try {
    logger.info("Starting booking reminder job...");

    // Get current time and time windows
    const now = new Date();
    const twentyFourHoursAhead = addHours(now, 24);
    const oneHourAhead = addHours(now, 1);

    // Get bookings that need reminders
    const bookings = await getBookingsToRemind(
      now,
      twentyFourHoursAhead,
      oneHourAhead,
    );

    if (bookings.length === 0) {
      logger.info("No bookings need reminders at this time");
      return result;
    }

    logger.info(`Found ${bookings.length} bookings needing reminders`);

    // Process each booking
    for (const booking of bookings) {
      try {
        const sent = await processBookingReminder(
          booking,
          now,
          twentyFourHoursAhead,
          oneHourAhead,
        );

        if (sent) {
          result.remindersSent++;
          if (sent.email) result.emailsSent++;
          if (sent.sms) result.smsSent++;
        }
      } catch (error) {
        logger.error(
          `Failed to process reminder for booking ${booking.id}:`,
          error,
        );
        result.errors.push({
          bookingId: booking.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info(
      `Reminder job completed. Sent ${result.remindersSent} reminders`,
    );
    return result;
  } catch (error) {
    logger.error("Reminder job execution failed:", error);
    throw error;
  }
}

/**
 * Get bookings that need reminders
 */
async function getBookingsToRemind(
  now: Date,
  twentyFourHoursAhead: Date,
  oneHourAhead: Date,
): Promise<any[]> {
  try {
    // Get bookings with status CONFIRMED or IN_PROGRESS
    // Scheduled in the next 24 hours
    const allBookings = await getBookings(
      {
        status: "CONFIRMED",
        startDate: now,
        endDate: twentyFourHoursAhead,
      },
      1,
      100,
      "scheduledDate",
      "asc",
    );

    const inProgressBookings = await getBookings(
      {
        status: "IN_PROGRESS",
        startDate: now,
        endDate: twentyFourHoursAhead,
      },
      1,
      100,
      "scheduledDate",
      "asc",
    );

    const all = [...allBookings.data, ...inProgressBookings.data];

    // Filter to only those that haven't been reminded recently
    const filtered = [];
    for (const booking of all) {
      const reminderKey = `reminder:sent:${booking.id}`;
      const lastReminder = await redisService.get(reminderKey);
      if (!lastReminder) {
        filtered.push(booking);
      }
    }

    return filtered;
  } catch (error) {
    logger.error("Failed to get bookings for reminders:", error);
    return [];
  }
}

/**
 * Process a single booking reminder
 */
async function processBookingReminder(
  booking: any,
  now: Date,
  twentyFourHoursAhead: Date,
  oneHourAhead: Date,
): Promise<{ email: boolean; sms: boolean }> {
  const result = { email: false, sms: false };

  try {
    // Get customer and provider info
    const [customer, provider] = await Promise.all([
      findUserById(booking.customerId),
      findProviderById(booking.providerId),
    ]);

    if (!customer) {
      logger.warn(
        `Customer ${booking.customerId} not found for booking ${booking.id}`,
      );
      return result;
    }

    if (!provider) {
      logger.warn(
        `Provider ${booking.providerId} not found for booking ${booking.id}`,
      );
      return result;
    }

    const scheduledDate = new Date(booking.scheduledDate);
    const hoursUntil = Math.floor(
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60),
    );

    // Determine which type of reminder to send
    const is24HourReminder = hoursUntil >= 23 && hoursUntil <= 25;
    const is1HourReminder = hoursUntil >= 0 && hoursUntil <= 2;

    if (!is24HourReminder && !is1HourReminder) {
      return result;
    }

    const reminderType = is24HourReminder ? "24_hours" : "1_hour";

    // Send email reminder
    try {
      const emailTemplate = getBookingReminderEmailTemplate(
        customer.fullName,
        provider.businessName,
        booking.bookingNumber,
        scheduledDate,
        booking.service?.title || "Service",
        booking.address,
      );

      await sendEmail({
        to: customer.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      result.email = true;
      logger.debug(
        `Email reminder sent to ${customer.email} for booking ${booking.bookingNumber}`,
      );
    } catch (error) {
      logger.error(
        `Failed to send email reminder for booking ${booking.id}:`,
        error,
      );
    }

    // Send SMS reminder
    try {
      const smsBody = getBookingReminderSMSTemplate(
        booking.bookingNumber,
        provider.businessName,
        scheduledDate.toLocaleDateString(),
        scheduledDate.toLocaleTimeString(),
      );

      await sendSMS({
        to: customer.phone,
        body: smsBody,
      });

      result.sms = true;
      logger.debug(
        `SMS reminder sent to ${customer.phone} for booking ${booking.bookingNumber}`,
      );
    } catch (error) {
      logger.error(
        `Failed to send SMS reminder for booking ${booking.id}:`,
        error,
      );
    }

    // Create in-app notification
    try {
      await createNotification({
        userId: customer.id,
        type: "EMAIL",
        title: "Booking Reminder",
        message: `Reminder: Your booking ${booking.bookingNumber} with ${provider.businessName} is scheduled in ${hoursUntil} hours`,
        data: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          reminderType,
          hoursUntil,
        },
      });
    } catch (error) {
      logger.error(
        `Failed to create in-app notification for booking ${booking.id}:`,
        error,
      );
    }

    // Mark reminder as sent
    const reminderKey = `reminder:sent:${booking.id}`;
    await redisService.set(reminderKey, reminderType, 86400); // Expire in 24 hours

    return result;
  } catch (error) {
    logger.error(
      `Failed to process reminder for booking ${booking.id}:`,
      error,
    );
    return result;
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
    logger.warn("Reminder job is already running");
    return;
  }

  if (!ENABLED) {
    logger.warn("Reminder job is disabled");
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
          const lock = await redisService.set(REMINDER_LOCK_KEY, "locked", 300);
          if (!lock) {
            logger.warn("Reminder job lock already acquired, skipping");
            return;
          }

          await execute();

          // Update last run cache
          await redisService.set(
            REMINDER_CACHE_KEY,
            lastRun.toISOString(),
            86400,
          );

          // Release lock
          await redisService.delete(REMINDER_LOCK_KEY);
        } catch (error) {
          logger.error("Reminder job execution failed:", error);
          // Release lock on error
          await redisService.delete(REMINDER_LOCK_KEY);
        } finally {
          isRunning = false;
        }
      },
      null, // onComplete
      true, // start
      "Africa/Addis_Ababa", // timezone
    );

    // Calculate next run time
    nextRun = cronJob.nextDate().toDate();

    logger.info(`Reminder job started. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    logger.error("Failed to start reminder job:", error);
    throw error;
  }
}

/**
 * Stop the cron job
 */
export function stop(): void {
  if (!cronJob) {
    logger.warn("Reminder job is not running");
    return;
  }

  try {
    cronJob.stop();
    cronJob = null;
    isRunning = false;
    nextRun = null;

    logger.info("Reminder job stopped");
  } catch (error) {
    logger.error("Failed to stop reminder job:", error);
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

// Auto-start if enabled
if (ENABLED) {
  start();
}

// ============================================================
// EXPORTS
// ============================================================

export const reminderJob = {
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

export default reminderJob;
