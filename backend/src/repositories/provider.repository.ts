import { Prisma, ProviderProfile, Service, PrismaClient } from "@prisma/client";
import prisma from "../config/database";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface ProviderFilters {
  search?: string;
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

export interface ProviderCreateData {
  userId: string;
  businessName: string;
  businessLogo?: string;
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
}

export interface ProviderUpdateData {
  businessName?: string;
  businessLogo?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  address?: string;
  city?: string;
  subCity?: string;
  workingHours?: any;
  averageRating?: number;
  totalReviews?: number;
  completedJobs?: number;
  responseTime?: number;
  isFeatured?: boolean;
  locationLat?: number;
  locationLng?: number;
}

export interface ProviderWithUser extends ProviderProfile {
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  services?: Service[];
}

export interface ProviderSearchResult {
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
// PROVIDER REPOSITORY
// ============================================================

/**
 * Create a new provider profile
 */
export async function createProvider(
  data: ProviderCreateData,
): Promise<ProviderProfile> {
  try {
    return await prisma.providerProfile.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        businessLogo: data.businessLogo,
        description: data.description,
        category: data.category,
        subCategory: data.subCategory,
        yearsExperience: data.yearsExperience,
        hourlyRate: data.hourlyRate,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        address: data.address,
        city: data.city,
        subCity: data.subCity,
        workingHours: data.workingHours,
        verificationStatus: "PENDING",
      },
    });
  } catch (error) {
    logger.error("Create provider failed:", error);
    throw error;
  }
}

/**
 * Find provider by ID
 */
export async function findProviderById(
  id: string,
): Promise<ProviderWithUser | null> {
  try {
    return await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (error) {
    logger.error(`Find provider ${id} failed:`, error);
    throw error;
  }
}

/**
 * Find provider by user ID
 */
export async function findProviderByUserId(
  userId: string,
): Promise<ProviderProfile | null> {
  try {
    return await prisma.providerProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    logger.error(`Find provider by user ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Find provider with user by user ID
 */
export async function findProviderWithUserByUserId(
  userId: string,
): Promise<ProviderWithUser | null> {
  try {
    return await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        services: {
          where: { isActive: true },
        },
      },
    });
  } catch (error) {
    logger.error(`Find provider with user by ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Update provider profile
 */
export async function updateProvider(
  id: string,
  data: ProviderUpdateData,
): Promise<ProviderProfile> {
  try {
    return await prisma.providerProfile.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`Update provider ${id} failed:`, error);
    throw error;
  }
}

/**
 * Delete provider profile (soft delete)
 */
export async function deleteProvider(id: string): Promise<ProviderProfile> {
  try {
    return await prisma.providerProfile.update({
      where: { id },
      data: { isAvailable: false },
    });
  } catch (error) {
    logger.error(`Delete provider ${id} failed:`, error);
    throw error;
  }
}

/**
 * Hard delete provider profile
 */
export async function hardDeleteProvider(id: string): Promise<ProviderProfile> {
  try {
    return await prisma.providerProfile.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Hard delete provider ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get providers with filters and pagination
 */
export async function getProviders(
  filters: ProviderFilters,
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
    const where: Prisma.ProviderProfileWhereInput = {};

    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { address: { contains: filters.search, mode: "insensitive" } },
        {
          user: { fullName: { contains: filters.search, mode: "insensitive" } },
        },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.subCategory) {
      where.subCategory = filters.subCategory;
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: "insensitive" };
    }

    if (filters.minRating !== undefined) {
      where.averageRating = { gte: filters.minRating };
    }

    if (filters.maxPrice !== undefined) {
      where.hourlyRate = { lte: filters.maxPrice };
    }

    if (filters.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.minExperience !== undefined) {
      where.yearsExperience = { gte: filters.minExperience };
    }

    if (filters.maxExperience !== undefined) {
      where.yearsExperience = {
        ...where.yearsExperience,
        lte: filters.maxExperience,
      };
    }

    const totalItems = await prisma.providerProfile.count({ where });

    const skip = (page - 1) * limit;
    const data = await prisma.providerProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        services: {
          where: { isActive: true },
          take: 5,
        },
      },
    });

    const totalPages = Math.ceil(totalItems / limit);
    const pagination = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, pagination };
  } catch (error) {
    logger.error("Get providers failed:", error);
    throw error;
  }
}

/**
 * Search providers by location with radius
 */
