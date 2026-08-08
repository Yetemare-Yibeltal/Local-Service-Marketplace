import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import {
  getDashboardStats,
  adminGetUsers,
  adminGetUserById,
  adminUpdateUser,
  adminDeactivateUser,
  adminActivateUser,
  adminGetProviders,
  adminGetProviderById,
  adminVerifyProvider,
  adminGetDisputes,
  adminGetDisputeById,
  adminResolveDispute,
  adminAddDisputeMessage,
  getSystemSettings,
  getSystemSetting,
  updateSystemSetting,
  getAuditLogs,
  getPlatformAnalytics,
  createAuditLog,
} from "../services/internal/admin.service";
import {
  userFilterSchema,
  userIdParamSchema,
  adminUpdateUserSchema,
} from "../schemas/user.schema";
import {
  providerIdParamSchema,
  providerFilterSchema,
} from "../schemas/provider.schema";
import { bookingFilterSchema } from "../schemas/booking.schema";
import logger from "../utils/logger";

// ============================================================
// ADMIN CONTROLLER
// ============================================================

// ============================================================
// DASHBOARD
// ============================================================

/**
 * Get admin dashboard statistics
 * @route GET /api/v1/admin/dashboard
 * @description Retrieves comprehensive dashboard statistics for admin
 * @header Authorization: Bearer {accessToken}
 * @returns { dashboardStats } with 200 status
 */
export const getAdminDashboard = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const stats = await getDashboardStats();

    sendSuccess(res, stats, "Dashboard statistics retrieved successfully");
  },
);

// ============================================================
// USER MANAGEMENT (ADMIN)
// ============================================================

/**
 * Get all users with filters (admin)
 * @route GET /api/v1/admin/users
 * @description Retrieves all users with pagination and filters
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, search, role, isActive, isEmailVerified, isPhoneVerified, sortBy, sortOrder }
 * @returns { users, pagination } with 200 status
 */
export const adminGetAllUsers = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedQuery = userFilterSchema.parse(req.query);

    const result = await adminGetUsers(
      {
        search: validatedQuery.search,
        role: validatedQuery.role,
        isActive: validatedQuery.isActive,
        isEmailVerified: validatedQuery.isEmailVerified,
        isPhoneVerified: validatedQuery.isPhoneVerified,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 20,
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
 * Get user by ID (admin)
 * @route GET /api/v1/admin/users/:userId
 * @description Retrieves a user by ID
 * @header Authorization: Bearer {accessToken}
 * @param {userId} - User ID
 * @returns { user } with 200 status
 */
export const adminGetUser = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedParams = userIdParamSchema.parse(req.params);

    const user = await adminGetUserById(validatedParams.userId);

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user, "User retrieved successfully");
  },
);

/**
 * Update user (admin)
 * @route PUT /api/v1/admin/users/:userId
 * @description Updates a user
 * @header Authorization: Bearer {accessToken}
 * @param {userId} - User ID
 * @body { fullName?, phone?, email?, role?, isEmailVerified?, isPhoneVerified?, isActive?, bio? }
 * @returns { updated user } with 200 status
 */
export const adminUpdateUserController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedParams = userIdParamSchema.parse(req.params);
    const validatedData = adminUpdateUserSchema.parse(req.body);

    const user = await adminUpdateUser(validatedParams.userId, validatedData);

    sendSuccess(res, user, "User updated successfully");
  },
);

/**
 * Deactivate user (admin)
 * @route POST /api/v1/admin/users/:userId/deactivate
 * @description Deactivates a user
 * @header Authorization: Bearer {accessToken}
 * @param {userId} - User ID
 * @body { reason? }
 * @returns { updated user } with 200 status
 */
export const adminDeactivateUserController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedParams = userIdParamSchema.parse(req.params);
    const { reason } = req.body;

    const user = await adminDeactivateUser(validatedParams.userId, reason);

    sendSuccess(res, user, "User deactivated successfully");
  },
);

/**
 * Activate user (admin)
 * @route POST /api/v1/admin/users/:userId/activate
 * @description Activates a user
 * @header Authorization: Bearer {accessToken}
 * @param {userId} - User ID
 * @returns { updated user } with 200 status
 */
export const adminActivateUserController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedParams = userIdParamSchema.parse(req.params);

    const user = await adminActivateUser(validatedParams.userId);

    sendSuccess(res, user, "User activated successfully");
  },
);

// ============================================================
// PROVIDER MANAGEMENT (ADMIN)
// ============================================================

