import internalProviderService from "./internal/provider.service";
import { findUserById } from "../repositories/user.repository";
import { findProviderById } from "../repositories/provider.repository";
import { createNotification } from "../repositories/notification.repository";
import logger from "../utils/logger";
import { cloudinaryService } from "./external";

// ============================================================
// PROVIDER SERVICE (ROOT LEVEL)
// This service re-exports all functionality from the internal
// provider service and adds application-specific convenience
// methods for provider registration, profile management,
// service management, verification, and analytics.
// ============================================================

// Re-export all methods from the internal service
export const {
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
} = internalProviderService;

// ============================================================
// TYPES
// ============================================================

export interface ProviderRegistrationData {
  userId: string;
  businessName: string;
  description: string;
  category: string;
  subCategory?: string;
  yearsExperience: number;
  hourlyRate?: number;
  locationLat: number;
  locationLng: number;
  address: string;
  city: string;
  subCity?: string;
  workingHours?: any;
  businessLogo?: Buffer | string;
}

export interface ProviderUpdateData {
  businessName?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
  address?: string;
  city?: string;
  subCity?: string;
  workingHours?: any;
  businessLogo?: Buffer | string;
}

export interface ServiceData {
  providerId: string;
  title: string;
  description: string;
  priceType: "FIXED" | "HOURLY";
  price: number;
  discountPrice?: number;
  estimatedDurationMinutes?: number;
  category: string;
  subCategory?: string;
  images?: Buffer[];
}

export interface ProviderAvailabilityData {
  providerId: string;
  isAvailable: boolean;
  workingHours?: any;
}

export interface ProviderSearchData {
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
}

// ============================================================
// APPLICATION-SPECIFIC PROVIDER METHODS
// ============================================================

/**
 * Register a new provider with full profile setup
 */
export async function registerNewProvider(
  data: ProviderRegistrationData,
): Promise<any> {
  try {
    // Validate user exists
    const user = await findUserById(data.userId);
    if (!user) {
      throw new Error(`User ${data.userId} not found`);
    }

    // Check if user is already a provider
    const existingProvider = await getProviderProfileByUserId(data.userId);
    if (existingProvider) {
      throw new Error("User is already registered as a provider");
    }

    // Upload business logo if provided
    let businessLogoUrl: string | undefined;
    if (data.businessLogo) {
      try {
        const uploadResult = await cloudinaryService.uploadProviderLogo(
          data.businessLogo,
          data.userId,
        );
        businessLogoUrl = uploadResult.secureUrl;
      } catch (error) {
        logger.error("Business logo upload failed:", error);
        // Continue without logo
      }
    }

    // Register provider
    const provider = await registerProvider({
      ...data,
      businessLogo: businessLogoUrl as any,
    });

    // Create welcome notification
    await createNotification({
      userId: data.userId,
      type: "EMAIL",
      title: "Provider Registration Successful",
      message: `Your business "${data.businessName}" has been registered successfully. Please wait for verification.`,
      data: { providerId: provider.id },
    });

    logger.info(`Provider registered: ${provider.id} for user ${data.userId}`);

    return provider;
  } catch (error) {
    logger.error("Register new provider failed:", error);
    throw error;
  }
}

/**
 * Get provider with full details including services and user
 */
