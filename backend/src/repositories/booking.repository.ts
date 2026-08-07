import {
  Prisma,
  Booking,
  BookingStatus,
  ProviderProfile,
  Service,
} from "@prisma/client";
import prisma from "../config/database";
import { generateBookingReference } from "../utils/bcrypt";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface BookingFilters {
  status?: BookingStatus;
  customerId?: string;
  providerId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface BookingCreateData {
  customerId: string;
  providerId: string;
  serviceId?: string;
  scheduledDate: Date;
  address: string;
  specialNotes?: string;
  totalPrice: number;
  depositAmount?: number;
}

export interface BookingUpdateData {
  status?: BookingStatus;
  scheduledDate?: Date;
  address?: string;
  specialNotes?: string;
  totalPrice?: number;
  depositAmount?: number;
  confirmedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: string;
  providerLat?: number;
  providerLng?: number;
  customerLat?: number;
  customerLng?: number;
}

export interface BookingWithRelations extends Booking {
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  provider?: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    averageRating: number;
  };
  service?: {
    id: string;
    title: string;
    description: string;
    price: number;
    priceType: string;
  } | null;
  review?: {
    id: string;
    rating: number;
    comment: string;
  } | null;
  payment?: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
  } | null;
}

export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  disputedBookings: number;
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyBookings: number;
  completionRate: number;
}

// ============================================================
// BOOKING REPOSITORY
// ============================================================

/**
 * Generate unique booking number
 */
export async function generateBookingNumber(): Promise<string> {
  let bookingNumber: string;
  let exists: boolean;
  let attempts = 0;

  do {
    bookingNumber = generateBookingReference();
    const existing = await prisma.booking.findUnique({
      where: { bookingNumber },
      select: { id: true },
    });
    exists = !!existing;
    attempts++;

    if (attempts > 10) {
      const timestamp = Date.now().toString(36).toUpperCase();
      bookingNumber = `BKG-${timestamp}`;
      break;
    }
  } while (exists);

  return bookingNumber;
}

/**
 * Create a new booking
 */
export async function createBooking(data: BookingCreateData): Promise<Booking> {
  try {
    const bookingNumber = await generateBookingNumber();

    return await prisma.booking.create({
      data: {
        bookingNumber,
        customerId: data.customerId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        scheduledDate: data.scheduledDate,
        address: data.address,
        specialNotes: data.specialNotes,
        totalPrice: data.totalPrice,
        depositAmount: data.depositAmount || 0,
        status: "PENDING",
      },
    });
  } catch (error) {
    logger.error("Create booking failed:", error);
    throw error;
  }
}

/**
 * Find booking by ID with relations
 */
