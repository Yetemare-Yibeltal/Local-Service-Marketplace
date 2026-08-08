import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import {
  registerProvider,
  getProviderProfileById,
  getProviderProfileByUserId,
  updateProviderProfile,
  searchProviders,
  getProviderList,
  verifyProviderProfile,
  getProviderStatistics,
  getProviderDashboard,
  createServiceForProvider,
  getProviderServices,
  getServiceById,
  updateServiceForProvider,
  deleteServiceForProvider,
  updateProviderAvailability,
  updateWorkingHours,
} from "../services/internal/provider.service";
import {
  providerRegistrationSchema,
  updateProviderSchema,
  providerIdParamSchema,
  providerFilterSchema,
  providerSearchSchema,
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  availabilitySchema,
  bulkAvailabilitySchema,
} from "../schemas/provider.schema";
import { USER_ROLES } from "../utils/constants";
import logger from "../utils/logger";

// ============================================================
// PROVIDER CONTROLLER
// ============================================================

/**
 * Register a new provider
 * @route POST /api/v1/providers/register
 * @description Registers a user as a service provider
 * @header Authorization: Bearer {accessToken}
 * @body { businessName, description, category, subCategory?, yearsExperience, hourlyRate?, locationLat, locationLng, address, city, subCity?, workingHours?, businessLogo? }
 * @returns { provider } with 201 status
 */
export const registerProviderController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = providerRegistrationSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const provider = await registerProvider({
      userId,
      businessName: validatedData.businessName,
      description: validatedData.description,
      category: validatedData.category,
      subCategory: validatedData.subCategory,
      yearsExperience: validatedData.yearsExperience,
      hourlyRate: validatedData.hourlyRate,
      locationLat: validatedData.locationLat,
      locationLng: validatedData.locationLng,
      address: validatedData.address,
      city: validatedData.city,
      subCity: validatedData.subCity,
      workingHours: validatedData.workingHours,
      businessLogo: req.file?.buffer,
    });

    sendSuccess(res, provider, "Provider registered successfully", 201);
  },
);

/**
 * Get provider profile by ID
 * @route GET /api/v1/providers/:id
 * @description Retrieves a provider's public profile by ID
 * @param {id} - Provider ID
 * @returns { provider } with 200 status
 */
export const getProviderProfileController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = providerIdParamSchema.parse(req.params);

    const provider = await getProviderProfileById(validatedParams.id);

    if (!provider) {
      sendError(res, "Provider not found", 404);
      return;
    }

    sendSuccess(res, provider, "Provider retrieved successfully");
  },
);

/**
 * Get provider profile by user ID (authenticated)
 * @route GET /api/v1/providers/profile
 * @description Retrieves the authenticated user's provider profile
 * @header Authorization: Bearer {accessToken}
 * @returns { provider } with 200 status
 */
export const getMyProviderProfileController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const provider = await getProviderProfileByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    sendSuccess(res, provider, "Provider profile retrieved successfully");
  },
);

/**
 * Update provider profile
 * @route PUT /api/v1/providers/profile
 * @description Updates the authenticated user's provider profile
 * @header Authorization: Bearer {accessToken}
 * @body { businessName?, description?, category?, subCategory?, yearsExperience?, hourlyRate?, isAvailable?, address?, city?, subCity?, workingHours?, businessLogo? }
 * @returns { updated provider } with 200 status
 */
export const updateProviderProfileController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = updateProviderSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const provider = await updateProviderProfile(userId, {
      businessName: validatedData.businessName,
      description: validatedData.description,
      category: validatedData.category,
      subCategory: validatedData.subCategory,
      yearsExperience: validatedData.yearsExperience,
      hourlyRate: validatedData.hourlyRate,
      isAvailable: validatedData.isAvailable,
      address: validatedData.address,
      city: validatedData.city,
      subCity: validatedData.subCity,
      workingHours: validatedData.workingHours,
      businessLogo: req.file?.buffer,
    });

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    sendSuccess(res, provider, "Provider profile updated successfully");
  },
);

/**
 * Get provider list with filters
 * @route GET /api/v1/providers
 * @description Retrieves all providers with optional filters
 * @query { page, limit, category, subCategory, city, minRating, maxPrice, isAvailable, isVerified, isFeatured, search, sortBy, sortOrder }
 * @returns { providers, pagination } with 200 status
 */
