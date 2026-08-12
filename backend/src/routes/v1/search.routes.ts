import { Router } from "express";
import {
  searchProvidersController,
  getNearbyProvidersController,
  searchByCategoryController,
  searchByCityController,
  autocompleteController,
  getSuggestionsController,
  getPopularSearchesController,
  getSearchFiltersController,
  getFeaturedProvidersController,
  getSearchHistoryController,
  clearSearchHistoryController,
  getSearchStatsController,
} from "../../controllers/search.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  providerSearchSchema,
  providerFilterSchema,
} from "../../schemas/provider.schema";
import { catchAsync } from "../../middlewares/error.middleware";
import { standardRateLimiter } from "../../config/rateLimit";

// ============================================================
// SEARCH ROUTES
// ============================================================

const router = Router();

// ============================================================
// PUBLIC SEARCH ROUTES
// ============================================================

/**
 * @route POST /api/v1/search/providers
 * @description Search providers by location with filters
 * @body { lat, lng, radius, query?, category?, subCategory?, minRating?, maxPrice?, isAvailable?, isVerified?, page?, limit?, sortBy? }
 * @returns { providers, pagination, facets? } with 200 status
 * @access Public
 */
router.post(
  "/providers",
  standardRateLimiter,
  validateBody(providerSearchSchema),
  catchAsync(searchProvidersController),
);

/**
 * @route GET /api/v1/search/nearby
 * @description Get nearby providers
 * @query { lat, lng, radius, limit }
 * @returns { providers } with 200 status
 * @access Public
 */
router.get("/nearby", catchAsync(getNearbyProvidersController));

/**
 * @route GET /api/v1/search/category/:category
 * @description Search providers by category
 * @param {category} - Category name
 * @query { lat, lng, radius, limit }
 * @returns { providers } with 200 status
 * @access Public
 */
router.get("/category/:category", catchAsync(searchByCategoryController));

/**
 * @route GET /api/v1/search/city/:city
 * @description Search providers by city
 * @param {city} - City name
 * @query { category, page, limit }
 * @returns { providers, pagination } with 200 status
 * @access Public
 */
router.get("/city/:city", catchAsync(searchByCityController));

/**
 * @route GET /api/v1/search/autocomplete
 * @description Autocomplete for search
 * @query { q, limit, category }
 * @returns { suggestions } with 200 status
 * @access Public
 */
router.get("/autocomplete", catchAsync(autocompleteController));

/**
 * @route GET /api/v1/search/suggestions
 * @description Get search suggestions
 * @query { q, limit }
 * @returns { suggestions } with 200 status
 * @access Public
 */
router.get("/suggestions", catchAsync(getSuggestionsController));

/**
 * @route GET /api/v1/search/popular
 * @description Get popular searches
 * @query { limit }
 * @returns { popularSearches } with 200 status
 * @access Public
 */
router.get("/popular", catchAsync(getPopularSearchesController));

/**
 * @route GET /api/v1/search/filters
 * @description Get available search filters
 * @returns { categories, cities, sortOptions } with 200 status
 * @access Public
 */
router.get("/filters", catchAsync(getSearchFiltersController));

/**
 * @route GET /api/v1/search/featured
 * @description Get featured providers
 * @query { lat, lng, limit }
 * @returns { providers } with 200 status
 * @access Public
 */
router.get("/featured", catchAsync(getFeaturedProvidersController));

// ============================================================
// PROTECTED SEARCH ROUTES
// ============================================================

// All protected routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/search/history
 * @description Get user search history
 * @query { limit }
 * @returns { history } with 200 status
 * @access Authenticated users only
 */
router.get("/history", catchAsync(getSearchHistoryController));

/**
 * @route DELETE /api/v1/search/history
 * @description Clear user search history
 * @returns { success: true } with 200 status
 * @access Authenticated users only
 */
router.delete("/history", catchAsync(clearSearchHistoryController));

// ============================================================
// ADMIN SEARCH ROUTES
// ============================================================

/**
 * @route GET /api/v1/search/stats
 * @description Get search statistics (admin only)
 * @query { startDate, endDate }
 * @returns { stats } with 200 status
 * @access Admin only
 */
router.get("/stats", catchAsync(getSearchStatsController));

// ============================================================
// EXPORTS
// ============================================================

export default router;
