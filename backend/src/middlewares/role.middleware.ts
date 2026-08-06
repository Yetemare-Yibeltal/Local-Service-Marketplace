import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { sendForbidden, sendUnauthorized } from "../utils/response";
import { USER_ROLES } from "../utils/constants";
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

/**
 * Require all specified roles
 */
export function requireAllRoles(...roles: UserRole[]) {
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

    const hasAllRoles = roles.every((role) => req.user?.role === role);

    if (!hasAllRoles) {
      logger.warn(
        `Access denied: User ${req.user.id} with role ${req.user.role} does not have all required roles: ${roles.join(", ")}`,
      );
      return sendForbidden(res, "Insufficient permissions", [
        `Access requires all of: ${roles.join(", ")}`,
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
 * Check if the authenticated user owns the resource
 * @param getResourceOwnerId - Function that returns the owner ID from the request
 */
export function requireOwnership(
  getResourceOwnerId: (req: Request) => Promise<string | null>,
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
      const ownerId = await getResourceOwnerId(req);

      if (!ownerId) {
        return sendForbidden(res, "Resource not found", [
          "The requested resource does not exist",
        ]);
      }

      if (req.user.id !== ownerId) {
        logger.warn(
          `Ownership denied: User ${req.user.id} attempted to access resource owned by ${ownerId}`,
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

// ============================================================
// PERMISSION-BASED MIDDLEWARES
// ============================================================

/**
 * Define role permissions
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
// EXPORTS
// ============================================================

export default {
  requireRole,
  requireAnyRole,
  requireAllRoles,
  requireCustomer,
  requireCustomerOrAdmin,
  requireProvider,
  requireProviderOrAdmin,
  requireAdmin,
  requireOwnership,
  requirePermission,
  requireSelfUser,
  hasPermission,
  permissions,
};
