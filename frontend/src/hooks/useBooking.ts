'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

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
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// HOOK
// ============================================================

export function useBooking() {
  const { getToken, user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Helper to make authenticated requests
  const fetchWithAuth = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        // Token expired - redirect to login
        router.push('/login');
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Request failed');
      }

      const result = await response.json();
      return result.data;
    },
    [getToken, router]
  );

  // Get customer bookings
  const getCustomerBookings = useCallback(
    async (filters: BookingFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.search) params.append('search', filters.search);
        params.append('page', (filters.page || 1).toString());
        params.append('limit', (filters.limit || 10).toString());

        const response = await fetchWithAuth(`/bookings/customer?${params.toString()}`);

        setBookings(response.data || []);
        setPagination(
          response.pagination || {
            page: 1,
            limit: 10,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        );

        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
        showToast(error || 'Failed to load bookings', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Get provider bookings
  const getProviderBookings = useCallback(
    async (filters: BookingFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.search) params.append('search', filters.search);
        params.append('page', (filters.page || 1).toString());
        params.append('limit', (filters.limit || 10).toString());

        const response = await fetchWithAuth(`/bookings/provider?${params.toString()}`);

        setBookings(response.data || []);
        setPagination(
          response.pagination || {
            page: 1,
            limit: 10,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        );

        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
        showToast(error || 'Failed to load bookings', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Get booking by ID
  const getBookingById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const booking = await fetchWithAuth(`/bookings/${id}`);
        setSelectedBooking(booking);
        return booking;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
        showToast(error || 'Failed to load booking', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Get booking by number
  const getBookingByNumber = useCallback(
    async (bookingNumber: string) => {
      setLoading(true);
      setError(null);

      try {
        const booking = await fetchWithAuth(`/bookings/number/${bookingNumber}`);
        setSelectedBooking(booking);
        return booking;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
        showToast(error || 'Failed to load booking', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Create booking
  const createBooking = useCallback(
    async (data: CreateBookingData) => {
      setLoading(true);
      setError(null);

      try {
        const booking = await fetchWithAuth('/bookings', {
          method: 'POST',
          body: JSON.stringify({
            providerId: data.providerId,
            serviceId: data.serviceId,
            scheduledDate: data.scheduledDate,
            address: data.address,
            specialNotes: data.specialNotes,
            totalPrice: data.totalPrice,
            depositAmount: data.depositAmount || 0,
          }),
        });

        showToast('Booking created successfully!', 'success');
        return booking;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create booking');
        showToast(error || 'Failed to create booking', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Cancel booking
  const cancelBooking = useCallback(
    async (id: string, reason: string) => {
      setLoading(true);
      setError(null);

      try {
        const booking = await fetchWithAuth(`/bookings/${id}/cancel`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });

        // Update local state
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, status: 'CANCELLED', cancellationReason: reason } : b
          )
        );
        if (selectedBooking?.id === id) {
          setSelectedBooking({
            ...selectedBooking,
            status: 'CANCELLED',
            cancellationReason: reason,
          });
        }

        showToast('Booking cancelled successfully', 'success');
        return booking;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel booking');
        showToast(error || 'Failed to cancel booking', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast, selectedBooking]
  );

  // Confirm booking (provider only)
  const confirmBooking = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const booking = await fetchWithAuth(`/bookings/${id}/confirm`, {
          method: 'POST',
        });

        // Update local state
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, status: 'CONFIRMED', confirmedAt: new Date().toISOString() } : b
          )
        );
        if (selectedBooking?.id === id) {
          setSelectedBooking({
            ...selectedBooking,
            status: 'CONFIRMED',
            confirmedAt: new Date().toISOString(),
          });
        }

        showToast('Booking confirmed successfully', 'success');
        return booking;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to confirm booking');
        showToast(error || 'Failed to confirm booking', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast, selectedBooking]
  );

  // Start booking (provider only)
  const startBooking = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const booking = await fetchWithAuth(`/bookings/${id}/start`, {
          method: 'POST',
        });

        // Update local state
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, status: 'IN_PROGRESS', startedAt: new Date().toISOString() } : b
          )
        );
        if (selectedBooking?.id === id) {
          setSelectedBooking({
            ...selectedBooking,
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString(),
          });
        }

        showToast('Booking started successfully', 'success');
        return booking;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start booking');
        showToast(error || 'Failed to start booking', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast, selectedBooking]
  );

  // Complete booking (provider only)
  const completeBooking = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const booking = await fetchWithAuth(`/bookings/${id}/complete`, {
          method: 'POST',
        });

        // Update local state
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, status: 'COMPLETED', completedAt: new Date().toISOString() } : b
          )
        );
        if (selectedBooking?.id === id) {
          setSelectedBooking({
            ...selectedBooking,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          });
        }

        showToast('Booking completed successfully!', 'success');
        return booking;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete booking');
        showToast(error || 'Failed to complete booking', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast, selectedBooking]
  );

  // Get booking statistics
  const getBookingStats = useCallback(
    async (role: 'customer' | 'provider') => {
      setLoading(true);
      setError(null);

      try {
        const endpoint =
          role === 'customer' ? '/bookings/customer/stats' : '/bookings/provider/stats';

        const stats = await fetchWithAuth(endpoint);
        setStats(stats);
        return stats;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
        showToast(error || 'Failed to load stats', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Reset selected booking
  const clearSelectedBooking = useCallback(() => {
    setSelectedBooking(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if booking can be cancelled
  const canCancel = useCallback((booking: Booking) => {
    return ['PENDING', 'CONFIRMED'].includes(booking.status);
  }, []);

  // Check if booking can be confirmed (provider only)
  const canConfirm = useCallback(
    (booking: Booking) => {
      return booking.status === 'PENDING' && user?.role === 'PROVIDER';
    },
    [user]
  );

  // Check if booking can be started (provider only)
  const canStart = useCallback(
    (booking: Booking) => {
      return booking.status === 'CONFIRMED' && user?.role === 'PROVIDER';
    },
    [user]
  );

  // Check if booking can be completed (provider only)
  const canComplete = useCallback(
    (booking: Booking) => {
      return booking.status === 'IN_PROGRESS' && user?.role === 'PROVIDER';
    },
    [user]
  );

  // Check if booking can be reviewed (customer only)
  const canReview = useCallback(
    (booking: Booking) => {
      return booking.status === 'COMPLETED' && !booking.review && user?.role === 'CUSTOMER';
    },
    [user]
  );

  return {
    // State
    bookings,
    selectedBooking,
    stats,
    pagination,
    loading,
    error,

    // Actions
    getCustomerBookings,
    getProviderBookings,
    getBookingById,
    getBookingByNumber,
    createBooking,
    cancelBooking,
    confirmBooking,
    startBooking,
    completeBooking,
    getBookingStats,
    clearSelectedBooking,
    clearError,

    // Helpers
    canCancel,
    canConfirm,
    canStart,
    canComplete,
    canReview,
  };
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useBooking;
