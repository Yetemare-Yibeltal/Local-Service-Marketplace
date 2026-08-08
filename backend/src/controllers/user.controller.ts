import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import {
  getUserProfile,
  updateUserProfile,
  getUsersList,
  getUserByEmail,
  getUserByPhone,
  checkEmailExists,
  checkPhoneExists,
  createUserByAdmin,
  updateUserByAdmin,
  deactivateUser,
  activateUser,
  permanentlyDeleteUser,
  getUserStatistics,
} from "../services/internal/user.service";
import {
  updateProfileSchema,
  userIdParamSchema,
  userFilterSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from "../schemas/user.schema";
import { USER_ROLES } from "../utils/constants";
import logger from "../utils/logger";

// ============================================================
// USER CONTROLLER
// ============================================================

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 * @description Retrieves the authenticated user's profile
 * @header Authorization: Bearer {accessToken}
 * @returns { user } with 200 status
 */
export const getMyProfile = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const user = await getUserProfile(userId);

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user, "User profile retrieved successfully");
  },
);

/**
 * Update current user profile
 * @route PUT /api/v1/users/profile
 * @description Updates the authenticated user's profile
 * @header Authorization: Bearer {accessToken}
 * @body { fullName?, phone?, bio?, profileImage? }
 * @returns { updated user } with 200 status
 */
export const updateMyProfile = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = updateProfileSchema.parse(req.body);

    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const user = await updateUserProfile(userId, {
      fullName: validatedData.fullName,
      phone: validatedData.phone,
      bio: validatedData.bio,
      profileImage: validatedData.profileImage,
    });

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user, "User profile updated successfully");
  },
);

/**
 * Get user by ID (admin only)
 * @route GET /api/v1/users/:userId
 * @description Retrieves a user by ID (admin only)
 * @header Authorization: Bearer {accessToken}
 * @param {userId} - User ID
 * @returns { user } with 200 status
 */
export const getUserById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = userIdParamSchema.parse(req.params);

    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { findUserById } = await import("../repositories/user.repository");
    const user = await findUserById(validatedParams.userId);

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user, "User retrieved successfully");
  },
);

/**
 * Get all users with filters (admin only)
 * @route GET /api/v1/users
 * @description Retrieves all users with pagination and filters (admin only)
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, search, role, isActive, isEmailVerified, isPhoneVerified, sortBy, sortOrder }
 * @returns { users, pagination } with 200 status
 */
export const getUsers = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedQuery = userFilterSchema.parse(req.query);

    const result = await getUsersList(
      {
        search: validatedQuery.search,
        role: validatedQuery.role,
        isActive: validatedQuery.isActive,
        isEmailVerified: validatedQuery.isEmailVerified,
        isPhoneVerified: validatedQuery.isPhoneVerified,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 10,
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
 * Get user statistics (admin only)
 * @route GET /api/v1/users/stats
 * @description Gets overall user statistics (admin only)
 * @header Authorization: Bearer {accessToken}
 * @returns { stats } with 200 status
 */
export const getUserStats = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const stats = await getUserStatistics();

    sendSuccess(res, stats, "User statistics retrieved successfully");
  },
);

/**
 * Create user by admin
 * @route POST /api/v1/users
 * @description Creates a new user (admin only)
 * @header Authorization: Bearer {accessToken}
 * @body { email, phone, password, fullName, role, isEmailVerified?, isPhoneVerified?, isActive? }
 * @returns { user } with 201 status
 */
export const createUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedData = adminCreateUserSchema.parse(req.body);

    const user = await createUserByAdmin(validatedData);

    sendSuccess(res, user, "User created successfully", 201);
  },
);

/**
 * Update user by admin
 * @route PUT /api/v1/users/:userId
 * @description Updates a user (admin only)
 * @header Authorization: Bearer {accessToken}
 * @param {userId} - User ID
 * @body { fullName?, phone?, email?, role?, isEmailVerified?, isPhoneVerified?, isActive?, bio? }
 * @returns { updated user } with 200 status
 */
