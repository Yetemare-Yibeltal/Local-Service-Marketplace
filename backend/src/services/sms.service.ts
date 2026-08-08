import twilioService from "./external/twilio.service";
import { findUserById } from "../repositories/user.repository";
import { findBookingById } from "../repositories/booking.repository";
import { findProviderById } from "../repositories/provider.repository";
import logger from "../utils/logger";
import { cacheSet, cacheGet } from "../config/redis";

// ============================================================
// SMS SERVICE (ROOT LEVEL)
// This service re-exports all functionality from the external
// Twilio service and adds application-specific convenience
// methods for common SMS scenarios with templates.
// ============================================================

// Re-export all methods from the external service
export const {
  sendSMS,
  sendSMSWithRetry,
  sendBulkSMS,
  sendOTP,
  verifyOTP,
  sendBookingConfirmation,
  sendBookingReminder,
  sendPasswordReset,
  sendWelcomeSMS,
  sendStatusUpdate,
  sendProviderVerification,
  sendCustomSMS,
  getSMSStatus,
  getAccountInfo,
  getPhoneNumberAvailability,
  validatePhoneNumber,
  formatPhoneNumber,
  isConfiguredFn,
} = twilioService;

// ============================================================
// TYPES
// ============================================================

export interface SMSTemplateData {
  to: string;
  template: string;
  variables: Record<string, string>;
  from?: string;
}

export interface BulkSMSTemplateData {
  recipients: string[];
  template: string;
  variables: Record<string, string>;
  from?: string;
  concurrency?: number;
}

export interface SMSDeliveryResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  to?: string;
}

export interface OTPData {
  phone: string;
  otp: string;
  expiryMinutes?: number;
}

// ============================================================
// APPLICATION-SPECIFIC SMS METHODS
// ============================================================

/**
 * Send an OTP for verification with custom expiry
 */
export async function sendOTPVerification(
  phone: string,
  expiryMinutes: number = 10,
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Validate phone number
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      return {
        success: false,
        error: "Invalid phone number format",
      };
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis for verification
    const key = `otp:${validation.formattedNumber}`;
    await cacheSet(key, otp, expiryMinutes * 60);

    // Send OTP via SMS
    const result = await twilioService.sendOTP(phone, otp, expiryMinutes);

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error) {
    logger.error("Send OTP verification failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send OTP",
    };
  }
}

/**
 * Send a booking confirmation SMS with full details
 */
export async function sendBookingConfirmationSMS(
  phone: string,
  bookingId: string,
): Promise<SMSDeliveryResult> {
  try {
    const booking = await findBookingById(bookingId);
    if (!booking) {
      return {
        success: false,
        error: `Booking ${bookingId} not found`,
      };
    }

    const provider = await findProviderById(booking.providerId);
    if (!provider) {
      return {
        success: false,
        error: `Provider ${booking.providerId} not found`,
      };
    }

    const customer = await findUserById(booking.customerId);
    if (!customer) {
      return {
        success: false,
        error: `Customer ${booking.customerId} not found`,
      };
    }

    const result = await twilioService.sendBookingConfirmation(
      phone,
      booking.bookingNumber,
      provider.businessName,
      booking.scheduledDate,
      booking.address,
    );

    // Log success
    if (result.success) {
      logger.info(`Booking confirmation SMS sent for ${booking.bookingNumber}`);
    }

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error(
      `Send booking confirmation SMS failed for ${bookingId}:`,
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send booking confirmation SMS",
    };
  }
}

/**
 * Send a booking reminder SMS to customer
 */
export async function sendBookingReminderSMS(
  phone: string,
  bookingId: string,
  hoursBefore: number = 24,
): Promise<SMSDeliveryResult> {
  try {
    const booking = await findBookingById(bookingId);
    if (!booking) {
      return {
        success: false,
        error: `Booking ${bookingId} not found`,
      };
    }

    const provider = await findProviderById(booking.providerId);
    if (!provider) {
      return {
        success: false,
        error: `Provider ${booking.providerId} not found`,
      };
    }

    const result = await twilioService.sendBookingReminder(
      phone,
      booking.bookingNumber,
      provider.businessName,
      booking.scheduledDate,
    );

    if (result.success) {
      logger.info(
        `Booking reminder SMS sent for ${booking.bookingNumber} (${hoursBefore}h)`,
      );
    }

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error(`Send booking reminder SMS failed for ${bookingId}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send booking reminder SMS",
    };
  }
}

/**
 * Send a password reset SMS to user
 */
export async function sendPasswordResetSMS(
  phone: string,
  userId: string,
): Promise<SMSDeliveryResult> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      return {
        success: false,
        error: `User ${userId} not found`,
      };
    }

    // Generate a secure reset token
    const resetToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const result = await twilioService.sendPasswordReset(phone, resetToken);

    if (result.success) {
      logger.info(`Password reset SMS sent to user ${userId}`);
    }

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error(`Send password reset SMS failed for ${userId}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send password reset SMS",
    };
  }
}

