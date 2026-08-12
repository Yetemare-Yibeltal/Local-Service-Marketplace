import { Router } from "express";
import {
  registerProviderController,
  getProviderProfileController,
  getMyProviderProfileController,
  updateProviderProfileController,
  getProviderListController,
  searchProvidersController,
  getProviderStatsController,
  getProviderDashboardController,
  createServiceController,
  getProviderServicesController,
  getServiceByIdController,
  updateServiceController,
  deleteServiceController,
  updateAvailabilityController,
  updateWorkingHoursController,
  verifyProviderController,
  getVerificationStatusController,
  getTopRatedProvidersController,
  getFeaturedProvidersController,
  getRecentProvidersController,
  getCategorySuggestionsController,
} from "../../controllers/provider.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  providerRegistrationSchema,
  updateProviderSchema,
  providerIdParamSchema,
  providerFilterSchema,
  providerSearchSchema,
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
} from "../../schemas/provider.schema";
import { upload } from "../../middlewares/upload.middleware";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// PROVIDER ROUTES
// ============================================================

const router = Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * @route GET /api/v1/providers
 * @description Get all providers with filters
 * @query { page, limit, category, subCategory, city, minRating, maxPrice, isAvailable, isVerified, isFeatured, search, sortBy, sortOrder }
 * @returns { providers, pagination } with 200 status
 * @access Public
 */
router.get(
  "/",
  validateQuery(providerFilterSchema),
  catchAsync(getProviderListController),
);

/**
 * @route GET /api/v1/providers/:id
 * @description Get provider by ID
 * @param {id} - Provider ID
 * @returns { provider } with 200 status
 * @access Public
 */
router.get(
  "/:id",
  validateParams(providerIdParamSchema),
  catchAsync(getProviderProfileController),
);

/**
 * @route GET /api/v1/providers/services/:id
 * @description Get service by ID
 * @param {id} - Service ID
 * @returns { service } with 200 status
 * @access Public
 */
router.get(
  "/services/:id",
  validateParams(serviceIdParamSchema),
  catchAsync(getServiceByIdController),
);

/**
 * @route POST /api/v1/providers/search
 * @description Search providers by location
 * @body { lat, lng, radius, category, subCategory, minRating, maxPrice, isAvailable, isVerified, page, limit }
 * @returns { providers, pagination } with 200 status
 * @access Public
 */
router.post(
  "/search",
  validateBody(providerSearchSchema),
  catchAsync(searchProvidersController),
);

/**
 * @route GET /api/v1/providers/top-rated
 * @description Get top rated providers
 * @query { category, limit }
 * @returns { providers } with 200 status
 * @access Public
 */
router.get("/top-rated", catchAsync(getTopRatedProvidersController));

/**
 * @route GET /api/v1/providers/featured
 * @description Get featured providers
 * @query { limit }
 * @returns { providers } with 200 status
 * @access Public
 */
router.get("/featured", catchAsync(getFeaturedProvidersController));

/**
 * @route GET /api/v1/providers/recent
 * @description Get recent providers
 * @query { limit }
 * @returns { providers } with 200 status
 * @access Public
 */
router.get("/recent", catchAsync(getRecentProvidersController));

/**
 * @route GET /api/v1/providers/category-suggestions
 * @description Get category suggestions
 * @query { search, limit }
 * @returns { categories } with 200 status
 * @access Public
 */
router.get(
  "/category-suggestions",
  catchAsync(getCategorySuggestionsController),
);

// ============================================================
// PROTECTED ROUTES
// ============================================================

// All protected provider routes require authentication
router.use(authenticate);

/**
 * @route POST /api/v1/providers/register
 * @description Register as a provider
 * @body { businessName, description, category, subCategory?, yearsExperience, hourlyRate?, locationLat, locationLng, address, city, subCity?, workingHours?, businessLogo? }
 * @returns { provider } with 201 status
 * @access Authenticated users only
 */
router.post(
  "/register",
  upload.single("businessLogo"),
  validateBody(providerRegistrationSchema),
  catchAsync(registerProviderController),
);

