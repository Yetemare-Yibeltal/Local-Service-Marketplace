import { ProviderProfile, Service } from "@prisma/client";
import {
  createProvider,
  findProviderById,
  findProviderByUserId,
  findProviderWithUserByUserId,
  updateProvider,
  deleteProvider,
  getProviders,
  searchProvidersByLocation,
  verifyProvider,
  updateProviderRating,
  incrementCompletedJobs,
  getProviderCountByCategory,
  getTotalProviderCount,
  getActiveProviderCount,
  getVerifiedProviderCount,
  createService,
  findServiceById,
  getServicesByProvider,
  updateService,
  deleteService,
  ProviderCreateData,
  ProviderUpdateData,
  ProviderWithUser,
  ProviderSearchResult,
} from "../../repositories/provider.repository";
import { findUserById, updateUser } from "../../repositories/user.repository";
import { createNotification } from "../../repositories/notification.repository";
import {
  sendEmail,
  getProviderVerificationEmailTemplate,
} from "../../config/email";
import {
  sendSMS,
  getProviderVerificationSMSTemplate,
} from "../../config/twilio";
import {
  uploadProviderLogo,
  uploadServiceImage,
} from "../../config/cloudinary";
import logger from "../../utils/logger";
import { validateRequired, isValidLength } from "../../utils/validator";

// ============================================================
// TYPES
// ============================================================

export interface RegisterProviderData {
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
  businessLogo?: Buffer;
}

export interface UpdateProviderData {
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
  businessLogo?: Buffer;
}

