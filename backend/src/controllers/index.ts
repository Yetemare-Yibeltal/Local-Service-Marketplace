// ============================================================
// CONTROLLERS INDEX
// Central export point for all controller modules
// ============================================================

// ============================================================
// AUTH CONTROLLER
// ============================================================

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  sendOTPCode,
  verifyOTPCode,
  forgotPassword,
  resetPassword,
  changeUserPassword,
  verifyUserEmail,
  getCurrentUser,
} from "./auth.controller";

// ============================================================
// BOOKING CONTROLLER
// ============================================================

export {
  createBookingController,
  getBookingByIdController,
  getBookingByNumberController,
  getCustomerBookingList,
  getProviderBookingList,
  adminGetAllBookings,
  updateBookingController,
  updateBookingStatusController,
  cancelBookingController,
  confirmBookingController,
  startBookingController,
  completeBookingController,
  getProviderStatsController,
  getCustomerStatsController,
  checkBookingExistsController,
  checkCustomerBookingOwner,
  checkProviderBookingOwner,
  getCustomerBookingView,
  getProviderBookingView,
} from "./booking.controller";

// ============================================================
// PROVIDER CONTROLLER
// ============================================================

export {
  registerProviderController,
  getProviderProfileController,
  getMyProviderProfileController,
  updateProviderProfileController,
  getProviderListController,
  searchProvidersController,
  getProviderStatsController,
  getProviderDashboardController,
  createServiceController,
  getProviderServicesController,
  getServiceByIdController,
  updateServiceController,
  deleteServiceController,
  updateAvailabilityController,
  updateWorkingHoursController,
  verifyProviderController,
  getVerificationStatusController,
  getTopRatedProvidersController,
  getFeaturedProvidersController,
  getRecentProvidersController,
  getCategorySuggestionsController,
} from "./provider.controller";

// ============================================================
// ALL CONTROLLERS AGGREGATED
// ============================================================

import * as authController from "./auth.controller";
import * as bookingController from "./booking.controller";
import * as providerController from "./provider.controller";

export const controllers = {
  auth: authController,
  booking: bookingController,
  provider: providerController,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  ...authController,
  ...bookingController,
  ...providerController,
  controllers,
};