/**
 * Get all providers with filters (admin)
 * @route GET /api/v1/admin/providers
 * @description Retrieves all providers with pagination and filters
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, search, category, city, isVerified, isAvailable, verificationStatus, sortBy, sortOrder }
 * @returns { providers, pagination } with 200 status
 */
export const adminGetAllProviders = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedQuery = providerFilterSchema.parse(req.query);

    const result = await adminGetProviders(
      {
        search: validatedQuery.search,
        category: validatedQuery.category,
        city: validatedQuery.city,
        isVerified: validatedQuery.isVerified,
        isAvailable: validatedQuery.isAvailable,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 20,
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
 * Get provider by ID (admin)
 * @route GET /api/v1/admin/providers/:providerId
 * @description Retrieves a provider by ID
 * @header Authorization: Bearer {accessToken}
 * @param {providerId} - Provider ID
 * @returns { provider } with 200 status
 */
export const adminGetProvider = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedParams = providerIdParamSchema.parse(req.params);

    const provider = await adminGetProviderById(validatedParams.id);

    if (!provider) {
      sendError(res, "Provider not found", 404);
      return;
    }

    sendSuccess(res, provider, "Provider retrieved successfully");
  },
);

/**
 * Verify provider (admin)
 * @route PATCH /api/v1/admin/providers/:providerId/verify
 * @description Verifies or rejects a provider
 * @header Authorization: Bearer {accessToken}
 * @param {providerId} - Provider ID
 * @body { status, notes? }
 * @returns { updated provider } with 200 status
 */
export const adminVerifyProviderController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedParams = providerIdParamSchema.parse(req.params);
    const { status, notes } = req.body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      sendError(res, "Status must be APPROVED or REJECTED", 400);
      return;
    }

    const provider = await adminVerifyProvider(
      validatedParams.id,
      status === "APPROVED",
      notes,
    );

    sendSuccess(res, provider, `Provider ${status.toLowerCase()} successfully`);
  },
);

/**
 * Get pending providers (admin)
 * @route GET /api/v1/admin/providers/pending
 * @description Retrieves all pending verification providers
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit }
 * @returns { providers, pagination } with 200 status
 */
export const adminGetPendingProviders = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { page = 1, limit = 20 } = req.query;

    const { prisma } = require("../config/database");

    const where = { verificationStatus: "PENDING" };

    const [data, totalItems] = await Promise.all([
      prisma.providerProfile.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.providerProfile.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / Number(limit));

    sendPaginated(res, data, Number(page), Number(limit), totalItems);
  },
);

// ============================================================
// DISPUTE MANAGEMENT (ADMIN)
// ============================================================

/**
 * Get all disputes (admin)
 * @route GET /api/v1/admin/disputes
 * @description Retrieves all disputes with pagination and filters
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, status, raisedBy, startDate, endDate }
 * @returns { disputes, pagination } with 200 status
 */
export const adminGetAllDisputes = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedQuery = bookingFilterSchema.parse(req.query);

    const result = await adminGetDisputes(
      {
        status: validatedQuery.status,
        raisedBy: validatedQuery.customerId,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 20,
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
 * Get dispute by ID (admin)
 * @route GET /api/v1/admin/disputes/:disputeId
 * @description Retrieves a dispute by ID
 * @header Authorization: Bearer {accessToken}
 * @param {disputeId} - Dispute ID
 * @returns { dispute } with 200 status
 */
export const adminGetDispute = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { disputeId } = req.params;

    if (!disputeId) {
      sendError(res, "Dispute ID is required", 400);
      return;
    }

    const dispute = await adminGetDisputeById(disputeId);

    if (!dispute) {
      sendError(res, "Dispute not found", 404);
      return;
    }

    sendSuccess(res, dispute, "Dispute retrieved successfully");
  },
);

/**
 * Resolve dispute (admin)
 * @route PUT /api/v1/admin/disputes/:disputeId/resolve
 * @description Resolves a dispute
 * @header Authorization: Bearer {accessToken}
 * @param {disputeId} - Dispute ID
 * @body { resolution, status? }
 * @returns { resolved dispute } with 200 status
 */
export const adminResolveDisputeController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { disputeId } = req.params;
    const { resolution, status } = req.body;

    if (!disputeId) {
      sendError(res, "Dispute ID is required", 400);
      return;
    }

    if (!resolution || resolution.length < 5) {
      sendError(res, "Resolution must be at least 5 characters", 400);
      return;
    }

    const dispute = await adminResolveDispute(
      disputeId,
      resolution,
      status || "RESOLVED",
    );

    sendSuccess(res, dispute, "Dispute resolved successfully");
  },
);

