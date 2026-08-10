'use client';

import { getApiClient } from './client';

// ============================================================
// TYPES
// ============================================================

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string;
  images: string[];
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  provider?: {
    id: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    averageRating: number;
    totalReviews: number;
  };
  booking?: {
    id: string;
    bookingNumber: string;
    scheduledDate: string;
    totalPrice: number;
  };
  reviewResponses?: {
    id: string;
    response: string;
    createdAt: string;
  }[];
}

export interface CreateReviewData {
  bookingId: string;
  rating: number;
  comment: string;
  images?: string[];
  isPublic?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  images?: string[];
  isPublic?: boolean;
}

export interface ReviewResponseData {
  response: string;
}

export interface ReviewFilters {
  providerId?: string;
  reviewerId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
  isVerified?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewWithStats extends Review {
  stats?: ReviewStats;
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
  stats: ReviewStats;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Create a new review (customer only)
 */
export async function createReview(data: CreateReviewData): Promise<Review> {
  const client = getApiClient();
  const response = await client.post<{ data: Review }>('/reviews', {
    bookingId: data.bookingId,
    rating: data.rating,
    comment: data.comment,
    images: data.images || [],
    isPublic: data.isPublic !== undefined ? data.isPublic : true,
  });
  return response.data;
}

/**
 * Get review by ID
 */
export async function getReviewById(id: string): Promise<Review> {
  const client = getApiClient();
  const response = await client.get<{ data: Review }>(`/reviews/${id}`);
  return response.data;
}

/**
 * Get review by booking ID
 */
export async function getReviewByBookingId(bookingId: string): Promise<Review | null> {
  const client = getApiClient();
  try {
    const response = await client.get<{ data: Review }>(`/reviews/booking/${bookingId}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Get reviews for a provider
 */
export async function getProviderReviews(
  providerId: string,
  filters: {
    rating?: number;
    minRating?: number;
    maxRating?: number;
    isPublic?: boolean;
    isVerified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<PaginatedResponse<Review>> {
  const client = getApiClient();
  const params = new URLSearchParams();

  if (filters.rating) params.append('rating', filters.rating.toString());
  if (filters.minRating) params.append('minRating', filters.minRating.toString());
  if (filters.maxRating) params.append('maxRating', filters.maxRating.toString());
  if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
  if (filters.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString());
  if (filters.search) params.append('search', filters.search);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 10).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await client.get<{
    data: Review[];
    pagination: any;
    stats: ReviewStats;
  }>(`/reviews/provider/${providerId}?${params.toString()}`);

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
    stats: response.stats || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
  };
}

/**
 * Get reviews by reviewer (authenticated user)
 */
export async function getMyReviews(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Review>> {
  const client = getApiClient();
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await client.get<{
    data: Review[];
    pagination: any;
  }>(`/reviews/my-reviews?${params.toString()}`);

  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    stats: {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
  };
}

/**
 * Update review (reviewer only)
 */
export async function updateReview(id: string, data: UpdateReviewData): Promise<Review> {
  const client = getApiClient();
  const response = await client.put<{ data: Review }>(`/reviews/${id}`, {
    rating: data.rating,
    comment: data.comment,
    images: data.images,
    isPublic: data.isPublic,
  });
  return response.data;
}

/**
 * Delete review (reviewer or admin only)
 */
export async function deleteReview(id: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/reviews/${id}`);
}

/**
 * Verify review (admin only)
 */
export async function verifyReview(id: string, isVerified: boolean): Promise<Review> {
  const client = getApiClient();
  const response = await client.patch<{ data: Review }>(`/reviews/${id}/verify`, { isVerified });
  return response.data;
}

/**
 * Add response to review (provider only)
 */
export async function addReviewResponse(id: string, response: string): Promise<Review> {
  const client = getApiClient();
  const data = await client.post<{ data: Review }>(`/reviews/${id}/respond`, { response });
  return data.data;
}

/**
 * Update review response (provider only)
 */
export async function updateReviewResponse(reviewId: string, response: string): Promise<Review> {
  const client = getApiClient();
  const data = await client.put<{ data: Review }>(`/reviews/${reviewId}/response`, { response });
  return data.data;
}

/**
 * Delete review response (provider only)
 */
export async function deleteReviewResponse(reviewId: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/reviews/${reviewId}/response`);
}

/**
 * Get provider rating statistics
 */
export async function getProviderRatingStats(providerId: string): Promise<ReviewStats> {
  const client = getApiClient();
  const response = await client.get<{ data: ReviewStats }>(`/reviews/provider/${providerId}/stats`);
  return response.data;
}

/**
 * Get all reviews (admin only)
 */
export async function getAdminReviews(
  filters: ReviewFilters = {}
): Promise<PaginatedResponse<Review>> {
  const client = getApiClient();
  const params = new URLSearchParams();

  if (filters.providerId) params.append('providerId', filters.providerId);
  if (filters.reviewerId) params.append('reviewerId', filters.reviewerId);
  if (filters.rating) params.append('rating', filters.rating.toString());
  if (filters.minRating) params.append('minRating', filters.minRating.toString());
  if (filters.maxRating) params.append('maxRating', filters.maxRating.toString());
  if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
  if (filters.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 20).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await client.get<{
    data: Review[];
    pagination: any;
    stats: ReviewStats;
  }>(`/admin/reviews?${params.toString()}`);

  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    stats: response.stats || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
  };
}

/**
 * Check if review exists
 */
export async function reviewExists(id: string): Promise<{ exists: boolean }> {
  const client = getApiClient();
  return await client.get<{ exists: boolean }>(`/reviews/${id}/exists`);
}

/**
 * Check if booking has a review
 */
export async function bookingHasReview(bookingId: string): Promise<{ hasReview: boolean }> {
  const client = getApiClient();
  return await client.get<{ hasReview: boolean }>(`/reviews/booking/${bookingId}/has-review`);
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  createReview,
  getReviewById,
  getReviewByBookingId,
  getProviderReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  verifyReview,
  addReviewResponse,
  updateReviewResponse,
  deleteReviewResponse,
  getProviderRatingStats,
  getAdminReviews,
  reviewExists,
  bookingHasReview,
}; 
