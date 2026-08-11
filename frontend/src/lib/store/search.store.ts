'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  searchProviders as searchProvidersApi,
  getPopularSearches as getPopularSearchesApi,
  getSearchSuggestions as getSearchSuggestionsApi,
  getSearchHistory as getSearchHistoryApi,
  saveSearchHistory as saveSearchHistoryApi,
  clearSearchHistory as clearSearchHistoryApi,
} from '../api/providers';

// ============================================================
// TYPES
// ============================================================

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

export interface SearchState {
  // Results
  results: SearchResult[];
  facets: FacetResult | null;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Search filters
  filters: SearchFilters;
  searchQuery: string;
  lastSearchData: SearchData | null;

  // Autocomplete
  autocompleteResults: SearchResult[];
  suggestions: SearchSuggestion[];
  popularSearches: string[];

  // History
  history: SearchHistoryItem[];
  isHistoryLoading: boolean;

  // UI State
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  lastFetchTime: number | null;
  cacheTTL: number;
}

export interface SearchActions {
  // Search operations
  search: (data: SearchData) => Promise<SearchResponse>;
  searchWithFilters: (filters: SearchFilters) => Promise<SearchResponse>;

  // Autocomplete and suggestions
  autocomplete: (query: string, limit?: number) => Promise<SearchResult[]>;
  getSuggestions: (query: string, limit?: number) => Promise<SearchSuggestion[]>;
  getPopularSearches: (limit?: number) => Promise<string[]>;

  // History
  getHistory: (limit?: number) => Promise<SearchHistoryItem[]>;
  saveHistory: (query: string, filters: Record<string, any>, resultsCount: number) => Promise<void>;
  clearHistory: () => Promise<void>;

  // State management
  setFilters: (filters: Partial<SearchFilters>) => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  clearResults: () => void;
  clearError: () => void;
  reset: () => void;
  invalidateCache: () => void;
}

