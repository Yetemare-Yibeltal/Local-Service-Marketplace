import { sendEmail } from "../config/email";
import { createNotification } from "../repositories/notification.repository";
import logger from "../utils/logger";
import { formatDate, formatCurrency } from "../utils/helpers";

// ============================================================
// TYPES
// ============================================================

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface OTPEmailData {
  name: string;
  otp: string;
}

export interface PasswordResetEmailData {
  name: string;
  resetToken: string;
  resetUrl?: string;
}

export interface BookingConfirmationEmailData {
  customerName: string;
  providerName: string;
  bookingNumber: string;
  scheduledDate: Date;
  serviceTitle: string;
  totalPrice: number;
  address: string;
  providerPhone: string;
  providerEmail: string;
}

export interface BookingReminderEmailData {
  customerName: string;
  providerName: string;
  bookingNumber: string;
  scheduledDate: Date;
  serviceTitle: string;
  address: string;
}

export interface BookingStatusUpdateEmailData {
  customerName: string;
  providerName: string;
  bookingNumber: string;
  status: string;
  scheduledDate: Date;
  serviceTitle: string;
}

export interface ProviderVerificationEmailData {
  businessName: string;
  status: "APPROVED" | "REJECTED";
  notes?: string;
}

export interface ReviewNotificationEmailData {
  providerName: string;
  customerName: string;
  rating: number;
  comment: string;
  bookingNumber: string;
}

