import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { sendForbidden, sendUnauthorized } from "../utils/response";
import prisma from "../config/database";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";

export interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage";
}

// ============================================================
// ROLE MIDDLEWARES
// ============================================================

/**
 * Require a specific role
 */
export function requireRole(role: UserRole) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void | Response => {
    if (!req.user) {
      return sendUnauthorized(res, "Authentication required", [
        "You must be logged in to access this resource",
      ]);
    }

    if (req.user.role !== role && req.user.role !== "ADMIN") {
      logger.warn(
        `Access denied: User ${req.user.id} with role ${req.user.role} attempted to access ${role}-only resource`,
      );
      return sendForbidden(res, `Access denied. ${role} role required.`, [
        `This resource requires ${role} privileges`,
      ]);
    }

    next();
  };
}

/**
 * Require one of multiple roles
 */
export function requireAnyRole(...roles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void | Response => {
    if (!req.user) {
      return sendUnauthorized(res, "Authentication required", [
        "You must be logged in to access this resource",
      ]);
    }

    // Admin has access to everything
    if (req.user.role === "ADMIN") {
      return next();
    }

    if (!roles.includes(req.user.role as UserRole)) {
      logger.warn(
        `Access denied: User ${req.user.id} with role ${req.user.role} attempted to access resource requiring ${roles.join(", ")}`,
      );
      return sendForbidden(res, "Insufficient permissions", [
        `Access requires one of: ${roles.join(", ")}`,
      ]);
    }

    next();
  };
}

// ============================================================
// CUSTOMER ROLE MIDDLEWARES
// ============================================================

/**
 * Require customer role
 */
export function requireCustomer() {
  return requireRole("CUSTOMER");
}

/**
 * Require customer or admin role
 */
export function requireCustomerOrAdmin() {
  return requireAnyRole("CUSTOMER", "ADMIN");
}

// ============================================================
// PROVIDER ROLE MIDDLEWARES
// ============================================================

/**
 * Require provider role
 */
export function requireProvider() {
  return requireRole("PROVIDER");
}

/**
 * Require provider or admin role
 */
export function requireProviderOrAdmin() {
  return requireAnyRole("PROVIDER", "ADMIN");
}

// ============================================================
// ADMIN ROLE MIDDLEWARES
// ============================================================

/**
 * Require admin role
 */
export function requireAdmin() {
  return requireRole("ADMIN");
}

// ============================================================
// RESOURCE OWNERSHIP MIDDLEWARES
// ============================================================

/**
 * Check if user owns the booking
 */
export async function isBookingOwner(
  req: Request,
  userId: string,
): Promise<boolean> {
  const bookingId = req.params.id || req.params.bookingId;
  if (!bookingId) {
    return false;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { customerId: true },
  });

  if (!booking) {
    return false;
  }

  return booking.customerId === userId;
}

/**
 * Check if user owns the provider profile
 */
export async function isProviderOwner(
  req: Request,
  userId: string,
): Promise<boolean> {
  const providerId = req.params.id || req.params.providerId;
  if (!providerId) {
    return false;
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    select: { userId: true },
  });

  if (!provider) {
    return false;
  }

  return provider.userId === userId;
}

/**
 * Check if user owns the service
 */
export async function isServiceOwner(
  req: Request,
  userId: string,
): Promise<boolean> {
  const serviceId = req.params.id || req.params.serviceId;
  if (!serviceId) {
    return false;
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      provider: {
        select: { userId: true },
      },
    },
  });

  if (!service || !service.provider) {
    return false;
  }

  return service.provider.userId === userId;
}

/**
 * Check if user owns the review
 */
export async function isReviewOwner(
  req: Request,
  userId: string,
): Promise<boolean> {
  const reviewId = req.params.id || req.params.reviewId;
  if (!reviewId) {
    return false;
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { reviewerId: true },
  });

  if (!review) {
    return false;
  }

  return review.reviewerId === userId;
}

/**
 * Generic ownership middleware
 */
export function requireOwnership(
  checkFn: (req: Request, userId: string) => Promise<boolean>,
) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    if (!req.user) {
      return sendUnauthorized(res, "Authentication required", [
        "You must be logged in to access this resource",
      ]);
    }

    // Admin bypasses ownership check
    if (req.user.role === "ADMIN") {
      return next();
    }

    try {
      const isOwner = await checkFn(req, req.user.id);

      if (!isOwner) {
        logger.warn(
          `Ownership denied: User ${req.user.id} attempted to access resource they do not own`,
        );
        return sendForbidden(res, "Access denied", [
          "You do not have permission to access this resource",
        ]);
      }

      next();
    } catch (error) {
      logger.error("Ownership check failed:", error);
      return sendForbidden(res, "Access denied", [
        "Unable to verify resource ownership",
      ]);
    }
  };
}

/**
 * Require booking ownership
 */
export function requireBookingOwner() {
  return requireOwnership(isBookingOwner);
}

/**
 * Require provider ownership
 */
export function requireProviderOwner() {
  return requireOwnership(isProviderOwner);
}

