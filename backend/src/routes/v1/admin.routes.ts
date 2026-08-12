import { Router } from "express";
import {
  getAdminDashboard,
  adminGetAllUsers,
  adminGetUser,
  adminUpdateUserController,
  adminDeactivateUserController,
  adminActivateUserController,
  adminGetAllProviders,
  adminGetProvider,
  adminVerifyProviderController,
  adminGetPendingProviders,
  adminGetAllDisputes,
  adminGetDispute,
  adminResolveDisputeController,
  adminAddDisputeMessageController,
  adminGetSettings,
  adminGetSetting,
  adminUpdateSetting,
  adminGetAuditLogs,
  adminGetPlatformAnalytics,
} from "../../controllers/admin.controller";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  userFilterSchema,
  userIdParamSchema,
  adminUpdateUserSchema,
} from "../../schemas/user.schema";
import {
  providerIdParamSchema,
  providerFilterSchema,
} from "../../schemas/provider.schema";
import { bookingFilterSchema } from "../../schemas/booking.schema";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// ADMIN ROUTES
// ============================================================

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ============================================================
// DASHBOARD
// ============================================================

/**
 * @route GET /api/v1/admin/dashboard
 * @description Get admin dashboard statistics
 * @returns { dashboardStats } with 200 status
 * @access Admin only
 */
router.get("/dashboard", catchAsync(getAdminDashboard));

// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * @route GET /api/v1/admin/users
 * @description Get all users with filters
 * @query { page, limit, search, role, isActive, isEmailVerified, isPhoneVerified, sortBy, sortOrder }
 * @returns { users, pagination } with 200 status
 * @access Admin only
 */
router.get(
  "/users",
  validateQuery(userFilterSchema),
  catchAsync(adminGetAllUsers),
);

/**
 * @route GET /api/v1/admin/users/:userId
 * @description Get user by ID
 * @param {userId} - User ID
 * @returns { user } with 200 status
 * @access Admin only
 */
router.get(
  "/users/:userId",
  validateParams(userIdParamSchema),
  catchAsync(adminGetUser),
);

/**
 * @route PUT /api/v1/admin/users/:userId
 * @description Update user
 * @param {userId} - User ID
 * @body { fullName?, phone?, email?, role?, isEmailVerified?, isPhoneVerified?, isActive?, bio? }
 * @returns { updated user } with 200 status
 * @access Admin only
 */
router.put(
  "/users/:userId",
  validateParams(userIdParamSchema),
  validateBody(adminUpdateUserSchema),
  catchAsync(adminUpdateUserController),
);

/**
 * @route POST /api/v1/admin/users/:userId/deactivate
 * @description Deactivate user
 * @param {userId} - User ID
 * @body { reason? }
 * @returns { updated user } with 200 status
 * @access Admin only
 */
router.post(
  "/users/:userId/deactivate",
  validateParams(userIdParamSchema),
  catchAsync(adminDeactivateUserController),
);

/**
 * @route POST /api/v1/admin/users/:userId/activate
 * @description Activate user
 * @param {userId} - User ID
 * @returns { updated user } with 200 status
 * @access Admin only
 */
router.post(
  "/users/:userId/activate",
  validateParams(userIdParamSchema),
  catchAsync(adminActivateUserController),
);

// ============================================================
// PROVIDER MANAGEMENT
// ============================================================

/**
 * @route GET /api/v1/admin/providers
 * @description Get all providers with filters
 * @query { page, limit, search, category, city, isVerified, isAvailable, verificationStatus, sortBy, sortOrder }
 * @returns { providers, pagination } with 200 status
 * @access Admin only
 */
router.get(
  "/providers",
  validateQuery(providerFilterSchema),
  catchAsync(adminGetAllProviders),
);

/**
 * @route GET /api/v1/admin/providers/:providerId
 * @description Get provider by ID
 * @param {providerId} - Provider ID
 * @returns { provider } with 200 status
 * @access Admin only
 */