export interface AccountDeactivationEmailData {
  name: string;
  reason?: string;
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

/**
 * Generate HTML wrapper with consistent styling
 */
function htmlWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Local Service Provider Marketplace</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; }
        .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
        .logo span { color: #1e40af; }
        .content { padding: 20px 0; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888888; font-size: 12px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .button:hover { background-color: #1d4ed8; }
        .details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0; }
        .details td { padding: 8px 10px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; }
        .status-approved { background-color: #d1fae5; color: #065f46; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; }
        .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px; color: #92400e; font-size: 14px; }
        .alert { background-color: #fee2e2; padding: 15px; border-radius: 6px; margin-top: 20px; color: #991b1b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏪 <span>Market</span>Place</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; 2026 Local Service Provider Marketplace. All rights reserved.</p>
          <p>If you have any questions, please contact us at support@service-marketplace.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Welcome email template
 */
export function getWelcomeEmailTemplate(data: WelcomeEmailData): EmailData {
  const content = `
    <h2>Welcome to Marketplace, ${data.name}!</h2>
    <p>Thank you for joining Local Service Provider Marketplace. We are excited to have you on board.</p>
    <p>With our platform, you can:</p>
    <ul>
      <li>${data.role === "PROVIDER" ? "List your services and reach more customers" : "Find trusted service providers in your area"}</li>
      <li>Book services with transparent pricing</li>
      <li>Manage your bookings in one place</li>
      <li>Rate and review providers</li>
    </ul>
    <p>Get started by exploring our services today.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.CORS_ORIGIN || "http://localhost:3000"}" class="button">Get Started</a>
    </div>
    <div style="background-color: #f0f4ff; padding: 15px; border-radius: 6px; margin-top: 20px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>Your Account Details:</strong><br>
        Email: ${data.email}<br>
        Phone: ${data.phone}<br>
        Role: ${data.role}
      </p>
    </div>
  `;

  return {
    to: data.email,
    subject: "Welcome to Local Service Provider Marketplace",
    html: htmlWrapper(content),
  };
}

/**
 * OTP email template
 */
export function getOTPEmailTemplate(data: OTPEmailData): EmailData {
  const content = `
    <h2>Verification Code</h2>
    <p>Hello ${data.name},</p>
    <p>Use the code below to verify your email address:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="font-size: 48px; font-weight: bold; color: #2563eb; padding: 20px; letter-spacing: 10px; background-color: #f0f4ff; border-radius: 8px; display: inline-block;">
        ${data.otp}
      </div>
    </div>
    <p>This code will expire in <strong>10 minutes</strong>.</p>
    <div class="warning">
      <strong>⚠️ Security Alert:</strong> Do not share this code with anyone. If you did not request this code, please ignore this email.
    </div>
  `;

  return {
    to: data.email || "",
    subject: "Your Verification Code",
    html: htmlWrapper(content),
  };
}

/**
 * Password reset email template
 */
export function getPasswordResetEmailTemplate(
  data: PasswordResetEmailData,
): EmailData {
  const resetUrl =
    data.resetUrl ||
    `${process.env.CORS_ORIGIN || "http://localhost:3000"}/reset-password?token=${data.resetToken}`;

  const content = `
    <h2>Reset Your Password</h2>
    <p>Hello ${data.name},</p>
    <p>We received a request to reset your password for your Local Service Provider Marketplace account.</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <p>If you did not request a password reset, please ignore this email or contact support.</p>
    <div class="warning">
      <strong>⚠️ Security Alert:</strong> This link will expire in <strong>1 hour</strong>. If you have any concerns, please contact our support team.
    </div>
  `;

  return {
    to: data.email || "",
    subject: "Reset Your Password",
    html: htmlWrapper(content),
  };
}

/**
 * Booking confirmation email template
 */
export function getBookingConfirmationEmailTemplate(
  data: BookingConfirmationEmailData,
): EmailData {
  const formattedDate = formatDate(data.scheduledDate, "MMMM DD, YYYY");
  const formattedTime = formatDate(data.scheduledDate, "HH:mm");

  const content = `
    <h2>Booking Confirmed! ✅</h2>
    <p>Hello ${data.customerName},</p>
    <p>Your booking with <strong>${data.providerName}</strong> has been confirmed.</p>

    <div class="details">
      <table width="100%">
        <tr><td><strong>Booking Number:</strong></td><td>${data.bookingNumber}</td></tr>
        <tr><td><strong>Service:</strong></td><td>${data.serviceTitle}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${formattedDate}</td></tr>
        <tr><td><strong>Time:</strong></td><td>${formattedTime}</td></tr>
        <tr><td><strong>Location:</strong></td><td>${data.address}</td></tr>
        <tr><td><strong>Total Price:</strong></td><td>${formatCurrency(data.totalPrice)}</td></tr>
        <tr><td><strong>Provider:</strong></td><td>${data.providerName}</td></tr>
        <tr><td><strong>Provider Contact:</strong></td><td>${data.providerPhone}</td></tr>
      </table>
    </div>

    <p>Your provider will arrive at the scheduled time. You can track your booking in your dashboard.</p>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/bookings/${data.bookingNumber}" class="button">View Booking</a>
    </div>

    <div class="warning">
      <strong>📌 Reminder:</strong> If you need to cancel or reschedule, please do so at least 2 hours before the scheduled time.
    </div>
  `;

  return {
    to: data.email || "",
    subject: `Booking Confirmed - ${data.bookingNumber}`,
    html: htmlWrapper(content),
  };
}

/**
 * Booking reminder email template
 */
export function getBookingReminderEmailTemplate(
  data: BookingReminderEmailData,
): EmailData {
  const formattedDate = formatDate(data.scheduledDate, "MMMM DD, YYYY");
  const formattedTime = formatDate(data.scheduledDate, "HH:mm");

  const content = `
    <h2>🔔 Booking Reminder</h2>
    <p>Hello ${data.customerName},</p>
    <p>This is a reminder that your booking with <strong>${data.providerName}</strong> is scheduled for <strong>tomorrow</strong>.</p>

    <div class="details">
      <table width="100%">
        <tr><td><strong>Booking:</strong></td><td>${data.bookingNumber}</td></tr>
        <tr><td><strong>Service:</strong></td><td>${data.serviceTitle}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${formattedDate}</td></tr>
        <tr><td><strong>Time:</strong></td><td>${formattedTime}</td></tr>
        <tr><td><strong>Location:</strong></td><td>${data.address}</td></tr>
      </table>
    </div>

    <p>Please ensure you are available at the scheduled time. You can contact your provider directly through your dashboard.</p>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/bookings/${data.bookingNumber}" class="button">View Booking</a>
    </div>
  `;

  return {
    to: data.email || "",
    subject: `Reminder: Booking ${data.bookingNumber} Tomorrow`,
    html: htmlWrapper(content),
  };
}

/**
 * Booking status update email template
 */
export function getBookingStatusUpdateEmailTemplate(
  data: BookingStatusUpdateEmailData,
): EmailData {
  const statusMap: Record<string, { label: string; color: string }> = {
    CONFIRMED: { label: "Confirmed", color: "#d1fae5" },
    IN_PROGRESS: { label: "In Progress", color: "#fef3c7" },
    COMPLETED: { label: "Completed", color: "#d1fae5" },
    CANCELLED: { label: "Cancelled", color: "#fee2e2" },
    DISPUTED: { label: "Disputed", color: "#fef3c7" },
  };

  const statusInfo = statusMap[data.status] || {
    label: data.status,
    color: "#e5e7eb",
  };
  const formattedDate = formatDate(data.scheduledDate, "MMMM DD, YYYY HH:mm");

  const content = `
    <h2>Booking Status Updated</h2>
    <p>Hello ${data.customerName},</p>
    <p>The status of your booking with <strong>${data.providerName}</strong> has been updated.</p>

    <div class="details">
      <table width="100%">
        <tr><td><strong>Booking:</strong></td><td>${data.bookingNumber}</td></tr>
        <tr><td><strong>Service:</strong></td><td>${data.serviceTitle}</td></tr>
        <tr><td><strong>Date & Time:</strong></td><td>${formattedDate}</td></tr>
        <tr>
          <td><strong>Status:</strong></td>
          <td>
            <span style="display: inline-block; padding: 4px 12px; background-color: ${statusInfo.color}; border-radius: 4px; font-weight: 600; font-size: 14px;">
              ${statusInfo.label}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/bookings/${data.bookingNumber}" class="button">View Booking</a>
    </div>
  `;

  return {
    to: data.email || "",
    subject: `Booking ${data.bookingNumber} - ${statusInfo.label}`,
    html: htmlWrapper(content),
  };
}

/**
 * Provider verification email template
 */
export function getProviderVerificationEmailTemplate(
  data: ProviderVerificationEmailData,
): EmailData {
  let statusContent = "";

  if (data.status === "APPROVED") {
    statusContent = `
      <div style="text-align: center; padding: 20px; background-color: #d1fae5; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 48px;">✅</span>
        <h3 style="color: #065f46; margin: 10px 0 0 0;">Your Business Has Been Verified!</h3>
      </div>
      <p>Your business <strong>${data.businessName}</strong> has been approved and verified on our platform.</p>
      <p>You can now:</p>
      <ul>
        <li>Accept bookings from customers</li>
        <li>Manage your services</li>
        <li>Track your earnings</li>
        <li>Build your reputation with reviews</li>
      </ul>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/provider" class="button">Go to Dashboard</a>
      </div>
    `;
  } else {
    statusContent = `
      <div style="text-align: center; padding: 20px; background-color: #fee2e2; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 48px;">⚠️</span>
        <h3 style="color: #991b1b; margin: 10px 0 0 0;">Verification Review</h3>
      </div>
      <p>Your business <strong>${data.businessName}</strong> has been reviewed.</p>
      ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
      <p>Please update your information and resubmit for verification.</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/provider/profile" class="button">Update Profile</a>
      </div>
    `;
  }

  const content = `
    <h2>Provider Verification Status</h2>
    <p>Hello,</p>
    ${statusContent}
  `;

  return {
    to: data.email || "",
    subject: `Provider Verification - ${data.status === "APPROVED" ? "Approved ✅" : "Review Required"}`,
    html: htmlWrapper(content),
  };
}

/**
 * Review notification email template
 */
export function getReviewNotificationEmailTemplate(
  data: ReviewNotificationEmailData,
): EmailData {
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);

  const content = `
    <h2>New Review Received</h2>
    <p>Hello ${data.providerName},</p>
    <p><strong>${data.customerName}</strong> has left a review for booking <strong>${data.bookingNumber}</strong>.</p>

    <div class="details">
      <table width="100%">
        <tr><td><strong>Rating:</strong></td><td>${stars} (${data.rating}/5)</td></tr>
        <tr><td><strong>Comment:</strong></td><td>${data.comment}</td></tr>
      </table>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.CORS_ORIGIN || "http://localhost:3000"}/dashboard/provider/reviews" class="button">View Reviews</a>
    </div>

    <p>Thank you for providing excellent service to our customers!</p>
  `;

  return {
    to: data.email || "",
    subject: `New Review from ${data.customerName}`,
    html: htmlWrapper(content),
  };
}

/**
 * Account deactivation email template
 */
export function getAccountDeactivationEmailTemplate(
  data: AccountDeactivationEmailData,
): EmailData {
  const content = `
    <h2>Account Deactivation</h2>
    <p>Hello ${data.name},</p>
    <p>We regret to inform you that your account has been deactivated.</p>
    ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
    <p>If you believe this is a mistake, please contact our support team.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="mailto:support@service-marketplace.com" class="button" style="background-color: #dc2626;">Contact Support</a>
    </div>
  `;

  return {
    to: data.email || "",
    subject: "Account Deactivation Notice",
    html: htmlWrapper(content),
  };
}

// ============================================================
// EMAIL SENDING FUNCTIONS
// ============================================================

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  data: WelcomeEmailData,
): Promise<boolean> {
  try {
    const email = getWelcomeEmailTemplate(data);
    await sendEmail(email);
    logger.info(`Welcome email sent to ${data.email}`);
    return true;
  } catch (error) {
    logger.error("Send welcome email failed:", error);
    return false;
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(data: OTPEmailData): Promise<boolean> {
  try {
    const email = getOTPEmailTemplate(data);
    await sendEmail(email);
    logger.info(`OTP email sent to ${data.email}`);
    return true;
  } catch (error) {
    logger.error("Send OTP email failed:", error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  data: PasswordResetEmailData,
): Promise<boolean> {
  try {
    const email = getPasswordResetEmailTemplate(data);
    await sendEmail(email);
    logger.info(`Password reset email sent to ${data.email}`);
    return true;
  } catch (error) {
    logger.error("Send password reset email failed:", error);
    return false;
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  data: BookingConfirmationEmailData,
): Promise<boolean> {
  try {
    const email = getBookingConfirmationEmailTemplate(data);
    await sendEmail(email);
    logger.info(`Booking confirmation email sent to ${data.email}`);
    return true;
  } catch (error) {
    logger.error("Send booking confirmation email failed:", error);
    return false;
  }
}

/**
 * Send booking reminder email
 */
export async function sendBookingReminderEmail(
  data: BookingReminderEmailData,
): Promise<boolean> {
  try {
    const email = getBookingReminderEmailTemplate(data);
    await sendEmail(email);
    logger.info(`Booking reminder email sent to ${data.email}`);
    return true;
  } catch (error) {
    logger.error("Send booking reminder email failed:", error);
    return false;
  }
}

/**
 * Send booking status update email
 */
export async function sendBookingStatusUpdateEmail(
  data: BookingStatusUpdateEmailData,
): Promise<boolean> {
  try {
    const email = getBookingStatusUpdateEmailTemplate(data);
    await sendEmail(email);
    logger.info(`Booking status update email sent to ${data.email}`);
    return true;
  } catch (error) {
    logger.error("Send booking status update email failed:", error);
    return false;
  }
}

/**
 * Send provider verification email
 */
export async function sendProviderVerificationEmail(
  data: ProviderVerificationEmailData,
): Promise<boolean> {
  try {
    const email = getProviderVerificationEmailTemplate(data);
    await sendEmail(email);
    logger.info(`Provider verification email sent to ${data.email}`);
    return true;
  } catch (error) {
    logger.error("Send provider verification email failed:", error);
    return false;
  }
}

/**
 * Send review notification email
 */
export async function sendReviewNotificationEmail(
  data: ReviewNotificationEmailData,
): Promise<boolean> {
  try {
    const email = getReviewNotificationEmailTemplate(data);
    await sendEmail(email);
    logger.info(`Review notification email sent to ${data.email}`);
    return true;
  } catch (error) {
    logger.error("Send review notification email failed:", error);
    return false;
  }
}

/**
 * Send account deactivation email
 */
export async function sendAccountDeactivationEmail(
  data: AccountDeactivationEmailData,
): Promise<boolean> {
  try {
    const email = getAccountDeactivationEmailTemplate(data);
    await sendEmail(email);
    logger.info(`Account deactivation email sent to ${data.email}`);
    return true;
  } catch (error) {
    logger.error("Send account deactivation email failed:", error);
    return false;
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Get email domain
 */
export function getEmailDomain(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : "";
}

/**
 * Mask email for display
 */
export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const maskedName =
    name.length <= 2
      ? name
      : name.substring(0, 2) + "*".repeat(Math.min(name.length - 2, 4));
  return `${maskedName}@${domain}`;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Templates
  getWelcomeEmailTemplate,
  getOTPEmailTemplate,
  getPasswordResetEmailTemplate,
  getBookingConfirmationEmailTemplate,
  getBookingReminderEmailTemplate,
  getBookingStatusUpdateEmailTemplate,
  getProviderVerificationEmailTemplate,
  getReviewNotificationEmailTemplate,
  getAccountDeactivationEmailTemplate,

  // Sending functions
  sendWelcomeEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendBookingStatusUpdateEmail,
  sendProviderVerificationEmail,
  sendReviewNotificationEmail,
  sendAccountDeactivationEmail,

  // Helpers
  isValidEmail,
  getEmailDomain,
  maskEmail,
  htmlWrapper,
};
