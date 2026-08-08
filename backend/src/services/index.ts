// ============================================================
// SERVICES INDEX
// Central export point for all service modules
// ============================================================

// ============================================================
// INTERNAL SERVICES
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
} from "./internal/auth.service";

export type {
  RegisterData,
  LoginData,
  AuthResponse,
  TokenResponse,
  OTPData,
  ResetPasswordData,
  ChangePasswordData,
} from "./internal/auth.service";

// User service (internal)
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
} from "./internal/user.service";

export type {
  UpdateProfileData,
  AdminCreateUserData,
  AdminUpdateUserData,
  UserProfileResponse,
} from "./internal/user.service";

// Provider service (internal)
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
} from "./internal/provider.service";

export type {
  RegisterProviderData,
  UpdateProviderData,
  CreateServiceData,
  UpdateServiceData,
  ProviderSearchData,
  ProviderStats,
  ProviderDashboardData,
} from "./internal/provider.service";

// Booking service (internal)
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
} from "./internal/booking.service";

export type {
  CreateBookingData,
  UpdateBookingData,
  CancelBookingData,
  BookingConflictCheck,
  BookingStats,
} from "./internal/booking.service";

// Review service (internal)
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
  checkReviewExists as checkReviewExistsInternal,
  checkBookingHasReview,
  checkReviewOwner,
  isValidRating,
  isValidComment,
} from "./internal/review.service";

export type {
  CreateReviewData,
  UpdateReviewData,
  ReviewResponseData,
  ReviewStats,
} from "./internal/review.service";

// Category service (internal)
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
} from "./internal/category.service";

export type {
  CreateCategoryData,
  UpdateCategoryData,
  CategoryFilter,
  BulkCategoryOrderUpdate,
} from "./internal/category.service";

// Search service (internal)
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
} from "./internal/search.service";

export type {
  SearchFilters,
  GeoSearchData,
  TextSearchData,
  SearchHistory,
  FacetedSearchResult,
  AutocompleteResult,
} from "./internal/search.service";

// Notification service (internal)
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
} from "./internal/notification.service";

export type {
  SendNotificationData,
  SendBulkNotificationData,
  SendEmailNotificationData,
} from "./internal/notification.service";

// Admin service (internal)
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
} from "./internal/admin.service";

export type {
  AdminDashboardStats,
  AdminUserFilters,
  AdminProviderFilters,
  AdminBookingFilters,
  AdminDisputeFilters,
  SystemSetting,
  AuditLogEntry,
} from "./internal/admin.service";

// Analytics service (internal)
export {
  getBookingAnalytics,
  getRevenueAnalytics,
  getProviderPerformanceAnalytics,
  getCustomerBehaviorAnalytics,
  getCategoryAnalytics,
} from "./internal/analytics.service";

export type {
  DateRange,
  AnalyticsFilters,
  TimeSeriesData,
  BookingAnalyticsResult,
  RevenueAnalyticsResult,
  ProviderPerformanceResult,
  CustomerBehaviorResult,
  CategoryAnalyticsResult,
} from "./internal/analytics.service";

// ============================================================
// EXTERNAL SERVICES
// ============================================================

// Mapbox service
export { default as mapboxService } from "./external/mapbox.service";
export type {
  GeocodeResult,
  ReverseGeocodeResult,
  PlaceSearchResult,
  DistanceResult,
  AutocompleteResult,
} from "./external/mapbox.service";

// Twilio service
export { default as twilioService } from "./external/twilio.service";
export type {
  SMSSendData,
  SMSResponse,
  BulkSMSData,
  VerificationResult,
  PhoneNumberValidationResult,
} from "./external/twilio.service";

// SendGrid service
export { default as sendgridService } from "./external/sendgrid.service";
export type {
  EmailSendData,
  EmailAttachment,
  EmailResponse,
  BulkEmailData,
  EmailValidationResult,
} from "./external/sendgrid.service";

// Cloudinary service
export { default as cloudinaryService } from "./external/cloudinary.service";
export type {
  UploadOptions,
  UploadResult,
  DeleteResult,
  TransformOptions,
  ImageInfo,
} from "./external/cloudinary.service";

