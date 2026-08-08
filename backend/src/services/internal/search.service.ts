import { Prisma } from "@prisma/client";
import {
  searchProvidersByLocation,
  getProviders,
  ProviderSearchResult,
} from "../../repositories/provider.repository";
import { getActiveCategories } from "../../repositories/category.repository";
import { calculateDistance } from "../../repositories/provider.repository";
import { cacheSet, cacheGet, cacheDelete } from "../../config/redis";
import logger from "../../utils/logger";
import { DEFAULTS } from "../../utils/constants";

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

export interface TextSearchData {
  query: string;
  category?: string;
  city?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  filters: Record<string, any>;
  resultsCount: number;
  createdAt: Date;
}

export interface FacetedSearchResult {
  providers: ProviderSearchResult[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  facets: {
    categories: Array<{ name: string; count: number }>;
    cities: Array<{ name: string; count: number }>;
    ratings: Array<{ rating: number; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
  };
}

export interface AutocompleteResult {
  id: string;
  businessName: string;
  category: string;
  city: string;
  averageRating: number;
  isVerified: boolean;
}

// ============================================================
// SEARCH SERVICE
// ============================================================

/**
 * Search providers by location with filters
 */
export async function searchProvidersByLocationService(
  data: GeoSearchData,
): Promise<{
  data: ProviderSearchResult[];
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
    const filters: SearchFilters = {
      category: data.category,
      subCategory: data.subCategory,
      minRating: data.minRating,
      maxPrice: data.maxPrice,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isVerified: data.isVerified,
    };

    const page = data.page || DEFAULTS.PAGE;
    const limit = data.limit || DEFAULTS.LIMIT;
    const radius = data.radius || DEFAULTS.RADIUS_KM;

    // Generate cache key
    const cacheKey = `search:${data.lat}:${data.lng}:${radius}:${JSON.stringify(filters)}:${page}:${limit}`;

    // Try to get from cache
    const cachedResult = await cacheGet(cacheKey);
    if (cachedResult) {
      logger.debug(`Search results returned from cache for ${cacheKey}`);
      return cachedResult as any;
    }

    const result = await searchProvidersByLocation(
      data.lat,
      data.lng,
      radius,
      filters,
      page,
      limit,
    );

    // Cache results for 5 minutes
    await cacheSet(cacheKey, result, 300);

    logger.info(`Search completed: ${result.data.length} results found`);

    return result;
  } catch (error) {
    logger.error("Search providers by location failed:", error);
    throw error;
  }
}

/**
 * Text search for providers
 */
export async function textSearchProviders(data: TextSearchData): Promise<{
  data: ProviderSearchResult[];
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
    const page = data.page || DEFAULTS.PAGE;
    const limit = data.limit || DEFAULTS.LIMIT;
    const query = data.query.trim();

    if (!query || query.length < 2) {
      throw new Error("Search query must be at least 2 characters");
    }

    const filters: SearchFilters = {
      category: data.category,
      city: data.city,
      minRating: data.minRating,
      isAvailable: true,
    };

    // Use the existing provider search with search parameter
    const result = await getProviders(
      {
        search: query,
        ...filters,
      },
      page,
      limit,
      "averageRating",
      "desc",
    );

    // Convert to search result format with distance (using default coordinates)
    const dataWithDistance = result.data.map((provider) => ({
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
      distance: 0, // Text search doesn't have distance
      address: provider.address,
      city: provider.city,
      subCity: provider.subCity,
      locationLat: provider.locationLat,
      locationLng: provider.locationLng,
      completedJobs: provider.completedJobs,
      responseTime: provider.responseTime,
      yearsExperience: provider.yearsExperience,
    }));

    logger.info(
      `Text search completed for "${query}": ${dataWithDistance.length} results`,
    );

    return {
      data: dataWithDistance,
      pagination: result.pagination,
    };
  } catch (error) {
    logger.error("Text search providers failed:", error);
    throw error;
  }
}

/**
 * Faceted search with aggregations
 */
