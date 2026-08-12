// ============================================================
// BOOKING TYPES
// Complete booking type definitions for the application
// ============================================================

// ============================================================
// ENUMS
// ============================================================

/**
 * Booking status enum
 */
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

/**
 * Booking status labels for display
 */
export const BookingStatusLabels: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

/**
 * Booking status colors for UI
 */
export const BookingStatusColors: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  DISPUTED: "bg-orange-100 text-orange-800",
};

/**
 * Booking status icons
 */
export const BookingStatusIcons: Record<BookingStatus, string> = {
  PENDING: "ClockIcon",
  CONFIRMED: "CheckCircleIcon",
  IN_PROGRESS: "ArrowPathIcon",
  COMPLETED: "CheckCircleIcon",
  CANCELLED: "XCircleIcon",
  DISPUTED: "ExclamationTriangleIcon",
};

/**
 * Allowed status transitions
 */
export const BookingStateTransitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "DISPUTED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "DISPUTED"],
  IN_PROGRESS: ["COMPLETED", "DISPUTED"],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: [],
};

// ============================================================
// BASE BOOKING TYPES
// ============================================================

/**
 * Booking base interface
 */
export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  providerId: string;
  serviceId: string | null;
  status: BookingStatus;
  scheduledDate: Date;
  estimatedEndDate: Date | null;
  address: string;
  specialNotes: string | null;
  totalPrice: number;
  depositAmount: number;
  confirmedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  providerLat: number | null;
  providerLng: number | null;
  customerLat: number | null;
  customerLng: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking with customer and provider details
 */
export interface BookingWithCustomer extends Booking {
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
}

/**
 * Booking with provider details
 */
export interface BookingWithProvider extends Booking {
  provider: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    averageRating: number;
    totalReviews: number;
    isVerified: boolean;
  };
}

/**
 * Booking with customer, provider, service, review, and payment details
 */
export interface BookingWithRelations extends Booking {
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  provider: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    averageRating: number;
    totalReviews: number;
    isVerified: boolean;
  };
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    priceType: string;
  } | null;
  review: {
    id: string;
    rating: number;
    comment: string;
  } | null;
  payment: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
  } | null;
}

// ============================================================
// BOOKING CRUD TYPES
// ============================================================

/**
 * Booking creation input
 */
export interface BookingCreateInput {
  customerId: string;
  providerId: string;
  serviceId?: string;
  scheduledDate: Date;
  address: string;
  specialNotes?: string;
  totalPrice: number;
  depositAmount?: number;
}

/**
 * Booking update input
 */
export interface BookingUpdateInput {
  scheduledDate?: Date;
  address?: string;
  specialNotes?: string;
  totalPrice?: number;
  depositAmount?: number;
}

/**
 * Booking status update input
 */
export interface BookingStatusUpdateInput {
  status: BookingStatus;
  cancellationReason?: string;
}

/**
 * Booking cancellation input
 */
export interface BookingCancelInput {
  reason: string;
  cancelledBy: string;
}

// ============================================================
// BOOKING FILTERS AND QUERIES
// ============================================================

/**
 * Booking filter parameters
 */
export interface BookingFilters {
  status?: BookingStatus;
  customerId?: string;
  providerId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  createdAtStart?: Date;
  createdAtEnd?: Date;
  scheduledDateStart?: Date;
  scheduledDateEnd?: Date;
}

/**
 * Booking sort options
 */
export interface BookingSortOptions {
  field: "createdAt" | "scheduledDate" | "totalPrice" | "status" | "updatedAt";
  order: "asc" | "desc";
}

/**
 * Booking pagination parameters
 */
export interface BookingPaginationParams {
  page: number;
  limit: number;
  filters?: BookingFilters;
  sort?: BookingSortOptions;
}

/**
 * Customer booking filter parameters
 */