export interface CreateServiceData {
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

export interface UpdateServiceData {
  title?: string;
  description?: string;
  priceType?: "FIXED" | "HOURLY";
  price?: number;
  discountPrice?: number;
  estimatedDurationMinutes?: number;
  category?: string;
  subCategory?: string;
  isActive?: boolean;
  images?: Buffer[];
}

export interface ProviderSearchData {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  subCategory?: string;
  minRating?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

export interface ProviderStats {
  totalProviders: number;
  activeProviders: number;
  verifiedProviders: number;
  providersByCategory: Record<string, number>;
}

export interface ProviderDashboardData {
  profile: ProviderWithUser | null;
  stats: {
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
    responseTime: number | null;
    completionRate: number;
  };
  recentServices: Service[];
}

// ============================================================
// PROVIDER SERVICE
// ============================================================

/**
 * Register a new provider
 */
export async function registerProvider(
  data: RegisterProviderData,
): Promise<ProviderProfile> {
  try {
    // Validate user exists
    const user = await findUserById(data.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is already a provider
    const existingProvider = await findProviderByUserId(data.userId);
    if (existingProvider) {
      throw new Error("User is already registered as a provider");
    }

    // Validate required fields
    if (!data.businessName || data.businessName.length < 2) {
      throw new Error("Business name must be at least 2 characters");
    }

    if (!data.description || data.description.length < 10) {
      throw new Error("Description must be at least 10 characters");
    }

    if (!data.category) {
      throw new Error("Category is required");
    }

    // Upload business logo if provided
    let businessLogoUrl: string | undefined;
    if (data.businessLogo) {
      try {
        const uploadResult = await uploadProviderLogo(
          data.businessLogo,
          data.userId,
        );
        businessLogoUrl = uploadResult.secure_url;
      } catch (error) {
        logger.error("Business logo upload failed:", error);
        // Continue without logo
      }
    }

    // Create provider profile
    const providerData: ProviderCreateData = {
      userId: data.userId,
      businessName: data.businessName,
      description: data.description,
      category: data.category,
      subCategory: data.subCategory,
      yearsExperience: data.yearsExperience || 0,
      hourlyRate: data.hourlyRate,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      address: data.address,
      city: data.city,
      subCity: data.subCity,
      workingHours: data.workingHours,
      businessLogo: businessLogoUrl,
    };

    const provider = await createProvider(providerData);

    // Update user role to PROVIDER
    await updateUser(data.userId, { role: "PROVIDER" });

    // Create notification
    await createNotification({
      userId: data.userId,
      type: "EMAIL",
      title: "Provider Registration Submitted",
      message: `Your provider registration for "${data.businessName}" has been submitted for verification.`,
    });

    logger.info(`Provider registered: ${provider.id} for user ${data.userId}`);

    return provider;
  } catch (error) {
    logger.error("Register provider failed:", error);
    throw error;
  }
}

/**
 * Get provider profile by ID
 */
export async function getProviderProfileById(
  providerId: string,
): Promise<ProviderWithUser | null> {
  try {
    return await findProviderById(providerId);
  } catch (error) {
    logger.error(`Get provider profile ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get provider profile by user ID
 */
export async function getProviderProfileByUserId(
  userId: string,
): Promise<ProviderWithUser | null> {
  try {
    return await findProviderWithUserByUserId(userId);
  } catch (error) {
    logger.error(`Get provider profile by user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Update provider profile
 */
export async function updateProviderProfile(
  userId: string,
  data: UpdateProviderData,
): Promise<ProviderProfile | null> {
  try {
    // Find provider by user ID
    const provider = await findProviderByUserId(userId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    // Upload new business logo if provided
    let businessLogoUrl: string | undefined;
    if (data.businessLogo) {
      try {
        const uploadResult = await uploadProviderLogo(
          data.businessLogo,
          userId,
        );
        businessLogoUrl = uploadResult.secure_url;
      } catch (error) {
        logger.error("Business logo upload failed:", error);
      }
    }

    const updateData: ProviderUpdateData = {
      businessName: data.businessName,
      description: data.description,
      category: data.category,
      subCategory: data.subCategory,
      yearsExperience: data.yearsExperience,
      hourlyRate: data.hourlyRate,
      isAvailable: data.isAvailable,
      address: data.address,
      city: data.city,
      subCity: data.subCity,
      workingHours: data.workingHours,
      businessLogo: businessLogoUrl,
    };

    const updatedProvider = await updateProvider(provider.id, updateData);

    logger.info(`Provider profile updated for user ${userId}`);

    return updatedProvider;
  } catch (error) {
    logger.error(`Update provider profile for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Search providers by location
 */
export async function searchProviders(data: ProviderSearchData): Promise<{
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
    const filters = {
      category: data.category,
      subCategory: data.subCategory,
      minRating: data.minRating,
      maxPrice: data.maxPrice,
      isAvailable: data.isAvailable,
      isVerified: data.isVerified,
    };

    return await searchProvidersByLocation(
      data.lat,
      data.lng,
      data.radius || 10,
      filters,
      data.page || 1,
      data.limit || 20,
    );
  } catch (error) {
    logger.error("Search providers failed:", error);
    throw error;
  }
}

/**
 * Get providers with filters
 */
export async function getProviderList(
  filters: {
    search?: string;
    category?: string;
    city?: string;
    minRating?: number;
    isAvailable?: boolean;
    isVerified?: boolean;
    isFeatured?: boolean;
  },
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<{
  data: ProviderWithUser[];
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
    return await getProviders(filters, page, limit, sortBy, sortOrder);
  } catch (error) {
    logger.error("Get provider list failed:", error);
    throw error;
  }
}

/**
 * Verify provider
 */
export async function verifyProviderProfile(
  providerId: string,
  isVerified: boolean,
  notes?: string,
): Promise<ProviderProfile> {
  try {
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    const updatedProvider = await verifyProvider(providerId, isVerified, notes);

    // Send email notification
    try {
      const user = await findUserById(provider.userId);
      if (user) {
        const emailTemplate = getProviderVerificationEmailTemplate({
          businessName: provider.businessName,
          status: isVerified ? "APPROVED" : "REJECTED",
          notes,
        });

        await sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        // Send SMS
        await sendSMS({
          to: user.phone,
          body: getProviderVerificationSMSTemplate(
            provider.businessName,
            isVerified ? "APPROVED" : "REJECTED",
          ),
        });
      }
    } catch (error) {
      logger.error("Failed to send verification notification:", error);
    }

    // Create notification
    await createNotification({
      userId: provider.userId,
      type: "EMAIL",
      title: isVerified ? "Provider Verified" : "Provider Verification Review",
      message: isVerified
        ? `Your business "${provider.businessName}" has been verified successfully.`
        : `Your business "${provider.businessName}" verification needs review. ${notes || ""}`,
    });

    logger.info(`Provider ${providerId} verification status: ${isVerified}`);

    return updatedProvider;
  } catch (error) {
    logger.error(`Verify provider ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get provider statistics
 */
export async function getProviderStatistics(): Promise<ProviderStats> {
  try {
    const [total, active, verified, byCategory] = await Promise.all([
      getTotalProviderCount(),
      getActiveProviderCount(),
      getVerifiedProviderCount(),
      getProviderCountByCategory(),
    ]);

    return {
      totalProviders: total,
      activeProviders: active,
      verifiedProviders: verified,
      providersByCategory: byCategory,
    };
  } catch (error) {
    logger.error("Get provider statistics failed:", error);
    throw error;
  }
}

/**
 * Get provider dashboard data
 */
export async function getProviderDashboard(
  providerId: string,
): Promise<ProviderDashboardData> {
  try {
    const provider = await findProviderWithUserByUserId(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    // Get services
    const services = await getServicesByProvider(provider.id);

    // Calculate stats (this would come from booking repository)
    // For now, use placeholder stats from provider record
    const stats = {
      totalBookings: provider.completedJobs || 0,
      completedBookings: provider.completedJobs || 0,
      pendingBookings: 0,
      totalEarnings: 0,
      averageRating: provider.averageRating || 0,
      totalReviews: provider.totalReviews || 0,
      responseTime: provider.responseTime || null,
      completionRate: provider.completedJobs > 0 ? 100 : 0,
    };

    return {
      profile: provider,
      stats,
      recentServices: services.slice(0, 5),
    };
  } catch (error) {
    logger.error(`Get provider dashboard for ${providerId} failed:`, error);
    throw error;
  }
}

// ============================================================
// SERVICE MANAGEMENT
// ============================================================

/**
 * Create a service
 */
export async function createServiceForProvider(
  providerId: string,
  data: CreateServiceData,
): Promise<Service> {
  try {
    // Verify provider exists
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    // Validate data
    if (!data.title || data.title.length < 3) {
      throw new Error("Title must be at least 3 characters");
    }

    if (!data.description || data.description.length < 10) {
      throw new Error("Description must be at least 10 characters");
    }

    if (data.price < 0) {
      throw new Error("Price cannot be negative");
    }

    // Upload images
    let imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      try {
        for (const image of data.images.slice(0, 5)) {
          const uploadResult = await uploadServiceImage(image, providerId);
          imageUrls.push(uploadResult.secure_url);
        }
      } catch (error) {
        logger.error("Service image upload failed:", error);
      }
    }

    const service = await createService({
      providerId,
      title: data.title,
      description: data.description,
      priceType: data.priceType,
      price: data.price,
      discountPrice: data.discountPrice,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      category: data.category,
      subCategory: data.subCategory,
      images: imageUrls,
    });

    logger.info(`Service created: ${service.id} for provider ${providerId}`);

    return service;
  } catch (error) {
    logger.error(`Create service for provider ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get services for provider
 */
export async function getProviderServices(
  providerId: string,
): Promise<Service[]> {
  try {
    return await getServicesByProvider(providerId);
  } catch (error) {
    logger.error(`Get services for provider ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get service by ID
 */
export async function getServiceById(
  serviceId: string,
): Promise<Service | null> {
  try {
    return await findServiceById(serviceId);
  } catch (error) {
    logger.error(`Get service ${serviceId} failed:`, error);
    throw error;
  }
}

/**
 * Update service
 */
export async function updateServiceForProvider(
  serviceId: string,
  providerId: string,
  data: UpdateServiceData,
): Promise<Service> {
  try {
    // Verify service belongs to provider
    const existingService = await findServiceById(serviceId);
    if (!existingService) {
      throw new Error("Service not found");
    }

    if (existingService.providerId !== providerId) {
      throw new Error("You do not have permission to update this service");
    }

    // Upload new images if provided
    let imageUrls: string[] | undefined;
    if (data.images && data.images.length > 0) {
      imageUrls = [];
      try {
        for (const image of data.images.slice(0, 5)) {
          const uploadResult = await uploadServiceImage(image, providerId);
          imageUrls.push(uploadResult.secure_url);
        }
      } catch (error) {
        logger.error("Service image upload failed:", error);
      }
    }

    const updateData: any = {
      title: data.title,
      description: data.description,
      priceType: data.priceType,
      price: data.price,
      discountPrice: data.discountPrice,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      category: data.category,
      subCategory: data.subCategory,
      isActive: data.isActive,
    };

    if (imageUrls) {
      updateData.images = imageUrls;
    }

    const updatedService = await updateService(serviceId, updateData);

    logger.info(`Service ${serviceId} updated`);

    return updatedService;
  } catch (error) {
    logger.error(`Update service ${serviceId} failed:`, error);
    throw error;
  }
}

/**
 * Delete service
 */
export async function deleteServiceForProvider(
  serviceId: string,
  providerId: string,
): Promise<Service> {
  try {
    // Verify service belongs to provider
    const existingService = await findServiceById(serviceId);
    if (!existingService) {
      throw new Error("Service not found");
    }

    if (existingService.providerId !== providerId) {
      throw new Error("You do not have permission to delete this service");
    }

    const deletedService = await deleteService(serviceId);

    logger.info(`Service ${serviceId} deleted`);

    return deletedService;
  } catch (error) {
    logger.error(`Delete service ${serviceId} failed:`, error);
    throw error;
  }
}

// ============================================================
// AVAILABILITY MANAGEMENT
// ============================================================

/**
 * Update provider availability
 */
export async function updateProviderAvailability(
  providerId: string,
  isAvailable: boolean,
): Promise<ProviderProfile> {
  try {
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    const updatedProvider = await updateProvider(providerId, { isAvailable });

    logger.info(`Provider ${providerId} availability set to ${isAvailable}`);

    return updatedProvider;
  } catch (error) {
    logger.error(`Update provider availability ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Update working hours
 */
export async function updateWorkingHours(
  providerId: string,
  workingHours: any,
): Promise<ProviderProfile> {
  try {
    const provider = await findProviderById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    const updatedProvider = await updateProvider(providerId, { workingHours });

    logger.info(`Working hours updated for provider ${providerId}`);

    return updatedProvider;
  } catch (error) {
    logger.error(`Update working hours for ${providerId} failed:`, error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
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
};