/**
 * Send a welcome SMS to new user
 */
export async function sendWelcomeSMSMessage(
  phone: string,
  userId: string,
): Promise<SMSDeliveryResult> {
  try {
    const user = await findUserById(userId);
    if (!user) {
      return {
        success: false,
        error: `User ${userId} not found`,
      };
    }

    const result = await twilioService.sendWelcomeSMS(phone, user.fullName);

    if (result.success) {
      logger.info(`Welcome SMS sent to user ${userId}`);
    }

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error(`Send welcome SMS failed for ${userId}:`, error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send welcome SMS",
    };
  }
}

/**
 * Send a booking status update SMS
 */
export async function sendBookingStatusSMS(
  phone: string,
  bookingId: string,
  status: string,
): Promise<SMSDeliveryResult> {
  try {
    const booking = await findBookingById(bookingId);
    if (!booking) {
      return {
        success: false,
        error: `Booking ${bookingId} not found`,
      };
    }

    const provider = await findProviderById(booking.providerId);
    if (!provider) {
      return {
        success: false,
        error: `Provider ${booking.providerId} not found`,
      };
    }

    const result = await twilioService.sendStatusUpdate(
      phone,
      booking.bookingNumber,
      status,
      provider.businessName,
    );

    if (result.success) {
      logger.info(
        `Status update SMS sent for ${booking.bookingNumber}: ${status}`,
      );
    }

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error(`Send status update SMS failed for ${bookingId}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send status update SMS",
    };
  }
}

/**
 * Send a provider verification SMS
 */
export async function sendProviderVerificationSMS(
  phone: string,
  providerId: string,
  isVerified: boolean,
): Promise<SMSDeliveryResult> {
  try {
    const provider = await findProviderById(providerId);
    if (!provider) {
      return {
        success: false,
        error: `Provider ${providerId} not found`,
      };
    }

    const result = await twilioService.sendProviderVerification(
      phone,
      provider.businessName,
      isVerified,
    );

    if (result.success) {
      logger.info(
        `Verification SMS sent for provider ${providerId}: ${isVerified}`,
      );
    }

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error(
      `Send provider verification SMS failed for ${providerId}:`,
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send verification SMS",
    };
  }
}

/**
 * Send a custom SMS using a template
 */
export async function sendTemplateSMS(
  data: SMSTemplateData,
): Promise<SMSDeliveryResult> {
  try {
    // Validate phone number
    const validation = validatePhoneNumber(data.to);
    if (!validation.isValid) {
      return {
        success: false,
        error: "Invalid phone number format",
      };
    }

    // Replace variables in template
    let body = data.template;
    for (const [key, value] of Object.entries(data.variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    const result = await twilioService.sendSMS({
      to: data.to,
      body,
      from: data.from,
    });

    if (result.success) {
      logger.info(`Template SMS sent to ${data.to}`);
    }

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error("Send template SMS failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send template SMS",
    };
  }
}

/**
 * Send bulk SMS using a template
 */
export async function sendBulkTemplateSMS(
  data: BulkSMSTemplateData,
): Promise<SMSDeliveryResult[]> {
  try {
    // Replace variables in template
    let body = data.template;
    for (const [key, value] of Object.entries(data.variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    const results = await twilioService.sendBulkSMS(
      {
        recipients: data.recipients,
        body,
        from: data.from,
      },
      data.concurrency || 5,
    );

    const successCount = results.filter((r) => r.success).length;
    logger.info(
      `Bulk template SMS sent to ${successCount}/${results.length} recipients`,
    );

    return results;
  } catch (error) {
    logger.error("Send bulk template SMS failed:", error);
    throw error;
  }
}

/**
 * Send an OTP SMS with verification
 */
export async function sendOTPSMS(
  phone: string,
  otp: string,
  expiryMinutes: number = 10,
): Promise<SMSDeliveryResult> {
  try {
    const result = await twilioService.sendOTP(phone, otp, expiryMinutes);

    if (result.success) {
      logger.info(`OTP SMS sent to ${phone}`);
    }

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error("Send OTP SMS failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send OTP SMS",
    };
  }
}

/**
 * Verify OTP from SMS
 */
export async function verifyOTPCode(
  phone: string,
  otp: string,
): Promise<{
  verified: boolean;
  error?: string;
}> {
  try {
    const result = await twilioService.verifyOTP(phone, otp);
    return {
      verified: result.verified,
      error: result.error,
    };
  } catch (error) {
    logger.error("Verify OTP code failed:", error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : "OTP verification failed",
    };
  }
}

/**
 * Check SMS delivery status
 */
export async function checkSMSDeliveryStatus(messageId: string): Promise<{
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: Date;
  dateSent: Date | null;
  errorCode: number | null;
  errorMessage: string | null;
} | null> {
  try {
    return await twilioService.getSMSStatus(messageId);
  } catch (error) {
    logger.error("Check SMS delivery status failed:", error);
    return null;
  }
}

/**
 * Send a booking reminder SMS to customer (alias for consistency)
 */
export async function sendBookingReminderSms(
  phone: string,
  bookingNumber: string,
  providerName: string,
  scheduledDate: Date,
): Promise<SMSDeliveryResult> {
  try {
    const result = await twilioService.sendBookingReminder(
      phone,
      bookingNumber,
      providerName,
      scheduledDate,
    );

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error("Send booking reminder SMS failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send booking reminder SMS",
    };
  }
}

/**
 * Send a status update SMS (alias for consistency)
 */
export async function sendStatusUpdateSMS(
  phone: string,
  bookingNumber: string,
  status: string,
  providerName: string,
): Promise<SMSDeliveryResult> {
  try {
    const result = await twilioService.sendStatusUpdate(
      phone,
      bookingNumber,
      status,
      providerName,
    );

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error("Send status update SMS failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send status update SMS",
    };
  }
}

/**
 * Send a provider verification SMS (alias for consistency)
 */
export async function sendProviderVerificationSms(
  phone: string,
  businessName: string,
  isVerified: boolean,
): Promise<SMSDeliveryResult> {
  try {
    const result = await twilioService.sendProviderVerification(
      phone,
      businessName,
      isVerified,
    );

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error("Send provider verification SMS failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send provider verification SMS",
    };
  }
}

/**
 * Send a welcome SMS (alias for consistency)
 */
export async function sendWelcomeSms(
  phone: string,
  name: string,
): Promise<SMSDeliveryResult> {
  try {
    const result = await twilioService.sendWelcomeSMS(phone, name);

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error("Send welcome SMS failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send welcome SMS",
    };
  }
}

/**
 * Send a password reset SMS (alias for consistency)
 */
export async function sendPasswordResetSms(
  phone: string,
  resetToken: string,
): Promise<SMSDeliveryResult> {
  try {
    const result = await twilioService.sendPasswordReset(phone, resetToken);

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error("Send password reset SMS failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send password reset SMS",
    };
  }
}

/**
 * Send a custom SMS message
 */
export async function sendCustomSms(
  phone: string,
  message: string,
  from?: string,
): Promise<SMSDeliveryResult> {
  try {
    const result = await twilioService.sendSMS({
      to: phone,
      body: message,
      from,
    });

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
      to: result.to,
    };
  } catch (error) {
    logger.error("Send custom SMS failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send custom SMS",
    };
  }
}

/**
 * Send SMS to multiple recipients
 */
export async function sendBulkSms(
  recipients: string[],
  message: string,
  from?: string,
  concurrency: number = 5,
): Promise<SMSDeliveryResult[]> {
  try {
    const results = await twilioService.sendBulkSMS(
      {
        recipients,
        body: message,
        from,
      },
      concurrency,
    );

    const successCount = results.filter((r) => r.success).length;
    logger.info(
      `Bulk SMS sent to ${successCount}/${results.length} recipients`,
    );

    return results;
  } catch (error) {
    logger.error("Send bulk SMS failed:", error);
    throw error;
  }
}

/**
 * Check if SMS service is configured
 */
export function isSMSConfigured(): boolean {
  return twilioService.isConfiguredFn();
}

/**
 * Get formatted phone number
 */
export function getFormattedPhone(phone: string): string {
  return twilioService.formatPhoneNumber(phone);
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): {
  isValid: boolean;
  formattedNumber: string;
  countryCode: string;
  nationalNumber: string;
} {
  return twilioService.validatePhoneNumber(phone);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Re-export external service methods
  sendSMS,
  sendSMSWithRetry,
  sendBulkSMS,
  sendOTP,
  verifyOTP,
  sendBookingConfirmation,
  sendBookingReminder,
  sendPasswordReset,
  sendWelcomeSMS,
  sendStatusUpdate,
  sendProviderVerification,
  sendCustomSMS,
  getSMSStatus,
  getAccountInfo,
  getPhoneNumberAvailability,
  validatePhoneNumber,
  formatPhoneNumber,
  isConfiguredFn,

  // Application-specific methods
  sendOTPVerification,
  sendBookingConfirmationSMS,
  sendBookingReminderSMS,
  sendPasswordResetSMS,
  sendWelcomeSMSMessage,
  sendBookingStatusSMS,
  sendProviderVerificationSMS,
  sendTemplateSMS,
  sendBulkTemplateSMS,
  sendOTPSMS,
  verifyOTPCode,
  checkSMSDeliveryStatus,
  sendBookingReminderSms,
  sendStatusUpdateSMS,
  sendProviderVerificationSms,
  sendWelcomeSms,
  sendPasswordResetSms,
  sendCustomSms,
  sendBulkSms,
  isSMSConfigured,
  getFormattedPhone,
  validatePhone,
};
