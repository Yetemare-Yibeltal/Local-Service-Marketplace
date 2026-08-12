import { Router } from "express";
import {
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
} from "../../controllers/user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  updateProfileSchema,
  userIdParamSchema,
  userFilterSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from "../../schemas/user.schema";
import { upload } from "../../middlewares/upload.middleware";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// USER ROUTES
// ============================================================

const router = Router();

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

/**
 * @route GET /api/v1/users/check-email
 * @description Check if email exists
 * @query { email }
 * @returns { exists: boolean } with 200 status
 * @access Public
 */
router.get("/check-email", catchAsync(checkEmail));

/**
 * @route GET /api/v1/users/check-phone
 * @description Check if phone exists
 * @query { phone }
 * @returns { exists: boolean } with 200 status
 * @access Public
 */
router.get("/check-phone", catchAsync(checkPhone));

// ============================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================

// All protected routes require authentication
router.use(authenticate);

// ============================================================
// USER PROFILE
// ============================================================

/**
 * @route GET /api/v1/users/profile
 * @description Get current user profile
 * @returns { user } with 200 status
 * @access Authenticated users only
 */
router.get("/profile", catchAsync(getMyProfile));

/**
 * @route PUT /api/v1/users/profile
 * @description Update current user profile
 * @body { fullName?, phone?, bio?, profileImage? }
 * @returns { updated user } with 200 status
 * @access Authenticated users only
 */
router.put(
  "/profile",
  upload.single("profileImage"),
  validateBody(updateProfileSchema),
  catchAsync(updateMyProfile),
);

// ============================================================
// ADMIN USER MANAGEMENT
// ============================================================

/**
 * @route GET /api/v1/users/stats
 * @description Get user statistics (admin only)
 * @returns { stats } with 200 status
 * @access Admin only
 */
router.get("/stats", catchAsync(getUserStats));

/**
 * @route GET /api/v1/users
 * @description Get all users with filters (admin only)
 * @query { page, limit, search, role, isActive, isEmailVerified, isPhoneVerified, sortBy, sortOrder }
 * @returns { users, pagination } with 200 status
 * @access Admin only
 */
router.get("/", validateQuery(userFilterSchema), catchAsync(getUsers));

/**
 * @route GET /api/v1/users/by-email
 * @description Get user by email (admin only)
 * @query { email }
 * @returns { user } with 200 status
 * @access Admin only
 */
router.get("/by-email", catchAsync(getUserByEmailController));

/**
 * @route GET /api/v1/users/by-phone
 * @description Get user by phone (admin only)
 * @query { phone }
 * @returns { user } with 200 status
 * @access Admin only
 */
router.get("/by-phone", catchAsync(getUserByPhoneController));

/**
 * @route GET /api/v1/users/:userId
 * @description Get user by ID (admin only)
 * @param {userId} - User ID
 * @returns { user } with 200 status
 * @access Admin only
 */
router.get(
  "/:userId",
  validateParams(userIdParamSchema),
  catchAsync(getUserById),
);

/**
 * @route POST /api/v1/users
 * @description Create user (admin only)
 * @body { email, phone, password, fullName, role, isEmailVerified?, isPhoneVerified?, isActive? }
 * @returns { user } with 201 status
 * @access Admin only
 */
router.post("/", validateBody(adminCreateUserSchema), catchAsync(createUser));

/**
 * @route PUT /api/v1/users/:userId
 * @description Update user (admin only)
 * @param {userId} - User ID
 * @body { fullName?, phone?, email?, role?, isEmailVerified?, isPhoneVerified?, isActive?, bio? }
 * @returns { updated user } with 200 status
 * @access Admin only
 */
router.put(
  "/:userId",
  validateParams(userIdParamSchema),
  validateBody(adminUpdateUserSchema),
  catchAsync(updateUser),
);

/**
 * @route POST /api/v1/users/:userId/deactivate
 * @description Deactivate user (admin only)
 * @param {userId} - User ID
 * @body { reason? }
 * @returns { updated user } with 200 status
 * @access Admin only
 */
router.post(
  "/:userId/deactivate",
  validateParams(userIdParamSchema),
  catchAsync(deactivateUserController),
);

/**
 * @route POST /api/v1/users/:userId/activate
 * @description Activate user (admin only)
 * @param {userId} - User ID
 * @returns { updated user } with 200 status
 * @access Admin only
 */
router.post(
  "/:userId/activate",
  validateParams(userIdParamSchema),
  catchAsync(activateUserController),
);

/**
 * @route DELETE /api/v1/users/:userId
 * @description Permanently delete user (admin only)
 * @param {userId} - User ID
 * @returns { success: true } with 200 status
 * @access Admin only
 */
router.delete(
  "/:userId",
  validateParams(userIdParamSchema),
  catchAsync(deleteUserPermanently),
);

// ============================================================
// EXPORTS
// ============================================================

export default router;
