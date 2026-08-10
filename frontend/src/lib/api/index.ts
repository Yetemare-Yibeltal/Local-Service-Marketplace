'use client';

// ============================================================
// API INDEX
// Central export point for all API service modules
// ============================================================

// API Client
export {
  default as apiClient,
  createApiClient,
  getApiClient,
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
} from './client';
export type { ApiClientConfig, ApiResponse, ApiError, RequestOptions } from './client';

// Auth API
export {
  login,
  register,
  refreshToken,
  logout,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  getCurrentUser,
} from './auth';
export type {
  LoginData,
  RegisterData,
  RegisterResponse,
  LoginResponse,
  RefreshTokenResponse,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
  OTPData,
  VerifyEmailData,
} from './auth';

// Providers API
export {
  getProviderProfile,
  getProviderById,
  updateProviderProfile,
  getProviderDashboard,
  getProviderServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  updateAvailability,
  updateWorkingHours,
  searchProviders,
  getProviderList,
  getTopRatedProviders,
  getFeaturedProviders,
  getRecentProviders,
  getCategorySuggestions,
  getFavoriteProviders,
  addFavorite,
  removeFavorite,
  isProviderFavorited,
  getFavoriteCount,
  getVerificationStatus,
} from './providers';
export type {
  ProviderProfile,
  Service,
  CreateServiceData,
  UpdateServiceData,
  ProviderSearchData,
  ProviderSearchResult,
  ProviderSearchResponse,
  FavoriteProvider,
  WorkingHours,
  AvailabilityUpdateData,
} from './providers';

// Bookings API
export {
  createBooking,
  getBookingById,
  getBookingByNumber,
  getCustomerBookings,
  getProviderBookings,
  getAdminBookings,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  confirmBooking,
  startBooking,
  completeBooking,
  getProviderBookingStats,
  getCustomerBookingStats,
  bookingExists,
  isBookingCustomer,
  isBookingProvider,
} from './bookings';
export type {
  Booking,
  CreateBookingData,
  UpdateBookingData,
  UpdateBookingStatusData,
  BookingFilters,
  BookingStats,
  PaginatedResponse,
} from './bookings';

// Categories API
export {
  createCategory,
  getCategoryById,
  getCategoryBySlug,
  getCategories,
  getActiveCategories,
  getRootCategories,
  getChildCategories,
  getCategoryTree,
  getCategoryBreadcrumb,
  getCategoryDescendants,
  getSubCategoryTree,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
  bulkUpdateCategories,
  getCategoryStats,
  getCategoriesWithChildCount,
  validateCategoryName,
  validateCategorySlug,
  checkSlugExists,
} from './categories';
export type {
  Category,
  CategoryTree,
  CreateCategoryData,
  UpdateCategoryData,
  CategoryFilters,
  BulkCategoryUpdate,
  CategoryStats,
} from './categories';

// Notifications API
export {
  getNotifications,
  getUnreadNotifications,
  getNotificationById,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  hasUnreadNotifications,
  sendNotification,
  sendBulkNotifications,
  resendNotification,
} from './notifications';
export type {
  Notification,
  NotificationPreferences,
  UnreadCount,
  NotificationFilters,
} from './notifications';

// Reviews API
export {
  createReview,
  getReviewById,
  getReviewByBookingId,
  getProviderReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  verifyReview,
  addReviewResponse,
  updateReviewResponse,
  deleteReviewResponse,
  getProviderRatingStats,
  getAdminReviews,
  reviewExists,
  bookingHasReview,
} from './reviews';
export type {
  Review,
  CreateReviewData,
  UpdateReviewData,
  ReviewResponseData,
  ReviewFilters,
  ReviewStats,
  ReviewWithStats,
} from './reviews';

// Admin API
export {
  getAdminDashboard,
  getPlatformAnalytics,
  adminGetUsers,
  adminGetUser,
  adminUpdateUser,
  adminDeactivateUser,
  adminActivateUser,
  adminGetProviders,
  adminGetProvider,
  adminGetPendingProviders,
  adminVerifyProvider,
  adminGetDisputes,
  adminGetDispute,
  adminResolveDispute,
  adminAddDisputeMessage,
  adminGetSettings,
  adminGetSetting,
  adminUpdateSetting,
  adminGetAuditLogs,
} from './admin';
export type {
  AdminUser,
  AdminProvider,
  AdminDispute,
  AdminAuditLog,
  SystemSetting,
  AdminDashboardStats,
  PlatformAnalytics,
  AdminFilters,
  UserAdminFilters,
  ProviderAdminFilters,
  DisputeAdminFilters,
  AuditLogFilters,
} from './admin';

// ============================================================
// RE-EXPORT ALL API SERVICES AS A SINGLE OBJECT
// ============================================================

import * as authAPI from './auth';
import * as providersAPI from './providers';
import * as bookingsAPI from './bookings';
import * as categoriesAPI from './categories';
import * as notificationsAPI from './notifications';
import * as reviewsAPI from './reviews';
import * as adminAPI from './admin';
import * as clientAPI from './client';

export const api = {
  client: clientAPI,
  auth: authAPI,
  providers: providersAPI,
  bookings: bookingsAPI,
  categories: categoriesAPI,
  notifications: notificationsAPI,
  reviews: reviewsAPI,
  admin: adminAPI,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default api;
