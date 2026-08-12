import { Request, Response, NextFunction } from "express";
import {
  verifyAccessToken,
  verifyRefreshToken,
  TokenPayload,
} from "../utils/jwt";
import { findUserById } from "../repositories/user.repository";
import { UnauthorizedError, ForbiddenError } from "../types/error.types";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
  userId: string;
  userRole: string;
  token?: string;
}

export type AuthOptions = {
  required?: boolean;
  roles?: string[];
  allowRefresh?: boolean;
};

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

/**
 * Main authentication middleware
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError("Authentication required", [
        "No token provided",
      ]);
    }

    const result = verifyAccessToken(token);

    if (!result.valid || !result.payload) {
      throw new UnauthorizedError("Invalid or expired token", [
        result.error || "Token validation failed",
      ]);
    }

    const { userId, email, role } = result.payload;

    // Verify user exists in database
    const user = await findUserById(userId);

    if (!user) {
      throw new UnauthorizedError("User not found", [
        "The user associated with this token no longer exists",
      ]);
    }

    if (!user.isActive) {
      throw new ForbiddenError("Account is deactivated", [
        "Your account has been deactivated",
      ]);
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    (req as AuthenticatedRequest).userId = user.id;
    (req as AuthenticatedRequest).userRole = user.role;
    (req as AuthenticatedRequest).token = token;

    logger.debug(`User authenticated: ${user.id} (${user.role})`);

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware (does not require token)
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const result = verifyAccessToken(token);

    if (!result.valid || !result.payload) {
      return next();
    }

    const { userId, email, role } = result.payload;

    const user = await findUserById(userId);

    if (user && user.isActive) {
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      };
      (req as AuthenticatedRequest).userId = user.id;
      (req as AuthenticatedRequest).userRole = user.role;
      (req as AuthenticatedRequest).token = token;
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      throw new UnauthorizedError("Authentication required", [
        "You must be logged in",
      ]);
    }

    if (!roles.includes(authReq.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${roles.join(" or ")}`,
        [
          `You have ${authReq.user.role} role but ${roles.join(" or ")} is required`,
        ],
      );
    }

    next();
  };
}

/**
 * Require customer role
 */
export function requireCustomer() {
  return requireRole("CUSTOMER", "ADMIN");
}

/**
 * Require provider role
 */
export function requireProvider() {
  return requireRole("PROVIDER", "ADMIN");
}

/**
 * Require admin role
 */
export function requireAdmin() {
  return requireRole("ADMIN");
}

/**
 * Check if user is customer or admin
 */
export function requireCustomerOrAdmin() {
  return requireRole("CUSTOMER", "ADMIN");
}

/**
 * Check if user is provider or admin
 */
export function requireProviderOrAdmin() {
  return requireRole("PROVIDER", "ADMIN");
}

// ============================================================
// RESOURCE OWNERSHIP MIDDLEWARE
// ============================================================

/**
 * Check if the authenticated user owns the resource
 * @param getResourceOwnerId - Function that returns the owner ID from the request
 */
export function requireOwnership(
  getResourceOwnerId: (req: Request) => Promise<string | null>,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      throw new UnauthorizedError("Authentication required", [
        "You must be logged in",
      ]);
    }

    // Admin bypass
    if (authReq.user.role === "ADMIN") {
      return next();
    }

    try {
      const ownerId = await getResourceOwnerId(req);

      if (!ownerId) {
        throw new ForbiddenError("Resource not found", [
          "The requested resource does not exist",
        ]);
      }

      if (authReq.user.id !== ownerId) {
        throw new ForbiddenError("Access denied", [
          "You do not own this resource",
        ]);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user owns a booking
 */
export function requireBookingOwner() {
  return requireOwnership(async (req: Request) => {
    const bookingId = req.params.id || req.params.bookingId;
    if (!bookingId) return null;

    const { findBookingById } =
      await import("../repositories/booking.repository");
    const booking = await findBookingById(bookingId);
    return booking?.customerId || null;
  });
}

/**
 * Check if user owns a provider profile
 */
export function requireProviderOwner() {
  return requireOwnership(async (req: Request) => {
    const providerId = req.params.id || req.params.providerId;
    if (!providerId) return null;

    const { findProviderById } =
      await import("../repositories/provider.repository");
    const provider = await findProviderById(providerId);
    return provider?.userId || null;
  });
}

/**
 * Check if user owns a review
 */
export function requireReviewOwner() {
  return requireOwnership(async (req: Request) => {
    const reviewId = req.params.id || req.params.reviewId;
    if (!reviewId) return null;

    const { findReviewById } =
      await import("../repositories/review.repository");
    const review = await findReviewById(reviewId);
    return review?.reviewerId || null;
  });
}

/**
 * Check if user owns a service
 */
export function requireServiceOwner() {
  return requireOwnership(async (req: Request) => {
    const serviceId = req.params.id || req.params.serviceId;
    if (!serviceId) return null;

    const { findServiceById } =
      await import("../repositories/provider.repository");
    const service = await findServiceById(serviceId);
    return service?.providerId || null;
  });
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Extract token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Get authenticated user from request (throws if not authenticated)
 */
export function getAuthenticatedUser(
  req: Request,
): AuthenticatedRequest["user"] {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    throw new UnauthorizedError("User not authenticated");
  }
  return authReq.user;
}

/**
 * Get user ID from request (throws if not authenticated)
 */
export function getUserId(req: Request): string {
  const user = getAuthenticatedUser(req);
  return user.id;
}

/**
 * Get user role from request (throws if not authenticated)
 */
export function getUserRole(req: Request): string {
  const user = getAuthenticatedUser(req);
  return user.role;
}

/**
 * Check if request is authenticated
 */
export function isAuthenticated(req: Request): boolean {
  const authReq = req as AuthenticatedRequest;
  return !!authReq.user;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  authenticate,
  optionalAuthenticate,
  requireRole,
  requireCustomer,
  requireProvider,
  requireAdmin,
  requireCustomerOrAdmin,
  requireProviderOrAdmin,
  requireOwnership,
  requireBookingOwner,
  requireProviderOwner,
  requireReviewOwner,
  requireServiceOwner,
  getAuthenticatedUser,
  getUserId,
  getUserRole,
  isAuthenticated,
};