export async function findBookingById(
  id: string,
): Promise<BookingWithRelations | null> {
  try {
    return await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        provider: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessLogo: true,
            category: true,
            averageRating: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            priceType: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Find booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Find booking by booking number
 */
export async function findBookingByNumber(
  bookingNumber: string,
): Promise<BookingWithRelations | null> {
  try {
    return await prisma.booking.findUnique({
      where: { bookingNumber },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        provider: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessLogo: true,
            category: true,
            averageRating: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            priceType: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Find booking by number ${bookingNumber} failed:`, error);
    throw error;
  }
}

/**
 * Update booking
 */
export async function updateBooking(
  id: string,
  data: BookingUpdateData,
): Promise<Booking> {
  try {
    return await prisma.booking.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`Update booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Update booking status with validation
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  cancellationReason?: string,
  cancelledBy?: string,
): Promise<Booking> {
  try {
    const updateData: any = { status };

    if (status === "CONFIRMED") {
      updateData.confirmedAt = new Date();
    } else if (status === "IN_PROGRESS") {
      updateData.startedAt = new Date();
    } else if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
      if (cancelledBy) {
        updateData.cancelledBy = cancelledBy;
      }
    }

    return await prisma.booking.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    logger.error(`Update booking status ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get bookings with filters and pagination
 */
export async function getBookings(
  filters: BookingFilters,
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<{
  data: BookingWithRelations[];
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
    const where: Prisma.BookingWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters.startDate) {
      where.scheduledDate = { gte: filters.startDate };
    }

    if (filters.endDate) {
      where.scheduledDate = { ...where.scheduledDate, lte: filters.endDate };
    }

    if (filters.search) {
      where.OR = [
        { bookingNumber: { contains: filters.search, mode: "insensitive" } },
        { address: { contains: filters.search, mode: "insensitive" } },
        {
          customer: {
            fullName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          provider: {
            businessName: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    if (filters.minPrice !== undefined) {
      where.totalPrice = { gte: filters.minPrice };
    }

    if (filters.maxPrice !== undefined) {
      where.totalPrice = { ...where.totalPrice, lte: filters.maxPrice };
    }

    const totalItems = await prisma.booking.count({ where });

    const skip = (page - 1) * limit;
    const data = await prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        provider: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessLogo: true,
            category: true,
            averageRating: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            priceType: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
          },
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
    logger.error("Get bookings failed:", error);
    throw error;
  }
}

/**
 * Get bookings by customer ID
 */
export async function getBookingsByCustomer(
  customerId: string,
  status?: BookingStatus,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: BookingWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  return getBookings(
    {
      customerId,
      status,
    },
    page,
    limit,
    "createdAt",
    "desc",
  );
}

/**
 * Get bookings by provider ID
 */
export async function getBookingsByProvider(
  providerId: string,
  status?: BookingStatus,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: BookingWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  return getBookings(
    {
      providerId,
      status,
    },
    page,
    limit,
    "createdAt",
    "desc",
  );
}

/**
 * Cancel booking
 */
export async function cancelBooking(
  id: string,
  reason: string,
  cancelledBy: string,
): Promise<Booking> {
  try {
    return await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledBy: cancelledBy,
      },
    });
  } catch (error) {
    logger.error(`Cancel booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Confirm booking
 */
export async function confirmBooking(id: string): Promise<Booking> {
  try {
    return await prisma.booking.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error(`Confirm booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Start booking (mark as IN_PROGRESS)
 */
export async function startBooking(id: string): Promise<Booking> {
  try {
    return await prisma.booking.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error(`Start booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Complete booking
 */
export async function completeBooking(id: string): Promise<Booking> {
  try {
    return await prisma.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error(`Complete booking ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get dashboard statistics for provider
 */
export async function getProviderDashboardStats(
  providerId: string,
): Promise<DashboardStats> {
  try {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      disputedBookings,
      totalEarnings,
    ] = await Promise.all([
      prisma.booking.count({ where: { providerId } }),
      prisma.booking.count({ where: { providerId, status: "PENDING" } }),
      prisma.booking.count({ where: { providerId, status: "CONFIRMED" } }),
      prisma.booking.count({ where: { providerId, status: "IN_PROGRESS" } }),
      prisma.booking.count({ where: { providerId, status: "COMPLETED" } }),
      prisma.booking.count({ where: { providerId, status: "CANCELLED" } }),
      prisma.booking.count({ where: { providerId, status: "DISPUTED" } }),
      prisma.booking.aggregate({
        where: { providerId, status: "COMPLETED" },
        _sum: { totalPrice: true },
      }),
    ]);

    // Monthly earnings
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyEarnings = await prisma.booking.aggregate({
      where: {
        providerId,
        status: "COMPLETED",
        completedAt: { gte: monthStart },
      },
      _sum: { totalPrice: true },
    });

    // Weekly bookings
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyBookings = await prisma.booking.count({
      where: {
        providerId,
        createdAt: { gte: weekStart },
      },
    });

    const completionRate =
      totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      disputedBookings,
      totalEarnings: totalEarnings._sum.totalPrice || 0,
      monthlyEarnings: monthlyEarnings._sum.totalPrice || 0,
      weeklyBookings,
      completionRate,
    };
  } catch (error) {
    logger.error(
      `Get provider dashboard stats for ${providerId} failed:`,
      error,
    );
    throw error;
  }
}

/**
 * Get dashboard statistics for customer
 */
export async function getCustomerDashboardStats(customerId: string): Promise<{
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  disputedBookings: number;
  totalSpent: number;
}> {
  try {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      disputedBookings,
      totalSpent,
    ] = await Promise.all([
      prisma.booking.count({ where: { customerId } }),
      prisma.booking.count({ where: { customerId, status: "PENDING" } }),
      prisma.booking.count({ where: { customerId, status: "CONFIRMED" } }),
      prisma.booking.count({ where: { customerId, status: "IN_PROGRESS" } }),
      prisma.booking.count({ where: { customerId, status: "COMPLETED" } }),
      prisma.booking.count({ where: { customerId, status: "CANCELLED" } }),
      prisma.booking.count({ where: { customerId, status: "DISPUTED" } }),
      prisma.booking.aggregate({
        where: { customerId, status: "COMPLETED" },
        _sum: { totalPrice: true },
      }),
    ]);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      disputedBookings,
      totalSpent: totalSpent._sum.totalPrice || 0,
    };
  } catch (error) {
    logger.error(
      `Get customer dashboard stats for ${customerId} failed:`,
      error,
    );
    throw error;
  }
}

/**
 * Get booking count by status
 */
export async function getBookingCountByStatus(): Promise<
  Record<BookingStatus, number>
> {
  try {
    const result = await prisma.booking.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const counts: Record<BookingStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      DISPUTED: 0,
    };

    result.forEach((item) => {
      counts[item.status] = item._count.status;
    });

    return counts;
  } catch (error) {
    logger.error("Get booking count by status failed:", error);
    throw error;
  }
}

/**
 * Check if booking exists
 */
export async function bookingExists(id: string): Promise<boolean> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!booking;
  } catch (error) {
    logger.error(`Check booking exists ${id} failed:`, error);
    throw error;
  }
}

/**
 * Check if customer owns booking
 */
export async function isBookingCustomer(
  id: string,
  customerId: string,
): Promise<boolean> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { customerId: true },
    });
    return booking?.customerId === customerId;
  } catch (error) {
    logger.error(`Check booking customer ${id} failed:`, error);
    throw error;
  }
}

/**
 * Check if provider owns booking
 */
export async function isBookingProvider(
  id: string,
  providerId: string,
): Promise<boolean> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { providerId: true },
    });
    return booking?.providerId === providerId;
  } catch (error) {
    logger.error(`Check booking provider ${id} failed:`, error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  generateBookingNumber,
  createBooking,
  findBookingById,
  findBookingByNumber,
  updateBooking,
  updateBookingStatus,
  getBookings,
  getBookingsByCustomer,
  getBookingsByProvider,
  cancelBooking,
  confirmBooking,
  startBooking,
  completeBooking,
  getProviderDashboardStats,
  getCustomerDashboardStats,
  getBookingCountByStatus,
  bookingExists,
  isBookingCustomer,
  isBookingProvider,
};
