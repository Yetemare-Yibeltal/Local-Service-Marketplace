import twilio, { Twilio } from "twilio";
import env from "./env";
import logger from "../utils/logger";

// ============================================================
// TWILIO CONFIGURATION
// ============================================================

/**
 * Twilio client instance
 */
let twilioClient: Twilio | null = null;
let isTwilioConfigured: boolean = false;

/**
 * SMS data structure
 */
export interface SMSData {
  to: string;
  body: string;
  from?: string;
}

/**
 * SMS response structure
 */
export interface SMSResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

/**
 * Create Twilio client
 */
export function createTwilioClient(): Twilio {
  if (twilioClient) {
    return twilioClient;
  }

  try {
    const accountSid = env.TWILIO_ACCOUNT_SID;
    const authToken = env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      logger.warn("Twilio credentials not configured");
      isTwilioConfigured = false;
      throw new Error("Twilio credentials not configured");
    }

    twilioClient = twilio(accountSid, authToken);
    isTwilioConfigured = true;
    logger.info("Twilio client initialized successfully");

    return twilioClient;
  } catch (error) {
    logger.error("Twilio client creation failed:", error);
    isTwilioConfigured = false;
    throw error;
  }
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfiguredFn(): boolean {
  return (
    isTwilioConfigured &&
    !!(
      env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_PHONE_NUMBER
    )
  );
}

// ============================================================
// PHONE NUMBER VALIDATION
// ============================================================

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) {
    return false;
  }

  // Remove spaces and special characters
  const cleaned = phone.replace(/[^0-9+]/g, "");

  // Check if it's a valid E.164 format or Ethiopian format
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  const ethiopianRegex = /^09\d{8}$/;

  return e164Regex.test(cleaned) || ethiopianRegex.test(cleaned);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove spaces and special characters
  let cleaned = phone.replace(/[^0-9+]/g, "");

  // If Ethiopian format (09xxxxxxxx), convert to +251xxxxxxxxx
  if (cleaned.startsWith("09") && cleaned.length === 10) {
    cleaned = "+251" + cleaned.substring(1);
  }

  // If Ethiopian format with 0 (09xxxxxxxxx)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "+251" + cleaned.substring(1);
  }

  // If starts with 9 (9xxxxxxxx), convert to +2519xxxxxxxx
  if (cleaned.startsWith("9") && cleaned.length === 9) {
    cleaned = "+251" + cleaned;
  }

  return cleaned;
}

// ============================================================
// SMS SENDING
// ============================================================

/**
 * Send an SMS
 */
export async function sendSMS(smsData: SMSData): Promise<SMSResponse> {
  try {
    if (!isTwilioConfiguredFn()) {
      logger.warn("Twilio not configured. Skipping SMS send.");
      return {
        success: false,
        error: "Twilio not configured",
      };
    }

    const client = createTwilioClient();
    const from = smsData.from || env.TWILIO_PHONE_NUMBER;

    if (!from) {
      throw new Error("Twilio phone number not configured");
    }

    const formattedTo = formatPhoneNumber(smsData.to);

    if (!validatePhoneNumber(formattedTo)) {
      throw new Error(`Invalid phone number: ${formattedTo}`);
    }

    const message = await client.messages.create({
      body: smsData.body,
      from: from,
      to: formattedTo,
    });

    logger.info(`SMS sent to ${smsData.to} | SID: ${message.sid}`);

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    };
  } catch (error) {
    logger.error("SMS sending failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMS sending failed",
    };
  }
}

/**
 * Send SMS with retry logic
 */