export async function getProviderWithFullDetails(
  providerId: string,
): Promise<any> {
  try {
    const provider = await getProviderProfileById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const services = await getProviderServices(providerId);

    return {
      ...provider,
      services,
    };
  } catch (error) {
    logger.error(`Get provider with full details ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get provider by user ID with full details
 */
export async function getProviderByUserIdWithDetails(
  userId: string,
): Promise<any> {
  try {
    const provider = await getProviderProfileByUserId(userId);
    if (!provider) {
      return null;
    }

    const services = await getProviderServices(provider.id);

    return {
      ...provider,
      services,
    };
  } catch (error) {
    logger.error(
      `Get provider by user ID with details ${userId} failed:`,
      error,
    );
    throw error;
  }
}

/**
 * Update provider profile with optional logo upload
 */
export async function updateProviderWithLogo(
  userId: string,
  data: ProviderUpdateData,
): Promise<any> {
  try {
    const provider = await getProviderProfileByUserId(userId);
    if (!provider) {
      throw new Error(`Provider not found for user ${userId}`);
    }

    // Upload new business logo if provided
    let businessLogoUrl: string | undefined;
    if (data.businessLogo) {
      try {
        // Delete old logo if exists
        if (provider.businessLogo) {
          const publicId = provider.businessLogo
            .split("/")
            .pop()
            ?.split(".")[0];
          if (publicId) {
            await cloudinaryService.deleteFile(
              `marketplace/providers/${publicId}`,
            );
          }
        }

        const uploadResult = await cloudinaryService.uploadProviderLogo(
          data.businessLogo,
          userId,
        );
        businessLogoUrl = uploadResult.secureUrl;
      } catch (error) {
        logger.error("Business logo upload failed:", error);
        // Continue without updating logo
      }
    }

    const updatedProvider = await updateProviderProfile(userId, {
      ...data,
      businessLogo: businessLogoUrl as any,
    });

    logger.info(`Provider profile updated for user ${userId}`);

    return updatedProvider;
  } catch (error) {
    logger.error(`Update provider with logo for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Create a new service with image uploads
 */
export async function createServiceWithImages(data: ServiceData): Promise<any> {
  try {
    // Validate provider exists
    const provider = await getProviderProfileById(data.providerId);
    if (!provider) {
      throw new Error(`Provider ${data.providerId} not found`);
    }

    // Upload images
    let imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      try {
        for (let i = 0; i < data.images.length && i < 5; i++) {
          const uploadResult = await cloudinaryService.uploadServiceImage(
            data.images[i],
            data.providerId,
          );
          imageUrls.push(uploadResult.secureUrl);
        }
      } catch (error) {
        logger.error("Service image upload failed:", error);
      }
    }

    const service = await createServiceForProvider(data.providerId, {
      ...data,
      images: imageUrls as any,
    });

    logger.info(
      `Service created: ${service.id} for provider ${data.providerId}`,
    );

    return service;
  } catch (error) {
    logger.error("Create service with images failed:", error);
    throw error;
  }
}

/**
 * Update service with new images
 */
export async function updateServiceWithImages(
  serviceId: string,
  providerId: string,
  data: any,
): Promise<any> {
  try {
    // Validate service belongs to provider
    const existingService = await getServiceById(serviceId);
    if (!existingService) {
      throw new Error(`Service ${serviceId} not found`);
    }

    if (existingService.providerId !== providerId) {
      throw new Error("You do not have permission to update this service");
    }

    // Upload new images if provided
    let imageUrls: string[] | undefined;
    if (data.images && data.images.length > 0) {
      // Delete old images
      if (existingService.images && existingService.images.length > 0) {
        for (const imageUrl of existingService.images) {
          const publicId = imageUrl.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinaryService.deleteFile(
              `marketplace/services/${publicId}`,
            );
          }
        }
      }

      imageUrls = [];
      for (let i = 0; i < data.images.length && i < 5; i++) {
        const uploadResult = await cloudinaryService.uploadServiceImage(
          data.images[i],
          providerId,
        );
        imageUrls.push(uploadResult.secureUrl);
      }
    }

    const updatedService = await updateServiceForProvider(
      serviceId,
      providerId,
      {
        ...data,
        images: imageUrls as any,
      },
    );

    logger.info(`Service ${serviceId} updated`);

    return updatedService;
  } catch (error) {
    logger.error(`Update service with images ${serviceId} failed:`, error);
    throw error;
  }
}

/**
 * Get provider with earnings summary
 */
export async function getProviderWithEarnings(
  providerId: string,
  period: "today" | "week" | "month" | "year" = "month",
): Promise<any> {
  try {
    const provider = await getProviderProfileById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Import payment service dynamically to avoid circular dependency
    const { getProviderEarnings } = await import("./payment.service");

    const earnings = await getProviderEarnings(providerId, period);

    return {
      provider,
      earnings,
    };
  } catch (error) {
    logger.error(`Get provider with earnings ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Search providers with geolocation and text query
 */
export async function searchProvidersWithQuery(
  data: ProviderSearchData,
): Promise<any> {
  try {
    // If query is provided, use text search; otherwise use location search
    if (data.query && data.query.length >= 2) {
      const { textSearchProviders } = await import("./search.service");
      return await textSearchProviders({
        query: data.query,
        category: data.category,
        minRating: data.minRating,
        page: data.page || 1,
        limit: data.limit || 20,
      });
    }

    return await searchProviders({
      lat: data.lat,
      lng: data.lng,
      radius: data.radius || 10,
      category: data.category,
      subCategory: data.subCategory,
      minRating: data.minRating,
      maxPrice: data.maxPrice,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isVerified: data.isVerified,
      page: data.page || 1,
      limit: data.limit || 20,
    });
  } catch (error) {
    logger.error("Search providers with query failed:", error);
    throw error;
  }
}

/**
 * Get provider verification status
 */
export async function getProviderVerificationStatus(
  providerId: string,
): Promise<{
  isVerified: boolean;
  status: string;
  verificationDate: Date | null;
  notes: string | null;
}> {
  try {
    const provider = await getProviderProfileById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return {
      isVerified: provider.isVerified,
      status: provider.verificationStatus || "PENDING",
      verificationDate: provider.verificationDate || null,
      notes: provider.verificationNotes || null,
    };
  } catch (error) {
    logger.error(
      `Get provider verification status ${providerId} failed:`,
      error,
    );
    throw error;
  }
}

/**
 * Check if provider is available
 */
export async function isProviderAvailable(
  providerId: string,
): Promise<boolean> {
  try {
    const provider = await getProviderProfileById(providerId);
    if (!provider) {
      return false;
    }

    return provider.isAvailable || false;
  } catch (error) {
    logger.error(`Check provider available ${providerId} failed:`, error);
    return false;
  }
}

/**
 * Get top rated providers
 */
export async function getTopRatedProviders(
  category?: string,
  limit: number = 10,
): Promise<any[]> {
  try {
    const filters: any = {
      isAvailable: true,
      isVerified: true,
      minRating: 4.0,
      ...(category && { category }),
    };

    const result = await getProviderList(
      filters,
      1,
      limit,
      "averageRating",
      "desc",
    );

    return result.data;
  } catch (error) {
    logger.error("Get top rated providers failed:", error);
    throw error;
  }
}

/**
 * Get featured providers
 */
export async function getFeaturedProvidersList(
  limit: number = 10,
): Promise<any[]> {
  try {
    const filters = {
      isAvailable: true,
      isVerified: true,
      isFeatured: true,
    };

    const result = await getProviderList(filters, 1, limit);

    return result.data;
  } catch (error) {
    logger.error("Get featured providers failed:", error);
    throw error;
  }
}

/**
 * Get recently registered providers
 */
export async function getRecentProviders(limit: number = 10): Promise<any[]> {
  try {
    const filters = {
      isAvailable: true,
      isVerified: true,
    };

    const result = await getProviderList(
      filters,
      1,
      limit,
      "createdAt",
      "desc",
    );

    return result.data;
  } catch (error) {
    logger.error("Get recent providers failed:", error);
    throw error;
  }
}

/**
 * Bulk update provider availability
 */
export async function bulkUpdateProviderAvailability(
  providerIds: string[],
  isAvailable: boolean,
): Promise<number> {
  try {
    let updatedCount = 0;

    for (const providerId of providerIds) {
      try {
        await updateProviderAvailability(providerId, isAvailable);
        updatedCount++;
      } catch (error) {
        logger.error(
          `Failed to update availability for provider ${providerId}:`,
          error,
        );
      }
    }

    logger.info(`Bulk updated availability for ${updatedCount} providers`);

    return updatedCount;
  } catch (error) {
    logger.error("Bulk update provider availability failed:", error);
    throw error;
  }
}

/**
 * Get provider category suggestions
 */
export async function getProviderCategorySuggestions(
  search: string,
  limit: number = 10,
): Promise<string[]> {
  try {
    const { prisma } = require("../config/database");

    const categories = await prisma.providerProfile.findMany({
      where: {
        category: {
          contains: search,
          mode: "insensitive",
        },
      },
      select: {
        category: true,
      },
      distinct: ["category"],
      take: limit,
    });

    return categories.map((c: any) => c.category);
  } catch (error) {
    logger.error("Get provider category suggestions failed:", error);
    return [];
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Re-export internal service methods
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

  // Application-specific methods
  registerNewProvider,
  getProviderWithFullDetails,
  getProviderByUserIdWithDetails,
  updateProviderWithLogo,
  createServiceWithImages,
  updateServiceWithImages,
  getProviderWithEarnings,
  searchProvidersWithQuery,
  getProviderVerificationStatus,
  isProviderAvailable,
  getTopRatedProviders,
  getFeaturedProvidersList,
  getRecentProviders,
  bulkUpdateProviderAvailability,
  getProviderCategorySuggestions,
};
