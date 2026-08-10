'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  StarIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  TrashIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
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
  provider: {
    id: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
  };
  booking: {
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
  summary: {
    totalReviews: number;
    averageRating: number;
    verifiedReviews: number;
    unverifiedReviews: number;
    ratingDistribution: Record<number, number>;
  };
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

async function getAdminReviews(
  page: number = 1,
  limit: number = 20,
  search?: string,
  rating?: number,
  minRating?: number,
  maxRating?: number,
  providerId?: string,
  reviewerId?: string,
  isVerified?: boolean,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (rating) params.append('rating', rating.toString());
  if (minRating) params.append('minRating', minRating.toString());
  if (maxRating) params.append('maxRating', maxRating.toString());
  if (providerId) params.append('providerId', providerId);
  if (reviewerId) params.append('reviewerId', reviewerId);
  if (isVerified !== undefined) params.append('isVerified', isVerified.toString());
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return await fetchWithAuth(`/admin/reviews?${params.toString()}`);
}

async function getReviewDetails(reviewId: string): Promise<Review> {
  return await fetchWithAuth(`/reviews/${reviewId}`);
}

async function verifyReview(reviewId: string, isVerified: boolean): Promise<Review> {
  return await fetchWithAuth(`/reviews/${reviewId}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ isVerified }),
  });
}

async function deleteReview(reviewId: string): Promise<void> {
  await fetchWithAuth(`/reviews/${reviewId}`, {
    method: 'DELETE',
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
        <StarSolidIcon key={i} className={`w-${size} h-${size} text-yellow-400`} />
      ))}
      {hasHalfStar && (
        <div className="relative w-4 h-4">
          <StarSolidIcon className="w-4 h-4 text-yellow-400 absolute left-0 top-0 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
          <StarSolidIcon className="w-4 h-4 text-gray-300 absolute left-0 top-0" style={{ clipPath: 'inset(0 0 0 50%)' }} />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarSolidIcon key={i} className={`w-${size} h-${size} text-gray-300`} />
      ))}
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ isVerified }: { isVerified: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isVerified
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800'
    }`}>
      {isVerified ? (
        <CheckCircleIcon className="w-3 h-3" />
      ) : (
        <ShieldCheckIcon className="w-3 h-3" />
      )}
      {isVerified ? 'Verified' : 'Pending'}
    </span>
  );
}

/**
 * Review Row Component
 */
