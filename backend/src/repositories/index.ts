// ============================================================
// REPOSITORIES INDEX
// Central export point for all repository modules
// ============================================================

// User repository
export {
  findUserById,
  findUserByEmail,
  findUserByPhone,
  findUserWithProviderById,
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  getUsers,
  countUsersByRole,
  getTotalUserCount,
  getActiveUserCount,
  findUserByEmailOrPhone,
  updateLastLogin,
  emailExists,
  phoneExists,
} from "./user.repository";

export type {
  UserFilters,
  UserWithProvider,
  UserCreateData,
  UserUpdateData,
} from "./user.repository";

// Booking repository
export {
  generateBookingNumber,
  createBooking,
  findBookingById,
  findBookingByNumber,
  updateBooking,
  updateBookingStatus,
  getBookings,
  getBookingsByCustomer,
  getBookingsByProvider,
  cancelBooking,
  confirmBooking,
  startBooking,
  completeBooking,
  getProviderDashboardStats,
  getCustomerDashboardStats,
  getBookingCountByStatus,
  bookingExists,
  isBookingCustomer,
  isBookingProvider,
} from "./booking.repository";

export type {
  BookingFilters,
  BookingCreateData,
  BookingUpdateData,
  BookingWithRelations,
  DashboardStats,
} from "./booking.repository";

// Provider repository
export {
  createProvider,
  findProviderById,
  findProviderByUserId,
  findProviderWithUserByUserId,
  updateProvider,
  deleteProvider,
  hardDeleteProvider,
  getProviders,
  searchProvidersByLocation,
  calculateDistance,
  verifyProvider,
  updateProviderRating,
  incrementCompletedJobs,
  getProviderCountByCategory,
  getTotalProviderCount,
  getActiveProviderCount,
  getVerifiedProviderCount,
  createService,
  findServiceById,
  getServicesByProvider,
  updateService,
  deleteService,
  hardDeleteService,
} from "./provider.repository";

export type {
  ProviderFilters,
  ProviderCreateData,
  ProviderUpdateData,
  ProviderWithUser,
  ProviderSearchResult,
} from "./provider.repository";

// Review repository
export {
  createReview,
  findReviewById,
  findReviewByBookingId,
  getReviewsByProvider,
  getReviewsByReviewer,
  updateReview,
  deleteReview,
  verifyReview,
  addReviewResponse,
  updateReviewResponse,
  deleteReviewResponse,
  getReviewResponsesByReviewId,
  updateProviderRating as updateProviderRatingFromReview,
  getProviderRatingStats,
  reviewExists,
  bookingHasReview,
  isReviewOwner,
} from "./review.repository";

export type {
  ReviewFilters,
  ReviewCreateData,
  ReviewUpdateData,
  ReviewWithRelations,
  ReviewResponseData,
  ProviderRatingStats,
} from "./review.repository";

// Category repository
export {
  generateSlug,
  createCategory,
  findCategoryById,
  findCategoryBySlug,
  getCategories,
  getActiveCategories,
  getRootCategories,
  getChildCategories,
  getCategoryTree,
  sortCategoryChildren,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
  bulkUpdateCategoryOrder,
  getCategoryCount,
  getActiveCategoryCount,
  categoryExists,
  slugExists,
  getCategoriesWithChildCount,
} from "./category.repository";

export type {
  CategoryFilters,
  CategoryCreateData,
  CategoryUpdateData,
  CategoryWithChildren,
  CategoryWithParent,
  CategoryTree,
} from "./category.repository";

// Notification repository
export {
  createNotification,
  createBulkNotifications,
  findNotificationById,
  getNotificationsByUser,
  getUnreadNotificationsByUser,
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateNotificationStatus,
  getUnreadCount,
  deleteNotification,
  deleteAllNotificationsByUser,
  deleteOldNotifications,
  notificationExists,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "./notification.repository";

export type {
  NotificationFilters,
  NotificationCreateData,
  NotificationUpdateData,
  NotificationWithUser,
  NotificationPreferences,
  UnreadCount,
} from "./notification.repository";

// ============================================================
// RE-EXPORT ALL REPOSITORIES AS A SINGLE OBJECT
// ============================================================

import * as userRepository from "./user.repository";
import * as bookingRepository from "./booking.repository";
import * as providerRepository from "./provider.repository";
import * as reviewRepository from "./review.repository";
import * as categoryRepository from "./category.repository";
import * as notificationRepository from "./notification.repository";

export const repositories = {
  user: userRepository,
  booking: bookingRepository,
  provider: providerRepository,
  review: reviewRepository,
  category: categoryRepository,
  notification: notificationRepository,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default repositories;