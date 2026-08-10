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

/**
 * Create a new booking
 */
export async function createBooking(data: CreateBookingData): Promise<Booking> {
  const client = getApiClient();
  const response = await client.post<{ data: Booking }>('/bookings', {
    providerId: data.providerId,
    serviceId: data.serviceId,
    scheduledDate: data.scheduledDate,
    address: data.address,
    specialNotes: data.specialNotes,
    totalPrice: data.totalPrice,
    depositAmount: data.depositAmount || 0,
  });
  return response.data;
}

/**
 * Get booking by ID
 */
export async function getBookingById(id: string): Promise<Booking> {
  const client = getApiClient();
  const response = await client.get<{ data: Booking }>(`/bookings/${id}`);
  return response.data;
}

/**
 * Get booking by booking number
 */
export async function getBookingByNumber(bookingNumber: string): Promise<Booking> {
  const client = getApiClient();
  const response = await client.get<{ data: Booking }>(`/bookings/number/${bookingNumber}`);
  return response.data;
}

/**
 * Get customer bookings with filters
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

  const response = await client.get<{ data: Booking[]; pagination: any }>(
    `/bookings/customer?${params.toString()}`
  );
  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

/**
 * Get provider bookings with filters
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

  const response = await client.get<{ data: Booking[]; pagination: any }>(
    `/bookings/provider?${params.toString()}`
  );
  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
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

  const response = await client.get<{ data: Booking[]; pagination: any }>(
    `/bookings/admin?${params.toString()}`
  );
  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

/**
 * Update booking
 */
export async function updateBooking(id: string, data: UpdateBookingData): Promise<Booking> {
  const client = getApiClient();
  const response = await client.put<{ data: Booking }>(`/bookings/${id}`, data);
  return response.data;
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  id: string,
  data: UpdateBookingStatusData
): Promise<Booking> {
  const client = getApiClient();
  const response = await client.patch<{ data: Booking }>(`/bookings/${id}/status`, data);
  return response.data;
}

/**
 * Cancel booking with reason
 */
export async function cancelBooking(id: string, reason: string): Promise<Booking> {
  const client = getApiClient();
  const response = await client.post<{ data: Booking }>(`/bookings/${id}/cancel`, { reason });
  return response.data;
}

/**
 * Confirm booking (provider only)
 */
export async function confirmBooking(id: string): Promise<Booking> {
  const client = getApiClient();
  const response = await client.post<{ data: Booking }>(`/bookings/${id}/confirm`);
  return response.data;
}

/**
 * Start booking (provider only)
 */
export async function startBooking(id: string): Promise<Booking> {
  const client = getApiClient();
  const response = await client.post<{ data: Booking }>(`/bookings/${id}/start`);
  return response.data;
}

/**
 * Complete booking (provider only)
 */
export async function completeBooking(id: string): Promise<Booking> {
  const client = getApiClient();
  const response = await client.post<{ data: Booking }>(`/bookings/${id}/complete`);
  return response.data;
}

/**
 * Get provider booking statistics
 */
export async function getProviderBookingStats(): Promise<BookingStats> {
  const client = getApiClient();
  const response = await client.get<{ data: BookingStats }>('/bookings/provider/stats');
  return response.data;
}

/**
 * Get customer booking statistics
 */
export async function getCustomerBookingStats(): Promise<BookingStats> {
  const client = getApiClient();
  const response = await client.get<{ data: BookingStats }>('/bookings/customer/stats');
  return response.data;
}

/**
 * Check if booking exists
 */
export async function bookingExists(id: string): Promise<{ exists: boolean }> {
  const client = getApiClient();
  return await client.get<{ exists: boolean }>(`/bookings/${id}/exists`);
}

/**
 * Check if customer owns booking
 */
export async function isBookingCustomer(id: string): Promise<{ isOwner: boolean }> {
  const client = getApiClient();
  return await client.get<{ isOwner: boolean }>(`/bookings/${id}/customer-owner`);
}

/**
 * Check if provider owns booking
 */
export async function isBookingProvider(id: string): Promise<{ isOwner: boolean }> {
  const client = getApiClient();
  return await client.get<{ isOwner: boolean }>(`/bookings/${id}/provider-owner`);
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
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
};
