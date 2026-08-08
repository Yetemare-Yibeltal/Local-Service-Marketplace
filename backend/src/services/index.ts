// ============================================================
// SERVICES INDEX
// Central export point for all service modules
// ============================================================

// Auth service
export {
  register,
  login,
  refreshToken,
  logout,
  sendOTP,
  verifyOTP,
  sendPasswordResetEmail,
  resetPassword,
  resetPasswordWithUserId,
  changePassword,
  verifyEmail,
  findUserById as findUserByIdService,
} from "./auth.service";

export type {
  RegisterData,
  LoginData,
  AuthResponse,
  TokenResponse,
  OTPData,
  ResetPasswordData,
  ChangePasswordData,
} from "./auth.service";

// Booking service
export {
  createBooking,
  getBookingById,
  getBookingByNumber,
  getCustomerBookings,
  getProviderBookings,
  updateBookingData,
  updateBookingStatusService,
  cancelBookingService,
  confirmBookingService,
  startBookingService,
  completeBookingService,
  getProviderStats,
  getCustomerStats,
  checkBookingConflict,
  validateBookingStatusTransition,
  sendBookingConfirmation,
  sendStatusUpdateNotification,
  getAllBookings,
  checkBookingExists,
  checkBookingCustomer,
  checkBookingProvider,
} from "./booking.service";

export type {
  CreateBookingData,
  UpdateBookingData,
  CancelBookingData,
  BookingConflictCheck,
  BookingStats,
} from "./booking.service";

// Email service
export {
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
} from "./email.service";

export type {
  EmailData,
  WelcomeEmailData,
  OTPEmailData,
  PasswordResetEmailData,
  BookingConfirmationEmailData,
  BookingReminderEmailData,
  BookingStatusUpdateEmailData,
  ProviderVerificationEmailData,
  ReviewNotificationEmailData,
  AccountDeactivationEmailData,
} from "./email.service";

// ============================================================
// RE-EXPORT ALL SERVICES AS A SINGLE OBJECT
// ============================================================

import * as authService from "./auth.service";
import * as bookingService from "./booking.service";
import * as emailService from "./email.service";

export const services = {
  auth: authService,
  booking: bookingService,
  email: emailService,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default services;
