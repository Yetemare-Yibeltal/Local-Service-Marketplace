import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import {
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
} from "../services/internal/search.service";
import {
  providerSearchSchema,
  providerFilterSchema,
} from "../schemas/provider.schema";
import { DEFAULTS } from "../utils/constants";
import logger from "../utils/logger";

// ============================================================
// SEARCH CONTROLLER
// ============================================================

// ============================================================
// PROVIDER SEARCH
// ============================================================

/**
 * Search providers by location with filters
 * @route POST /api/v1/search/providers
 * @description Searches for providers near a location with optional filters
 * @body { lat, lng, radius, query?, category?, subCategory?, minRating?, maxPrice?, isAvailable?, isVerified?, page?, limit?, sortBy? }
 * @returns { providers, pagination, facets? } with 200 status
 */
export const searchProvidersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = providerSearchSchema.parse(req.body);

    // Use the search with filters service
    const { searchWithFilters } = await import("../services/search.service");

    const result = await searchWithFilters({
      lat: validatedData.lat,
      lng: validatedData.lng,
      radius: validatedData.radius || DEFAULTS.RADIUS_KM,
      query: validatedData.query,
      category: validatedData.category,
      subCategory: validatedData.subCategory,
      minRating: validatedData.minRating,
      maxPrice: validatedData.maxPrice,
      isAvailable:
        validatedData.isAvailable !== undefined
          ? validatedData.isAvailable
          : true,
      isVerified: validatedData.isVerified,
      page: validatedData.page || DEFAULTS.PAGE,
      limit: validatedData.limit || DEFAULTS.LIMIT,
      sortBy: validatedData.sortBy || "relevance",
    });

    // Save search query to history if user is authenticated
    if (validatedData.query && validatedData.query.length >= 2) {
      const userId = (req as any).user?.id;
      if (userId) {
        try {
          const { saveSearchQuery } =
            await import("../services/search.service");
          await saveSearchQuery(
            userId,
            validatedData.query,
            {
              category: validatedData.category,
              minRating: validatedData.minRating,
              maxPrice: validatedData.maxPrice,
            },
            result.pagination.totalItems,
          );
        } catch (error) {
          logger.error("Failed to save search history:", error);
        }
      }
    }

    sendPaginated(
      res,
      result.data,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.totalItems,
    );
  },
);

/**
 * Simple nearby providers search
 * @route GET /api/v1/search/nearby
 * @description Searches for nearby providers without complex filters
 * @query { lat, lng, radius, limit }
 * @returns { providers } with 200 status
 */
export const getNearbyProvidersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { lat, lng, radius, limit } = req.query;

    if (!lat || !lng) {
      sendError(res, "Latitude and longitude are required", 400);
      return;
    }

    const providers = await getNearbyProviders(
      parseFloat(lat as string),
      parseFloat(lng as string),
      radius ? parseFloat(radius as string) : 5,
      limit ? parseInt(limit as string) : 10,
    );

    sendSuccess(res, providers, "Nearby providers retrieved successfully");
  },
);

/**
 * Search providers by category
 * @route GET /api/v1/search/category/:category
 * @description Searches for providers in a specific category
 * @param {category} - Category name
 * @query { lat, lng, radius, limit }
 * @returns { providers } with 200 status
 */
export const searchByCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { category } = req.params;

    if (!category) {
      sendError(res, "Category is required", 400);
      return;
    }

    const { lat, lng, radius, limit } = req.query;

    if (!lat || !lng) {
      sendError(res, "Latitude and longitude are required", 400);
      return;
    }

    const providers = await getProvidersByCategory(
      category,
      parseFloat(lat as string),
      parseFloat(lng as string),
      radius ? parseFloat(radius as string) : 20,
      limit ? parseInt(limit as string) : 20,
    );

    sendSuccess(res, providers, "Category providers retrieved successfully");
  },
);

/**
 * Search providers by city
 * @route GET /api/v1/search/city/:city
 * @description Searches for providers in a specific city
 * @param {city} - City name
 * @query { category, page, limit }
 * @returns { providers, pagination } with 200 status
 */
export const searchByCityController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { city } = req.params;

    if (!city) {
      sendError(res, "City is required", 400);
      return;
    }

    const { category, page, limit } = req.query;

    const { searchProvidersByCity } =
      await import("../services/search.service");

    const result = await searchProvidersByCity(
      city,
      category as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20,
    );

    sendPaginated(
      res,
      result.data,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.totalItems,
    );
  },
);

// ============================================================
// AUTOCOMPLETE & SUGGESTIONS
// ============================================================

/**
 * Autocomplete search for providers
 * @route GET /api/v1/search/autocomplete
 * @description Provides autocomplete suggestions for provider search
 * @query { q, limit, category }
 * @returns { suggestions } with 200 status
 */
