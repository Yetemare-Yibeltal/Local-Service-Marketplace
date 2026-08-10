'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getProviderProfile as getProviderProfileApi,
  getProviderById as getProviderByIdApi,
  updateProviderProfile as updateProviderProfileApi,
  getProviderDashboard as getProviderDashboardApi,
  getProviderServices as getProviderServicesApi,
  getServiceById as getServiceByIdApi,
  createService as createServiceApi,
  updateService as updateServiceApi,
  deleteService as deleteServiceApi,
  toggleServiceStatus as toggleServiceStatusApi,
  updateAvailability as updateAvailabilityApi,
  updateWorkingHours as updateWorkingHoursApi,
  getFavoriteProviders as getFavoriteProvidersApi,
  addFavorite as addFavoriteApi,
  removeFavorite as removeFavoriteApi,
  isProviderFavorited as isProviderFavoritedApi,
  getFavoriteCount as getFavoriteCountApi,
  getVerificationStatus as getVerificationStatusApi,
} from '../api/providers';

// ============================================================
// TYPES
// ============================================================

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  businessLogo: string | null;
  description: string;
  category: string;
  subCategory: string | null;
  yearsExperience: number;
  hourlyRate: number | null;
  isAvailable: boolean;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  locationLat: number;
  locationLng: number;
  address: string;
  city: string;
  subCity: string | null;
  workingHours: any;
  completedJobs: number;
  responseTime: number | null;
  isFeatured: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationDate: string | null;
  verificationNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  services?: Service[];
}

export interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  priceType: 'FIXED' | 'HOURLY';
  price: number;
  discountPrice: number | null;
  estimatedDurationMinutes: number | null;
  isActive: boolean;
  images: string[];
  category: string;
  subCategory: string | null;
  createdAt: string;
  updatedAt: string;
  bookingsCount?: number;
  revenue?: number;
}

export interface CreateServiceData {
  title: string;
  description: string;
  priceType: 'FIXED' | 'HOURLY';
  price: number;
  discountPrice?: number;
  estimatedDurationMinutes?: number;
  category: string;
  subCategory?: string;
  images?: File[];
}

export interface UpdateServiceData {
  title?: string;
  description?: string;
  priceType?: 'FIXED' | 'HOURLY';
  price?: number;
  discountPrice?: number;
  estimatedDurationMinutes?: number;
  category?: string;
  subCategory?: string;
  isActive?: boolean;
  images?: File[];
}

export interface FavoriteProvider {
  id: string;
  providerId: string;
  customerId: string;
  createdAt: string;
  provider: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    subCategory: string | null;
    averageRating: number;
    totalReviews: number;
    isVerified: boolean;
    isAvailable: boolean;
    locationLat: number;
    locationLng: number;
    address: string;
    city: string;
    hourlyRate: number | null;
    completedJobs: number;
    yearsExperience: number;
    responseTime: number | null;
  };
}

export interface ProviderDashboard {
  profile: ProviderProfile;
  stats: {
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
    responseTime: number | null;
    completionRate: number;
  };
  recentServices: Service[];
}

export interface ProviderState {
  // Profile
  profile: ProviderProfile | null;
  isProfileLoading: boolean;

  // Services
  services: Service[];
  selectedService: Service | null;
  isServicesLoading: boolean;

  // Favorites
  favorites: FavoriteProvider[];
  favoriteCount: number;
  isFavoritesLoading: boolean;

  // Dashboard
  dashboard: ProviderDashboard | null;
  isDashboardLoading: boolean;

  // Verification
  verificationStatus: {
    isVerified: boolean;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    verificationDate: string | null;
    verificationNotes: string | null;
  } | null;