export async function sendSMSWithRetry(
  smsData: SMSData,
  maxRetries: number = 3,
): Promise<SMSResponse> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendSMS(smsData);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      logger.debug(`SMS retry ${attempt}/${maxRetries} in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: `SMS failed after ${maxRetries} attempts: ${lastError || "Unknown error"}`,
  };
}

// ============================================================
// SMS TEMPLATES
// ============================================================

/**
 * Generate OTP SMS template
 */
export function getOTPSMSTemplate(otp: string): string {
  return `Your verification code is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone.`;
}

/**
 * Generate booking confirmation SMS template
 */
export function getBookingConfirmationSMSTemplate(
  bookingNumber: string,
  providerName: string,
  scheduledDate: string,
  scheduledTime: string,
): string {
  return `Booking ${bookingNumber} confirmed with ${providerName} on ${scheduledDate} at ${scheduledTime}. View details: ${env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/bookings/${bookingNumber}`;
}

/**
 * Generate booking reminder SMS template
 */
export function getBookingReminderSMSTemplate(
  bookingNumber: string,
  providerName: string,
  scheduledDate: string,
  scheduledTime: string,
): string {
  return `Reminder: Booking ${bookingNumber} with ${providerName} is scheduled for ${scheduledDate} at ${scheduledTime}.`;
}

/**
 * Generate password reset SMS template
 */
export function getPasswordResetSMSTemplate(resetToken: string): string {
  const resetUrl = `${env.CORS_ORIGIN || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  return `Reset your password using this link: ${resetUrl}. This link expires in 1 hour.`;
}

/**
 * Generate welcome SMS template
 */
export function getWelcomeSMSTemplate(name: string): string {
  return `Welcome to Local Service Provider Marketplace, ${name}! Find trusted professionals near you. Download our app or visit ${env.CORS_ORIGIN || "http://localhost:3000"} to get started.`;
}

/**
 * Generate booking status update SMS template
 */
export function getBookingStatusSMSTemplate(
  bookingNumber: string,
  status: string,
  providerName: string,
): string {
  const statusMap: Record<string, string> = {
    CONFIRMED: "confirmed",
    IN_PROGRESS: "is in progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  };

  const statusText = statusMap[status] || status.toLowerCase();
  return `Booking ${bookingNumber} with ${providerName} has been ${statusText}.`;
}

/**
 * Generate provider verification SMS template
 */
export function getProviderVerificationSMSTemplate(
  businessName: string,
  status: string,
): string {
  if (status === "APPROVED") {
    return `Congratulations! Your business "${businessName}" has been verified on Local Service Provider Marketplace. You can now start accepting bookings.`;
  }
  return `Your business "${businessName}" verification has been reviewed. Please check your dashboard for more information.`;
}

// ============================================================
// BULK SMS SENDING
// ============================================================

/**
 * Send SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string,
): Promise<SMSResponse[]> {
  const results: SMSResponse[] = [];

  for (const recipient of recipients) {
    const result = await sendSMS({
      to: recipient,
      body,
    });
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Send same SMS to multiple recipients with concurrency limit
 */
export async function sendBulkSMSConcurrent(
  recipients: string[],
  body: string,
  concurrency: number = 5,
): Promise<SMSResponse[]> {
  const results: SMSResponse[] = [];
  const batches: string[][] = [];

  for (let i = 0; i < recipients.length; i += concurrency) {
    batches.push(recipients.slice(i, i + concurrency));
  }

  for (const batch of batches) {
    const batchPromises = batch.map((recipient) =>
      sendSMS({
        to: recipient,
        body,
      }),
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Delay between batches
    if (batches.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.on("SIGTERM", () => {
  logger.info("Twilio client shutdown");
});

process.on("SIGINT", () => {
  logger.info("Twilio client shutdown");
});

// ============================================================
// EXPORTS
// ============================================================

export default {
  createTwilioClient,
  isTwilioConfigured: isTwilioConfiguredFn,
  validatePhoneNumber,
  formatPhoneNumber,
  sendSMS,
  sendSMSWithRetry,
  sendBulkSMS,
  sendBulkSMSConcurrent,
  getOTPSMSTemplate,
  getBookingConfirmationSMSTemplate,
  getBookingReminderSMSTemplate,
  getPasswordResetSMSTemplate,
  getWelcomeSMSTemplate,
  getBookingStatusSMSTemplate,
  getProviderVerificationSMSTemplate,
};