export const autocompleteController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { q, limit, category } = req.query;

    if (!q || typeof q !== "string" || q.length < 2) {
      sendSuccess(res, [], "No suggestions found");
      return;
    }

    const { getProviderAutocomplete } =
      await import("../services/search.service");

    const suggestions = await getProviderAutocomplete(
      q,
      limit ? parseInt(limit as string) : 10,
    );

    sendSuccess(
      res,
      suggestions,
      "Autocomplete suggestions retrieved successfully",
    );
  },
);

/**
 * Get search suggestions
 * @route GET /api/v1/search/suggestions
 * @description Gets search suggestions based on partial query
 * @query { q, limit }
 * @returns { suggestions } with 200 status
 */
export const getSuggestionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { q, limit } = req.query;

    if (!q || typeof q !== "string" || q.length < 2) {
      sendSuccess(res, [], "No suggestions found");
      return;
    }

    const { getSearchSuggestionsWithCache } =
      await import("../services/search.service");

    const suggestions = await getSearchSuggestionsWithCache(
      q,
      limit ? parseInt(limit as string) : 5,
    );

    sendSuccess(res, suggestions, "Search suggestions retrieved successfully");
  },
);

/**
 * Get popular searches
 * @route GET /api/v1/search/popular
 * @description Gets the most popular search queries
 * @query { limit }
 * @returns { popularSearches } with 200 status
 */
export const getPopularSearchesController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { limit } = req.query;

    const { getPopularSearchesWithCache } =
      await import("../services/search.service");

    const popular = await getPopularSearchesWithCache(
      limit ? parseInt(limit as string) : 10,
    );

    sendSuccess(res, popular, "Popular searches retrieved successfully");
  },
);

/**
 * Get search filters
 * @route GET /api/v1/search/filters
 * @description Gets available search filters (categories, cities, sort options)
 * @returns { filters } with 200 status
 */
export const getSearchFiltersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { getSearchFilters } = await import("../services/search.service");

    const filters = await getSearchFilters();

    sendSuccess(res, filters, "Search filters retrieved successfully");
  },
);

// ============================================================
// FEATURED & RECOMMENDED
// ============================================================

/**
 * Get featured providers
 * @route GET /api/v1/search/featured
 * @description Gets featured/verified providers near a location
 * @query { lat, lng, limit }
 * @returns { providers } with 200 status
 */
export const getFeaturedProvidersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { lat, lng, limit } = req.query;

    if (!lat || !lng) {
      sendError(res, "Latitude and longitude are required", 400);
      return;
    }

    const { getFeaturedProviders } = await import("../services/search.service");

    const providers = await getFeaturedProviders(
      parseFloat(lat as string),
      parseFloat(lng as string),
      limit ? parseInt(limit as string) : 10,
    );

    sendSuccess(res, providers, "Featured providers retrieved successfully");
  },
);

// ============================================================
// SEARCH HISTORY
// ============================================================

/**
 * Get user search history
 * @route GET /api/v1/search/history
 * @description Gets the authenticated user's search history
 * @header Authorization: Bearer {accessToken}
 * @query { limit }
 * @returns { history } with 200 status
 */
export const getSearchHistoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const { limit } = req.query;

    const history = await getUserSearchHistory(
      userId,
      limit ? parseInt(limit as string) : 10,
    );

    sendSuccess(res, history, "Search history retrieved successfully");
  },
);

/**
 * Clear user search history
 * @route DELETE /api/v1/search/history
 * @description Clears the authenticated user's search history
 * @header Authorization: Bearer {accessToken}
 * @returns { success: true } with 200 status
 */
export const clearSearchHistoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const { clearSearchHistory } = await import("../services/search.service");

    await clearSearchHistory(userId);

    sendSuccess(res, null, "Search history cleared successfully");
  },
);

// ============================================================
// SEARCH STATISTICS (ADMIN)
// ============================================================

/**
 * Get search statistics (admin only)
 * @route GET /api/v1/search/stats
 * @description Gets search analytics and statistics
 * @header Authorization: Bearer {accessToken}
 * @query { startDate, endDate }
 * @returns { stats } with 200 status
 */
export const getSearchStatsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { startDate, endDate } = req.query;

    const { getSearchStatistics } = await import("../services/search.service");

    const stats = await getSearchStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
    );

    sendSuccess(res, stats, "Search statistics retrieved successfully");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Provider search
  searchProvidersController,
  getNearbyProvidersController,
  searchByCategoryController,
  searchByCityController,

  // Autocomplete & suggestions
  autocompleteController,
  getSuggestionsController,
  getPopularSearchesController,
  getSearchFiltersController,

  // Featured
  getFeaturedProvidersController,

  // Search history
  getSearchHistoryController,
  clearSearchHistoryController,

  // Search statistics
  getSearchStatsController,
};
