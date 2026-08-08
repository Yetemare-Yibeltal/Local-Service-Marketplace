// ============================================================
// INTERNAL SERVICES INDEX
// Central export point for all internal service modules
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

// User service
export {
  getUserProfile,
  updateUserProfile,
  getUsersList,
  getUserByEmail,
  getUserByPhone,
  checkEmailExists,
  checkPhoneExists,
  createUserByAdmin,
  updateUserByAdmin,
  deactivateUser,
  activateUser,
  permanentlyDeleteUser,
  getUserStatistics,
} from "./user.service";

export type {
  UpdateProfileData,
  AdminCreateUserData,
  AdminUpdateUserData,
  UserProfileResponse,
} from "./user.service";

// Provider service
export {
  registerProvider,
  getProviderProfileById,
  getProviderProfileByUserId,
  updateProviderProfile,
  searchProviders,
  getProviderList,
  verifyProviderProfile,
  getProviderStatistics,
  getProviderDashboard,
  createServiceForProvider,
  getProviderServices,
  getServiceById,
  updateServiceForProvider,
  deleteServiceForProvider,
  updateProviderAvailability,
  updateWorkingHours,
} from "./provider.service";

export type {
  RegisterProviderData,
  UpdateProviderData,
  CreateServiceData,
  UpdateServiceData,
  ProviderSearchData,
  ProviderStats,
  ProviderDashboardData,
} from "./provider.service";

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

// Review service
export {
  createReview,
  getReviewById,
  getReviewByBookingId,
  getProviderReviews,
  getReviewsByReviewer,
  updateReviewById,
  deleteReviewById,
  verifyReviewById,
  addResponseToReview,
  updateReviewResponseById,
  deleteReviewResponseById,
  getReviewResponses,
  getProviderRatingStatsService,
  refreshProviderRating,
  sendReviewNotification,
  checkReviewExists,
  checkBookingHasReview,
  checkReviewOwner,
  isValidRating,
  isValidComment,
} from "./review.service";

export type {
  CreateReviewData,
  UpdateReviewData,
  ReviewResponseData,
  ReviewStats,
} from "./review.service";

// Category service
export {
  createCategory,
  generateSlug,
  getCategoryById,
  getCategoryBySlug,
  getCategoryList,
  getActiveCategoryList,
  getRootCategoryList,
  getChildCategoryList,
  getCategoryHierarchy,
  updateCategoryById,
  deleteCategoryById,
  hardDeleteCategoryById,
  getChildCategoryCount,
  bulkUpdateCategoryOrder,
  getCategoryStatistics,
  getCategoriesWithChildrenCount,
  checkCategoryExists,
  checkSlugExists,
  validateCategoryName,
  validateCategorySlug,
  validateCategoryHierarchy,
} from "./category.service";

export type {
  CreateCategoryData,
  UpdateCategoryData,
  CategoryFilter,
  BulkCategoryOrderUpdate,
} from "./category.service";

// Search service
export {
  searchProvidersByLocationService,
  textSearchProviders,
  facetedSearch,
  autocompleteSearch,
  getPopularSearches,
  getSearchSuggestions,
  saveSearchHistory,
  getUserSearchHistory,
  clearUserSearchHistory,
  getNearbyProviders,
  getFeaturedProviders,
  getProvidersByCategory,
} from "./search.service";

export type {
  SearchFilters,
  GeoSearchData,
  TextSearchData,
  SearchHistory,
  FacetedSearchResult,
  AutocompleteResult,
} from "./search.service";

// Notification service
export {
  sendNotification,
  sendBulkNotifications,
  getNotificationById,
  getUserNotifications,
  getUserUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCountService,
  deleteNotificationById,
  deleteAllUserNotifications,
  cleanupOldNotifications,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  sendEmailNotification,
  checkNotificationExists,
} from "./notification.service";

export type {
  SendNotificationData,
  SendBulkNotificationData,
  SendEmailNotificationData,
} from "./notification.service";

// Admin service
export {
  getDashboardStats,
  adminGetUsers,
  adminGetUserById,
  adminUpdateUser,
  adminDeactivateUser,
  adminActivateUser,
  adminGetProviders,
  adminGetProviderById,
  adminVerifyProvider,
  adminGetDisputes,
  adminGetDisputeById,
  adminResolveDispute,
  adminAddDisputeMessage,
  getSystemSettings,
  getSystemSetting,
  updateSystemSetting,
  createAuditLog,
  getAuditLogs,
  getPlatformAnalytics,
} from "./admin.service";

export type {
  AdminDashboardStats,
  AdminUserFilters,
  AdminProviderFilters,
  AdminBookingFilters,
  AdminDisputeFilters,
  SystemSetting,
  AuditLogEntry,
} from "./admin.service";

// Analytics service
export {
  getBookingAnalytics,
  getRevenueAnalytics,
  getProviderPerformanceAnalytics,
  getCustomerBehaviorAnalytics,
  getCategoryAnalytics,
} from "./analytics.service";

export type {
  DateRange,
  AnalyticsFilters,
  TimeSeriesData,
  BookingAnalyticsResult,
  RevenueAnalyticsResult,
  ProviderPerformanceResult,
  CustomerBehaviorResult,
  CategoryAnalyticsResult,
} from "./analytics.service";

// ============================================================
// RE-EXPORT ALL SERVICES AS A SINGLE OBJECT
// ============================================================

import * as authService from "./auth.service";
import * as userService from "./user.service";
import * as providerService from "./provider.service";
import * as bookingService from "./booking.service";
import * as reviewService from "./review.service";
import * as categoryService from "./category.service";
import * as searchService from "./search.service";
import * as notificationService from "./notification.service";
import * as adminService from "./admin.service";
import * as analyticsService from "./analytics.service";

export const internalServices = {
  auth: authService,
  user: userService,
  provider: providerService,
  booking: bookingService,
  review: reviewService,
  category: categoryService,
  search: searchService,
  notification: notificationService,
  admin: adminService,
  analytics: analyticsService,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default internalServices;