function ReviewRow({
  review,
  onView,
  onVerify,
  onDelete,
}: {
  review: Review;
  onView: (review: Review) => void;
  onVerify: (review: Review) => void;
  onDelete: (review: Review) => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const createdAt = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleVerify = async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      await onVerify(review);
    } catch (error) {
      console.error('Error verifying review:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!confirm('Are you sure you want to delete this review?')) return;
    setDeleting(true);
    try {
      await onDelete(review);
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0 mt-0.5">
          {review.reviewer.profileImage ? (
            <Image
              src={review.reviewer.profileImage}
              alt={review.reviewer.fullName}
              width={32}
              height={32}
              className="rounded-full object-cover w-8 h-8"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-blue-600" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {review.reviewer.fullName}
            </span>
            <RatingStars rating={review.rating} size={4} />
            <span className="text-xs text-gray-400">({review.rating})</span>
            <StatusBadge isVerified={review.isVerified} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <BriefcaseIcon className="w-3.5 h-3.5" />
              {review.provider.businessName}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {createdAt}
            </span>
            <span className="flex items-center gap-1">
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
              {review.comment.length > 50 ? `${review.comment.slice(0, 50)}...` : review.comment}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
        <button
          onClick={() => onView(review)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
          title={review.isVerified ? 'Unverify' : 'Verify'}
        >
          {verifying ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : review.isVerified ? (
            <XCircleIcon className="w-4 h-4" />
          ) : (
            <CheckCircleIcon className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Delete Review"
        >
          {deleting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/**
 * Review Details Modal
 */
function ReviewDetailsModal({
  review,
  isOpen,
  onClose,
  onVerify,
  onDelete,
}: {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (review: Review) => void;
  onDelete: (review: Review) => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !review) return null;

  const createdAt = new Date(review.createdAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await onVerify(review);
      onClose();
    } catch (error) {
      alert('Failed to update verification status');
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    setDeleting(true);
    try {
      await onDelete(review);
      onClose();
    } catch (error) {
      alert('Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900">Review Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Reviewer */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {review.reviewer.profileImage ? (
                <Image
                  src={review.reviewer.profileImage}
                  alt={review.reviewer.fullName}
                  width={48}
                  height={48}
                  className="rounded-full object-cover w-12 h-12"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{review.reviewer.fullName}</p>
              <p className="text-sm text-gray-500">{review.reviewer.email}</p>
              <p className="text-sm text-gray-500">{review.reviewer.phone}</p>
            </div>
          </div>

          {/* Provider */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Provider</h4>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-shrink-0">
                {review.provider.businessLogo ? (
                  <Image
                    src={review.provider.businessLogo}
                    alt={review.provider.businessName}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover w-10 h-10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{review.provider.businessName}</p>
                <p className="text-sm text-gray-500">{review.provider.category}</p>
              </div>
            </div>
          </div>

          {/* Booking */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Booking</h4>
            <p className="text-sm text-gray-900">#{review.booking.bookingNumber}</p>
            <p className="text-sm text-gray-500">
              {new Date(review.booking.scheduledDate).toLocaleDateString()} · ETB {review.booking.totalPrice.toFixed(2)}
            </p>
          </div>

          {/* Rating & Comment */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Rating</h4>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars rating={review.rating} size={6} />
              <span className="text-sm font-medium text-gray-900">{review.rating}.0</span>
            </div>
            <h4 className="text-sm font-medium text-gray-700 mt-3">Comment</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">{review.comment}</p>
          </div>

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Images</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {review.images.map((img, idx) => (
                  <Image
                    key={idx}
                    src={img}
                    alt={`Review image ${idx + 1}`}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Provider Response */}
          {review.reviewResponses && review.reviewResponses.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Provider Response</h4>
              {review.reviewResponses.map((resp) => (
                <div key={resp.id} className="bg-gray-50 rounded-lg p-3 mt-1">
                  <p className="text-sm text-gray-700">{resp.response}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(resp.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Verification Status */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Verification Status</h4>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge isVerified={review.isVerified} />
              <span className="text-sm text-gray-500">
                {review.isVerified ? 'This review has been verified' : 'This review is pending verification'}
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400">
            Created: {createdAt}
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
              review.isVerified
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {verifying ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : null}
            {review.isVerified ? 'Unverify' : 'Verify'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : null}
            Delete
          </button>
        </div>
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

export default function AdminReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<{
    totalReviews: number;
    averageRating: number;
    verifiedReviews: number;
    unverifiedReviews: number;
    ratingDistribution: Record<number, number>;
  }>({
    totalReviews: 0,
    averageRating: 0,
    verifiedReviews: 0,
    unverifiedReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [ratingFilter, setRatingFilter] = useState(searchParams.get('rating') || '');
  const [verificationFilter, setVerificationFilter] = useState(searchParams.get('verified') || '');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: searchParams.get('startDate') || '',
    end: searchParams.get('endDate') || '',
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Modals
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load reviews
  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminReviews(
        page,
        limit,
        debouncedSearch || undefined,
        ratingFilter ? Number(ratingFilter) : undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        verificationFilter === 'true' ? true : verificationFilter === 'false' ? false : undefined,
        dateRange.start || undefined,
        dateRange.end || undefined
      );
      setReviews(response.data);
      setSummary(response.summary);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, ratingFilter, verificationFilter, dateRange]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (ratingFilter) params.set('rating', ratingFilter);
    if (verificationFilter) params.set('verified', verificationFilter);
    if (dateRange.start) params.set('startDate', dateRange.start);
    if (dateRange.end) params.set('endDate', dateRange.end);
    router.push(`/dashboard/admin/reviews?${params.toString()}`);
  }, [searchTerm, ratingFilter, verificationFilter, dateRange, router]);

  // Handlers
  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setShowDetailsModal(true);
  };

  const handleVerifyReview = async (review: Review) => {
    try {
      await verifyReview(review.id, !review.isVerified);
      await loadReviews();
    } catch (error) {
      alert('Failed to update verification status');
    }
  };

  const handleDeleteReview = async (review: Review) => {
    try {
      await deleteReview(review.id);
      await loadReviews();
    } catch (error) {
      alert('Failed to delete review');
    }
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setRatingFilter('');
    setVerificationFilter('');
    setDateRange({ start: '', end: '' });
    setPage(1);
  };

  const ratingOptions = [
    { value: '1', label: '1 Star' },
    { value: '2', label: '2 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '5', label: '5 Stars' },
  ];

  const verificationOptions = [
    { value: 'true', label: 'Verified' },
    { value: 'false', label: 'Pending' },
  ];

  const isFiltered = searchTerm || ratingFilter || verificationFilter || dateRange.start || dateRange.end;

  const ratingDistribution = summary.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
            <p className="text-gray-600 mt-0.5">
              {totalItems} review{totalItems !== 1 ? 's' : ''} found
            </p>
          </div>
          <button onClick={loadReviews} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
            <ArrowPathIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Summary Cards */}
        {!loading && totalItems > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.totalReviews}</p>
              <p className="text-xs text-gray-500">Total Reviews</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary.averageRating.toFixed(1)} ★</p>
              <p className="text-xs text-gray-500">Average Rating</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{summary.verifiedReviews}</p>
              <p className="text-xs text-gray-500">Verified</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary.unverifiedReviews}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        {!loading && totalItems > 0 && (
          <div className="bg-white rounded-xl shadow-card p-4 mb-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-700">{star}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{
                      width: `${summary.totalReviews > 0 ? (ratingDistribution[star] || 0) / summary.totalReviews * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{ratingDistribution[star] || 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reviewer or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <FilterDropdown
            options={ratingOptions}
            value={ratingFilter}
            onChange={setRatingFilter}
            placeholder="All Ratings"
          />
          <FilterDropdown
            options={verificationOptions}
            value={verificationFilter}
            onChange={setVerificationFilter}
            placeholder="All Verification"
          />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Start Date"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="End Date"
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {isFiltered
                    ? 'No reviews match your current filters. Try adjusting your search.'
                    : 'There are no reviews on the platform yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-7">Review</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                </div>
                <div className="px-6 divide-y divide-gray-100">
                  {reviews.map((review) => (
                    <ReviewRow
                      key={review.id}
                      review={review}
                      onView={handleViewReview}
                      onVerify={handleVerifyReview}
                      onDelete={handleDeleteReview}
                    />
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
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
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Details Modal */}
      <ReviewDetailsModal
        review={selectedReview}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedReview(null);
        }}
        onVerify={handleVerifyReview}
        onDelete={handleDeleteReview}
      />
    </div>
  );
}