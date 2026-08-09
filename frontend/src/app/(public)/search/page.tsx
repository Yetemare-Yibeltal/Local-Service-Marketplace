'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  StarIcon,
  CheckBadgeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// ============================================================
// TYPES
// ============================================================

interface Provider {
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

interface SearchResponse {
  data: Provider[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  facets?: {
    categories: Array<{ name: string; count: number }>;
    cities: Array<{ name: string; count: number }>;
    ratings: Array<{ rating: number; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
  };
}

interface SearchFilters {
  category?: string;
  subCategory?: string;
  minRating?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  sortBy?: 'relevance' | 'distance' | 'rating' | 'price' | 'experience';
}

interface Category {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
  icon: string | null;
  image: string | null;
}

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const DEFAULT_LAT = 9.03;
const DEFAULT_LNG = 38.74;

// ============================================================
// API FUNCTIONS
// ============================================================

async function searchProviders(
  query: string,
  filters: SearchFilters,
  page: number,
  limit: number,
  lat: number = DEFAULT_LAT,
  lng: number = DEFAULT_LNG
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${API_URL}/providers/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat,
        lng,
        radius: 20,
        query: query || undefined,
        category: filters.category,
        subCategory: filters.subCategory,
        minRating: filters.minRating,
        maxPrice: filters.maxPrice,
        isAvailable: filters.isAvailable !== undefined ? filters.isAvailable : true,
        isVerified: filters.isVerified,
        page,
        limit,
        sortBy: filters.sortBy || 'relevance',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to search providers');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error searching providers:', error);
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_URL}/categories/active`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Provider Card Component
 */
function ProviderCard({ provider }: { provider: Provider }) {
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Link
      href={`/provider/${provider.id}`}
      className="block bg-white rounded-xl shadow-card hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden border border-gray-100"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            {provider.businessLogo ? (
              <Image
                src={provider.businessLogo}
                alt={provider.businessName}
                width={60}
                height={60}
                className="rounded-full object-cover w-15 h-15"
              />
            ) : (
              <div className="w-15 h-15 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">
                  {getInitials(provider.businessName)}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {provider.businessName}
              </h3>
              {provider.isVerified && (
                <CheckBadgeIcon className="w-5 h-5 text-blue-500 flex-shrink-0" title="Verified Provider" />
              )}
            </div>
            <p className="text-sm text-gray-500">{provider.category}</p>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900">
                  {provider.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">
                  ({provider.totalReviews})
                </span>
              </div>

              {provider.hourlyRate && (
                <span className="text-sm text-gray-600">
                  ETB {provider.hourlyRate}/hr
                </span>
              )}

              <span className="text-xs text-gray-400">
                {provider.distance < 1
                  ? `${(provider.distance * 1000).toFixed(0)}m`
                  : `${provider.distance.toFixed(1)}km`}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {provider.isAvailable && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Available
                </span>
              )}
              {provider.yearsExperience > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {provider.yearsExperience}+ years
                </span>
              )}
              {provider.responseTime !== null && provider.responseTime < 60 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Fast Response
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Filter Sidebar Component
 */
function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  categories,
}: {
  filters: SearchFilters;
  onFilterChange: (key: keyof SearchFilters, value: any) => void;
  onClearFilters: () => void;
  categories: Category[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const filterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && v !== ''
  ).length;

  const hasActiveFilters = filterCount > 0;

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <FunnelIcon className="w-5 h-5 text-gray-600" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {filterCount}
          </span>
        )}
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-card p-6 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => onFilterChange('category', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <select
              value={filters.minRating || ''}
              onChange={(e) => onFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
            </select>
          </div>

          {/* Price Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Price (ETB/hr)
            </label>
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="No limit"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>

          {/* Sort By */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy || 'relevance'}
              onChange={(e) => onFilterChange('sortBy', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="distance">Distance</option>
              <option value="rating">Rating</option>
              <option value="price">Price (Low to High)</option>
              <option value="experience">Experience</option>
            </select>
          </div>

          {/* Availability Toggle */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Available Only</span>
            <button
              onClick={() => onFilterChange('isAvailable', filters.isAvailable === false ? true : false)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                filters.isAvailable !== false ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  filters.isAvailable !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Verified Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Verified Only</span>
            <button
              onClick={() => onFilterChange('isVerified', filters.isVerified === true ? undefined : true)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                filters.isVerified ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  filters.isVerified ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              {/* Same filter controls as desktop */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => onFilterChange('category', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating || ''}
                  onChange={(e) => onFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3.0">3.0+ Stars</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price (ETB/hr)
                </label>
                <input
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => onFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={(e) => onFilterChange('sortBy', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="distance">Distance</option>
                  <option value="rating">Rating</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="experience">Experience</option>
                </select>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Available Only</span>
                <button
                  onClick={() => onFilterChange('isAvailable', filters.isAvailable === false ? true : false)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    filters.isAvailable !== false ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      filters.isAvailable !== false ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Verified Only</span>
                <button
                  onClick={() => onFilterChange('isVerified', filters.isVerified === true ? undefined : true)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    filters.isVerified ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      filters.isVerified ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => {
                  onClearFilters();
                  setIsOpen(false);
                }}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
          {startPage > 2 && <span className="px-2">...</span>}
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
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
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

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Load categories on mount
  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  // Load search results
  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchProviders(
        searchQuery,
        filters,
        pagination.page,
        pagination.limit
      );
      setProviders(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, pagination.page, pagination.limit]);

  // Trigger search when dependencies change
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;

    setSearchQuery(query);
    if (category) {
      setFilters((prev) => ({ ...prev, category }));
    }

    performSearch();
  }, [searchParams, performSearch]);

  // Handlers
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
    router.push('/search');
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container-custom py-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            categories={categories}
          />

          {/* Results */}
          <div className="flex-1">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                {pagination.totalItems > 0
                  ? `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalItems
                    )} of ${pagination.totalItems} results`
                  : 'No results found'}
              </p>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-card p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-15 h-15 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-card">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No providers found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && providers.length > 0 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}