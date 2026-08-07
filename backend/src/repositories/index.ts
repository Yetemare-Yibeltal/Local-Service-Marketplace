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

// ============================================================
// RE-EXPORT ALL REPOSITORIES AS A SINGLE OBJECT
// ============================================================

import * as userRepository from "./user.repository";
import * as bookingRepository from "./booking.repository";

export const repositories = {
  user: userRepository,
  booking: bookingRepository,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default repositories;