// ============================================================
// ROOT LEVEL SERVICES
// ============================================================

// Admin service (root)
export {
  getDashboardStats as adminGetDashboardStats,
  adminGetUsers as rootAdminGetUsers,
  adminGetUserById as rootAdminGetUserById,
  adminUpdateUser as rootAdminUpdateUser,
  adminDeactivateUser as rootAdminDeactivateUser,
  adminActivateUser as rootAdminActivateUser,
  adminGetProviders as rootAdminGetProviders,
  adminGetProviderById as rootAdminGetProviderById,
  adminVerifyProvider as rootAdminVerifyProvider,
  adminGetDisputes as rootAdminGetDisputes,
  adminGetDisputeById as rootAdminGetDisputeById,
  adminResolveDispute as rootAdminResolveDispute,
  adminAddDisputeMessage as rootAdminAddDisputeMessage,
  getSystemSettings as rootGetSystemSettings,
  getSystemSetting as rootGetSystemSetting,
  updateSystemSetting as rootUpdateSystemSetting,
  createAuditLog as rootCreateAuditLog,
  getAuditLogs as rootGetAuditLogs,
  getPlatformAnalytics as rootGetPlatformAnalytics,
} from "./admin.service";

export type {
  AdminDashboardStats as RootAdminDashboardStats,
  AdminUserFilters as RootAdminUserFilters,
  AdminProviderFilters as RootAdminProviderFilters,
  AdminDisputeFilters as RootAdminDisputeFilters,
  SystemSetting as RootSystemSetting,
  AuditLogEntry as RootAuditLogEntry,
} from "./admin.service";

// Analytics service (root)
export {
  getBookingAnalytics as rootGetBookingAnalytics,
  getRevenueAnalytics as rootGetRevenueAnalytics,
  getProviderPerformanceAnalytics as rootGetProviderPerformanceAnalytics,
  getCustomerBehaviorAnalytics as rootGetCustomerBehaviorAnalytics,
  getCategoryAnalytics as rootGetCategoryAnalytics,
} from "./analytics.service";

export type {
  BookingAnalyticsResult as RootBookingAnalyticsResult,
  RevenueAnalyticsResult as RootRevenueAnalyticsResult,
  ProviderPerformanceResult as RootProviderPerformanceResult,
  CustomerBehaviorResult as RootCustomerBehaviorResult,
  CategoryAnalyticsResult as RootCategoryAnalyticsResult,
} from "./analytics.service";

// Category service (root)
export {
  generateSlug as rootGenerateSlug,
  createCategory as rootCreateCategory,
  getCategoryById as rootGetCategoryById,
  getCategoryBySlug as rootGetCategoryBySlug,
  getCategoryList as rootGetCategoryList,
  getActiveCategoryList as rootGetActiveCategoryList,
  getRootCategoryList as rootGetRootCategoryList,
  getChildCategoryList as rootGetChildCategoryList,
  getCategoryHierarchy as rootGetCategoryHierarchy,
  updateCategoryById as rootUpdateCategoryById,
  deleteCategoryById as rootDeleteCategoryById,
  hardDeleteCategoryById as rootHardDeleteCategoryById,
  getChildCategoryCount as rootGetChildCategoryCount,
  bulkUpdateCategoryOrder as rootBulkUpdateCategoryOrder,
  getCategoryStatistics as rootGetCategoryStatistics,
  getCategoriesWithChildrenCount as rootGetCategoriesWithChildrenCount,
  checkCategoryExists as rootCheckCategoryExists,
  checkSlugExists as rootCheckSlugExists,
  validateCategoryName as rootValidateCategoryName,
  validateCategorySlug as rootValidateCategorySlug,
  validateCategoryHierarchy as rootValidateCategoryHierarchy,
  getCategoryBreadcrumb,
  getCategoryDescendants,
  getSubCategoryTree,
} from "./category.service";

