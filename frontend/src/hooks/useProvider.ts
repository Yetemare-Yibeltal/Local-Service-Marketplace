'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

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

export interface UpdateServiceData extends Partial<CreateServiceData> {
  isActive?: boolean;
}

export interface ProviderSearchData {
  lat: number;
  lng: number;
  radius?: number;
  query?: string;
  category?: string;
  subCategory?: string;
  minRating?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'distance' | 'rating' | 'price' | 'experience';
}

export interface ProviderStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  responseTime: number | null;
  completionRate: number;
}

export interface ProviderDashboard {
  profile: ProviderProfile;
  stats: ProviderStats;
  recentServices: Service[];
}

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// HOOK
// ============================================================

export function useProvider() {
  const { getToken, user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [dashboard, setDashboard] = useState<ProviderDashboard | null>(null);

  // Helper to make authenticated requests
  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      router.push('/login');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Request failed');
    }

    const result = await response.json();
    return result.data;
  }, [getToken, router]);

  // Get provider profile
  const getProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth('/providers/profile');
      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      showToast(error || 'Failed to load profile', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Update provider profile
  const updateProfile = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/providers/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const result = await response.json();
      const updatedProfile = result.data;
      setProfile(updatedProfile);
      showToast('Profile updated successfully!', 'success');
      return updatedProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      showToast(error || 'Failed to update profile', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken, showToast]);

  // Get provider dashboard
  const getDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth('/providers/dashboard');
      setDashboard(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      showToast(error || 'Failed to load dashboard', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Get provider services
  const getServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth('/providers/services');
      setServices(data || []);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
      showToast(error || 'Failed to load services', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Get service by ID
  const getServiceById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth(`/providers/services/${id}`);
      setSelectedService(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service');
      showToast(error || 'Failed to load service', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Create service
  const createService = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/providers/services`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create service');
      }

      const result = await response.json();
      const newService = result.data;
      setServices(prev => [...prev, newService]);
      showToast('Service created successfully!', 'success');
      return newService;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
      showToast(error || 'Failed to create service', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken, showToast]);

  // Update service
  const updateService = useCallback(async (id: string, formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/providers/services/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update service');
      }

      const result = await response.json();
      const updatedService = result.data;
      setServices(prev => prev.map(s => s.id === id ? updatedService : s));
      if (selectedService?.id === id) {
        setSelectedService(updatedService);
      }
      showToast('Service updated successfully!', 'success');
      return updatedService;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
      showToast(error || 'Failed to update service', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken, showToast, selectedService]);

  // Delete service
  const deleteService = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await fetchWithAuth(`/providers/services/${id}`, {
        method: 'DELETE',
      });

      setServices(prev => prev.filter(s => s.id !== id));
      if (selectedService?.id === id) {
        setSelectedService(null);
      }
      showToast('Service deleted successfully', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
      showToast(error || 'Failed to delete service', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast, selectedService]);

  // Toggle service active status
  const toggleServiceStatus = useCallback(async (id: string, isActive: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth(`/providers/services/${id}/toggle-status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });

      setServices(prev => prev.map(s => s.id === id ? { ...s, isActive } : s));
      if (selectedService?.id === id) {
        setSelectedService({ ...selectedService, isActive });
      }
      showToast(`Service ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle service status');
      showToast(error || 'Failed to toggle service status', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast, selectedService]);

  // Update availability
  const updateAvailability = useCallback(async (isAvailable: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth('/providers/availability', {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable }),
      });

      setProfile(prev => prev ? { ...prev, isAvailable } : null);
      showToast(`Availability updated to ${isAvailable ? 'Available' : 'Unavailable'}`, 'success');
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability');
      showToast(error || 'Failed to update availability', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Update working hours
  const updateWorkingHours = useCallback(async (workingHours: Record<string, { start: string; end: string }>) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth('/providers/working-hours', {
        method: 'PUT',
        body: JSON.stringify({ workingHours }),
      });

      setProfile(prev => prev ? { ...prev, workingHours } : null);
      showToast('Working hours updated successfully!', 'success');
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update working hours');
      showToast(error || 'Failed to update working hours', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Get provider stats
  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth('/bookings/provider/stats');
      setStats(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      showToast(error || 'Failed to load stats', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Check if user is a provider
  const isProvider = useCallback(() => {
    return user?.role === 'PROVIDER';
  }, [user]);

  // Check if user has a provider profile
  const hasProfile = useCallback(() => {
    return !!profile;
  }, [profile]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset provider state
  const reset = useCallback(() => {
    setProfile(null);
    setServices([]);
    setSelectedService(null);
    setStats(null);
    setDashboard(null);
    setError(null);
  }, []);

  return {
    // State
    profile,
    services,
    selectedService,
    stats,
    dashboard,
    loading,
    error,

    // Profile operations
    getProfile,
    updateProfile,
    getDashboard,

    // Service operations
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,

    // Availability operations
    updateAvailability,
    updateWorkingHours,

    // Stats
    getStats,

    // Helpers
    isProvider,
    hasProfile,
    clearError,
    reset,
  };
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useProvider;