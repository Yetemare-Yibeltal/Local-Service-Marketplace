import nodemailer, {
  Transporter,
  SendMailOptions,
  SentMessageInfo,
} from "nodemailer";
import env from "./env";
import logger from "../utils/logger";

// ============================================================
// EMAIL CONFIGURATION
// ============================================================

/**
 * Email transporter instance
 */
let emailTransporter: Transporter | null = null;
let isEmailConfigured: boolean = false;

/**
 * Email configuration options
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Email data structure
 */
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Create email transporter
 */
export function createEmailTransporter(): Transporter {
  if (emailTransporter) {
    return emailTransporter;
  }

  const config: EmailConfig = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER || "",
      pass: env.SMTP_PASS || "",
    },
  };

  try {
    emailTransporter = nodemailer.createTransporter(config);

    // Verify transporter
    emailTransporter.verify((error: Error | null) => {
      if (error) {
        logger.error("Email transporter verification failed:", error);
        isEmailConfigured = false;
      } else {
        logger.info("Email transporter configured successfully");
        isEmailConfigured = true;
      }
    });

    return emailTransporter;
  } catch (error) {
    logger.error("Email transporter creation failed:", error);
    throw error;
  }
}

/**
 * Check if email is configured
 */
export function isEmailConfiguredFn(): boolean {
  return isEmailConfigured && !!(env.SMTP_USER && env.SMTP_PASS);
}

/**
 * Send an email
 */