export type {
  CreateCategoryData as RootCreateCategoryData,
  UpdateCategoryData as RootUpdateCategoryData,
  CategoryFilter as RootCategoryFilter,
  BulkCategoryOrderUpdate as RootBulkCategoryOrderUpdate,
  CategoryStatistics as RootCategoryStatistics,
} from "./category.service";

// Cloudinary service (root)
export {
  uploadProfileImage,
  uploadProviderCoverImage,
  uploadServiceImages,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  isCloudinaryConfigured,
  uploadFile,
  uploadImage,
  uploadAvatar,
  uploadProviderLogo,
  uploadServiceImage as rootUploadServiceImage,
  uploadReviewImage,
  uploadCategoryImage,
  uploadDocument,
  uploadMultipleImages,
  deleteFile,
  deleteMultipleFiles,
  getImageUrl,
  getThumbnailUrl,
  getOptimizedUrl,
  getFaceCropUrl,
  getWatermarkedUrl,
  getImageInfo,
  imageExists,
  addTags,
  removeTags,
  generatePublicId,
  healthCheck,
  getFolderResources,
  deleteFolder,
  isConfiguredFn,
} from "./cloudinary.service";

export type {
  UploadOptions as RootUploadOptions,
  UploadResult as RootUploadResult,
  DeleteResult as RootDeleteResult,
  TransformOptions as RootTransformOptions,
  ImageInfo as RootImageInfo,
} from "./cloudinary.service";

// Notification service (root)
export {
  sendNotification as rootSendNotification,
  sendBulkNotifications as rootSendBulkNotifications,
  getNotificationById as rootGetNotificationById,
  getUserNotifications as rootGetUserNotifications,
  getUserUnreadNotifications as rootGetUserUnreadNotifications,
  markNotificationRead as rootMarkNotificationRead,
  markAllNotificationsRead as rootMarkAllNotificationsRead,
  getUnreadCountService as rootGetUnreadCountService,
  deleteNotificationById as rootDeleteNotificationById,
  deleteAllUserNotifications as rootDeleteAllUserNotifications,
  cleanupOldNotifications as rootCleanupOldNotifications,
  getUserNotificationPreferences as rootGetUserNotificationPreferences,
  updateUserNotificationPreferences as rootUpdateUserNotificationPreferences,
  sendEmailNotification as rootSendEmailNotification,
  checkNotificationExists as rootCheckNotificationExists,
  sendBookingConfirmationNotification,
  sendBookingStatusUpdateNotification,
  sendProviderVerificationNotification,
  sendWelcomeNotification,
  sendBookingReminderNotification,
  sendDisputeResolutionNotification,
  sendReviewNotification as rootSendReviewNotification,
  sendPaymentNotification,
  sendCustomNotification,
  sendBulkCustomNotification,
  sendBookingCancellationNotification,
  getUserNotificationSummary,
  checkNotificationExistsRoot,
  userHasUnreadNotifications,
} from "./notification.service";

export type {
  BookingNotificationData,
  ProviderNotificationData,
  UserNotificationData,
} from "./notification.service";

// Payment service
export {
  initiatePayment,
  verifyPayment,
  processRefund,
  getPaymentById,
  getPaymentByBookingId,
  getPaymentsByCustomer,
  getPaymentsByProvider,
  getPaymentStats,
  getProviderEarnings,
  savePaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  processPaymentWebhook,
  paymentExists,
  bookingHasPayment,
} from "./payment.service";

export type {
  PaymentData,
  PaymentVerificationData,
  RefundData,
  PaymentMethodData,
  PaymentStats,
  PaymentResponse,
} from "./payment.service";