export const getProviderListController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = providerFilterSchema.parse(req.query);

    const result = await getProviderList(
      {
        search: validatedQuery.search,
        category: validatedQuery.category,
        city: validatedQuery.city,
        minRating: validatedQuery.minRating,
        isAvailable: validatedQuery.isAvailable,
        isVerified: validatedQuery.isVerified,
        isFeatured: validatedQuery.isFeatured,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 20,
      validatedQuery.sortBy || "createdAt",
      validatedQuery.sortOrder || "desc",
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

/**
 * Search providers by location
 * @route POST /api/v1/providers/search
 * @description Searches for providers near a location with filters
 * @body { lat, lng, radius, category, subCategory, minRating, maxPrice, isAvailable, isVerified, page, limit }
 * @returns { providers, pagination } with 200 status
 */
export const searchProvidersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = providerSearchSchema.parse(req.body);

    const result = await searchProviders({
      lat: validatedData.lat,
      lng: validatedData.lng,
      radius: validatedData.radius || 10,
      category: validatedData.category,
      subCategory: validatedData.subCategory,
      minRating: validatedData.minRating,
      maxPrice: validatedData.maxPrice,
      isAvailable:
        validatedData.isAvailable !== undefined
          ? validatedData.isAvailable
          : true,
      isVerified: validatedData.isVerified,
      page: validatedData.page || 1,
      limit: validatedData.limit || 20,
    });

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
 * Get provider statistics (admin only)
 * @route GET /api/v1/providers/stats
 * @description Gets overall provider statistics
 * @header Authorization: Bearer {accessToken}
 * @returns { stats } with 200 status
 */
export const getProviderStatsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const stats = await getProviderStatistics();

    sendSuccess(res, stats, "Provider statistics retrieved successfully");
  },
);

/**
 * Get provider dashboard
 * @route GET /api/v1/providers/dashboard
 * @description Gets the authenticated provider's dashboard data
 * @header Authorization: Bearer {accessToken}
 * @returns { dashboard } with 200 status
 */
export const getProviderDashboardController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const dashboard = await getProviderDashboard(userId);

    if (!dashboard) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    sendSuccess(res, dashboard, "Provider dashboard retrieved successfully");
  },
);

// ============================================================
// SERVICE MANAGEMENT
// ============================================================

/**
 * Create a service for a provider
 * @route POST /api/v1/providers/services
 * @description Creates a new service for the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @body { title, description, priceType, price, discountPrice?, estimatedDurationMinutes?, category, subCategory?, images? }
 * @returns { service } with 201 status
 */
export const createServiceController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = createServiceSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get provider profile for this user
    const provider = await getProviderProfileByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const service = await createServiceForProvider(provider.id, {
      title: validatedData.title,
      description: validatedData.description,
      priceType: validatedData.priceType,
      price: validatedData.price,
      discountPrice: validatedData.discountPrice,
      estimatedDurationMinutes: validatedData.estimatedDurationMinutes,
      category: validatedData.category,
      subCategory: validatedData.subCategory,
      images: req.files as any,
    });

    sendSuccess(res, service, "Service created successfully", 201);
  },
);

/**
 * Get provider services
 * @route GET /api/v1/providers/services
 * @description Retrieves all services for the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @returns { services } with 200 status
 */
export const getProviderServicesController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get provider profile for this user
    const provider = await getProviderProfileByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const services = await getProviderServices(provider.id);

    sendSuccess(res, services, "Services retrieved successfully");
  },
);

/**
 * Get service by ID
 * @route GET /api/v1/providers/services/:id
 * @description Retrieves a specific service by ID
 * @param {id} - Service ID
 * @returns { service } with 200 status
 */
export const getServiceByIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = serviceIdParamSchema.parse(req.params);

    const service = await getServiceById(validatedParams.id);

    if (!service) {
      sendError(res, "Service not found", 404);
      return;
    }

    sendSuccess(res, service, "Service retrieved successfully");
  },
);

/**
 * Update service
 * @route PUT /api/v1/providers/services/:id
 * @description Updates a service for the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Service ID
 * @body { title?, description?, priceType?, price?, discountPrice?, estimatedDurationMinutes?, category?, subCategory?, isActive?, images? }
 * @returns { updated service } with 200 status
 */
export const updateServiceController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = serviceIdParamSchema.parse(req.params);
    const validatedData = updateServiceSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get provider profile for this user
    const provider = await getProviderProfileByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const service = await updateServiceForProvider(
      validatedParams.id,
      provider.id,
      {
        title: validatedData.title,
        description: validatedData.description,
        priceType: validatedData.priceType,
        price: validatedData.price,
        discountPrice: validatedData.discountPrice,
        estimatedDurationMinutes: validatedData.estimatedDurationMinutes,
        category: validatedData.category,
        subCategory: validatedData.subCategory,
        isActive: validatedData.isActive,
        images: req.files as any,
      },
    );

    sendSuccess(res, service, "Service updated successfully");
  },
);

/**
 * Delete service
 * @route DELETE /api/v1/providers/services/:id
 * @description Deletes a service for the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Service ID
 * @returns { success: true } with 200 status
 */
export const deleteServiceController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = serviceIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get provider profile for this user
    const provider = await getProviderProfileByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    await deleteServiceForProvider(validatedParams.id, provider.id);

    sendSuccess(res, null, "Service deleted successfully");
  },
);

// ============================================================
// AVAILABILITY MANAGEMENT
// ============================================================

