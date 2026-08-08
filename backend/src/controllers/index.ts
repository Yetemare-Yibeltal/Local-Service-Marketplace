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
// USER CONTROLLER
// ============================================================

export {
  getMyProfile,
  updateMyProfile,
  getUserById,
  getUsers,
  getUserStats,
  createUser,
  updateUser,
  deactivateUserController,
  activateUserController,
  deleteUserPermanently,
  checkEmail,
  checkPhone,
  getUserByEmailController,
  getUserByPhoneController,
} from "./user.controller";

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
// ADMIN CONTROLLER
// ============================================================

export {
  getAdminDashboard,
  adminGetAllUsers,
  adminGetUser,
  adminUpdateUserController,
  adminDeactivateUserController,
  adminActivateUserController,
  adminGetAllProviders,
  adminGetProvider,
  adminVerifyProviderController,
  adminGetPendingProviders,
  adminGetAllDisputes,
  adminGetDispute,
  adminResolveDisputeController,
  adminAddDisputeMessageController,
  adminGetSettings,
  adminGetSetting,
  adminUpdateSetting,
  adminGetAuditLogs,
  adminGetPlatformAnalytics,
} from "./admin.controller";

// ============================================================
// REVIEW CONTROLLER
// ============================================================

export {
  createReviewController,
  getReviewByIdController,
  getReviewByBookingIdController,
  getProviderReviewsController,
  getMyReviewsController,
  adminGetAllReviews,
  updateReviewController,
  deleteReviewController,
  verifyReviewController,
  addReviewResponseController,
  updateReviewResponseController,
  deleteReviewResponseController,
  getProviderRatingStatsController,
  checkReviewExistsController,
  checkBookingHasReviewController,
} from "./review.controller";

// ============================================================
// CATEGORY CONTROLLER
// ============================================================

export {
  createCategoryController,
  getCategoryByIdController,
  getCategoryBySlugController,
  getCategoriesController,
  getActiveCategoriesController,
  getRootCategoriesController,
  getChildCategoriesController,
  getCategoryTreeController,
  getCategoryBreadcrumbController,
  getCategoryDescendantsController,
  getSubCategoryTreeController,
  updateCategoryController,
  deleteCategoryController,
  hardDeleteCategoryController,
  bulkUpdateCategoryOrderController,
  getCategoryStatsController,
  getCategoriesWithCountController,
  validateCategoryNameController,
  validateCategorySlugController,
  checkSlugExistsController,
} from "./category.controller";

// ============================================================
// SEARCH CONTROLLER
// ============================================================

export {
  searchProvidersController,
  getNearbyProvidersController,
  searchByCategoryController,
  searchByCityController,
  autocompleteController,
  getSuggestionsController,
  getPopularSearchesController,
  getSearchFiltersController,
  getFeaturedProvidersController,
  getSearchHistoryController,
  clearSearchHistoryController,
  getSearchStatsController,
} from "./search.controller";

// ============================================================
// NOTIFICATION CONTROLLER
// ============================================================

export {
  sendNotificationController,
  sendBulkNotificationController,
  sendEmailNotificationController,
  getNotificationByIdController,
  getMyNotificationsController,
  getMyUnreadNotificationsController,
  adminGetAllNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  getUnreadCountController,
  hasUnreadNotificationsController,
  deleteNotificationController,
  deleteAllMyNotificationsController,
  cleanupOldNotificationsController,
  getNotificationPreferencesController,
  updateNotificationPreferencesController,
  checkNotificationExistsController,
} from "./notification.controller";

// ============================================================
// ANALYTICS CONTROLLER
// ============================================================

export {
  getBookingAnalyticsController,
  getRevenueAnalyticsController,
  getProviderPerformanceController,
  getCustomerBehaviorController,
  getCategoryAnalyticsController,
  getAnalyticsDashboardController,
} from "./analytics.controller";

// ============================================================
// PAYMENT CONTROLLER
// ============================================================

export {
  initiatePaymentController,
  verifyPaymentController,
  processRefundController,
  getPaymentByIdController,
  getPaymentByBookingIdController,
  getCustomerPaymentsController,
  getProviderPaymentsController,
  getPaymentStatsController,
  getProviderEarningsController,
  savePaymentMethodController,
  getPaymentMethodsController,
  deletePaymentMethodController,
  processPaymentWebhookController,
  checkBookingPaymentExistsController,
  checkPaymentExistsController,
} from "./payment.controller";

// ============================================================
// ALL CONTROLLERS AGGREGATED
// ============================================================

import * as authController from "./auth.controller";
import * as userController from "./user.controller";
import * as providerController from "./provider.controller";
import * as bookingController from "./booking.controller";
import * as adminController from "./admin.controller";
import * as reviewController from "./review.controller";
import * as categoryController from "./category.controller";
import * as searchController from "./search.controller";
import * as notificationController from "./notification.controller";
import * as analyticsController from "./analytics.controller";
import * as paymentController from "./payment.controller";

export const controllers = {
  auth: authController,
  user: userController,
  provider: providerController,
  booking: bookingController,
  admin: adminController,
  review: reviewController,
  category: categoryController,
  search: searchController,
  notification: notificationController,
  analytics: analyticsController,
  payment: paymentController,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  ...authController,
  ...userController,
  ...providerController,
  ...bookingController,
  ...adminController,
  ...reviewController,
  ...categoryController,
  ...searchController,
  ...notificationController,
  ...analyticsController,
  ...paymentController,
  controllers,
};