/**
 * Add message to dispute (admin)
 * @route POST /api/v1/admin/disputes/:disputeId/messages
 * @description Adds a message to a dispute
 * @header Authorization: Bearer {accessToken}
 * @param {disputeId} - Dispute ID
 * @body { message }
 * @returns { message } with 200 status
 */
export const adminAddDisputeMessageController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { disputeId } = req.params;
    const { message } = req.body;

    if (!disputeId) {
      sendError(res, "Dispute ID is required", 400);
      return;
    }

    if (!message || message.length < 3) {
      sendError(res, "Message must be at least 3 characters", 400);
      return;
    }

    const userId = (req as any).user?.id;

    const disputeMessage = await adminAddDisputeMessage(
      disputeId,
      message,
      userId,
    );

    sendSuccess(res, disputeMessage, "Message added successfully");
  },
);

// ============================================================
// SYSTEM SETTINGS (ADMIN)
// ============================================================

/**
 * Get all system settings (admin)
 * @route GET /api/v1/admin/settings
 * @description Retrieves all system settings
 * @header Authorization: Bearer {accessToken}
 * @returns { settings } with 200 status
 */
export const adminGetSettings = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const settings = await getSystemSettings();

    sendSuccess(res, settings, "Settings retrieved successfully");
  },
);

/**
 * Get system setting by key (admin)
 * @route GET /api/v1/admin/settings/:key
 * @description Retrieves a system setting by key
 * @header Authorization: Bearer {accessToken}
 * @param {key} - Setting key
 * @returns { setting } with 200 status
 */
export const adminGetSetting = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { key } = req.params;

    if (!key) {
      sendError(res, "Setting key is required", 400);
      return;
    }

    const setting = await getSystemSetting(key);

    if (!setting) {
      sendError(res, "Setting not found", 404);
      return;
    }

    sendSuccess(res, setting, "Setting retrieved successfully");
  },
);

/**
 * Update system setting (admin)
 * @route PUT /api/v1/admin/settings/:key
 * @description Updates a system setting
 * @header Authorization: Bearer {accessToken}
 * @param {key} - Setting key
 * @body { value, description? }
 * @returns { updated setting } with 200 status
 */
export const adminUpdateSetting = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { key } = req.params;
    const { value, description } = req.body;

    if (!key) {
      sendError(res, "Setting key is required", 400);
      return;
    }

    if (value === undefined) {
      sendError(res, "Value is required", 400);
      return;
    }

    const setting = await updateSystemSetting(key, value, description);

    sendSuccess(res, setting, "Setting updated successfully");
  },
);

// ============================================================
// AUDIT LOGS (ADMIN)
// ============================================================

/**
 * Get audit logs (admin)
 * @route GET /api/v1/admin/audit-logs
 * @description Retrieves audit logs with pagination and filters
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, userId, action, entity, startDate, endDate }
 * @returns { auditLogs, pagination } with 200 status
 */
export const adminGetAuditLogs = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { page, limit, userId, action, entity, startDate, endDate } =
      req.query;

    const result = await getAuditLogs(
      {
        userId: userId as string,
        action: action as string,
        entity: entity as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50,
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

// ============================================================
// PLATFORM ANALYTICS (ADMIN)
// ============================================================

/**
 * Get platform analytics (admin)
 * @route GET /api/v1/admin/analytics
 * @description Retrieves platform analytics
 * @header Authorization: Bearer {accessToken}
 * @query { period }
 * @returns { analytics } with 200 status
 */
export const adminGetPlatformAnalytics = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { period } = req.query;

    const analytics = await getPlatformAnalytics(
      (period as "today" | "week" | "month" | "quarter" | "year") || "month",
    );

    sendSuccess(res, analytics, "Platform analytics retrieved successfully");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Dashboard
  getAdminDashboard,

  // User Management
  adminGetAllUsers,
  adminGetUser,
  adminUpdateUserController,
  adminDeactivateUserController,
  adminActivateUserController,

  // Provider Management
  adminGetAllProviders,
  adminGetProvider,
  adminVerifyProviderController,
  adminGetPendingProviders,

  // Dispute Management
  adminGetAllDisputes,
  adminGetDispute,
  adminResolveDisputeController,
  adminAddDisputeMessageController,

  // System Settings
  adminGetSettings,
  adminGetSetting,
  adminUpdateSetting,

  // Audit Logs
  adminGetAuditLogs,

  // Analytics
  adminGetPlatformAnalytics,
};