/**
 * Update provider availability
 * @route PATCH /api/v1/providers/availability
 * @description Updates the availability status of the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @body { isAvailable }
 * @returns { updated provider } with 200 status
 */
export const updateAvailabilityController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { isAvailable } = req.body;

    if (isAvailable === undefined || typeof isAvailable !== "boolean") {
      sendError(res, "isAvailable boolean is required", 400);
      return;
    }

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get provider profile for this user
    const provider = await getProviderProfileByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const updatedProvider = await updateProviderAvailability(
      provider.id,
      isAvailable,
    );

    sendSuccess(
      res,
      updatedProvider,
      "Provider availability updated successfully",
    );
  },
);

/**
 * Update working hours
 * @route PUT /api/v1/providers/working-hours
 * @description Updates the working hours of the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @body { workingHours }
 * @returns { updated provider } with 200 status
 */
export const updateWorkingHoursController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { workingHours } = req.body;

    if (!workingHours || typeof workingHours !== "object") {
      sendError(res, "Working hours object is required", 400);
      return;
    }

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get provider profile for this user
    const provider = await getProviderProfileByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    const updatedProvider = await updateWorkingHours(provider.id, workingHours);

    sendSuccess(res, updatedProvider, "Working hours updated successfully");
  },
);

// ============================================================
// ADMIN VERIFICATION
// ============================================================

/**
 * Verify provider (admin only)
 * @route PATCH /api/v1/admin/providers/:id/verify
 * @description Verifies or rejects a provider (admin only)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Provider ID
 * @body { status, notes? }
 * @returns { updated provider } with 200 status
 */
export const verifyProviderController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = providerIdParamSchema.parse(req.params);
    const { status, notes } = req.body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      sendError(res, "Status must be APPROVED or REJECTED", 400);
      return;
    }

    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const provider = await verifyProviderProfile(
      validatedParams.id,
      status === "APPROVED",
      notes,
    );

    sendSuccess(res, provider, `Provider ${status.toLowerCase()} successfully`);
  },
);

/**
 * Get provider verification status
 * @route GET /api/v1/providers/verification-status
 * @description Gets the verification status of the authenticated provider
 * @header Authorization: Bearer {accessToken}
 * @returns { verificationStatus } with 200 status
 */
export const getVerificationStatusController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Get provider profile for this user
    const provider = await getProviderProfileByUserId(userId);

    if (!provider) {
      sendError(res, "Provider profile not found", 404);
      return;
    }

    sendSuccess(
      res,
      {
        isVerified: provider.isVerified,
        verificationStatus: provider.verificationStatus || "PENDING",
        verificationDate: provider.verificationDate,
        verificationNotes: provider.verificationNotes,
      },
      "Verification status retrieved successfully",
    );
  },
);

// ============================================================
// PROVIDER DISCOVERY
// ============================================================

/**
 * Get top rated providers
 * @route GET /api/v1/providers/top-rated
 * @description Retrieves top rated providers
 * @query { category, limit }
 * @returns { providers } with 200 status
 */
export const getTopRatedProvidersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { category, limit } = req.query;

    const { getTopRatedProviders } =
      await import("../services/provider.service");

    const providers = await getTopRatedProviders(
      category as string,
      limit ? parseInt(limit as string) : 10,
    );

    sendSuccess(res, providers, "Top rated providers retrieved successfully");
  },
);

/**
 * Get featured providers
 * @route GET /api/v1/providers/featured
 * @description Retrieves featured providers
 * @query { limit }
 * @returns { providers } with 200 status
 */
export const getFeaturedProvidersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { limit } = req.query;

    const { getFeaturedProvidersList } =
      await import("../services/provider.service");

    const providers = await getFeaturedProvidersList(
      limit ? parseInt(limit as string) : 10,
    );

    sendSuccess(res, providers, "Featured providers retrieved successfully");
  },
);

/**
 * Get recent providers
 * @route GET /api/v1/providers/recent
 * @description Retrieves recently registered providers
 * @query { limit }
 * @returns { providers } with 200 status
 */
export const getRecentProvidersController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { limit } = req.query;

    const { getRecentProviders } = await import("../services/provider.service");

    const providers = await getRecentProviders(
      limit ? parseInt(limit as string) : 10,
    );

    sendSuccess(res, providers, "Recent providers retrieved successfully");
  },
);

/**
 * Get provider category suggestions
 * @route GET /api/v1/providers/category-suggestions
 * @description Gets category suggestions for a search term
 * @query { search, limit }
 * @returns { categories } with 200 status
 */
export const getCategorySuggestionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { search, limit } = req.query;

    if (!search || typeof search !== "string" || search.length < 2) {
      sendSuccess(res, [], "Category suggestions retrieved successfully");
      return;
    }

    const { getProviderCategorySuggestions } =
      await import("../services/provider.service");

    const categories = await getProviderCategorySuggestions(
      search,
      limit ? parseInt(limit as string) : 10,
    );

    sendSuccess(res, categories, "Category suggestions retrieved successfully");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
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
};
