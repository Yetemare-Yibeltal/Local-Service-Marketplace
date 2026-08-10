'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createBooking as createBookingApi,
  getBookingById as getBookingByIdApi,
  getBookingByNumber as getBookingByNumberApi,
  getCustomerBookings as getCustomerBookingsApi,
  getProviderBookings as getProviderBookingsApi,
  getAdminBookings as getAdminBookingsApi,
  updateBooking as updateBookingApi,
  updateBookingStatus as updateBookingStatusApi,
  cancelBooking as cancelBookingApi,
  confirmBooking as confirmBookingApi,
  startBooking as startBookingApi,
  completeBooking as completeBookingApi,
  getProviderBookingStats as getProviderBookingStatsApi,
  getCustomerBookingStats as getCustomerBookingStatsApi,
  bookingExists as bookingExistsApi,
  isBookingCustomer as isBookingCustomerApi,
  isBookingProvider as isBookingProviderApi,
} from '../api/bookings';

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

export interface PaginatedBookingResponse {
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BookingState {
  // State
  bookings: Booking[];
  selectedBooking: Booking | null;
  stats: BookingStats | null;
  filters: BookingFilters;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastFetchTime: number | null;
  cacheTTL: number;
}

export interface BookingActions {
  // Fetch operations
  getCustomerBookings: (filters?: BookingFilters) => Promise<PaginatedBookingResponse>;
  getProviderBookings: (filters?: BookingFilters) => Promise<PaginatedBookingResponse>;
  getAdminBookings: (filters?: BookingFilters) => Promise<PaginatedBookingResponse>;
  getBookingById: (id: string) => Promise<Booking>;
  getBookingByNumber: (bookingNumber: string) => Promise<Booking>;
  getStats: (role: 'customer' | 'provider') => Promise<BookingStats>;

  // CRUD operations
  createBooking: (data: CreateBookingData) => Promise<Booking>;
  updateBooking: (id: string, data: UpdateBookingData) => Promise<Booking>;
  cancelBooking: (id: string, reason: string) => Promise<Booking>;
  confirmBooking: (id: string) => Promise<Booking>;
  startBooking: (id: string) => Promise<Booking>;
  completeBooking: (id: string) => Promise<Booking>;

  // Validation
  bookingExists: (id: string) => Promise<boolean>;
  isBookingCustomer: (id: string) => Promise<boolean>;
  isBookingProvider: (id: string) => Promise<boolean>;