export async function facetedSearch(
  data: GeoSearchData,
): Promise<FacetedSearchResult> {
  try {
    const lat = data.lat;
    const lng = data.lng;
    const radius = data.radius || DEFAULTS.RADIUS_KM;
    const page = data.page || DEFAULTS.PAGE;
    const limit = data.limit || 20;

    // Get search results
    const filters: SearchFilters = {
      category: data.category,
      subCategory: data.subCategory,
      minRating: data.minRating,
      maxPrice: data.maxPrice,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isVerified: data.isVerified,
    };

    const result = await searchProvidersByLocation(
      lat,
      lng,
      radius,
      filters,
      page,
      limit,
    );

    // Build facets
    const categories: Record<string, number> = {};
    const cities: Record<string, number> = {};
    const ratings: Record<number, number> = {};
    const priceRanges: Record<string, number> = {};

    // Get all providers in the area for faceting (limited to first 500 for performance)
    const allProviders = await searchProvidersByLocation(
      lat,
      lng,
      radius,
      { isAvailable: true },
      1,
      500,
    );

    allProviders.data.forEach((provider) => {
      // Category facets
      if (provider.category) {
        categories[provider.category] =
          (categories[provider.category] || 0) + 1;
      }

      // City facets
      if (provider.city) {
        cities[provider.city] = (cities[provider.city] || 0) + 1;
      }

      // Rating facets
      const rating = Math.floor(provider.averageRating || 0);
      if (rating > 0) {
        ratings[rating] = (ratings[rating] || 0) + 1;
      }

      // Price range facets
      const price = provider.hourlyRate || 0;
      if (price > 0) {
        let range = "0-500";
        if (price > 500 && price <= 1000) range = "501-1000";
        else if (price > 1000 && price <= 2000) range = "1001-2000";
        else if (price > 2000) range = "2001+";
        priceRanges[range] = (priceRanges[range] || 0) + 1;
      }
    });

    // Convert to arrays and sort
    const facetCategories = Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const facetCities = Object.entries(cities)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const facetRatings = Object.entries(ratings)
      .map(([rating, count]) => ({ rating: parseInt(rating), count }))
      .sort((a, b) => b.rating - a.rating);

    const facetPriceRanges = Object.entries(priceRanges)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const order = ["0-500", "501-1000", "1001-2000", "2001+"];
        return order.indexOf(a.range) - order.indexOf(b.range);
      });

    return {
      providers: result.data,
      pagination: result.pagination,
      facets: {
        categories: facetCategories,
        cities: facetCities,
        ratings: facetRatings,
        priceRanges: facetPriceRanges,
      },
    };
  } catch (error) {
    logger.error("Faceted search failed:", error);
    throw error;
  }
}

/**
 * Autocomplete for search
 */
export async function autocompleteSearch(
  query: string,
  limit: number = 10,
  category?: string,
): Promise<AutocompleteResult[]> {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `autocomplete:${query}:${category || "all"}`;
    const cachedResult = await cacheGet<AutocompleteResult[]>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const { prisma } = require("../../config/database");

    const providers = await prisma.providerProfile.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        OR: [
          { businessName: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
        ],
        ...(category ? { category } : {}),
      },
      select: {
        id: true,
        businessName: true,
        category: true,
        city: true,
        averageRating: true,
        isVerified: true,
      },
      take: limit,
    });

    const results: AutocompleteResult[] = providers.map((provider: any) => ({
      id: provider.id,
      businessName: provider.businessName,
      category: provider.category,
      city: provider.city,
      averageRating: provider.averageRating,
      isVerified: provider.isVerified,
    }));

    // Cache for 15 minutes
    await cacheSet(cacheKey, results, 900);

    return results;
  } catch (error) {
    logger.error("Autocomplete search failed:", error);
    throw error;
  }
}

/**
 * Get popular searches
 */
