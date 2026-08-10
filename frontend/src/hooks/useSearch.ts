'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from './useDebounce';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

// ============================================================
// TYPES
// ============================================================

export interface SearchFilters {
  category?: string;
  subCategory?: string;
  city?: string;
  minRating?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  minExperience?: number;
  maxExperience?: number;
  sortBy?: 'relevance' | 'distance' | 'rating' | 'price' | 'experience';
}

export interface SearchData {
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

export interface SearchResult {
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

export interface FacetResult {
  categories: Array<{ name: string; count: number }>;
  cities: Array<{ name: string; count: number }>;
  ratings: Array<{ rating: number; count: number }>;
  priceRanges: Array<{ range: string; count: number }>;
}

export interface SearchResponse {
  data: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  facets?: FacetResult;
}

export interface AutocompleteResult {
  id: string;
  businessName: string;
  category: string;
  city: string;
  averageRating: number;
  isVerified: boolean;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters: Record<string, any>;
  resultsCount: number;
  createdAt: string;
}

export interface SearchSuggestion {
  type: 'category' | 'provider' | 'location';
  label: string;
  value: string;
  icon?: string;
}

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// HOOK
// ============================================================

export function useSearch() {
  const { getToken, user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<FacetResult | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResult[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to make authenticated requests
  const fetchWithAuth = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        // Token expired - try to refresh or redirect
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

  // Search providers with filters
  const search = useCallback(
    async (data: SearchData): Promise<SearchResponse> => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setSearching(true);
      setError(null);
      setLastSearchQuery(data.query || '');
      setLastSearchFilters({
        category: data.category,
        subCategory: data.subCategory,
        minRating: data.minRating,
        maxPrice: data.maxPrice,
        isAvailable: data.isAvailable,
        isVerified: data.isVerified,
        sortBy: data.sortBy,
      });

      try {
        const token = getToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/providers/search`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
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
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Search failed');
        }

        const result = await response.json();
        const searchData = result.data;

        setResults(searchData.data || []);
        setPagination(
          searchData.pagination || {
            page: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        );
        setFacets(searchData.facets || null);

        // Save search history if user is authenticated and query exists
        if (user && data.query && data.query.length >= 2) {
          try {
            await saveSearchHistory(
              data.query,
              {
                category: data.category,
                minRating: data.minRating,
                maxPrice: data.maxPrice,
              },
              searchData.pagination?.totalItems || 0
            );
          } catch (error) {
            // Silently fail for history
            console.debug('Error saving search history:', error);
          }
        }

        return searchData;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was aborted, ignore
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
        setError(err instanceof Error ? err.message : 'Search failed');
        showToast(error || 'Search failed', 'error');
        throw err;
      } finally {
        setSearching(false);
        abortControllerRef.current = null;
      }
    },
    [getToken, showToast, user]
  );

  // Debounced search for autocomplete
  const debouncedSearchQuery = useDebounce<string>('', 300);

  // Autocomplete search
  const autocomplete = useCallback(
    async (query: string, limit: number = 10): Promise<AutocompleteResult[]> => {
      if (!query || query.length < 2) {
        setAutocompleteResults([]);
        return [];
      }

      setLoading(true);

      try {
        const data = await fetchWithAuth(
          `/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`
        );
        setAutocompleteResults(data || []);
        return data || [];
      } catch (err) {
        console.error('Autocomplete error:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  // Get popular searches
  const getPopularSearches = useCallback(
    async (limit: number = 10): Promise<string[]> => {
      setLoading(true);

      try {
        const data = await fetchWithAuth(`/search/popular?limit=${limit}`);
        setPopularSearches(data || []);
        return data || [];
      } catch (err) {
        console.error('Error fetching popular searches:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  // Get search suggestions
  const getSuggestions = useCallback(
    async (query: string, limit: number = 5): Promise<SearchSuggestion[]> => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return [];
      }

      setLoading(true);

      try {
        const data = await fetchWithAuth(
          `/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
        );
        // Transform response to suggestions
        const suggestionsData: SearchSuggestion[] = (data || []).map((item: any) => ({
          type: item.type || 'provider',
          label: item.label || item.businessName || item.name,
          value: item.value || item.id || item.label,
          icon: item.icon,
        }));
        setSuggestions(suggestionsData);
        return suggestionsData;
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  // Save search history
  const saveSearchHistory = useCallback(
    async (query: string, filters: Record<string, any>, resultsCount: number): Promise<void> => {
      if (!user || !query || query.length < 2) return;

      try {
        await fetchWithAuth('/search/history', {
          method: 'POST',
          body: JSON.stringify({ query, filters, resultsCount }),
        });
      } catch (err) {
        // Silently fail
        console.debug('Error saving search history:', err);
      }
    },
    [fetchWithAuth, user]
  );

  // Get user search history
  const getSearchHistory = useCallback(
    async (limit: number = 10): Promise<SearchHistoryItem[]> => {
      if (!user) return [];

      setIsHistoryLoading(true);

      try {
        const data = await fetchWithAuth(`/search/history?limit=${limit}`);
        setHistory(data || []);
        return data || [];
      } catch (err) {
        console.error('Error fetching search history:', err);
        return [];
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [fetchWithAuth, user]
  );

  // Clear search history
  const clearSearchHistory = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      await fetchWithAuth('/search/history', {
        method: 'DELETE',
      });
      setHistory([]);
      showToast('Search history cleared', 'success');
    } catch (err) {
      console.error('Error clearing search history:', err);
      showToast('Failed to clear search history', 'error');
    }
  }, [fetchWithAuth, user, showToast]);

  // Get nearby providers (simplified)
  const getNearby = useCallback(
    async (
      lat: number,
      lng: number,
      radius: number = 5,
      limit: number = 10
    ): Promise<SearchResult[]> => {
      setLoading(true);

      try {
        const data = await fetchWithAuth(
          `/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`
        );
        return data || [];
      } catch (err) {
        console.error('Error fetching nearby providers:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  // Get featured providers
  const getFeatured = useCallback(
    async (lat: number, lng: number, limit: number = 10): Promise<SearchResult[]> => {
      setLoading(true);

      try {
        const data = await fetchWithAuth(`/search/featured?lat=${lat}&lng=${lng}&limit=${limit}`);
        return data || [];
      } catch (err) {
        console.error('Error fetching featured providers:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  // Get providers by category
  const getByCategory = useCallback(
    async (
      category: string,
      lat: number,
      lng: number,
      radius: number = 20,
      limit: number = 20
    ): Promise<SearchResult[]> => {
      setLoading(true);

      try {
        const data = await fetchWithAuth(
          `/search/category/${encodeURIComponent(category)}?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`
        );
        return data || [];
      } catch (err) {
        console.error('Error fetching providers by category:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  // Search providers by city
  const searchByCity = useCallback(
    async (
      city: string,
      category?: string,
      page: number = 1,
      limit: number = 20
    ): Promise<SearchResponse> => {
      setSearching(true);

      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (category) params.append('category', category);

        const data = await fetchWithAuth(
          `/search/city/${encodeURIComponent(city)}?${params.toString()}`
        );
        setResults(data.data || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        );
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        showToast(error || 'Search failed', 'error');
        throw err;
      } finally {
        setSearching(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Get search filters (categories, cities, sort options)
  const getSearchFilters = useCallback(async (): Promise<{
    categories: { id: string; name: string }[];
    cities: string[];
    sortOptions: { value: string; label: string }[];
  }> => {
    try {
      return await fetchWithAuth('/search/filters');
    } catch (err) {
      console.error('Error fetching search filters:', err);
      return {
        categories: [],
        cities: [],
        sortOptions: [
          { value: 'relevance', label: 'Relevance' },
          { value: 'distance', label: 'Distance' },
          { value: 'rating', label: 'Rating' },
          { value: 'price', label: 'Price' },
          { value: 'experience', label: 'Experience' },
        ],
      };
    }
  }, [fetchWithAuth]);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
    setFacets(null);
    setPagination({
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
    setLastSearchQuery('');
    setLastSearchFilters({});
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset all search state
  const reset = useCallback(() => {
    clearResults();
    setAutocompleteResults([]);
    setPopularSearches([]);
    setSuggestions([]);
    setError(null);
    setSearching(false);
    setLoading(false);
  }, [clearResults]);

  return {
    // State
    results,
    facets,
    pagination,
    loading,
    searching,
    error,
    autocompleteResults,
    popularSearches,
    suggestions,
    history,
    isHistoryLoading,
    lastSearchQuery,
    lastSearchFilters,

    // Search operations
    search,
    autocomplete,
    getPopularSearches,
    getSuggestions,
    getNearby,
    getFeatured,
    getByCategory,
    searchByCity,
    getSearchFilters,

    // History
    saveSearchHistory,
    getSearchHistory,
    clearSearchHistory,

    // Utilities
    clearResults,
    clearError,
    reset,
  };
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useSearch;