// Provider service (root)
export {
  registerProvider as rootRegisterProvider,
  getProviderProfileById as rootGetProviderProfileById,
  getProviderProfileByUserId as rootGetProviderProfileByUserId,
  updateProviderProfile as rootUpdateProviderProfile,
  searchProviders as rootSearchProviders,
  getProviderList as rootGetProviderList,
  verifyProviderProfile as rootVerifyProviderProfile,
  getProviderStatistics as rootGetProviderStatistics,
  getProviderDashboard as rootGetProviderDashboard,
  createServiceForProvider as rootCreateServiceForProvider,
  getProviderServices as rootGetProviderServices,
  getServiceById as rootGetServiceById,
  updateServiceForProvider as rootUpdateServiceForProvider,
  deleteServiceForProvider as rootDeleteServiceForProvider,
  updateProviderAvailability as rootUpdateProviderAvailability,
  updateWorkingHours as rootUpdateWorkingHours,
  registerNewProvider,
  getProviderWithFullDetails,
  getProviderByUserIdWithDetails,
  updateProviderWithLogo,
  createServiceWithImages,
  updateServiceWithImages,
  getProviderWithEarnings,
  searchProvidersWithQuery,
  getProviderVerificationStatus,
  isProviderAvailable,
  getTopRatedProviders,
  getFeaturedProvidersList,
  getRecentProviders,
  bulkUpdateProviderAvailability,
  getProviderCategorySuggestions,
} from "./provider.service";

export type {
  ProviderRegistrationData,
  ProviderUpdateData,
  ServiceData,
  ProviderAvailabilityData,
  ProviderSearchData,
} from "./provider.service";

// Redis service
export { default as redisService } from "./redis.service";
export type {
  CacheOptions,
  PubSubMessage,
  RateLimitConfig,
  RateLimitResult,
} from "./redis.service";

// Review service (root)
export {
  createReview as rootCreateReview,
  getReviewById as rootGetReviewById,
  getReviewByBookingId as rootGetReviewByBookingId,
  getProviderReviews as rootGetProviderReviews,
  getReviewsByReviewer as rootGetReviewsByReviewer,
  updateReviewById as rootUpdateReviewById,
  deleteReviewById as rootDeleteReviewById,
  verifyReviewById as rootVerifyReviewById,
  addResponseToReview as rootAddResponseToReview,
  updateReviewResponseById as rootUpdateReviewResponseById,
  deleteReviewResponseById as rootDeleteReviewResponseById,
  getReviewResponses as rootGetReviewResponses,
  getProviderRatingStatsService as rootGetProviderRatingStatsService,
  refreshProviderRating as rootRefreshProviderRating,
  sendReviewNotification as rootSendReviewNotificationInternal,
  checkReviewExists as rootCheckReviewExists,
  checkBookingHasReview as rootCheckBookingHasReview,
  checkReviewOwner as rootCheckReviewOwner,
  isValidRating as rootIsValidRating,
  isValidComment as rootIsValidComment,
  createReviewWithImages,
  updateReviewWithImages,
  getProviderReviewsWithStats,
  getFullReviewById,
  sendReviewNotificationToProvider,
  getProviderAverageRating,
  getProviderReviewSummary,
  getReviewForBooking,
  deleteReviewWithCleanup,
  verifyReviewAndUpdate,
  canUserReviewBooking,
  getAdminReviews,
} from "./review.service";

export type {
  CreateReviewData as RootCreateReviewData,
  UpdateReviewData as RootUpdateReviewData,
  ReviewResponseData as RootReviewResponseData,
  ProviderReviewStats as RootProviderReviewStats,
} from "./review.service";

// Search service (root)
export {
  searchProvidersByLocationService as rootSearchProvidersByLocationService,
  textSearchProviders as rootTextSearchProviders,
  facetedSearch as rootFacetedSearch,
  autocompleteSearch as rootAutocompleteSearch,
  getPopularSearches as rootGetPopularSearches,
  getSearchSuggestions as rootGetSearchSuggestions,
  saveSearchHistory as rootSaveSearchHistory,
  getUserSearchHistory as rootGetUserSearchHistory,
  clearUserSearchHistory as rootClearUserSearchHistory,
  getNearbyProviders as rootGetNearbyProviders,
  getFeaturedProviders as rootGetFeaturedProviders,
  getProvidersByCategory as rootGetProvidersByCategory,
  searchWithFilters,
  searchNearbyProviders,
  searchProvidersByCity,
  getSearchSuggestionsWithCache,
  getPopularSearchesWithCache,
  saveSearchQuery,
  clearSearchHistory,
  getSearchStatistics,
  searchByCategory,
  getSearchFilters,
  getProviderAutocomplete,
} from "./search.service";