export type SearchStore = SearchState & SearchActions;

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: SearchState = {
  results: [],
  facets: null,
  pagination: {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {},
  searchQuery: '',
  lastSearchData: null,

  autocompleteResults: [],
  suggestions: [],
  popularSearches: [],

  history: [],
  isHistoryLoading: false,

  isLoading: false,
  isSearching: false,
  error: null,
  lastFetchTime: null,
  cacheTTL: 30000, // 30 seconds cache for search results
};

// ============================================================
// STORE
// ============================================================

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================================
      // SEARCH OPERATIONS
      // ============================================================

      search: async (data: SearchData): Promise<SearchResponse> => {
        set({ isSearching: true, error: null });

        try {
          const response = await searchProvidersApi(data);

          set({
            results: response.data || [],
            pagination: response.pagination || {
              page: data.page || 1,
              limit: data.limit || 20,
              totalItems: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
            facets: response.facets || null,
            lastSearchData: data,
            searchQuery: data.query || '',
            isSearching: false,
            error: null,
            lastFetchTime: Date.now(),
          });

          // Save search history if query exists
          if (data.query && data.query.length >= 2) {
            try {
              await get().saveHistory(
                data.query,
                {
                  category: data.category,
                  minRating: data.minRating,
                  maxPrice: data.maxPrice,
                },
                response.pagination?.totalItems || 0
              );
            } catch (error) {
              // Silently fail for history
              console.debug('Error saving search history:', error);
            }
          }

          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Search failed';
          set({ isSearching: false, error: errorMessage });
          throw error;
        }
      },

      searchWithFilters: async (filters: SearchFilters): Promise<SearchResponse> => {
        const { lastSearchData } = get();
        if (!lastSearchData) {
          throw new Error('No search data available. Perform a search first.');
        }

        const searchData: SearchData = {
          lat: lastSearchData.lat,
          lng: lastSearchData.lng,
          radius: lastSearchData.radius,
          query: lastSearchData.query,
          category: filters.category || lastSearchData.category,
          subCategory: filters.subCategory || lastSearchData.subCategory,
          minRating: filters.minRating || lastSearchData.minRating,
          maxPrice: filters.maxPrice || lastSearchData.maxPrice,
          isAvailable:
            filters.isAvailable !== undefined ? filters.isAvailable : lastSearchData.isAvailable,
          isVerified:
            filters.isVerified !== undefined ? filters.isVerified : lastSearchData.isVerified,
          page: 1,
          limit: lastSearchData.limit || 20,
          sortBy: filters.sortBy || lastSearchData.sortBy,
        };

        set({ filters });
        return get().search(searchData);
      },

      // ============================================================
      // AUTOCOMPLETE AND SUGGESTIONS
      // ============================================================

      autocomplete: async (query: string, limit: number = 10): Promise<SearchResult[]> => {
        if (!query || query.length < 2) {
          set({ autocompleteResults: [] });
          return [];
        }

        set({ isLoading: true, error: null });

        try {
          // Use search API with limited results for autocomplete
          const response = await searchProvidersApi({
            lat: 9.03,
            lng: 38.74,
            query,
            limit,
            isAvailable: true,
            isVerified: true,
          });

          set({
            autocompleteResults: response.data || [],
            isLoading: false,
            error: null,
          });

          return response.data || [];
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Autocomplete failed';
          set({ isLoading: false, error: errorMessage });
          return [];
        }
      },

      getSuggestions: async (query: string, limit: number = 5): Promise<SearchSuggestion[]> => {
        if (!query || query.length < 2) {
          set({ suggestions: [] });
          return [];
        }

        set({ isLoading: true, error: null });

        try {
          const suggestions = await getSearchSuggestionsApi(query, limit);
          const formattedSuggestions: SearchSuggestion[] = (suggestions || []).map((item: any) => ({
            type: item.type || 'provider',
            label: item.label || item.businessName || item.name,
            value: item.value || item.id || item.label,
            icon: item.icon,
          }));

          set({
            suggestions: formattedSuggestions,
            isLoading: false,
            error: null,
          });

          return formattedSuggestions;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get suggestions';
          set({ isLoading: false, error: errorMessage });
          return [];
        }
      },

      getPopularSearches: async (limit: number = 10): Promise<string[]> => {
        set({ isLoading: true, error: null });

        try {
          const popular = await getPopularSearchesApi(limit);
          set({
            popularSearches: popular || [],
            isLoading: false,
            error: null,
          });
          return popular || [];
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to get popular searches';
          set({ isLoading: false, error: errorMessage });
          return [];
        }
      },

      // ============================================================
      // HISTORY
      // ============================================================

      getHistory: async (limit: number = 10): Promise<SearchHistoryItem[]> => {
        set({ isHistoryLoading: true, error: null });

        try {
          const history = await getSearchHistoryApi(limit);
          set({
            history: history || [],
            isHistoryLoading: false,
            error: null,
          });
          return history || [];
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to get search history';
          set({ isHistoryLoading: false, error: errorMessage });
          return [];
        }
      },

      saveHistory: async (
        query: string,
        filters: Record<string, any>,
        resultsCount: number
      ): Promise<void> => {
        try {
          await saveSearchHistoryApi(query, filters, resultsCount);
          // Refresh history
          await get().getHistory(10);
        } catch (error) {
          // Silently fail
          console.debug('Error saving search history:', error);
        }
      },

      clearHistory: async (): Promise<void> => {
        set({ isHistoryLoading: true, error: null });

        try {
          await clearSearchHistoryApi();
          set({
            history: [],
            isHistoryLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to clear search history';
          set({ isHistoryLoading: false, error: errorMessage });
          throw error;
        }
      },

      // ============================================================
      // STATE MANAGEMENT
      // ============================================================

      setFilters: (filters: Partial<SearchFilters>): void => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      setSearchQuery: (query: string): void => {
        set({ searchQuery: query });
      },

      setPage: (page: number): void => {
        const { lastSearchData } = get();
        if (!lastSearchData) return;

        const searchData = { ...lastSearchData, page };
        get().search(searchData);
      },

      clearResults: (): void => {
        set({
          results: [],
          facets: null,
          pagination: {
            page: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
          lastSearchData: null,
        });
      },

      clearError: (): void => {
        set({ error: null });
      },

      reset: (): void => {
        set({
          ...initialState,
        });
      },

      invalidateCache: (): void => {
        set({ lastFetchTime: null });
      },
    }),
    {
      name: 'search-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        filters: state.filters,
        popularSearches: state.popularSearches,
        history: state.history,
      }),
    }
  )
);

// ============================================================
// SELECTORS
// ============================================================

export const selectSearchResults = (state: SearchStore) => state.results;
export const selectSearchFacets = (state: SearchStore) => state.facets;
export const selectSearchPagination = (state: SearchStore) => state.pagination;
export const selectSearchFilters = (state: SearchStore) => state.filters;
export const selectSearchQuery = (state: SearchStore) => state.searchQuery;
export const selectAutocompleteResults = (state: SearchStore) => state.autocompleteResults;
export const selectSearchSuggestions = (state: SearchStore) => state.suggestions;
export const selectPopularSearches = (state: SearchStore) => state.popularSearches;
export const selectSearchHistory = (state: SearchStore) => state.history;
export const selectIsSearching = (state: SearchStore) => state.isSearching;
export const selectSearchError = (state: SearchStore) => state.error;
export const selectIsHistoryLoading = (state: SearchStore) => state.isHistoryLoading;


export default useSearchStore;