/**
 * @route GET /api/v1/providers/profile
 * @description Get my provider profile
 * @returns { provider } with 200 status
 * @access Authenticated users only
 */
router.get("/profile", catchAsync(getMyProviderProfileController));

/**
 * @route PUT /api/v1/providers/profile
 * @description Update my provider profile
 * @body { businessName?, description?, category?, subCategory?, yearsExperience?, hourlyRate?, isAvailable?, address?, city?, subCity?, workingHours?, businessLogo? }
 * @returns { updated provider } with 200 status
 * @access Authenticated users only
 */
router.put(
  "/profile",
  upload.single("businessLogo"),
  validateBody(updateProviderSchema),
  catchAsync(updateProviderProfileController),
);

/**
 * @route GET /api/v1/providers/verification-status
 * @description Get verification status
 * @returns { verificationStatus } with 200 status
 * @access Authenticated users only
 */
router.get("/verification-status", catchAsync(getVerificationStatusController));

/**
 * @route GET /api/v1/providers/dashboard
 * @description Get provider dashboard
 * @returns { dashboard } with 200 status
 * @access Authenticated users only
 */
router.get("/dashboard", catchAsync(getProviderDashboardController));

/**
 * @route PATCH /api/v1/providers/availability
 * @description Update availability status
 * @body { isAvailable }
 * @returns { updated provider } with 200 status
 * @access Authenticated users only
 */
router.patch("/availability", catchAsync(updateAvailabilityController));

/**
 * @route PUT /api/v1/providers/working-hours
 * @description Update working hours
 * @body { workingHours }
 * @returns { updated provider } with 200 status
 * @access Authenticated users only
 */
router.put("/working-hours", catchAsync(updateWorkingHoursController));

// ============================================================
// SERVICE MANAGEMENT
// ============================================================

/**
 * @route GET /api/v1/providers/services
 * @description Get my services
 * @returns { services } with 200 status
 * @access Authenticated users only
 */
router.get("/services", catchAsync(getProviderServicesController));

/**
 * @route POST /api/v1/providers/services
 * @description Create a service
 * @body { title, description, priceType, price, discountPrice?, estimatedDurationMinutes?, category, subCategory?, images? }
 * @returns { service } with 201 status
 * @access Authenticated users only
 */
router.post(
  "/services",
  upload.array("images", 5),
  validateBody(createServiceSchema),
  catchAsync(createServiceController),
);

/**
 * @route PUT /api/v1/providers/services/:id
 * @description Update a service
 * @param {id} - Service ID
 * @body { title?, description?, priceType?, price?, discountPrice?, estimatedDurationMinutes?, category?, subCategory?, isActive?, images? }
 * @returns { updated service } with 200 status
 * @access Authenticated users only
 */
router.put(
  "/services/:id",
  validateParams(serviceIdParamSchema),
  upload.array("images", 5),
  validateBody(updateServiceSchema),
  catchAsync(updateServiceController),
);

/**
 * @route DELETE /api/v1/providers/services/:id
 * @description Delete a service
 * @param {id} - Service ID
 * @returns { success: true } with 200 status
 * @access Authenticated users only
 */
router.delete(
  "/services/:id",
  validateParams(serviceIdParamSchema),
  catchAsync(deleteServiceController),
);

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * @route GET /api/v1/providers/stats
 * @description Get provider statistics (admin only)
 * @returns { stats } with 200 status
 * @access Admin only
 */
router.get("/stats", catchAsync(getProviderStatsController));

/**
 * @route PATCH /api/v1/admin/providers/:id/verify
 * @description Verify provider (admin only)
 * @param {id} - Provider ID
 * @body { status, notes? }
 * @returns { updated provider } with 200 status
 * @access Admin only
 */
router.patch(
  "/admin/providers/:id/verify",
  validateParams(providerIdParamSchema),
  catchAsync(verifyProviderController),
);

// ============================================================
// EXPORTS
// ============================================================

export default router;
