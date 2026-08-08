import internalSearchService from "./internal/search.service";
import { searchProvidersByLocationService } from "./internal/search.service";
import { getActiveCategories } from "../repositories/category.repository";
import { cacheSet, cacheGet, cacheDelete } from "../config/redis";
import logger from "../utils/logger";
import { DEFAULTS } from "../utils/constants";

// ============================================================
// SEARCH SERVICE (ROOT LEVEL)
// This service re-exports all functionality from the internal
// search service and adds application-specific convenience
// methods for provider search, service search, autocomplete,
// search history, and search analytics.
// ============================================================

// Re-export all methods from the internal service
export const {
  searchProvidersByLocationService,
  textSearchProviders,
  facetedSearch,
  autocompleteSearch,
  getPopularSearches,
  getSearchSuggestions,
  saveSearchHistory,
  getUserSearchHistory,
  clearUserSearchHistory,
  getNearbyProviders,
  getFeaturedProviders,
  getProvidersByCategory,
} = internalSearchService;

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
  sortBy?: "relevance" | "distance" | "rating" | "price" | "experience";
}

export interface GeoSearchData {
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
  sortBy?: "relevance" | "distance" | "rating" | "price" | "experience";
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

// ============================================================
// APPLICATION-SPECIFIC SEARCH METHODS
// ============================================================

/**
 * Search providers with combined filters
 */
export async function searchWithFilters(data: GeoSearchData): Promise<{
  data: SearchResult[];
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
}> {
  try {
    // Validate coordinates
    if (!data.lat || !data.lng) {
      throw new Error(
        "Latitude and longitude are required for location search",
      );
    }

    // If query is provided and has length >= 2, use text search
    if (data.query && data.query.trim().length >= 2) {
      const textResult = await textSearchProviders({
        query: data.query.trim(),
        category: data.category,
        minRating: data.minRating,
        city: data.city,
        page: data.page || DEFAULTS.PAGE,
        limit: data.limit || DEFAULTS.LIMIT,
      });

      return textResult;
    }

    // Use faceted search with location
    const result = await facetedSearch({
      lat: data.lat,
      lng: data.lng,
      radius: data.radius || DEFAULTS.RADIUS_KM,
      query: data.query,
      category: data.category,
      subCategory: data.subCategory,
      minRating: data.minRating,
      maxPrice: data.maxPrice,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isVerified: data.isVerified,
      page: data.page || DEFAULTS.PAGE,
      limit: data.limit || DEFAULTS.LIMIT,
    });

    // Sort results if specified
    if (data.sortBy && data.sortBy !== "relevance") {
      const sortedData = [...result.providers];
      switch (data.sortBy) {
        case "distance":
          sortedData.sort((a, b) => a.distance - b.distance);
          break;
        case "rating":
          sortedData.sort((a, b) => b.averageRating - a.averageRating);
          break;
        case "price":
          sortedData.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
          break;
        case "experience":
          sortedData.sort((a, b) => b.yearsExperience - a.yearsExperience);
          break;
        default:
          break;
      }
      result.providers = sortedData;
    }

    return {
      data: result.providers,
      pagination: result.pagination,
      facets: result.facets,
    };
  } catch (error) {
    logger.error("Search with filters failed:", error);
    throw error;
  }
}

/**
 * Search nearby providers (simplified)
 */
export async function searchNearbyProviders(
  lat: number,
  lng: number,
  radius: number = 10,
  limit: number = 20,
): Promise<SearchResult[]> {
  try {
    const result = await searchProvidersByLocationService({
      lat,
      lng,
      radius,
      isAvailable: true,
      isVerified: true,
      limit,
    });

    return result.data;
  } catch (error) {
    logger.error("Search nearby providers failed:", error);
    throw error;
  }
}

/**
 * Search providers by city
 */
export async function searchProvidersByCity(
  city: string,
  category?: string,
  page: number = 1,
  limit: number = 20,
): Promise<{
  data: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    const { prisma } = require("../config/database");

    const where: any = {
      city: { contains: city, mode: "insensitive" },
      isAvailable: true,
    };

    if (category) {
      where.category = category;
    }

    const [data, totalItems] = await Promise.all([
      prisma.providerProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isVerified: "desc" }, { averageRating: "desc" }],
        select: {
          id: true,
          userId: true,
          businessName: true,
          businessLogo: true,
          category: true,
          subCategory: true,
          averageRating: true,
          totalReviews: true,
          hourlyRate: true,
          isAvailable: true,
          isVerified: true,
          address: true,
          city: true,
          subCity: true,
          locationLat: true,
          locationLng: true,
          completedJobs: true,
          responseTime: true,
          yearsExperience: true,
        },
      }),
      prisma.providerProfile.count({ where }),
    ]);

    const results: SearchResult[] = data.map((provider: any) => ({
      id: provider.id,
      userId: provider.userId,
      businessName: provider.businessName,
      businessLogo: provider.businessLogo,
      category: provider.category,
      subCategory: provider.subCategory,
      averageRating: provider.averageRating,
      totalReviews: provider.totalReviews,
      hourlyRate: provider.hourlyRate,
      isAvailable: provider.isAvailable,
      isVerified: provider.isVerified,
      distance: 0,
      address: provider.address,
      city: provider.city,
      subCity: provider.subCity,
      locationLat: provider.locationLat,
      locationLng: provider.locationLng,
      completedJobs: provider.completedJobs,
      responseTime: provider.responseTime,
      yearsExperience: provider.yearsExperience,
    }));

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: results,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Search providers by city ${city} failed:`, error);
    throw error;
  }
}

/**
 * Get search suggestions with caching
 */
export async function getSearchSuggestionsWithCache(
  query: string,
  limit: number = 5,
): Promise<string[]> {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `search:suggestions:${query.toLowerCase().trim()}`;
    const cached = await cacheGet<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const suggestions = await getSearchSuggestions(query, limit);

    await cacheSet(cacheKey, suggestions, 600);

    return suggestions;
  } catch (error) {
    logger.error("Get search suggestions with cache failed:", error);
    return [];
  }
}

/**
 * Get popular searches with cache
 */
export async function getPopularSearchesWithCache(
  limit: number = 10,
): Promise<string[]> {
  try {
    const cacheKey = "search:popular";
    const cached = await cacheGet<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const popular = await getPopularSearches(limit);

    await cacheSet(cacheKey, popular, 3600);

    return popular;
  } catch (error) {
    logger.error("Get popular searches with cache failed:", error);
    return [];
  }
}

/**
 * Save search query to history
 */
export async function saveSearchQuery(
  userId: string,
  query: string,
  filters: Record<string, any> = {},
  resultsCount: number = 0,
): Promise<void> {
  try {
    if (!query || query.length < 2) {
      return;
    }

    await saveSearchHistory(userId, query, filters, resultsCount);
    logger.info(`Search query "${query}" saved for user ${userId}`);
  } catch (error) {
    logger.error("Save search query failed:", error);
  }
}

/**
 * Clear search history for a user
 */
export async function clearSearchHistory(userId: string): Promise<void> {
  try {
    await clearUserSearchHistory(userId);
    logger.info(`Search history cleared for user ${userId}`);
  } catch (error) {
    logger.error("Clear search history failed:", error);
  }
}

/**
 * Get search statistics
 */
export async function getSearchStatistics(
  startDate?: Date,
  endDate?: Date,
): Promise<{
  totalSearches: number;
  uniqueSearches: number;
  topQueries: { query: string; count: number }[];
  categories: { name: string; count: number }[];
  cities: { name: string; count: number }[];
  averageResultsPerSearch: number;
}> {
  try {
    // This would typically query a search analytics table
    // For MVP, return sample statistics
    const categories = await getActiveCategories();

    return {
      totalSearches: 1250,
      uniqueSearches: 450,
      topQueries: [
        { query: "plumber", count: 120 },
        { query: "electrician", count: 95 },
        { query: "cleaner", count: 80 },
        { query: "tutor", count: 65 },
        { query: "photographer", count: 50 },
      ],
      categories: categories.map((c) => ({
        name: c.name,
        count: Math.floor(Math.random() * 100) + 10,
      })),
      cities: [
        { name: "Addis Ababa", count: 800 },
        { name: "Bahir Dar", count: 200 },
        { name: "Hawassa", count: 150 },
        { name: "Adama", count: 100 },
      ],
      averageResultsPerSearch: 25,
    };
  } catch (error) {
    logger.error("Get search statistics failed:", error);
    throw error;
  }
}

/**
 * Search providers by category with location
 */
export async function searchByCategory(
  category: string,
  lat: number,
  lng: number,
  radius: number = 10,
  limit: number = 20,
): Promise<SearchResult[]> {
  try {
    const result = await searchProvidersByLocationService({
      lat,
      lng,
      radius,
      category,
      isAvailable: true,
      isVerified: true,
      limit,
    });

    return result.data;
  } catch (error) {
    logger.error(`Search by category ${category} failed:`, error);
    throw error;
  }
}

/**
 * Get search filters
 */
export async function getSearchFilters(): Promise<{
  categories: { id: string; name: string }[];
  cities: string[];
  sortOptions: { value: string; label: string }[];
}> {
  try {
    const categories = await getActiveCategories();

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
      })),
      cities: [
        "Addis Ababa",
        "Bahir Dar",
        "Hawassa",
        "Adama",
        "Mekelle",
        "Dire Dawa",
        "Gondar",
        "Jimma",
        "Harar",
      ],
      sortOptions: [
        { value: "relevance", label: "Relevance" },
        { value: "distance", label: "Distance" },
        { value: "rating", label: "Rating" },
        { value: "price", label: "Price" },
        { value: "experience", label: "Experience" },
      ],
    };
  } catch (error) {
    logger.error("Get search filters failed:", error);
    throw error;
  }
}

/**
 * Get search autocomplete for providers
 */
export async function getProviderAutocomplete(
  query: string,
  limit: number = 10,
): Promise<
  {
    id: string;
    businessName: string;
    category: string;
    city: string;
    averageRating: number;
    isVerified: boolean;
  }[]
> {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    return await autocompleteSearch(query, limit);
  } catch (error) {
    logger.error("Get provider autocomplete failed:", error);
    return [];
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Re-export internal methods
  searchProvidersByLocationService,
  textSearchProviders,
  facetedSearch,
  autocompleteSearch,
  getPopularSearches,
  getSearchSuggestions,
  saveSearchHistory,
  getUserSearchHistory,
  clearUserSearchHistory,
  getNearbyProviders,
  getFeaturedProviders,
  getProvidersByCategory,

  // Application-specific methods
  searchWithFilters,
  searchNearbyProviders,
  searchProvidersByCity,
  getSearchSuggestionsWithCache,
  getPopularSearchesWithCache,
  saveSearchQuery,
  clearSearchHistory,
  getSearchStatistics,
  searchByCategory,
  getSearchFilters,
  getProviderAutocomplete,
};
