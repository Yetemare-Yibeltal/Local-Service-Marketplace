import twilio, { Twilio } from "twilio";
import env from "../../config/env";
import logger from "../../utils/logger";
import { cacheSet, cacheGet } from "../../config/redis";

// ============================================================
// TYPES
// ============================================================

export interface SMSSendData {
  to: string;
  body: string;
  from?: string;
  statusCallback?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  to?: string;
}

export interface BulkSMSData {
  recipients: string[];
  body: string;
  from?: string;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  error?: string;
  attempts?: number;
}

export interface PhoneNumberValidationResult {
  isValid: boolean;
  formattedNumber: string;
  countryCode: string;
  nationalNumber: string;
  carrier?: string;
  lineType?: string;
}

// ============================================================
// TWILIO SERVICE
// ============================================================

/**
 * Twilio service class for SMS operations
 */
class TwilioService {
  private client: Twilio | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Twilio client
   */
  private initialize(): void {
    try {
      const accountSid = env.TWILIO_ACCOUNT_SID;
      const authToken = env.TWILIO_AUTH_TOKEN;
      const phoneNumber = env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !phoneNumber) {
        this.isConfigured = false;
        logger.warn(
          "Twilio is not configured. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER",
        );
        return;
      }

      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
      logger.info("Twilio client initialized successfully");
    } catch (error) {
      this.isConfigured = false;
      logger.error("Failed to initialize Twilio client:", error);
    }
  }

  /**
   * Check if Twilio is configured
   */
  isConfiguredFn(): boolean {
    return this.isConfigured && !!this.client;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): PhoneNumberValidationResult {
    try {
      // Remove spaces and special characters
      let cleaned = phone.replace(/[^0-9+]/g, "");

      // Check if it's a valid E.164 format or Ethiopian format
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      const ethiopianRegex = /^09\d{8}$/;
      const ethiopianRegex2 = /^9\d{8}$/;

      let isValid = false;
      let formattedNumber = cleaned;
      let countryCode = "";
      let nationalNumber = cleaned;

      // Check Ethiopian formats
      if (ethiopianRegex.test(cleaned)) {
        isValid = true;
        formattedNumber = "+251" + cleaned.substring(1);
        countryCode = "+251";
        nationalNumber = cleaned;
      } else if (ethiopianRegex2.test(cleaned)) {
        isValid = true;
        formattedNumber = "+251" + cleaned;
        countryCode = "+251";
        nationalNumber = "0" + cleaned;
      } else if (cleaned.startsWith("+251") && cleaned.length === 13) {
        isValid = true;
        formattedNumber = cleaned;
        countryCode = "+251";
        nationalNumber = cleaned.replace("+251", "0");
      } else if (e164Regex.test(cleaned)) {
        isValid = true;
        formattedNumber = cleaned;
        // Extract country code (basic extraction)
        const match = cleaned.match(/^\+(\d{1,3})/);
        if (match) {
          countryCode = "+" + match[1];
          nationalNumber = cleaned.substring(match[1].length + 1);
        }
      }

      return {
        isValid,
        formattedNumber,
        countryCode,
        nationalNumber,
      };
    } catch (error) {
      logger.error("Phone number validation failed:", error);
      return {
        isValid: false,
        formattedNumber: phone,
        countryCode: "",
        nationalNumber: phone,
      };
    }
  }

  /**
   * Format Ethiopian phone number to E.164
   */
  formatPhoneNumber(phone: string): string {
    const validation = this.validatePhoneNumber(phone);
    if (validation.isValid) {
      return validation.formattedNumber;
    }
    return phone;
  }

  /**
   * Send a single SMS
   */
  async sendSMS(data: SMSSendData): Promise<SMSResponse> {
    try {
      if (!this.isConfiguredFn()) {
        logger.warn("Twilio not configured. SMS not sent.");
        return {
          success: false,
          error: "Twilio not configured",
        };
      }

      // Validate phone number
      const validation = this.validatePhoneNumber(data.to);
      if (!validation.isValid) {
        logger.warn(`Invalid phone number: ${data.to}`);
        return {
          success: false,
          error: "Invalid phone number format",
          to: data.to,
        };
      }

      const to = validation.formattedNumber;
      const from = data.from || env.TWILIO_PHONE_NUMBER;

      // Check if message is not too long
      if (data.body.length > 1600) {
        logger.warn(
          `Message too long (${data.body.length} chars), truncating to 1600`,
        );
        data.body = data.body.substring(0, 1597) + "...";
      }

      const message = await this.client!.messages.create({
        body: data.body,
        from: from!,
        to: to,
        statusCallback: data.statusCallback,
      });

      logger.info(`SMS sent to ${to}: SID ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        to: to,
      };
    } catch (error: any) {
      logger.error("SMS sending failed:", error);
      return {
        success: false,
        error: error.message || "SMS sending failed",
        to: data.to,
      };
    }
  }

  /**
   * Send SMS with retry logic
   */
  async sendSMSWithRetry(
    data: SMSSendData,
    maxRetries: number = 3,
    delayMs: number = 1000,
  ): Promise<SMSResponse> {
    let lastError: string = "";
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const result = await this.sendSMS(data);
        if (result.success) {
          return result;
        }
        lastError = result.error || "Unknown error";
      } catch (error: any) {
        lastError = error.message || "Unknown error";
      }

      if (attempt < maxRetries) {
        // Exponential backoff
        const waitTime = delayMs * Math.pow(2, attempt - 1);
        logger.debug(
          `Retry ${attempt}/${maxRetries} for SMS to ${data.to} in ${waitTime}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts: ${lastError}`,
      to: data.to,
    };
  }

  /**
   * Send bulk SMS with concurrency control
   */
  async sendBulkSMS(
    data: BulkSMSData,
    concurrency: number = 5,
  ): Promise<SMSResponse[]> {
    try {
      if (!this.isConfiguredFn()) {
        logger.warn("Twilio not configured. Bulk SMS not sent.");
        return data.recipients.map(() => ({
          success: false,
          error: "Twilio not configured",
        }));
      }

      const results: SMSResponse[] = [];
      const batches: string[][] = [];

      // Split recipients into batches
      for (let i = 0; i < data.recipients.length; i += concurrency) {
        batches.push(data.recipients.slice(i, i + concurrency));
      }

      let batchIndex = 0;
      for (const batch of batches) {
        batchIndex++;
        logger.info(
          `Sending bulk SMS batch ${batchIndex}/${batches.length} (${batch.length} recipients)`,
        );

        const batchPromises = batch.map((recipient) =>
          this.sendSMS({
            to: recipient,
            body: data.body,
            from: data.from,
          }),
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Delay between batches to avoid rate limits
        if (batchIndex < batches.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const successCount = results.filter((r) => r.success).length;
      logger.info(
        `Bulk SMS completed: ${successCount}/${results.length} successful`,
      );

      return results;
    } catch (error) {
      logger.error("Bulk SMS failed:", error);
      return data.recipients.map(() => ({
        success: false,
        error: "Bulk SMS failed",
      }));
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(
    phone: string,
    otp: string,
    expiryMinutes: number = 10,
  ): Promise<SMSResponse> {
    const body = `Your verification code is: ${otp}. This code expires in ${expiryMinutes} minutes. Do not share this code with anyone.`;

    // Store OTP in Redis for verification
    const key = `otp:${this.formatPhoneNumber(phone)}`;
    await cacheSet(key, otp, expiryMinutes * 60);

    return this.sendSMS({
      to: phone,
      body,
    });
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string): Promise<VerificationResult> {
    try {
      const key = `otp:${this.formatPhoneNumber(phone)}`;
      const storedOtp = await cacheGet<string>(key);

      if (!storedOtp) {
        return {
          success: false,
          verified: false,
          error: "OTP expired or not found",
        };
      }

      if (storedOtp !== otp) {
        return {
          success: false,
          verified: false,
          error: "Invalid OTP",
        };
      }

      // OTP is valid, delete it
      await cacheSet(key, "", 0);

      return {
        success: true,
        verified: true,
      };
    } catch (error) {
      logger.error("OTP verification failed:", error);
      return {
        success: false,
        verified: false,
        error: "OTP verification failed",
      };
    }
  }

  /**
   * Send booking confirmation SMS
   */
  async sendBookingConfirmation(
    phone: string,
    bookingNumber: string,
    providerName: string,
    scheduledDate: Date,
    location: string,
  ): Promise<SMSResponse> {
    const formattedDate = scheduledDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const body = `✅ Booking Confirmed! ${bookingNumber} with ${providerName} on ${formattedDate} at ${formattedTime}. Location: ${location}. View details: ${env.CORS_ORIGIN || "https://marketplace.com"}/dashboard/bookings/${bookingNumber}`;

    return this.sendSMS({
      to: phone,
      body,
    });
  }

  /**
   * Send booking reminder SMS
   */
  async sendBookingReminder(
    phone: string,
    bookingNumber: string,
    providerName: string,
    scheduledDate: Date,
  ): Promise<SMSResponse> {
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

    return this.sendSMS({
      to: phone,
      body,
    });
  }

  /**
   * Send password reset SMS
   */
  async sendPasswordReset(phone: string, token: string): Promise<SMSResponse> {
    const resetUrl = `${env.CORS_ORIGIN || "https://marketplace.com"}/reset-password?token=${token}`;
    const body = `Reset your password using this link: ${resetUrl}. This link expires in 1 hour.`;

    return this.sendSMS({
      to: phone,
      body,
    });
  }

  /**
   * Send welcome SMS
   */
  async sendWelcomeSMS(phone: string, name: string): Promise<SMSResponse> {
    const body = `Welcome to Marketplace, ${name}! 🎉 Find trusted professionals near you. Download our app or visit ${env.CORS_ORIGIN || "https://marketplace.com"} to get started.`;

    return this.sendSMS({
      to: phone,
      body,
    });
  }

  /**
   * Send status update SMS
   */
  async sendStatusUpdate(
    phone: string,
    bookingNumber: string,
    status: string,
    providerName: string,
  ): Promise<SMSResponse> {
    const statusMap: Record<string, string> = {
      CONFIRMED: "confirmed",
      IN_PROGRESS: "is in progress",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
      DISPUTED: "disputed",
    };

    const statusText = statusMap[status] || status.toLowerCase();
    const body = `Booking ${bookingNumber} with ${providerName} has been ${statusText}. View details: ${env.CORS_ORIGIN || "https://marketplace.com"}/dashboard/bookings/${bookingNumber}`;

    return this.sendSMS({
      to: phone,
      body,
    });
  }

  /**
   * Send provider verification SMS
   */
  async sendProviderVerification(
    phone: string,
    businessName: string,
    isVerified: boolean,
  ): Promise<SMSResponse> {
    let body: string;

    if (isVerified) {
      body = `🎉 Congratulations! Your business "${businessName}" has been verified on Marketplace. You can now start accepting bookings.`;
    } else {
      body = `Your business "${businessName}" verification has been reviewed. Please check your dashboard for more information.`;
    }

    return this.sendSMS({
      to: phone,
      body,
    });
  }

  /**
   * Send custom SMS with template
   */
  async sendCustomSMS(
    phone: string,
    template: string,
    variables: Record<string, string>,
  ): Promise<SMSResponse> {
    let body = template;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    return this.sendSMS({
      to: phone,
      body,
    });
  }

  /**
   * Get SMS status
   */
  async getSMSStatus(messageId: string): Promise<any> {
    try {
      if (!this.isConfiguredFn()) {
        logger.warn("Twilio not configured.");
        return null;
      }

      const message = await this.client!.messages(messageId).fetch();
      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      logger.error("Get SMS status failed:", error);
      return null;
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      if (!this.isConfiguredFn()) {
        logger.warn("Twilio not configured.");
        return null;
      }

      const account = await this.client!.api.accounts(
        env.TWILIO_ACCOUNT_SID,
      ).fetch();
      return {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
        dateCreated: account.dateCreated,
      };
    } catch (error) {
      logger.error("Get account info failed:", error);
      return null;
    }
  }

  /**
   * Get phone number availability
   */
  async getPhoneNumberAvailability(countryCode: string = "ET"): Promise<any> {
    try {
      if (!this.isConfiguredFn()) {
        logger.warn("Twilio not configured.");
        return null;
      }

      const availableNumbers = await this.client!.availablePhoneNumbers(
        countryCode,
      ).local.list({
        limit: 5,
      });

      return availableNumbers.map((number: any) => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        locality: number.locality,
        region: number.region,
        capabilities: number.capabilities,
      }));
    } catch (error) {
      logger.error("Get phone number availability failed:", error);
      return null;
    }
  }
}

// ============================================================
// EXPORTS
// ============================================================

const twilioService = new TwilioService();

export default twilioService;