/**
 * Require service ownership
 */
export function requireServiceOwner() {
  return requireOwnership(isServiceOwner);
}

/**
 * Require review ownership
 */
export function requireReviewOwner() {
  return requireOwnership(isReviewOwner);
}

// ============================================================
// PERMISSION-BASED MIDDLEWARES
// ============================================================

/**
 * Role permissions matrix for the application
 */
export const permissions: Record<UserRole, Permission[]> = {
  CUSTOMER: [
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update" },
    { resource: "booking", action: "create" },
    { resource: "booking", action: "read" },
    { resource: "booking", action: "update" },
    { resource: "booking", action: "delete" },
    { resource: "review", action: "create" },
    { resource: "review", action: "read" },
    { resource: "review", action: "update" },
    { resource: "provider", action: "read" },
    { resource: "category", action: "read" },
    { resource: "search", action: "read" },
  ],
  PROVIDER: [
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update" },
    { resource: "provider", action: "read" },
    { resource: "provider", action: "update" },
    { resource: "service", action: "create" },
    { resource: "service", action: "read" },
    { resource: "service", action: "update" },
    { resource: "service", action: "delete" },
    { resource: "booking", action: "read" },
    { resource: "booking", action: "update" },
    { resource: "review", action: "read" },
    { resource: "review", action: "respond" },
    { resource: "earnings", action: "read" },
    { resource: "dashboard", action: "read" },
  ],
  ADMIN: [{ resource: "*", action: "manage" }],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  role: UserRole,
  resource: string,
  action: Permission["action"],
): boolean {
  const rolePermissions = permissions[role] || [];

  // Admin has all permissions
  if (role === "ADMIN") {
    return true;
  }

  return rolePermissions.some(
    (p) =>
      (p.resource === resource || p.resource === "*") &&
      (p.action === action || p.action === "manage"),
  );
}

/**
 * Require a specific permission
 */
export function requirePermission(
  resource: string,
  action: Permission["action"],
) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void | Response => {
    if (!req.user) {
      return sendUnauthorized(res, "Authentication required", [
        "You must be logged in to access this resource",
      ]);
    }

    const userRole = req.user.role as UserRole;

    // Admin has all permissions
    if (userRole === "ADMIN") {
      return next();
    }

    if (!hasPermission(userRole, resource, action)) {
      logger.warn(
        `Permission denied: User ${req.user.id} (${userRole}) attempted to ${action} on ${resource}`,
      );
      return sendForbidden(res, "Insufficient permissions", [
        `You do not have permission to ${action} ${resource}`,
      ]);
    }

    next();
  };
}

// ============================================================
// SELF USER CHECK
// ============================================================

/**
 * Check if the authenticated user is accessing their own resource
 */
export function requireSelfUser() {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void | Response => {
    if (!req.user) {
      return sendUnauthorized(res, "Authentication required", [
        "You must be logged in to access this resource",
      ]);
    }

    const userId = req.params.id || req.params.userId;

    if (!userId) {
      return sendForbidden(res, "User ID required", [
        "User ID must be provided in the URL",
      ]);
    }

    // Admin can access any user
    if (req.user.role === "ADMIN") {
      return next();
    }

    if (req.user.id !== userId) {
      logger.warn(
        `Self user check failed: User ${req.user.id} attempted to access user ${userId}`,
      );
      return sendForbidden(res, "Access denied", [
        "You can only access your own profile",
      ]);
    }

    next();
  };
}

// ============================================================
// PROVIDER VERIFICATION CHECK
// ============================================================

/**
 * Check if provider is verified
 */
export function requireVerifiedProvider() {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    if (!req.user) {
      return sendUnauthorized(res, "Authentication required", [
        "You must be logged in to access this resource",
      ]);
    }

    // Admin bypasses verification check
    if (req.user.role === "ADMIN") {
      return next();
    }

    if (req.user.role !== "PROVIDER") {
      return sendForbidden(res, "Provider role required", [
        "This resource is only available to providers",
      ]);
    }

    try {
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
        select: { isVerified: true },
      });

      if (!provider) {
        return sendForbidden(res, "Provider profile not found", [
          "You must register as a provider first",
        ]);
      }

      if (!provider.isVerified) {
        return sendForbidden(res, "Provider verification required", [
          "Your provider account must be verified to access this resource",
        ]);
      }

      next();
    } catch (error) {
      logger.error("Provider verification check failed:", error);
      return sendForbidden(res, "Access denied", [
        "Unable to verify provider status",
      ]);
    }
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  requireRole,
  requireAnyRole,
  requireCustomer,
  requireCustomerOrAdmin,
  requireProvider,
  requireProviderOrAdmin,
  requireAdmin,
  requireOwnership,
  requireBookingOwner,
  requireProviderOwner,
  requireServiceOwner,
  requireReviewOwner,
  requirePermission,
  requireSelfUser,
  requireVerifiedProvider,
  hasPermission,
  permissions,
  isBookingOwner,
  isProviderOwner,
  isServiceOwner,
  isReviewOwner,
};