  // UI State
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export interface ProviderActions {
  // Profile Operations
  getProfile: () => Promise<ProviderProfile | null>;
  getProfileById: (id: string) => Promise<ProviderProfile | null>;
  updateProfile: (formData: FormData) => Promise<ProviderProfile>;

  // Service Operations
  getServices: () => Promise<Service[]>;
  getServiceById: (id: string) => Promise<Service | null>;
  createService: (formData: FormData) => Promise<Service>;
  updateService: (id: string, formData: FormData) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceStatus: (id: string, isActive: boolean) => Promise<Service>;

  // Availability Operations
  updateAvailability: (isAvailable: boolean) => Promise<ProviderProfile>;
  updateWorkingHours: (
    workingHours: Record<string, { start: string; end: string }>
  ) => Promise<ProviderProfile>;

  // Dashboard Operations
  getDashboard: () => Promise<ProviderDashboard | null>;

  // Favorite Operations
  getFavorites: () => Promise<FavoriteProvider[]>;
  addFavorite: (providerId: string) => Promise<void>;
  removeFavorite: (providerId: string) => Promise<void>;
  isFavorited: (providerId: string) => Promise<boolean>;
  getFavoriteCount: () => Promise<number>;

  // Verification
  getVerificationStatus: () => Promise<{
    isVerified: boolean;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    verificationDate: string | null;
    verificationNotes: string | null;
  } | null>;

  // State Management
  setProfile: (profile: ProviderProfile | null) => void;
  clearServices: () => void;
  clearSelectedService: () => void;
  clearError: () => void;
  reset: () => void;
}

export type ProviderStore = ProviderState & ProviderActions;

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: ProviderState = {
  profile: null,
  isProfileLoading: false,

  services: [],
  selectedService: null,
  isServicesLoading: false,

  favorites: [],
  favoriteCount: 0,
  isFavoritesLoading: false,

  dashboard: null,
  isDashboardLoading: false,

  verificationStatus: null,

  isLoading: false,
  isSubmitting: false,
  error: null,
};

// ============================================================
// STORE
// ============================================================

export const useProviderStore = create<ProviderStore>()((set, get) => ({
  ...initialState,

  // ============================================================
  // PROFILE OPERATIONS
  // ============================================================

  getProfile: async (): Promise<ProviderProfile | null> => {
    set({ isProfileLoading: true, error: null });

    try {
      const profile = await getProviderProfileApi();
      set({
        profile,
        isProfileLoading: false,
        error: null,
      });
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
      set({ isProfileLoading: false, error: errorMessage });
      return null;
    }
  },

  getProfileById: async (id: string): Promise<ProviderProfile | null> => {
    set({ isLoading: true, error: null });

    try {
      const profile = await getProviderByIdApi(id);
      set({ isLoading: false, error: null });
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch provider';
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },

  updateProfile: async (formData: FormData): Promise<ProviderProfile> => {
    set({ isSubmitting: true, error: null });

    try {
      const profile = await updateProviderProfileApi(formData);
      set({
        profile,
        isSubmitting: false,
        error: null,
      });
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  // ============================================================
  // SERVICE OPERATIONS
  // ============================================================

  getServices: async (): Promise<Service[]> => {
    set({ isServicesLoading: true, error: null });

    try {
      const services = await getProviderServicesApi();
      set({
        services,
        isServicesLoading: false,
        error: null,
      });
      return services;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch services';
      set({ isServicesLoading: false, error: errorMessage });
      return [];
    }
  },

  getServiceById: async (id: string): Promise<Service | null> => {
    set({ isLoading: true, error: null });

    try {
      const service = await getServiceByIdApi(id);
      set({
        selectedService: service,
        isLoading: false,
        error: null,
      });
      return service;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch service';
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },

  createService: async (formData: FormData): Promise<Service> => {
    set({ isSubmitting: true, error: null });

    try {
      const service = await createServiceApi(formData);
      set((state) => ({
        services: [service, ...state.services],
        isSubmitting: false,
        error: null,
      }));
      return service;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create service';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  updateService: async (id: string, formData: FormData): Promise<Service> => {
    set({ isSubmitting: true, error: null });

    try {
      const service = await updateServiceApi(id, formData);
      set((state) => ({
        services: state.services.map((s) => (s.id === id ? service : s)),
        selectedService: state.selectedService?.id === id ? service : state.selectedService,
        isSubmitting: false,
        error: null,
      }));
      return service;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update service';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  deleteService: async (id: string): Promise<void> => {
    set({ isSubmitting: true, error: null });

    try {
      await deleteServiceApi(id);
      set((state) => ({
        services: state.services.filter((s) => s.id !== id),
        selectedService: state.selectedService?.id === id ? null : state.selectedService,
        isSubmitting: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete service';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  toggleServiceStatus: async (id: string, isActive: boolean): Promise<Service> => {
    set({ isSubmitting: true, error: null });

    try {
      const service = await toggleServiceStatusApi(id, isActive);
      set((state) => ({
        services: state.services.map((s) => (s.id === id ? service : s)),
        selectedService: state.selectedService?.id === id ? service : state.selectedService,
        isSubmitting: false,
        error: null,
      }));
      return service;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to toggle service status';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  // ============================================================
  // AVAILABILITY OPERATIONS
  // ============================================================

  updateAvailability: async (isAvailable: boolean): Promise<ProviderProfile> => {
    set({ isSubmitting: true, error: null });

    try {
      const profile = await updateAvailabilityApi(isAvailable);
      set({
        profile,
        isSubmitting: false,
        error: null,
      });
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update availability';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  updateWorkingHours: async (
    workingHours: Record<string, { start: string; end: string }>
  ): Promise<ProviderProfile> => {
    set({ isSubmitting: true, error: null });

    try {
      const profile = await updateWorkingHoursApi(workingHours);
      set({
        profile,
        isSubmitting: false,
        error: null,
      });
      return profile;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update working hours';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  // ============================================================
  // DASHBOARD OPERATIONS
  // ============================================================

  getDashboard: async (): Promise<ProviderDashboard | null> => {
    set({ isDashboardLoading: true, error: null });

    try {
      const dashboard = await getProviderDashboardApi();
      set({
        dashboard,
        isDashboardLoading: false,
        error: null,
      });
      return dashboard;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard';
      set({ isDashboardLoading: false, error: errorMessage });
      return null;
    }
  },

  // ============================================================
  // FAVORITE OPERATIONS
  // ============================================================

  getFavorites: async (): Promise<FavoriteProvider[]> => {
    set({ isFavoritesLoading: true, error: null });

    try {
      const response = await getFavoriteProvidersApi(1, 100);
      set({
        favorites: response.data,
        favoriteCount: response.pagination.totalItems,
        isFavoritesLoading: false,
        error: null,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch favorites';
      set({ isFavoritesLoading: false, error: errorMessage });
      return [];
    }
  },

  addFavorite: async (providerId: string): Promise<void> => {
    set({ isSubmitting: true, error: null });

    try {
      await addFavoriteApi(providerId);
      set((state) => ({
        favoriteCount: state.favoriteCount + 1,
        isSubmitting: false,
        error: null,
      }));
      // Refresh favorites list
      await get().getFavorites();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add favorite';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  removeFavorite: async (providerId: string): Promise<void> => {
    set({ isSubmitting: true, error: null });

    try {
      await removeFavoriteApi(providerId);
      set((state) => ({
        favorites: state.favorites.filter((f) => f.providerId !== providerId),
        favoriteCount: state.favoriteCount - 1,
        isSubmitting: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove favorite';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  isFavorited: async (providerId: string): Promise<boolean> => {
    try {
      const result = await isProviderFavoritedApi(providerId);
      return result.isFavorited;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  },

  getFavoriteCount: async (): Promise<number> => {
    try {
      const result = await getFavoriteCountApi();
      set({ favoriteCount: result.total });
      return result.total;
    } catch (error) {
      console.error('Error fetching favorite count:', error);
      return 0;
    }
  },

  // ============================================================
  // VERIFICATION
  // ============================================================

  getVerificationStatus: async (): Promise<{
    isVerified: boolean;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    verificationDate: string | null;
    verificationNotes: string | null;
  } | null> => {
    set({ isLoading: true, error: null });

    try {
      const status = await getVerificationStatusApi();
      set({
        verificationStatus: status,
        isLoading: false,
        error: null,
      });
      return status;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch verification status';
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  setProfile: (profile: ProviderProfile | null): void => {
    set({ profile });
  },

  clearServices: (): void => {
    set({ services: [] });
  },

  clearSelectedService: (): void => {
    set({ selectedService: null });
  },

  clearError: (): void => {
    set({ error: null });
  },

  reset: (): void => {
    set({
      ...initialState,
    });
  },
}));

// ============================================================
// SELECTORS
// ============================================================

export const selectProviderProfile = (state: ProviderStore) => state.profile;
export const selectProviderServices = (state: ProviderStore) => state.services;
export const selectSelectedService = (state: ProviderStore) => state.selectedService;
export const selectProviderFavorites = (state: ProviderStore) => state.favorites;
export const selectFavoriteCount = (state: ProviderStore) => state.favoriteCount;
export const selectProviderDashboard = (state: ProviderStore) => state.dashboard;
export const selectVerificationStatus = (state: ProviderStore) => state.verificationStatus;
export const selectIsProviderLoading = (state: ProviderStore) => state.isLoading;
export const selectIsProviderSubmitting = (state: ProviderStore) => state.isSubmitting;
export const selectProviderError = (state: ProviderStore) => state.error;
export const selectIsProfileLoading = (state: ProviderStore) => state.isProfileLoading;
export const selectIsServicesLoading = (state: ProviderStore) => state.isServicesLoading;
export const selectIsFavoritesLoading = (state: ProviderStore) => state.isFavoritesLoading;
export const selectIsDashboardLoading = (state: ProviderStore) => state.isDashboardLoading;

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useProviderStore;