export type {
  SearchFilters as RootSearchFilters,
  GeoSearchData as RootGeoSearchData,
  SearchResult as RootSearchResult,
} from "./search.service";

// SMS service
export {
  sendSMS as rootSendSMS,
  sendSMSWithRetry as rootSendSMSWithRetry,
  sendBulkSMS as rootSendBulkSMS,
  sendOTP as rootSendOTP,
  verifyOTP as rootVerifyOTP,
  sendBookingConfirmation as rootSendBookingConfirmation,
  sendBookingReminder as rootSendBookingReminder,
  sendPasswordReset as rootSendPasswordReset,
  sendWelcomeSMS as rootSendWelcomeSMS,
  sendStatusUpdate as rootSendStatusUpdate,
  sendProviderVerification as rootSendProviderVerification,
  sendCustomSMS as rootSendCustomSMS,
  getSMSStatus as rootGetSMSStatus,
  getAccountInfo as rootGetAccountInfo,
  getPhoneNumberAvailability as rootGetPhoneNumberAvailability,
  validatePhoneNumber as rootValidatePhoneNumber,
  formatPhoneNumber as rootFormatPhoneNumber,
  isConfiguredFn as rootIsConfiguredFn,
  sendOTPVerification,
  sendBookingConfirmationSMS,
  sendBookingReminderSMS,
  sendPasswordResetSMS,
  sendWelcomeSMSMessage,
  sendBookingStatusSMS,
  sendProviderVerificationSMS,
  sendTemplateSMS,
  sendBulkTemplateSMS,
  sendOTPSMS,
  verifyOTPCode,
  checkSMSDeliveryStatus,
  sendBookingReminderSms,
  sendStatusUpdateSMS,
  sendProviderVerificationSms,
  sendWelcomeSms,
  sendPasswordResetSms,
  sendCustomSms,
  sendBulkSms,
  isSMSConfigured,
  getFormattedPhone,
  validatePhone,
} from "./sms.service";

export type {
  SMSTemplateData,
  BulkSMSTemplateData,
  SMSDeliveryResult,
  OTPData,
} from "./sms.service";

// User service (root)
export {
  getUserProfile as rootGetUserProfile,
  updateUserProfile as rootUpdateUserProfile,
  getUsersList as rootGetUsersList,
  getUserByEmail as rootGetUserByEmail,
  getUserByPhone as rootGetUserByPhone,
  checkEmailExists as rootCheckEmailExists,
  checkPhoneExists as rootCheckPhoneExists,
  createUserByAdmin as rootCreateUserByAdmin,
  updateUserByAdmin as rootUpdateUserByAdmin,
  deactivateUser as rootDeactivateUser,
  activateUser as rootActivateUser,
  permanentlyDeleteUser as rootPermanentlyDeleteUser,
  getUserStatistics as rootGetUserStatistics,
  getUserFullProfile,
  updateProfileWithAvatar,
  createUserWithWelcome,
  deactivateUserWithReason,
  getUserWithProvider,
  getUserDashboardStats,
  adminGetUsersList,
  getUserActivitySummary,
  bulkUpdateUserStatus,
  getUserCountStatistics,
  isEmailAvailable,
  isPhoneAvailable,
  searchUsersByContact,
} from "./user.service";

export type {
  UpdateProfileData as RootUpdateProfileData,
  AdminCreateUserData as RootAdminCreateUserData,
  AdminUpdateUserData as RootAdminUpdateUserData,
  UserProfileResponse as RootUserProfileResponse,
} from "./user.service";

// ============================================================
// ALL SERVICES AGGREGATED
// ============================================================

import * as allServices from "./";
import internalServices from "./internal";
import externalServices from "./external";

export const services = {
  internal: internalServices,
  external: externalServices,
  // Individual services are available via named exports above
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  ...allServices,
  internal: internalServices,
  external: externalServices,
};