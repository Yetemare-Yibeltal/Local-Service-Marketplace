'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  StarIcon,
  StarIcon as StarSolidIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';

// ============================================================
// TYPES
// ============================================================

interface Review {
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
  reviewer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  booking: {
    id: string;
    bookingNumber: string;
    scheduledDate: string;
    totalPrice: number;
  };
  reviewResponses: {
    id: string;
    response: string;
    createdAt: string;
  }[];
}

interface ReviewStats {
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

interface ApiResponse {
  data: Review[];
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
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// API FUNCTIONS
// ============================================================

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  const result = await response.json();
  return result.data;
}

async function getProviderReviews(
  page: number = 1,
  limit: number = 10,
  rating?: number,
  search?: string
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (rating) params.append('rating', rating.toString());
  if (search) params.append('search', search);

  return await fetchWithAuth(`/reviews/provider?${params.toString()}`);
}

async function addReviewResponse(reviewId: string, response: string): Promise<any> {
  return await fetchWithAuth(`/reviews/${reviewId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ response }),
  });
}

async function updateReviewResponse(responseId: string, response: string): Promise<any> {
  return await fetchWithAuth(`/reviews/responses/${responseId}`, {
    method: 'PUT',
    body: JSON.stringify({ response }),
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Rating Stars Component
 */
function RatingStars({ rating, size = 4 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <StarSolidIcon key={`full-${i}`} className={`w-${size} h-${size} text-yellow-400`} />
      ))}
      {hasHalfStar && (
        <div className="relative w-4 h-4">
          <StarSolidIcon className="w-4 h-4 text-yellow-400 absolute left-0 top-0 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
          <StarSolidIcon className="w-4 h-4 text-gray-300 absolute left-0 top-0" style={{ clipPath: 'inset(0 0 0 50%)' }} />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarSolidIcon key={`empty-${i}`} className={`w-${size} h-${size} text-gray-300`} />
      ))}
    </div>
  );
}

/**
 * Review Card Component
 */
function ReviewCard({
  review,
  onRespond,
}: {
  review: Review;
  onRespond: (reviewId: string) => void;
}) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasResponse = review.reviewResponses && review.reviewResponses.length > 0;
  const existingResponse = hasResponse ? review.reviewResponses[0] : null;

  const createdAt = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      setError('Please enter a response');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (hasResponse && existingResponse) {
        await updateReviewResponse(existingResponse.id, responseText);
      } else {
        await addReviewResponse(review.id, responseText);
      }
      setShowResponseForm(false);
      setResponseText('');
      onRespond(review.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Reviewer Avatar */}
        <div className="flex-shrink-0">
          {review.reviewer.profileImage ? (
            <Image
              src={review.reviewer.profileImage}
              alt={review.reviewer.fullName}
              width={44}
              height={44}
              className="rounded-full object-cover w-11 h-11"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
          )}
        </div>

        {/* Review Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900">{review.reviewer.fullName}</span>
            <RatingStars rating={review.rating} size={4} />
            <span className="text-xs text-gray-400">({review.rating})</span>
            {review.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                <CheckCircleIcon className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Booking #{review.booking.bookingNumber} • {createdAt}
          </p>
          <p className="text-gray-700 mt-2 leading-relaxed">{review.comment}</p>

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {review.images.slice(0, 3).map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  alt={`Review image ${idx + 1}`}
                  width={60}
                  height={60}
                  className="rounded-lg object-cover w-15 h-15 cursor-pointer hover:opacity-80 transition-opacity"
                />
              ))}
              {review.images.length > 3 && (
                <div className="w-15 h-15 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                  +{review.images.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Existing Response */}
          {hasResponse && existingResponse && (
            <div className="mt-3 pl-4 border-l-2 border-blue-300 bg-blue-50 rounded-r-lg p-3">
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span className="font-medium">Your Response:</span>
              </div>
              <p className="text-sm text-gray-700 mt-0.5">{existingResponse.response}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(existingResponse.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => {
                  setResponseText(existingResponse.response);
                  setShowResponseForm(true);
                }}
                className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit Response
              </button>
            </div>
          )}

          {/* Response Form */}
          {showResponseForm && (
            <div className="mt-3 space-y-3">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write your response to this review..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Submitting...' : 'Submit Response'}
                </button>
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseText('');
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Respond Button */}
          {!showResponseForm && !hasResponse && (
            <button
              onClick={() => setShowResponseForm(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Respond to Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Rating Distribution Bar Component
 */
function RatingDistribution({
  stats,
}: {
  stats: ReviewStats;
}) {
  const { averageRating, totalReviews, ratingDistribution } = stats;

  if (totalReviews === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Average */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
        <div>
          <RatingStars rating={averageRating} size={6} />
          <p className="text-sm text-gray-500">{totalReviews} reviews</p>
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star as keyof typeof ratingDistribution] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500 w-6">{star}★</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Filter Dropdown Component
 */
function FilterDropdown({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProviderReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [ratingFilter, setRatingFilter] = useState(searchParams.get('rating') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Load reviews
  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProviderReviews(
        page,
        limit,
        ratingFilter ? Number(ratingFilter) : undefined,
        debouncedSearch || undefined
      );
      setReviews(response.data);
      setStats(response.stats);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, limit, ratingFilter, debouncedSearch]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (ratingFilter) params.set('rating', ratingFilter);
    if (searchTerm) params.set('search', searchTerm);
    router.push(`/dashboard/provider/reviews?${params.toString()}`);
  }, [ratingFilter, searchTerm, router]);

  // Handle rating filter change
  const handleRatingChange = (value: string) => {
    setRatingFilter(value);
    setPage(1);
  };

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle response submitted
  const handleResponseSubmitted = (reviewId: string) => {
    loadReviews();
  };

  // Clear filters
  const clearFilters = () => {
    setRatingFilter('');
    setSearchTerm('');
    setPage(1);
  };

  const ratingOptions = [
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' },
  ];

  const isFiltered = ratingFilter || searchTerm;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
            <p className="text-gray-600 mt-0.5">
              {totalItems} review{totalItems !== 1 ? 's' : ''} from customers
            </p>
          </div>
          <button onClick={loadReviews} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
            <ArrowPathIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Stats and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Rating Distribution */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Rating Summary</h3>
              <RatingDistribution stats={stats} />
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-card p-4 mb-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[150px]">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <FilterDropdown
                options={ratingOptions}
                value={ratingFilter}
                onChange={handleRatingChange}
                placeholder="All Ratings"
              />
              {isFiltered && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="mt-2 text-gray-500">Loading reviews...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Reviews List */}
            {!loading && !error && (
              <>
                {reviews.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-card p-12 text-center">
                    <div className="text-6xl mb-4">⭐</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {isFiltered
                        ? 'No reviews match your current filters. Try adjusting your search.'
                        : 'You haven\'t received any reviews yet. Keep providing great service!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onRespond={handleResponseSubmitted}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      let p: number;
                      if (totalPages <= 7) {
                        p = i + 1;
                      } else if (page <= 4) {
                        p = i + 1;
                      } else if (page >= totalPages - 3) {
                        p = totalPages - 6 + i;
                      } else {
                        p = page - 3 + i;
                      }
                      if (p > totalPages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`px-4 py-2 rounded-lg border transition-colors min-w-[40px] ${
                            p === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    {totalPages > 7 && page < totalPages - 3 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    {totalPages > 7 && page < totalPages - 3 && (
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        {totalPages}
                      </button>
                    )}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link
            href="/dashboard/provider"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}