export async function sendEmail(
  emailData: EmailData,
): Promise<SentMessageInfo> {
  try {
    if (!isEmailConfiguredFn()) {
      logger.warn("Email not configured. Skipping email send.");
      return {
        messageId: "email-not-configured",
        envelope: {},
        accepted: [],
        rejected: [],
        pending: [],
        response: "Email not configured",
      };
    }

    const transporter = createEmailTransporter();

    const mailOptions: SendMailOptions = {
      from: emailData.from || `"Marketplace" <${env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, ""),
      attachments: emailData.attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(
      `Email sent to ${emailData.to} | Message ID: ${info.messageId}`,
    );

    return info;
  } catch (error) {
    logger.error("Email sending failed:", error);
    throw error;
  }
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

/**
 * Generate welcome email template
 */
export function getWelcomeEmailTemplate(name: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "Welcome to Local Service Provider Marketplace",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
            .content { padding: 20px 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888888; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .button:hover { background-color: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏪 Marketplace</div>
            </div>
            <div class="content">
              <h2>Welcome, ${name}!</h2>
              <p>Thank you for joining Local Service Provider Marketplace. We are excited to have you on board.</p>
              <p>With our platform, you can:</p>
              <ul>
                <li>Find trusted service providers in your area</li>
                <li>Book services with transparent pricing</li>
                <li>Manage your bookings in one place</li>
                <li>Rate and review providers</li>
              </ul>
              <p>Get started by exploring our services today.</p>
              <a href="${env.CORS_ORIGIN || "http://localhost:3000"}" class="button">Get Started</a>
            </div>
            <div class="footer">
              <p>&copy; 2026 Local Service Provider Marketplace. All rights reserved.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Generate password reset email template
 */
export function getPasswordResetEmailTemplate(
  name: string,
  resetToken: string,
): { subject: string; html: string } {
  const resetUrl = `${env.CORS_ORIGIN || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  return {
    subject: "Reset Your Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
            .content { padding: 20px 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888888; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .button:hover { background-color: #1d4ed8; }
            .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px; color: #92400e; font-size: 14px; }
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
              <p>We received a request to reset your password for your Local Service Provider Marketplace account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>If you did not request a password reset, please ignore this email or contact support.</p>
              <div class="warning">
                <strong>⚠️ Security Alert:</strong> This link will expire in 1 hour. If you have any concerns, please contact our support team.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2026 Local Service Provider Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Generate booking confirmation email template
 */
export function getBookingConfirmationEmailTemplate(
  customerName: string,
  providerName: string,
  bookingNumber: string,
  scheduledDate: Date,
  serviceTitle: string,
  totalPrice: number,
  address: string,
): { subject: string; html: string } {
  const formattedDate = scheduledDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    subject: `Booking Confirmation - ${bookingNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
            .content { padding: 20px 0; }
            .booking-details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0; }
            .booking-details td { padding: 8px 10px; }
            .status { display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #92400e; border-radius: 4px; font-size: 14px; font-weight: bold; }
            .status-confirmed { background-color: #d1fae5; color: #065f46; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888888; font-size: 12px; }
            .button { display: inline-block; padding: 10px 25px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏪 Marketplace</div>
            </div>
            <div class="content">
              <h2>Booking Confirmed!</h2>
              <p>Hello ${customerName},</p>
              <p>Your booking with <strong>${providerName}</strong> has been confirmed.</p>

              <div class="booking-details">
                <table width="100%">
                  <tr><td><strong>Booking Number:</strong></td><td>${bookingNumber}</td></tr>
                  <tr><td><strong>Service:</strong></td><td>${serviceTitle}</td></tr>
                  <tr><td><strong>Date:</strong></td><td>${formattedDate}</td></tr>
                  <tr><td><strong>Time:</strong></td><td>${formattedTime}</td></tr>
                  <tr><td><strong>Location:</strong></td><td>${address}</td></tr>
                  <tr><td><strong>Total Price:</strong></td><td>ETB ${totalPrice.toFixed(2)}</td></tr>
                  <tr><td><strong>Status:</strong></td><td><span class="status status-confirmed">✅ Confirmed</span></td></tr>
                </table>
              </div>

              <p>Your provider will arrive at the scheduled time. You can track your booking in your dashboard.</p>

              <a href="${env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/bookings/${bookingNumber}" class="button">View Booking</a>
            </div>
            <div class="footer">
              <p>&copy; 2026 Local Service Provider Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Generate OTP email template
 */
export function getOTPEmailTemplate(
  name: string,
  otp: string,
): { subject: string; html: string } {
  return {
    subject: "Your Verification Code",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
            .content { padding: 20px 0; text-align: center; }
            .otp-code { font-size: 48px; font-weight: bold; color: #2563eb; padding: 20px; letter-spacing: 10px; background-color: #f0f4ff; border-radius: 8px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888888; font-size: 12px; }
            .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px; color: #92400e; font-size: 14px; }
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
                <strong>⚠️ Security Alert:</strong> Do not share this code with anyone. If you did not request this code, please ignore this email.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2026 Local Service Provider Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Generate booking reminder email template
 */
export function getBookingReminderEmailTemplate(
  customerName: string,
  providerName: string,
  bookingNumber: string,
  scheduledDate: Date,
  serviceTitle: string,
): { subject: string; html: string } {
  const formattedDate = scheduledDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    subject: `Reminder: Booking ${bookingNumber} Tomorrow`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
            .content { padding: 20px 0; }
            .booking-details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0; }
            .booking-details td { padding: 8px 10px; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888888; font-size: 12px; }
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

              <div class="booking-details">
                <table width="100%">
                  <tr><td><strong>Booking:</strong></td><td>${bookingNumber}</td></tr>
                  <tr><td><strong>Service:</strong></td><td>${serviceTitle}</td></tr>
                  <tr><td><strong>Date:</strong></td><td>${formattedDate}</td></tr>
                  <tr><td><strong>Time:</strong></td><td>${formattedTime}</td></tr>
                </table>
              </div>

              <p>Please ensure you are available at the scheduled time. You can contact your provider directly through your dashboard.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Local Service Provider Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.on("SIGTERM", () => {
  if (emailTransporter) {
    emailTransporter.close();
    logger.info("Email transporter closed");
  }
});

process.on("SIGINT", () => {
  if (emailTransporter) {
    emailTransporter.close();
    logger.info("Email transporter closed");
  }
});

// ============================================================
// EXPORTS
// ============================================================

export default {
  createEmailTransporter,
  isEmailConfigured: isEmailConfiguredFn,
  sendEmail,
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getBookingConfirmationEmailTemplate,
  getOTPEmailTemplate,
  getBookingReminderEmailTemplate,
};