router.get(
  "/providers/:providerId",
  validateParams(providerIdParamSchema),
  catchAsync(adminGetProvider),
);

/**
 * @route PATCH /api/v1/admin/providers/:providerId/verify
 * @description Verify or reject provider
 * @param {providerId} - Provider ID
 * @body { status, notes? }
 * @returns { updated provider } with 200 status
 * @access Admin only
 */
router.patch(
  "/providers/:providerId/verify",
  validateParams(providerIdParamSchema),
  catchAsync(adminVerifyProviderController),
);

/**
 * @route GET /api/v1/admin/providers/pending
 * @description Get pending verification providers
 * @query { page, limit }
 * @returns { providers, pagination } with 200 status
 * @access Admin only
 */
router.get("/providers/pending", catchAsync(adminGetPendingProviders));

// ============================================================
// DISPUTE MANAGEMENT
// ============================================================

/**
 * @route GET /api/v1/admin/disputes
 * @description Get all disputes with filters
 * @query { page, limit, status, raisedBy, startDate, endDate }
 * @returns { disputes, pagination } with 200 status
 * @access Admin only
 */
router.get(
  "/disputes",
  validateQuery(bookingFilterSchema),
  catchAsync(adminGetAllDisputes),
);

/**
 * @route GET /api/v1/admin/disputes/:disputeId
 * @description Get dispute by ID
 * @param {disputeId} - Dispute ID
 * @returns { dispute } with 200 status
 * @access Admin only
 */
router.get("/disputes/:disputeId", catchAsync(adminGetDispute));

/**
 * @route PUT /api/v1/admin/disputes/:disputeId/resolve
 * @description Resolve dispute
 * @param {disputeId} - Dispute ID
 * @body { resolution, status? }
 * @returns { resolved dispute } with 200 status
 * @access Admin only
 */
router.put(
  "/disputes/:disputeId/resolve",
  catchAsync(adminResolveDisputeController),
);

/**
 * @route POST /api/v1/admin/disputes/:disputeId/messages
 * @description Add message to dispute
 * @param {disputeId} - Dispute ID
 * @body { message }
 * @returns { message } with 200 status
 * @access Admin only
 */
router.post(
  "/disputes/:disputeId/messages",
  catchAsync(adminAddDisputeMessageController),
);

// ============================================================
// SYSTEM SETTINGS
// ============================================================

/**
 * @route GET /api/v1/admin/settings
 * @description Get all system settings
 * @returns { settings } with 200 status
 * @access Admin only
 */
router.get("/settings", catchAsync(adminGetSettings));

/**
 * @route GET /api/v1/admin/settings/:key
 * @description Get system setting by key
 * @param {key} - Setting key
 * @returns { setting } with 200 status
 * @access Admin only
 */
router.get("/settings/:key", catchAsync(adminGetSetting));

/**
 * @route PUT /api/v1/admin/settings/:key
 * @description Update system setting
 * @param {key} - Setting key
 * @body { value, description? }
 * @returns { updated setting } with 200 status
 * @access Admin only
 */
router.put("/settings/:key", catchAsync(adminUpdateSetting));

// ============================================================
// AUDIT LOGS
// ============================================================

/**
 * @route GET /api/v1/admin/audit-logs
 * @description Get audit logs with filters
 * @query { page, limit, userId, action, entity, startDate, endDate }
 * @returns { auditLogs, pagination } with 200 status
 * @access Admin only
 */
router.get("/audit-logs", catchAsync(adminGetAuditLogs));

// ============================================================
// ANALYTICS
// ============================================================

/**
 * @route GET /api/v1/admin/analytics
 * @description Get platform analytics
 * @query { period }
 * @returns { analytics } with 200 status
 * @access Admin only
 */
router.get("/analytics", catchAsync(adminGetPlatformAnalytics));

// ============================================================
// EXPORTS
// ============================================================

export default router;
