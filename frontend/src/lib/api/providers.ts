'use client';

import { getApiClient } from './client';

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

export interface ProviderSearchResult {
  id: string;
  userId: string;
  businessName: string;
  businessLogo: string | null;
  category: string;
  subCategory: string | null;
  averageRating: number;
  totalReviews: number;
  hourlyRate: number | null;
  isAvailable: boolean;
  isVerified: boolean;
  distance: number;
  address: string;
  city: string;
  subCity: string | null;
  locationLat: number;
  locationLng: number;
  completedJobs: number;
  responseTime: number | null;
  yearsExperience: number;
}

export interface ProviderSearchResponse {
  data: ProviderSearchResult[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  facets?: {
    categories: { name: string; count: number }[];
    cities: { name: string; count: number }[];
    ratings: { rating: number; count: number }[];
    priceRanges: { range: string; count: number }[];
  };
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

export interface WorkingHours {
  [day: string]: {
    start: string;
    end: string;
  };
}

export interface AvailabilityUpdateData {
  isAvailable: boolean;
}

// ============================================================
// API FUNCTIONS
// ============================================================

// ============================================================
// PROVIDER PROFILE
// ============================================================

/**
 * Get provider profile (authenticated provider)
 */
export async function getProviderProfile(): Promise<ProviderProfile> {
  const client = getApiClient();
  return await client.get('/providers/profile');
}

/**
 * Get provider profile by ID (public)
 */
export async function getProviderById(id: string): Promise<ProviderProfile> {
  const client = getApiClient();
  return await client.get(`/providers/${id}`);
}

/**
 * Update provider profile
 */
export async function updateProviderProfile(formData: FormData): Promise<ProviderProfile> {
  const client = getApiClient();
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/providers/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get provider dashboard
 */
export async function getProviderDashboard(): Promise<{
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
}> {
  const client = getApiClient();
  return await client.get('/providers/dashboard');
}

// ============================================================
// SERVICES
// ============================================================

/**
 * Get provider services
 */
export async function getProviderServices(): Promise<Service[]> {
  const client = getApiClient();
  return await client.get('/providers/services');
}

/**
 * Get service by ID
 */
export async function getServiceById(id: string): Promise<Service> {
  const client = getApiClient();
  return await client.get(`/providers/services/${id}`);
}

/**
 * Create service
 */
export async function createService(formData: FormData): Promise<Service> {
  const client = getApiClient();
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/providers/services`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create service');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update service
 */
export async function updateService(id: string, formData: FormData): Promise<Service> {
  const client = getApiClient();
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/providers/services/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update service');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete service
 */
export async function deleteService(id: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/providers/services/${id}`);
}

/**
 * Toggle service active status
 */
export async function toggleServiceStatus(id: string, isActive: boolean): Promise<Service> {
  const client = getApiClient();
  return await client.patch(`/providers/services/${id}/toggle-status`, { isActive });
}

// ============================================================
// AVAILABILITY
// ============================================================

/**
 * Update provider availability
 */
export async function updateAvailability(isAvailable: boolean): Promise<ProviderProfile> {
  const client = getApiClient();
  return await client.patch('/providers/availability', { isAvailable });
}

/**
 * Update working hours
 */
export async function updateWorkingHours(workingHours: WorkingHours): Promise<ProviderProfile> {
  const client = getApiClient();
  return await client.put('/providers/working-hours', { workingHours });
}

// ============================================================
// SEARCH
// ============================================================

/**
 * Search providers by location with filters
 */
export async function searchProviders(data: ProviderSearchData): Promise<ProviderSearchResponse> {
  const client = getApiClient();
  return await client.post<ProviderSearchResponse>('/providers/search', {
    lat: data.lat,
    lng: data.lng,
    radius: data.radius || 10,
    query: data.query,
    category: data.category,
    subCategory: data.subCategory,
    minRating: data.minRating,
    maxPrice: data.maxPrice,
    isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
    isVerified: data.isVerified,
    page: data.page || 1,
    limit: data.limit || 20,
    sortBy: data.sortBy || 'relevance',
  });
}

/**
 * Get provider list with filters
 */
export async function getProviderList(
  filters: {
    category?: string;
    city?: string;
    minRating?: number;
    isAvailable?: boolean;
    isVerified?: boolean;
    isFeatured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{
  data: ProviderProfile[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const client = getApiClient();
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.city) params.append('city', filters.city);
  if (filters.minRating) params.append('minRating', filters.minRating.toString());
  if (filters.isAvailable !== undefined)
    params.append('isAvailable', filters.isAvailable.toString());
  if (filters.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString());
  if (filters.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured.toString());
  if (filters.search) params.append('search', filters.search);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 20).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  return await client.get(`/providers?${params.toString()}`);
}

/**
 * Get top rated providers
 */
export async function getTopRatedProviders(
  category?: string,
  limit: number = 10
): Promise<ProviderProfile[]> {
  const client = getApiClient();
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  params.append('limit', limit.toString());
  return await client.get(`/providers/top-rated?${params.toString()}`);
}

/**
 * Get featured providers
 */
export async function getFeaturedProviders(limit: number = 10): Promise<ProviderProfile[]> {
  const client = getApiClient();
  return await client.get(`/providers/featured?limit=${limit}`);
}

/**
 * Get recent providers
 */
export async function getRecentProviders(limit: number = 10): Promise<ProviderProfile[]> {
  const client = getApiClient();
  return await client.get(`/providers/recent?limit=${limit}`);
}

/**
 * Get provider category suggestions
 */
export async function getCategorySuggestions(
  search: string,
  limit: number = 10
): Promise<string[]> {
  const client = getApiClient();
  return await client.get(
    `/providers/category-suggestions?search=${encodeURIComponent(search)}&limit=${limit}`
  );
}

// ============================================================
// FAVORITES
// ============================================================

/**
 * Get favorite providers
 */
export async function getFavoriteProviders(
  page: number = 1,
  limit: number = 10
): Promise<{
  data: FavoriteProvider[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const client = getApiClient();
  return await client.get(`/providers/favorites?page=${page}&limit=${limit}`);
}

/**
 * Add provider to favorites
 */
export async function addFavorite(providerId: string): Promise<{ success: boolean }> {
  const client = getApiClient();
  return await client.post('/providers/favorites', { providerId });
}

/**
 * Remove provider from favorites
 */
export async function removeFavorite(providerId: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/providers/favorites/${providerId}`);
}

/**
 * Check if provider is favorited
 */
export async function isProviderFavorited(providerId: string): Promise<{ isFavorited: boolean }> {
  const client = getApiClient();
  return await client.get(`/providers/favorites/check/${providerId}`);
}

/**
 * Get favorite count
 */
export async function getFavoriteCount(): Promise<{ total: number }> {
  const client = getApiClient();
  return await client.get('/providers/favorites/count');
}

// ============================================================
// VERIFICATION
// ============================================================

/**
 * Get provider verification status
 */
export async function getVerificationStatus(): Promise<{
  isVerified: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationDate: string | null;
  verificationNotes: string | null;
}> {
  const client = getApiClient();
  return await client.get('/providers/verification-status');
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  // Profile
  getProviderProfile,
  getProviderById,
  updateProviderProfile,
  getProviderDashboard,

  // Services
  getProviderServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,

  // Availability
  updateAvailability,
  updateWorkingHours,

  // Search
  searchProviders,
  getProviderList,
  getTopRatedProviders,
  getFeaturedProviders,
  getRecentProviders,
  getCategorySuggestions,

  // Favorites
  getFavoriteProviders,
  addFavorite,
  removeFavorite,
  isProviderFavorited,
  getFavoriteCount,

  // Verification
  getVerificationStatus,
};