  // State management
  setFilters: (filters: Partial<BookingFilters>) => void;
  setPage: (page: number) => void;
  clearSelected: () => void;
  clearError: () => void;
  reset: () => void;
  invalidateCache: () => void;
}

export type BookingStore = BookingState & BookingActions;

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: BookingState = {
  bookings: [],
  selectedBooking: null,
  stats: null,
  filters: {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  isLoading: false,
  isSubmitting: false,
  error: null,
  lastFetchTime: null,
  cacheTTL: 60000, // 1 minute cache
};

// ============================================================
// STORE
// ============================================================

export const useBookingStore = create<BookingStore>()((set, get) => ({
  ...initialState,

  // ============================================================
  // FETCH OPERATIONS
  // ============================================================

  getCustomerBookings: async (filters?: BookingFilters): Promise<PaginatedBookingResponse> => {
    // Check cache
    const now = Date.now();
    const { lastFetchTime, cacheTTL, filters: currentFilters } = get();
    const filtersMatch = JSON.stringify(filters) === JSON.stringify(currentFilters);

    if (lastFetchTime && now - lastFetchTime < cacheTTL && filtersMatch) {
      return {
        data: get().bookings,
        pagination: get().pagination,
      };
    }

    set({ isLoading: true, error: null });

    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await getCustomerBookingsApi(mergedFilters);

      set({
        bookings: response.data,
        pagination: response.pagination,
        filters: mergedFilters,
        isLoading: false,
        error: null,
        lastFetchTime: Date.now(),
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bookings';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  getProviderBookings: async (filters?: BookingFilters): Promise<PaginatedBookingResponse> => {
    const now = Date.now();
    const { lastFetchTime, cacheTTL, filters: currentFilters } = get();
    const filtersMatch = JSON.stringify(filters) === JSON.stringify(currentFilters);

    if (lastFetchTime && now - lastFetchTime < cacheTTL && filtersMatch) {
      return {
        data: get().bookings,
        pagination: get().pagination,
      };
    }

    set({ isLoading: true, error: null });

    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await getProviderBookingsApi(mergedFilters);

      set({
        bookings: response.data,
        pagination: response.pagination,
        filters: mergedFilters,
        isLoading: false,
        error: null,
        lastFetchTime: Date.now(),
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bookings';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  getAdminBookings: async (filters?: BookingFilters): Promise<PaginatedBookingResponse> => {
    const now = Date.now();
    const { lastFetchTime, cacheTTL, filters: currentFilters } = get();
    const filtersMatch = JSON.stringify(filters) === JSON.stringify(currentFilters);

    if (lastFetchTime && now - lastFetchTime < cacheTTL && filtersMatch) {
      return {
        data: get().bookings,
        pagination: get().pagination,
      };
    }

    set({ isLoading: true, error: null });

    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await getAdminBookingsApi(mergedFilters);

      set({
        bookings: response.data,
        pagination: response.pagination,
        filters: mergedFilters,
        isLoading: false,
        error: null,
        lastFetchTime: Date.now(),
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bookings';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  getBookingById: async (id: string): Promise<Booking> => {
    set({ isLoading: true, error: null });

    try {
      const booking = await getBookingByIdApi(id);
      set({
        selectedBooking: booking,
        isLoading: false,
        error: null,
      });
      return booking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch booking';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  getBookingByNumber: async (bookingNumber: string): Promise<Booking> => {
    set({ isLoading: true, error: null });

    try {
      const booking = await getBookingByNumberApi(bookingNumber);
      set({
        selectedBooking: booking,
        isLoading: false,
        error: null,
      });
      return booking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch booking';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  getStats: async (role: 'customer' | 'provider'): Promise<BookingStats> => {
    set({ isLoading: true, error: null });

    try {
      const stats =
        role === 'provider'
          ? await getProviderBookingStatsApi()
          : await getCustomerBookingStatsApi();

      set({
        stats,
        isLoading: false,
        error: null,
      });

      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  createBooking: async (data: CreateBookingData): Promise<Booking> => {
    set({ isSubmitting: true, error: null });

    try {
      const booking = await createBookingApi(data);

      // Add to bookings list if on first page
      const { page, filters } = get();
      if (page === 1) {
        set((state) => ({
          bookings: [booking, ...state.bookings],
          pagination: {
            ...state.pagination,
            totalItems: state.pagination.totalItems + 1,
          },
        }));
      }

      set({ isSubmitting: false, error: null });

      return booking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  updateBooking: async (id: string, data: UpdateBookingData): Promise<Booking> => {
    set({ isSubmitting: true, error: null });

    try {
      const booking = await updateBookingApi(id, data);

      // Update in bookings list
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
        selectedBooking: state.selectedBooking?.id === id ? booking : state.selectedBooking,
        isSubmitting: false,
        error: null,
      }));

      return booking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update booking';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  cancelBooking: async (id: string, reason: string): Promise<Booking> => {
    set({ isSubmitting: true, error: null });

    try {
      const booking = await cancelBookingApi(id, reason);

      // Update in bookings list
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
        selectedBooking: state.selectedBooking?.id === id ? booking : state.selectedBooking,
        isSubmitting: false,
        error: null,
      }));

      return booking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  confirmBooking: async (id: string): Promise<Booking> => {
    set({ isSubmitting: true, error: null });

    try {
      const booking = await confirmBookingApi(id);

      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
        selectedBooking: state.selectedBooking?.id === id ? booking : state.selectedBooking,
        isSubmitting: false,
        error: null,
      }));

      return booking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm booking';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  startBooking: async (id: string): Promise<Booking> => {
    set({ isSubmitting: true, error: null });

    try {
      const booking = await startBookingApi(id);

      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
        selectedBooking: state.selectedBooking?.id === id ? booking : state.selectedBooking,
        isSubmitting: false,
        error: null,
      }));

      return booking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start booking';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  completeBooking: async (id: string): Promise<Booking> => {
    set({ isSubmitting: true, error: null });

    try {
      const booking = await completeBookingApi(id);

      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
        selectedBooking: state.selectedBooking?.id === id ? booking : state.selectedBooking,
        isSubmitting: false,
        error: null,
      }));

      return booking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete booking';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  // ============================================================
  // VALIDATION
  // ============================================================

  bookingExists: async (id: string): Promise<boolean> => {
    try {
      const result = await bookingExistsApi(id);
      return result.exists;
    } catch (error) {
      console.error('Error checking booking existence:', error);
      return false;
    }
  },

  isBookingCustomer: async (id: string): Promise<boolean> => {
    try {
      const result = await isBookingCustomerApi(id);
      return result.isOwner;
    } catch (error) {
      console.error('Error checking booking customer:', error);
      return false;
    }
  },

  isBookingProvider: async (id: string): Promise<boolean> => {
    try {
      const result = await isBookingProviderApi(id);
      return result.isOwner;
    } catch (error) {
      console.error('Error checking booking provider:', error);
      return false;
    }
  },

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  setFilters: (filters: Partial<BookingFilters>): void => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: filters.page || 1 },
    }));
  },

  setPage: (page: number): void => {
    set((state) => ({
      pagination: { ...state.pagination, page },
      filters: { ...state.filters, page },
    }));
  },

  clearSelected: (): void => {
    set({ selectedBooking: null });
  },

  clearError: (): void => {
    set({ error: null });
  },

  reset: (): void => {
    set({
      ...initialState,
      filters: {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    });
  },

  invalidateCache: (): void => {
    set({ lastFetchTime: null });
  },
}));

// ============================================================
// SELECTORS
// ============================================================

export const selectBookings = (state: BookingStore) => state.bookings;
export const selectSelectedBooking = (state: BookingStore) => state.selectedBooking;
export const selectStats = (state: BookingStore) => state.stats;
export const selectPagination = (state: BookingStore) => state.pagination;
export const selectFilters = (state: BookingStore) => state.filters;
export const selectIsLoading = (state: BookingStore) => state.isLoading;
export const selectIsSubmitting = (state: BookingStore) => state.isSubmitting;
export const selectError = (state: BookingStore) => state.error;
export const selectTotalBookings = (state: BookingStore) => state.pagination.totalItems;

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useBookingStore;