export async function searchProvidersByLocation(
  lat: number,
  lng: number,
  radius: number = 10,
  filters: ProviderFilters = {},
  page: number = 1,
  limit: number = 20,
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
    // Build where clause
    const where: Prisma.ProviderProfileWhereInput = {
      isAvailable: true,
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.subCategory) {
      where.subCategory = filters.subCategory;
    }

    if (filters.minRating !== undefined) {
      where.averageRating = { gte: filters.minRating };
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    // Get all providers with filters (without pagination first)
    const providers = await prisma.providerProfile.findMany({
      where,
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
    });

    // Calculate distance and filter by radius
    const withDistance = providers
      .map((provider) => {
        const distance = calculateDistance(
          lat,
          lng,
          provider.locationLat,
          provider.locationLng,
        );
        return {
          ...provider,
          distance,
        };
      })
      .filter((item) => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    const totalItems = withDistance.length;
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
    const data = withDistance.slice(skip, skip + limit);

    const pagination = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, pagination };
  } catch (error) {
    logger.error("Search providers by location failed:", error);
    throw error;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Verify provider
 */
export async function verifyProvider(
  id: string,
  isVerified: boolean,
  verificationNotes?: string,
): Promise<ProviderProfile> {
  try {
    return await prisma.providerProfile.update({
      where: { id },
      data: {
        isVerified,
        verificationStatus: isVerified ? "APPROVED" : "REJECTED",
        verificationNotes,
        verificationDate: new Date(),
      },
    });
  } catch (error) {
    logger.error(`Verify provider ${id} failed:`, error);
    throw error;
  }
}

/**
 * Update provider rating
 */
export async function updateProviderRating(
  id: string,
): Promise<ProviderProfile> {
  try {
    const result = await prisma.review.aggregate({
      where: { providerId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return await prisma.providerProfile.update({
      where: { id },
      data: {
        averageRating: result._avg.rating || 0,
        totalReviews: result._count.rating || 0,
      },
    });
  } catch (error) {
    logger.error(`Update provider rating ${id} failed:`, error);
    throw error;
  }
}

/**
 * Increment completed jobs count
 */
export async function incrementCompletedJobs(
  id: string,
): Promise<ProviderProfile> {
  try {
    return await prisma.providerProfile.update({
      where: { id },
      data: {
        completedJobs: { increment: 1 },
      },
    });
  } catch (error) {
    logger.error(`Increment completed jobs ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get provider count by category
 */
export async function getProviderCountByCategory(): Promise<
  Record<string, number>
> {
  try {
    const result = await prisma.providerProfile.groupBy({
      by: ["category"],
      _count: {
        category: true,
      },
    });

    const counts: Record<string, number> = {};
    result.forEach((item) => {
      counts[item.category] = item._count.category;
    });

    return counts;
  } catch (error) {
    logger.error("Get provider count by category failed:", error);
    throw error;
  }
}

/**
 * Get total provider count
 */
export async function getTotalProviderCount(): Promise<number> {
  try {
    return await prisma.providerProfile.count();
  } catch (error) {
    logger.error("Get total provider count failed:", error);
    throw error;
  }
}

/**
 * Get active provider count
 */
export async function getActiveProviderCount(): Promise<number> {
  try {
    return await prisma.providerProfile.count({
      where: { isAvailable: true },
    });
  } catch (error) {
    logger.error("Get active provider count failed:", error);
    throw error;
  }
}

/**
 * Get verified provider count
 */
export async function getVerifiedProviderCount(): Promise<number> {
  try {
    return await prisma.providerProfile.count({
      where: { isVerified: true },
    });
  } catch (error) {
    logger.error("Get verified provider count failed:", error);
    throw error;
  }
}

// ============================================================
// SERVICE MANAGEMENT
// ============================================================

/**
 * Create a service
 */
export async function createService(data: {
  providerId: string;
  title: string;
  description: string;
  priceType: string;
  price: number;
  discountPrice?: number;
  estimatedDurationMinutes?: number;
  category: string;
  subCategory?: string;
  images?: string[];
}): Promise<Service> {
  try {
    return await prisma.service.create({
      data: {
        providerId: data.providerId,
        title: data.title,
        description: data.description,
        priceType: data.priceType as any,
        price: data.price,
        discountPrice: data.discountPrice,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        category: data.category,
        subCategory: data.subCategory,
        images: data.images || [],
      },
    });
  } catch (error) {
    logger.error("Create service failed:", error);
    throw error;
  }
}

/**
 * Find service by ID
 */
export async function findServiceById(id: string): Promise<Service | null> {
  try {
    return await prisma.service.findUnique({
      where: { id },
    });
  } catch (error) {
    logger.error(`Find service ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get services by provider ID
 */
export async function getServicesByProvider(
  providerId: string,
): Promise<Service[]> {
  try {
    return await prisma.service.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error(`Get services by provider ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Update service
 */
export async function updateService(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    priceType: string;
    price: number;
    discountPrice: number;
    estimatedDurationMinutes: number;
    category: string;
    subCategory: string;
    isActive: boolean;
    images: string[];
  }>,
): Promise<Service> {
  try {
    return await prisma.service.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`Update service ${id} failed:`, error);
    throw error;
  }
}

/**
 * Delete service
 */
export async function deleteService(id: string): Promise<Service> {
  try {
    return await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    logger.error(`Delete service ${id} failed:`, error);
    throw error;
  }
}

/**
 * Hard delete service
 */
export async function hardDeleteService(id: string): Promise<Service> {
  try {
    return await prisma.service.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Hard delete service ${id} failed:`, error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createProvider,
  findProviderById,
  findProviderByUserId,
  findProviderWithUserByUserId,
  updateProvider,
  deleteProvider,
  hardDeleteProvider,
  getProviders,
  searchProvidersByLocation,
  calculateDistance,
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
  hardDeleteService,
};
