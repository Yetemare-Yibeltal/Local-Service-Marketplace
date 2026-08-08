import axios, { AxiosInstance } from "axios";
import env from "../../config/env";
import logger from "../../utils/logger";
import { cacheSet, cacheGet } from "../../config/redis";

// ============================================================
// TYPES
// ============================================================

export interface EmailSendData {
  to: string | string[];
  from: string;
  fromName?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  type?: string;
  disposition?: string;
  contentId?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  to?: string | string[];
}

export interface BulkEmailData {
  recipients: string[];
  from: string;
  fromName?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
}

export interface EmailValidationResult {
  isValid: boolean;
  reason?: string;
  domain?: string;
  mxExists?: boolean;
  disposable?: boolean;
  free?: boolean;
}

// ============================================================
// SENDGRID SERVICE
// ============================================================

/**
 * SendGrid service class for email operations
 */
class SendGridService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string = "https://api.sendgrid.com/v3";
  private isConfigured: boolean = false;

  constructor() {
    this.apiKey = env.SENDGRID_API_KEY || "";
    this.isConfigured = !!this.apiKey;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    if (!this.isConfigured) {
      logger.warn("SendGrid is not configured. Check SENDGRID_API_KEY");
    } else {
      logger.info("SendGrid client initialized successfully");
    }
  }

  /**
   * Check if SendGrid is configured
   */
  isConfiguredFn(): boolean {
    return this.isConfigured && !!this.apiKey;
  }

  /**
   * Send email to one or multiple recipients
   */
  async sendEmail(data: EmailSendData): Promise<EmailResponse> {
    try {
      if (!this.isConfiguredFn()) {
        logger.warn("SendGrid not configured. Email not sent.");
        return {
          success: false,
          error: "SendGrid not configured",
          to: data.to,
        };
      }

      // Format recipients
      const toAddresses = Array.isArray(data.to)
        ? data.to.map((email) => ({ email }))
        : [{ email: data.to }];

      // Prepare personalizations
      const personalization: any = {
        to: toAddresses,
        subject: data.subject,
      };

      if (data.cc && data.cc.length > 0) {
        personalization.cc = data.cc.map((email) => ({ email }));
      }

      if (data.bcc && data.bcc.length > 0) {
        personalization.bcc = data.bcc.map((email) => ({ email }));
      }

      // Prepare content
      let content = [];
      if (data.html) {
        content.push({ type: "text/html", value: data.html });
      }
      if (data.text) {
        content.push({ type: "text/plain", value: data.text });
      }

      // If no content provided but templateId is provided, use template
      const useTemplate = data.templateId && !data.html && !data.text;

      // Prepare payload
      const payload: any = {
        personalizations: [personalization],
        from: {
          email: data.from,
          name: data.fromName || "",
        },
      };

      if (data.replyTo) {
        payload.reply_to = { email: data.replyTo };
      }

      if (useTemplate) {
        payload.template_id = data.templateId;
        if (data.templateData) {
          payload.personalizations[0].dynamic_template_data = data.templateData;
        }
      } else {
        payload.content = content;
      }

      // Add attachments
      if (data.attachments && data.attachments.length > 0) {
        payload.attachments = data.attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString("base64")
            : att.content,
          type: att.type || "application/octet-stream",
          disposition: att.disposition || "attachment",
          content_id: att.contentId || att.filename,
        }));
      }

      const response = await this.client.post("/mail/send", payload);

      const messageId = response.headers["x-message-id"] || "unknown";

      logger.info(
        `Email sent to ${Array.isArray(data.to) ? data.to.join(", ") : data.to}: ${messageId}`,
      );

      return {
        success: true,
        messageId,
        status: "sent",
        to: data.to,
      };
    } catch (error: any) {
      logger.error("Email sending failed:", error);

      // Extract SendGrid error details
      let errorMessage = error.message || "Email sending failed";

      if (error.response && error.response.data) {
        const errors = error.response.data.errors;
        if (errors && errors.length > 0) {
          errorMessage = errors.map((e: any) => e.message).join(", ");
        }
      }

      return {
        success: false,
        error: errorMessage,
        to: data.to,
      };
    }
  }

  /**
   * Send email with retry logic
   */
  async sendEmailWithRetry(
    data: EmailSendData,
    maxRetries: number = 3,
    delayMs: number = 1000,
  ): Promise<EmailResponse> {
    let lastError: string = "";
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const result = await this.sendEmail(data);
        if (result.success) {
          return result;
        }
        lastError = result.error || "Unknown error";
      } catch (error: any) {
        lastError = error.message || "Unknown error";
      }

      if (attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(2, attempt - 1);
        logger.debug(
          `Retry ${attempt}/${maxRetries} for email to ${data.to} in ${waitTime}ms`,
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
   * Send bulk emails with concurrency control
   */
  async sendBulkEmails(
    data: BulkEmailData,
    concurrency: number = 5,
  ): Promise<EmailResponse[]> {
    try {
      if (!this.isConfiguredFn()) {
        logger.warn("SendGrid not configured. Bulk emails not sent.");
        return data.recipients.map(() => ({
          success: false,
          error: "SendGrid not configured",
        }));
      }

      const results: EmailResponse[] = [];
      const batches: string[][] = [];

      // Split recipients into batches
      for (let i = 0; i < data.recipients.length; i += concurrency) {
        batches.push(data.recipients.slice(i, i + concurrency));
      }

      let batchIndex = 0;
      for (const batch of batches) {
        batchIndex++;
        logger.info(
          `Sending bulk email batch ${batchIndex}/${batches.length} (${batch.length} recipients)`,
        );

        const batchPromises = batch.map((recipient) =>
          this.sendEmail({
            to: recipient,
            from: data.from,
            fromName: data.fromName,
            subject: data.subject,
            html: data.html,
            text: data.text,
            templateId: data.templateId,
            templateData: data.templateData,
            attachments: data.attachments,
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
        `Bulk email completed: ${successCount}/${results.length} successful`,
      );

      return results;
    } catch (error) {
      logger.error("Bulk email failed:", error);
      return data.recipients.map(() => ({
        success: false,
        error: "Bulk email failed",
      }));
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    to: string,
    name: string,
    from: string = env.SENDGRID_FROM_EMAIL || "noreply@marketplace.com",
  ): Promise<EmailResponse> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to Marketplace</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e0e0e0; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
          .content { padding: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏪 Marketplace</div>
          </div>
          <div class="content">
            <h2>Welcome ${name}!</h2>
            <p>Thank you for joining Marketplace. We are excited to have you on board.</p>
            <p>With our platform, you can:</p>
            <ul>
              <li>Find trusted service providers in your area</li>
              <li>Book services with transparent pricing</li>
              <li>Manage your bookings in one place</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${env.CORS_ORIGIN || "https://marketplace.com"}" class="button">Get Started</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      from,
      fromName: "Marketplace",
      subject: "Welcome to Marketplace",
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
    from: string = env.SENDGRID_FROM_EMAIL || "noreply@marketplace.com",
  ): Promise<EmailResponse> {
    const resetUrl = `${env.CORS_ORIGIN || "https://marketplace.com"}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e0e0e0; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
          .content { padding: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
          .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; color: #92400e; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏪 Marketplace</div>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password for your Marketplace account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If you did not request a password reset, please ignore this email.</p>
            <div class="warning">
              <strong>⚠️ Security Alert:</strong> This link will expire in 1 hour.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      from,
      fromName: "Marketplace",
      subject: "Reset Your Password",
      html,
    });
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(
    to: string,
    name: string,
    otp: string,
    from: string = env.SENDGRID_FROM_EMAIL || "noreply@marketplace.com",
  ): Promise<EmailResponse> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Verification Code</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e0e0e0; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
          .content { padding: 20px 0; text-align: center; }
          .otp-code { font-size: 48px; font-weight: bold; color: #2563eb; padding: 20px; letter-spacing: 10px; background-color: #f0f4ff; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; color: #92400e; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏪 Marketplace</div>
          </div>
          <div class="content">
            <h2>Verification Code</h2>
            <p>Hello ${name},</p>
            <p>Use the code below to verify your email address:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <div class="warning">
              <strong>⚠️ Security Alert:</strong> Do not share this code with anyone.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      from,
      fromName: "Marketplace",
      subject: "Your Verification Code",
      html,
    });
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmationEmail(
    to: string,
    customerName: string,
    providerName: string,
    bookingNumber: string,
    scheduledDate: Date,
    serviceTitle: string,
    totalPrice: number,
    address: string,
    from: string = env.SENDGRID_FROM_EMAIL || "noreply@marketplace.com",
  ): Promise<EmailResponse> {
    const formattedDate = scheduledDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e0e0e0; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
          .content { padding: 20px 0; }
          .details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0; }
          .status { display: inline-block; padding: 4px 12px; background-color: #d1fae5; color: #065f46; border-radius: 4px; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏪 Marketplace</div>
          </div>
          <div class="content">
            <h2>Booking Confirmed! ✅</h2>
            <p>Hello ${customerName},</p>
            <p>Your booking with <strong>${providerName}</strong> has been confirmed.</p>

            <div class="details">
              <table width="100%">
                <tr><td><strong>Booking Number:</strong></td><td>${bookingNumber}</td></tr>
                <tr><td><strong>Service:</strong></td><td>${serviceTitle}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${formattedDate}</td></tr>
                <tr><td><strong>Time:</strong></td><td>${formattedTime}</td></tr>
                <tr><td><strong>Location:</strong></td><td>${address}</td></tr>
                <tr><td><strong>Total Price:</strong></td><td>ETB ${totalPrice.toFixed(2)}</td></tr>
                <tr><td><strong>Status:</strong></td><td><span class="status">✅ Confirmed</span></td></tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${env.CORS_ORIGIN || "https://marketplace.com"}/dashboard/bookings/${bookingNumber}" class="button">View Booking</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      from,
      fromName: "Marketplace",
      subject: `Booking Confirmed - ${bookingNumber}`,
      html,
    });
  }

  /**
   * Send booking reminder email
   */
  async sendBookingReminderEmail(
    to: string,
    customerName: string,
    providerName: string,
    bookingNumber: string,
    scheduledDate: Date,
    serviceTitle: string,
    address: string,
    from: string = env.SENDGRID_FROM_EMAIL || "noreply@marketplace.com",
  ): Promise<EmailResponse> {
    const formattedDate = scheduledDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Booking Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e0e0e0; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
          .content { padding: 20px 0; }
          .details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏪 Marketplace</div>
          </div>
          <div class="content">
            <h2>🔔 Booking Reminder</h2>
            <p>Hello ${customerName},</p>
            <p>This is a reminder that your booking with <strong>${providerName}</strong> is scheduled for tomorrow.</p>

            <div class="details">
              <table width="100%">
                <tr><td><strong>Booking:</strong></td><td>${bookingNumber}</td></tr>
                <tr><td><strong>Service:</strong></td><td>${serviceTitle}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${formattedDate}</td></tr>
                <tr><td><strong>Time:</strong></td><td>${formattedTime}</td></tr>
                <tr><td><strong>Location:</strong></td><td>${address}</td></tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${env.CORS_ORIGIN || "https://marketplace.com"}/dashboard/bookings/${bookingNumber}" class="button">View Booking</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      from,
      fromName: "Marketplace",
      subject: `Reminder: Booking ${bookingNumber} Tomorrow`,
      html,
    });
  }

  /**
   * Send provider verification email
   */
  async sendProviderVerificationEmail(
    to: string,
    businessName: string,
    status: "APPROVED" | "REJECTED",
    notes?: string,
    from: string = env.SENDGRID_FROM_EMAIL || "noreply@marketplace.com",
  ): Promise<EmailResponse> {
    let statusContent = "";
    const isApproved = status === "APPROVED";

    if (isApproved) {
      statusContent = `
        <div style="text-align: center; padding: 20px; background-color: #d1fae5; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 48px;">✅</span>
          <h3 style="color: #065f46; margin: 10px 0 0 0;">Your Business Has Been Verified!</h3>
        </div>
        <p>Your business <strong>${businessName}</strong> has been approved and verified on our platform.</p>
        <p>You can now:</p>
        <ul>
          <li>Accept bookings from customers</li>
          <li>Manage your services</li>
          <li>Track your earnings</li>
        </ul>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${env.CORS_ORIGIN || "https://marketplace.com"}/dashboard/provider" class="button">Go to Dashboard</a>
        </div>
      `;
    } else {
      statusContent = `
        <div style="text-align: center; padding: 20px; background-color: #fee2e2; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 48px;">⚠️</span>
          <h3 style="color: #991b1b; margin: 10px 0 0 0;">Verification Review</h3>
        </div>
        <p>Your business <strong>${businessName}</strong> has been reviewed.</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
        <p>Please update your information and resubmit for verification.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${env.CORS_ORIGIN || "https://marketplace.com"}/dashboard/provider/profile" class="button">Update Profile</a>
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Provider Verification Status</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e0e0e0; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
          .content { padding: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏪 Marketplace</div>
          </div>
          <div class="content">
            <h2>Provider Verification Status</h2>
            ${statusContent}
          </div>
          <div class="footer">
            <p>&copy; 2026 Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      from,
      fromName: "Marketplace",
      subject: `Provider Verification - ${isApproved ? "Approved ✅" : "Review Required"}`,
      html,
    });
  }

  /**
   * Send email using dynamic template with HTML
   */
  async sendTemplateEmail(
    to: string,
    templateId: string,
    templateData: Record<string, any>,
    from: string = env.SENDGRID_FROM_EMAIL || "noreply@marketplace.com",
  ): Promise<EmailResponse> {
    return this.sendEmail({
      to,
      from,
      fromName: "Marketplace",
      subject: "",
      templateId,
      templateData,
    });
  }

  /**
   * Validate email address
   */
  async validateEmailAddress(email: string): Promise<EmailValidationResult> {
    try {
      if (!this.isConfiguredFn()) {
        logger.warn("SendGrid not configured. Email validation skipped.");
        return { isValid: true };
      }

      // Simple regex validation first
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return {
          isValid: false,
          reason: "Invalid email format",
        };
      }

      // Use SendGrid email validation API
      const response = await this.client.post("/validations/email", {
        email: email,
      });

      const data = response.data;

      return {
        isValid: data.result === "deliverable",
        reason: data.result !== "deliverable" ? data.result : undefined,
        domain: data.email_domain || undefined,
        mxExists: data.smtp_check || false,
        disposable: data.disposable || false,
        free: data.free || false,
      };
    } catch (error: any) {
      logger.error("Email validation failed:", error);
      // Fallback to simple validation if API fails
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return {
        isValid: emailRegex.test(email),
        reason: emailRegex.test(email) ? undefined : "Invalid email format",
      };
    }
  }

  /**
   * Validate multiple email addresses
   */
  async validateMultipleEmails(
    emails: string[],
  ): Promise<EmailValidationResult[]> {
    const results: EmailValidationResult[] = [];

    for (const email of emails) {
      const result = await this.validateEmailAddress(email);
      results.push(result);
    }

    return results;
  }

  /**
   * Send test email
   */
  async sendTestEmail(
    to: string,
    from: string = env.SENDGRID_FROM_EMAIL || "noreply@marketplace.com",
  ): Promise<EmailResponse> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Email</title>
      </head>
      <body>
        <h2>Test Email</h2>
        <p>This is a test email from SendGrid service.</p>
        <p>If you received this email, your configuration is working correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      from,
      fromName: "Marketplace Test",
      subject: "SendGrid Test Email",
      html,
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================

const sendgridService = new SendGridService();

export default sendgridService;
