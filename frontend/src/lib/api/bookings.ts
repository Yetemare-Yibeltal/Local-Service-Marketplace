'use client';

import { getApiClient } from './client';

// ============================================================
// TYPES
// ============================================================

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  providerId: string;
  serviceId: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  scheduledDate: string;
  address: string;
  specialNotes: string | null;
  totalPrice: number;
  depositAmount: number;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  provider?: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    averageRating: number;
    totalReviews: number;
    isVerified: boolean;
  };
  service?: {
    id: string;
    title: string;
    description: string;
    price: number;
    priceType: string;
  } | null;
  review?: {
    id: string;
    rating: number;
    comment: string;
  } | null;
  payment?: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
  } | null;
}

export interface CreateBookingData {
  providerId: string;
  serviceId?: string;
  scheduledDate: string;
  address: string;
  specialNotes?: string;
  totalPrice: number;
  depositAmount?: number;
}

export interface UpdateBookingData {
  scheduledDate?: string;
  address?: string;
  specialNotes?: string;
  totalPrice?: number;
  depositAmount?: number;
}

export interface UpdateBookingStatusData {
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  cancellationReason?: string;
}

export interface BookingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  providerId?: string;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BookingStats {
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
  averageRating: number;
  totalReviews: number;
  totalSpent: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================
// API FUNCTIONS
// ============================================================

// ============================================================
// CREATE
// ============================================================

/**
 * Create a new booking
 */
export async function createBooking(data: CreateBookingData): Promise<Booking> {
  const client = getApiClient();
  return await client.post<Booking>('/bookings', {
    providerId: data.providerId,
    serviceId: data.serviceId,
    scheduledDate: data.scheduledDate,
    address: data.address,
    specialNotes: data.specialNotes,
    totalPrice: data.totalPrice,
    depositAmount: data.depositAmount || 0,
  });
}

// ============================================================
// READ
// ============================================================

/**
 * Get booking by ID
 */
export async function getBookingById(id: string): Promise<Booking> {
  const client = getApiClient();
  return await client.get(`/bookings/${id}`);
}

/**
 * Get booking by booking number
 */
export async function getBookingByNumber(bookingNumber: string): Promise<Booking> {
  const client = getApiClient();
  return await client.get(`/bookings/number/${bookingNumber}`);
}

/**
 * Get customer bookings
 */
export async function getCustomerBookings(
  filters: BookingFilters = {}
): Promise<PaginatedResponse<Booking>> {
  const client = getApiClient();
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 10).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  return await client.get(`/bookings/customer?${params.toString()}`);
}

/**
 * Get provider bookings
 */
export async function getProviderBookings(
  filters: BookingFilters = {}
): Promise<PaginatedResponse<Booking>> {
  const client = getApiClient();
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 10).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  return await client.get(`/bookings/provider?${params.toString()}`);
}

/**
 * Get all bookings (admin only)
 */
export async function getAdminBookings(
  filters: BookingFilters = {}
): Promise<PaginatedResponse<Booking>> {
  const client = getApiClient();
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.providerId) params.append('providerId', filters.providerId);
  if (filters.customerId) params.append('customerId', filters.customerId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 10).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  return await client.get(`/bookings/admin?${params.toString()}`);
}

// ============================================================
// UPDATE
// ============================================================

/**
 * Update booking
 */
export async function updateBooking(id: string, data: UpdateBookingData): Promise<Booking> {
  const client = getApiClient();
  return await client.put<Booking>(`/bookings/${id}`, data);
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  id: string,
  data: UpdateBookingStatusData
): Promise<Booking> {
  const client = getApiClient();
  return await client.patch<Booking>(`/bookings/${id}/status`, data);
}

// ============================================================
// STATUS ACTIONS
// ============================================================

/**
 * Cancel booking
 */
export async function cancelBooking(id: string, reason: string): Promise<Booking> {
  const client = getApiClient();
  return await client.post<Booking>(`/bookings/${id}/cancel`, { reason });
}

/**
 * Confirm booking (provider only)
 */
export async function confirmBooking(id: string): Promise<Booking> {
  const client = getApiClient();
  return await client.post<Booking>(`/bookings/${id}/confirm`);
}

/**
 * Start booking (provider only)
 */
export async function startBooking(id: string): Promise<Booking> {
  const client = getApiClient();
  return await client.post<Booking>(`/bookings/${id}/start`);
}

/**
 * Complete booking (provider only)
 */
export async function completeBooking(id: string): Promise<Booking> {
  const client = getApiClient();
  return await client.post<Booking>(`/bookings/${id}/complete`);
}

// ============================================================
// STATISTICS
// ============================================================

/**
 * Get provider booking statistics
 */
export async function getProviderBookingStats(): Promise<BookingStats> {
  const client = getApiClient();
  return await client.get('/bookings/provider/stats');
}

/**
 * Get customer booking statistics
 */
export async function getCustomerBookingStats(): Promise<BookingStats> {
  const client = getApiClient();
  return await client.get('/bookings/customer/stats');
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Check if booking exists
 */
export async function bookingExists(id: string): Promise<{ exists: boolean }> {
  const client = getApiClient();
  return await client.get(`/bookings/${id}/exists`);
}

/**
 * Check if customer owns booking
 */
export async function isBookingCustomer(id: string): Promise<{ isOwner: boolean }> {
  const client = getApiClient();
  return await client.get(`/bookings/${id}/customer-owner`);
}

/**
 * Check if provider owns booking
 */
export async function isBookingProvider(id: string): Promise<{ isOwner: boolean }> {
  const client = getApiClient();
  return await client.get(`/bookings/${id}/provider-owner`);
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  // Create
  createBooking,

  // Read
  getBookingById,
  getBookingByNumber,
  getCustomerBookings,
  getProviderBookings,
  getAdminBookings,

  // Update
  updateBooking,
  updateBookingStatus,

  // Status Actions
  cancelBooking,
  confirmBooking,
  startBooking,
  completeBooking,

  // Statistics
  getProviderBookingStats,
  getCustomerBookingStats,

  // Validation
  bookingExists,
  isBookingCustomer,
  isBookingProvider,
};
