// ============================================================
// SCHEMAS INDEX
// Central export point for all validation schemas
// ============================================================

// Auth schemas
export {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOTPSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  logoutSchema,
} from "./auth.schema";

export type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  SendOTPInput,
  VerifyOTPInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
  LogoutInput,
} from "./auth.schema";

// User schemas
export {
  userRegisterSchema,
  publicRegisterSchema,
  updateProfileSchema,
  changePasswordSchema as userChangePasswordSchema,
  updateProfileImageSchema,
  userIdParamSchema,
  userFilterSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  userResponseSchema,
} from "./user.schema";

export type {
  UserRegisterInput,
  PublicRegisterInput,
  UpdateProfileInput,
  ChangePasswordInput as UserChangePasswordInput,
  UpdateProfileImageInput,
  UserIdParamInput,
  UserFilterInput,
  AdminCreateUserInput,
  AdminUpdateUserInput,
  UserResponse,
} from "./user.schema";

// Booking schemas
export {
  createBookingSchema,
  updateBookingStatusSchema,
  bookingIdParamSchema,
  bookingFilterSchema,
  providerBookingFilterSchema,
  customerBookingFilterSchema,
  adminBookingFilterSchema,
  bookingResponseSchema,
  cancelBookingSchema,
  bookingDashboardStatsSchema,
} from "./booking.schema";

export type {
  CreateBookingInput,
  UpdateBookingStatusInput,
  BookingIdParamInput,
  BookingFilterInput,
  ProviderBookingFilterInput,
  CustomerBookingFilterInput,
  AdminBookingFilterInput,
  BookingResponse,
  CancelBookingInput,
  BookingDashboardStats,
} from "./booking.schema";

// ============================================================
// RE-EXPORT ALL SCHEMAS AS A SINGLE OBJECT
// ============================================================

import * as authSchemas from "./auth.schema";
import * as userSchemas from "./user.schema";
import * as bookingSchemas from "./booking.schema";

export const schemas = {
  auth: authSchemas,
  user: userSchemas,
  booking: bookingSchemas,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default schemas;