export const updateUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = userIdParamSchema.parse(req.params);
    const validatedData = adminUpdateUserSchema.parse(req.body);

    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const user = await updateUserByAdmin(validatedParams.userId, validatedData);

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user, "User updated successfully");
  },
);

/**
 * Deactivate user (admin only)
 * @route POST /api/v1/users/:userId/deactivate
 * @description Deactivates a user (admin only)
 * @header Authorization: Bearer {accessToken}
 * @param {userId} - User ID
 * @body { reason? }
 * @returns { updated user } with 200 status
 */
export const deactivateUserController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = userIdParamSchema.parse(req.params);
    const { reason } = req.body;

    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const user = await deactivateUser(validatedParams.userId, reason);

    sendSuccess(res, user, "User deactivated successfully");
  },
);

/**
 * Activate user (admin only)
 * @route POST /api/v1/users/:userId/activate
 * @description Activates a user (admin only)
 * @header Authorization: Bearer {accessToken}
 * @param {userId} - User ID
 * @returns { updated user } with 200 status
 */
export const activateUserController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = userIdParamSchema.parse(req.params);

    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const user = await activateUser(validatedParams.userId);

    sendSuccess(res, user, "User activated successfully");
  },
);

/**
 * Permanently delete user (admin only)
 * @route DELETE /api/v1/users/:userId
 * @description Permanently deletes a user (admin only)
 * @header Authorization: Bearer {accessToken}
 * @param {userId} - User ID
 * @returns { success: true } with 200 status
 */
export const deleteUserPermanently = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = userIdParamSchema.parse(req.params);

    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    await permanentlyDeleteUser(validatedParams.userId);

    sendSuccess(res, null, "User permanently deleted successfully");
  },
);

/**
 * Check if email exists
 * @route GET /api/v1/users/check-email
 * @description Checks if an email is already registered
 * @query { email }
 * @returns { exists: boolean } with 200 status
 */
export const checkEmail = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      sendError(res, "Email is required", 400);
      return;
    }

    const exists = await checkEmailExists(email);

    sendSuccess(res, { exists }, "Email check completed");
  },
);

/**
 * Check if phone exists
 * @route GET /api/v1/users/check-phone
 * @description Checks if a phone number is already registered
 * @query { phone }
 * @returns { exists: boolean } with 200 status
 */
export const checkPhone = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { phone } = req.query;

    if (!phone || typeof phone !== "string") {
      sendError(res, "Phone number is required", 400);
      return;
    }

    const exists = await checkPhoneExists(phone);

    sendSuccess(res, { exists }, "Phone check completed");
  },
);

/**
 * Get user by email (admin only)
 * @route GET /api/v1/users/by-email
 * @description Retrieves a user by email (admin only)
 * @header Authorization: Bearer {accessToken}
 * @query { email }
 * @returns { user } with 200 status
 */
export const getUserByEmailController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { email } = req.query;

    if (!email || typeof email !== "string") {
      sendError(res, "Email is required", 400);
      return;
    }

    const user = await getUserByEmail(email);

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user, "User retrieved successfully");
  },
);

/**
 * Get user by phone (admin only)
 * @route GET /api/v1/users/by-phone
 * @description Retrieves a user by phone (admin only)
 * @header Authorization: Bearer {accessToken}
 * @query { phone }
 * @returns { user } with 200 status
 */
export const getUserByPhoneController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { phone } = req.query;

    if (!phone || typeof phone !== "string") {
      sendError(res, "Phone number is required", 400);
      return;
    }

    const user = await getUserByPhone(phone);

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user, "User retrieved successfully");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  getMyProfile,
  updateMyProfile,
  getUserById,
  getUsers,
  getUserStats,
  createUser,
  updateUser,
  deactivateUserController,
  activateUserController,
  deleteUserPermanently,
  checkEmail,
  checkPhone,
  getUserByEmailController,
  getUserByPhoneController,
};
