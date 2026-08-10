'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  HeartIcon,
  HeartIcon as HeartSolidIcon,
  StarIcon,
  MapPinIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartSolidFilled } from '@heroicons/react/24/solid';

// ============================================================
// TYPES
// ============================================================

interface FavoriteProvider {
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

interface ApiResponse {
  data: FavoriteProvider[];
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

async function getFavoriteProviders(page: number = 1, limit: number = 10): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  return await fetchWithAuth(`/providers/favorites?${params.toString()}`);
}

async function removeFavorite(providerId: string): Promise<void> {
  await fetchWithAuth(`/providers/favorites/${providerId}`, {
    method: 'DELETE',
  });
}

async function addFavorite(providerId: string): Promise<void> {
  await fetchWithAuth(`/providers/favorites`, {
    method: 'POST',
    body: JSON.stringify({ providerId }),
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Favorite Provider Card Component
 */
function FavoriteProviderCard({
  favorite,
  onRemove,
  onView,
  onBook,
}: {
  favorite: FavoriteProvider;
  onRemove: (providerId: string) => void;
  onView: (providerId: string) => void;
  onBook: (providerId: string) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const { provider } = favorite;

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await onRemove(provider.id);
    } catch (error) {
      console.error('Error removing favorite:', error);
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Provider Logo */}
        <div className="flex-shrink-0">
          {provider.businessLogo ? (
            <Image
              src={provider.businessLogo}
              alt={provider.businessName}
              width={64}
              height={64}
              className="rounded-lg object-cover w-16 h-16"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
              <BriefcaseIcon className="w-8 h-8 text-blue-600" />
            </div>
          )}
        </div>

        {/* Provider Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/provider/${provider.id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-lg truncate"
            >
              {provider.businessName}
            </Link>
            {provider.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                <CheckBadgeIcon className="w-3 h-3" />
                Verified
              </span>
            )}
            {provider.isAvailable ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Available</span>
            ) : (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">Unavailable</span>
            )}
          </div>

          <p className="text-sm text-gray-500">{provider.category}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
            <div className="flex items-center gap-1">
              <StarSolidIcon className="w-4 h-4 text-yellow-400" />
              <span className="font-medium text-gray-900">{provider.averageRating.toFixed(1)}</span>
              <span className="text-gray-400 text-xs">({provider.totalReviews} reviews)</span>
            </div>
            {provider.hourlyRate && (
              <span className="text-gray-600">ETB {provider.hourlyRate}/hr</span>
            )}
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5" />
              {provider.city}
            </span>
            <span className="text-gray-400 text-xs">
              {provider.completedJobs} jobs · {provider.yearsExperience}+ years exp
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={() => onView(provider.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              View Profile
            </button>
            <button
              onClick={() => onBook(provider.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <CalendarIcon className="w-4 h-4" />
              Book Now
            </button>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-auto disabled:opacity-50"
            >
              {removing ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <TrashIcon className="w-4 h-4" />
              )}
              {removing ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow-card p-16 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
          <HeartIcon className="w-10 h-10 text-red-300" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Favorites Yet</h3>
      <p className="text-gray-600 max-w-md mx-auto mb-6">
        Start saving your favorite providers by clicking the heart icon on their profile page.
        Your saved providers will appear here for quick access.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
          Find Providers
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

/**
 * Pagination Component
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CustomerFavoritesPage() {
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFavoriteProviders(page, limit);
      setFavorites(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Handle remove favorite
  const handleRemoveFavorite = async (providerId: string) => {
    try {
      await removeFavorite(providerId);
      // Refresh list
      await loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove favorite. Please try again.');
    }
  };

  // Handle view provider
  const handleViewProvider = (providerId: string) => {
    router.push(`/provider/${providerId}`);
  };

  // Handle book
  const handleBookProvider = (providerId: string) => {
    router.push(`/booking?provider=${providerId}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Favorite Providers</h1>
            <p className="text-gray-600 mt-0.5">
              Your saved providers for quick access
              {totalItems > 0 && ` · ${totalItems} favorite${totalItems !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Find More
            </Link>
            <button
              onClick={loadFavorites}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Loading your favorites...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={loadFavorites}
              className="ml-auto text-sm text-red-700 hover:text-red-900 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Favorites List */}
        {!loading && !error && (
          <>
            {favorites.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="space-y-3">
                  {favorites.map((favorite) => (
                    <FavoriteProviderCard
                      key={favorite.id}
                      favorite={favorite}
                      onRemove={handleRemoveFavorite}
                      onView={handleViewProvider}
                      onBook={handleBookProvider}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}