export interface CustomerBookingFilters {
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Provider booking filter parameters
 */
export interface ProviderBookingFilters {
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Admin booking filter parameters
 */
export interface AdminBookingFilters {
  status?: BookingStatus;
  providerId?: string;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// ============================================================
// BOOKING CONFLICT AND VALIDATION TYPES
// ============================================================

/**
 * Booking conflict check parameters
 */
export interface BookingConflictCheck {
  providerId: string;
  scheduledDate: Date;
  durationMinutes?: number;
}

/**
 * Booking conflict result
 */
export interface BookingConflictResult {
  hasConflict: boolean;
  conflictingBookings?: Booking[];
  message?: string;
}

/**
 * Booking validation result
 */
export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================
// BOOKING STATISTICS TYPES
// ============================================================

/**
 * Dashboard statistics for booking
 */
export interface BookingDashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  disputedBookings: number;
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyBookings: number;
  completionRate: number;
  averageBookingValue: number;
}

/**
 * Provider dashboard statistics
 */
export interface ProviderDashboardStats extends BookingDashboardStats {
  providerId: string;
  businessName: string;
  responseTime: number | null;
  bookingTrend: Array<{ date: string; count: number; revenue: number }>;
}

/**
 * Customer dashboard statistics
 */
export interface CustomerDashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  disputedBookings: number;
  totalSpent: number;
  averageBookingValue: number;
  bookingTrend: Array<{ date: string; count: number; spent: number }>;
}

/**
 * Booking statistics summary
 */
export interface BookingStatistics {
  total: number;
  byStatus: Record<BookingStatus, number>;
  byDay: Array<{ date: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  averagePrice: number;
  totalRevenue: number;
}

// ============================================================
// BOOKING NOTIFICATION TYPES
// ============================================================

/**
 * Booking notification data
 */
export interface BookingNotificationData {
  bookingId: string;
  bookingNumber: string;
  customerId: string;
  providerId: string;
  customerName: string;
  providerName: string;
  scheduledDate: Date;
  address: string;
  totalPrice: number;
  status: BookingStatus;
}

/**
 * Booking reminder data
 */
export interface BookingReminderData {
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  providerName: string;
  scheduledDate: Date;
  hoursBefore: number;
}

// ============================================================
// BOOKING RESPONSE TYPES
// ============================================================

/**
 * Booking list response
 */
export interface BookingListResponse {
  data: BookingWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Booking detail response
 */
export interface BookingDetailResponse {
  booking: BookingWithRelations;
  timeline: Array<{
    status: BookingStatus;
    timestamp: Date;
    note?: string;
  }>;
}

/**
 * Booking creation response
 */
export interface BookingCreateResponse {
  booking: Booking;
  message: string;
}

/**
 * Booking status update response
 */
export interface BookingStatusUpdateResponse {
  booking: Booking;
  previousStatus: BookingStatus;
  newStatus: BookingStatus;
  message: string;
}

// ============================================================
// BOOKING TIMELINE TYPES
// ============================================================

/**
 * Booking timeline event
 */
export interface BookingTimelineEvent {
  id: string;
  bookingId: string;
  status: BookingStatus;
  event: string;
  description: string;
  createdAt: Date;
  createdBy: string | null;
}

/**
 * Booking timeline input
 */
export interface BookingTimelineInput {
  bookingId: string;
  status: BookingStatus;
  event: string;
  description: string;
  createdBy?: string;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Enums and constants
  BookingStatus,
  BookingStatusLabels,
  BookingStatusColors,
  BookingStatusIcons,
  BookingStateTransitions,

  // Base types
  Booking,
  BookingWithCustomer,
  BookingWithProvider,
  BookingWithRelations,

  // CRUD types
  BookingCreateInput,
  BookingUpdateInput,
  BookingStatusUpdateInput,
  BookingCancelInput,

  // Filter types
  BookingFilters,
  BookingSortOptions,
  BookingPaginationParams,
  CustomerBookingFilters,
  ProviderBookingFilters,
  AdminBookingFilters,

  // Conflict types
  BookingConflictCheck,
  BookingConflictResult,
  BookingValidationResult,

  // Statistics types
  BookingDashboardStats,
  ProviderDashboardStats,
  CustomerDashboardStats,
  BookingStatistics,

  // Notification types
  BookingNotificationData,
  BookingReminderData,

  // Response types
  BookingListResponse,
  BookingDetailResponse,
  BookingCreateResponse,
  BookingStatusUpdateResponse,

  // Timeline types
  BookingTimelineEvent,
  BookingTimelineInput,
};