export async function getPopularSearches(
  limit: number = 10,
): Promise<string[]> {
  try {
    const cacheKey = "popular_searches";
    const cached = await cacheGet<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // In production, this would come from analytics data
    // For now, return default popular categories
    const categories = await getActiveCategories();
    const popular = categories.slice(0, limit).map((category) => category.name);

    await cacheSet(cacheKey, popular, 3600);

    return popular;
  } catch (error) {
    logger.error("Get popular searches failed:", error);
    return [];
  }
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5,
): Promise<string[]> {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `suggestions:${query}`;
    const cached = await cacheGet<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // Get matching categories and business names
    const { prisma } = require("../../config/database");

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: query, mode: "insensitive" },
      },
      select: { name: true },
      take: limit,
    });

    const providers = await prisma.providerProfile.findMany({
      where: {
        isAvailable: true,
        businessName: { contains: query, mode: "insensitive" },
      },
      select: { businessName: true },
      take: limit,
    });

    const suggestions = [
      ...categories.map((c: any) => c.name),
      ...providers.map((p: any) => p.businessName),
    ].slice(0, limit);

    await cacheSet(cacheKey, suggestions, 600);

    return suggestions;
  } catch (error) {
    logger.error("Get search suggestions failed:", error);
    return [];
  }
}

/**
 * Save search history
 */
export async function saveSearchHistory(
  userId: string,
  query: string,
  filters: Record<string, any>,
  resultsCount: number,
): Promise<void> {
  try {
    // In production, this would save to a search_history table
    // For now, just log and cache the recent searches
    const key = `search_history:${userId}`;
    const history = (await cacheGet<any[]>(key)) || [];

    history.unshift({
      query,
      filters,
      resultsCount,
      createdAt: new Date(),
    });

    // Keep last 50 searches
    if (history.length > 50) {
      history.pop();
    }

    await cacheSet(key, history, 604800); // 7 days

    logger.info(`Search history saved for user ${userId}: "${query}"`);
  } catch (error) {
    logger.error("Save search history failed:", error);
  }
}

/**
 * Get user search history
 */
export async function getUserSearchHistory(
  userId: string,
  limit: number = 10,
): Promise<SearchHistory[]> {
  try {
    const key = `search_history:${userId}`;
    const history = (await cacheGet<any[]>(key)) || [];

    return history.slice(0, limit);
  } catch (error) {
    logger.error("Get user search history failed:", error);
    return [];
  }
}

/**
 * Clear user search history
 */
export async function clearUserSearchHistory(userId: string): Promise<void> {
  try {
    const key = `search_history:${userId}`;
    await cacheDelete(key);
    logger.info(`Search history cleared for user ${userId}`);
  } catch (error) {
    logger.error("Clear user search history failed:", error);
  }
}

/**
 * Get nearby providers with fast response
 */
export async function getNearbyProviders(
  lat: number,
  lng: number,
  radius: number = 5,
  limit: number = 10,
): Promise<ProviderSearchResult[]> {
  try {
    const result = await searchProvidersByLocation(
      lat,
      lng,
      radius,
      { isAvailable: true, isVerified: true },
      1,
      limit,
    );

    return result.data;
  } catch (error) {
    logger.error("Get nearby providers failed:", error);
    throw error;
  }
}

/**
 * Get featured providers
 */
export async function getFeaturedProviders(
  lat: number,
  lng: number,
  limit: number = 10,
): Promise<ProviderSearchResult[]> {
  try {
    const result = await searchProvidersByLocation(
      lat,
      lng,
      50, // Large radius for featured
      { isAvailable: true, isVerified: true, isFeatured: true },
      1,
      limit,
    );

    return result.data;
  } catch (error) {
    logger.error("Get featured providers failed:", error);
    throw error;
  }
}

/**
 * Get providers by category
 */
export async function getProvidersByCategory(
  category: string,
  lat: number,
  lng: number,
  radius: number = 20,
  limit: number = 20,
): Promise<ProviderSearchResult[]> {
  try {
    const result = await searchProvidersByLocation(
      lat,
      lng,
      radius,
      { category, isAvailable: true, isVerified: true },
      1,
      limit,
    );

    return result.data;
  } catch (error) {
    logger.error("Get providers by category failed:", error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
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
};
