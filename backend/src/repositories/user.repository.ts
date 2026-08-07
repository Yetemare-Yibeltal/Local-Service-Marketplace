import { Prisma, User, UserRole, ProviderProfile } from "@prisma/client";
import prisma from "../config/database";
import { paginate } from "../config/database";

// ============================================================
// TYPES
// ============================================================

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface UserWithProvider extends User {
  providerProfile?: ProviderProfile | null;
}

export interface UserCreateData {
  email: string;
  phone: string;
  passwordHash: string;
  fullName: string;
  role?: UserRole;
}

export interface UserUpdateData {
  email?: string;
  phone?: string;
  passwordHash?: string;
  fullName?: string;
  bio?: string;
  profileImage?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: Date;
}

// ============================================================
// USER REPOSITORY
// ============================================================

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Find user by phone
 */
export async function findUserByPhone(phone: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({
      where: { phone },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Find user with provider profile by ID
 */
export async function findUserWithProviderById(
  id: string,
): Promise<UserWithProvider | null> {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        providerProfile: true,
      },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Create new user
 */
export async function createUser(data: UserCreateData): Promise<User> {
  try {
    return await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role || "CUSTOMER",
      },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  data: UserUpdateData,
): Promise<User> {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Delete user (soft delete by setting isActive to false)
 */
export async function deleteUser(id: string): Promise<User> {
  try {
    return await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Hard delete user (permanent deletion)
 */
export async function hardDeleteUser(id: string): Promise<User> {
  try {
    return await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Get users with pagination and filters
 */
export async function getUsers(
  filters: UserFilters,
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<{
  data: User[];
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
    const where: Prisma.UserWhereInput = {};

    // Apply filters
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
        { fullName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isEmailVerified !== undefined) {
      where.isEmailVerified = filters.isEmailVerified;
    }

    if (filters.isPhoneVerified !== undefined) {
      where.isPhoneVerified = filters.isPhoneVerified;
    }

    // Get total count
    const totalItems = await prisma.user.count({ where });

    // Get paginated data
    const skip = (page - 1) * limit;
    const data = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
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
    throw error;
  }
}

/**
 * Count users by role
 */
export async function countUsersByRole(): Promise<Record<UserRole, number>> {
  try {
    const result = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    const counts: Record<UserRole, number> = {
      CUSTOMER: 0,
      PROVIDER: 0,
      ADMIN: 0,
    };

    result.forEach((item) => {
      counts[item.role] = item._count.role;
    });

    return counts;
  } catch (error) {
    throw error;
  }
}

/**
 * Get total user count
 */
export async function getTotalUserCount(): Promise<number> {
  try {
    return await prisma.user.count();
  } catch (error) {
    throw error;
  }
}

/**
 * Get active user count
 */
export async function getActiveUserCount(): Promise<number> {
  try {
    return await prisma.user.count({
      where: { isActive: true },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Find user by email or phone (for login)
 */
export async function findUserByEmailOrPhone(
  email: string,
  phone?: string,
): Promise<User | null> {
  try {
    return await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone: phone || "" }],
      },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(id: string): Promise<User> {
  try {
    return await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if phone exists
 */
export async function phoneExists(phone: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    return !!user;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  findUserById,
  findUserByEmail,
  findUserByPhone,
  findUserWithProviderById,
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  getUsers,
  countUsersByRole,
  getTotalUserCount,
  getActiveUserCount,
  findUserByEmailOrPhone,
  updateLastLogin,
  emailExists,
  phoneExists,
};
