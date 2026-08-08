import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import {
  sendNotification,
  sendBulkNotifications,
  getNotificationById,
  getUserNotifications,
  getUserUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCountService,
  deleteNotificationById,
  deleteAllUserNotifications,
  cleanupOldNotifications,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  sendEmailNotification,
  checkNotificationExists,
} from "../services/internal/notification.service";
import {
  sendNotificationSchema,
  sendBulkNotificationSchema,
  notificationIdParamSchema,
  notificationFilterSchema,
  userNotificationFilterSchema,
  notificationPreferencesSchema,
  updateNotificationPreferencesSchema,
  markNotificationReadSchema,
  markAllNotificationsReadSchema,
} from "../schemas/notification.schema";
import { USER_ROLES } from "../utils/constants";
import logger from "../utils/logger";

// ============================================================
// NOTIFICATION CONTROLLER
// ============================================================

// ============================================================
// SEND NOTIFICATIONS
// ============================================================

/**
 * Send a notification to a user (admin only)
 * @route POST /api/v1/notifications
 * @description Sends a notification to a specific user
 * @header Authorization: Bearer {accessToken}
 * @body { userId, type, title, message, data? }
 * @returns { notification } with 201 status
 */
export const sendNotificationController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedData = sendNotificationSchema.parse(req.body);

    const notification = await sendNotification({
      userId: validatedData.userId,
      type: validatedData.type,
      title: validatedData.title,
      message: validatedData.message,
      data: validatedData.data,
    });

    sendSuccess(res, notification, "Notification sent successfully", 201);
  },
);

/**
 * Send bulk notifications to multiple users (admin only)
 * @route POST /api/v1/notifications/bulk
 * @description Sends notifications to multiple users
 * @header Authorization: Bearer {accessToken}
 * @body { userIds, type, title, message, data? }
 * @returns { notifications } with 201 status
 */
export const sendBulkNotificationController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedData = sendBulkNotificationSchema.parse(req.body);

    const notifications = await sendBulkNotifications({
      userIds: validatedData.userIds,
      type: validatedData.type,
      title: validatedData.title,
      message: validatedData.message,
      data: validatedData.data,
    });

    sendSuccess(
      res,
      notifications,
      "Bulk notifications sent successfully",
      201,
    );
  },
);

/**
 * Send email notification (admin only)
 * @route POST /api/v1/notifications/email
 * @description Sends a custom email notification
 * @header Authorization: Bearer {accessToken}
 * @body { userId, to, subject, html, type, title, message, data? }
 * @returns { notification } with 201 status
 */
export const sendEmailNotificationController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedData = sendEmailNotificationSchema.parse(req.body);

    const notification = await sendEmailNotification({
      userId: validatedData.userId,
      to: validatedData.to,
      subject: validatedData.subject,
      html: validatedData.html,
      type: validatedData.type,
      title: validatedData.title,
      message: validatedData.message,
      data: validatedData.data,
    });

    sendSuccess(res, notification, "Email notification sent successfully", 201);
  },
);

// ============================================================
// GET NOTIFICATIONS
// ============================================================

/**
 * Get notification by ID
 * @route GET /api/v1/notifications/:id
 * @description Retrieves a specific notification by ID
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Notification ID
 * @returns { notification } with 200 status
 */
export const getNotificationByIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = notificationIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const notification = await getNotificationById(validatedParams.id);

    if (!notification) {
      sendError(res, "Notification not found", 404);
      return;
    }

    // Check permission: only the recipient or admin can view
    if (notification.userId !== userId && userRole !== "ADMIN") {
      sendError(
        res,
        "You do not have permission to view this notification",
        403,
      );
      return;
    }

    sendSuccess(res, notification, "Notification retrieved successfully");
  },
);

/**
 * Get all notifications for the authenticated user
 * @route GET /api/v1/notifications
 * @description Retrieves all notifications for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, type, isRead, sortBy, sortOrder }
 * @returns { notifications, pagination, unreadCount } with 200 status
 */
export const getMyNotificationsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const validatedQuery = notificationFilterSchema.parse(req.query);

    const result = await getUserNotifications(
      userId,
      {
        type: validatedQuery.type,
        isRead: validatedQuery.isRead,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 10,
    );

    // Get unread count
    const unreadCount = await getUnreadCountService(userId);

    // Add unread count to response
    const response = {
      data: result.data,
      pagination: result.pagination,
      unreadCount: unreadCount.total,
      unreadByType: unreadCount.byType,
    };

    sendSuccess(res, response, "Notifications retrieved successfully");
  },
);

/**
 * Get unread notifications for the authenticated user
 * @route GET /api/v1/notifications/unread
 * @description Retrieves all unread notifications for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit }
 * @returns { notifications, pagination, unreadCount } with 200 status
 */
export const getMyUnreadNotificationsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const { page = 1, limit = 20 } = req.query;

    const result = await getUserUnreadNotifications(
      userId,
      Number(page),
      Number(limit),
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
 * Get all notifications (admin only)
 * @route GET /api/v1/notifications/admin
 * @description Retrieves all notifications with filters (admin only)
 * @header Authorization: Bearer {accessToken}
 * @query { page, limit, userId, type, status, isRead, startDate, endDate, sortBy, sortOrder }
 * @returns { notifications, pagination } with 200 status
 */
export const adminGetAllNotificationsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedQuery = notificationFilterSchema.parse(req.query);

    const { getAllNotifications } =
      await import("../repositories/notification.repository");

    const result = await getAllNotifications(
      {
        userId: validatedQuery.userId,
        type: validatedQuery.type,
        status: validatedQuery.status,
        isRead: validatedQuery.isRead,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 20,
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
// MARK AS READ
// ============================================================

/**
 * Mark a notification as read
 * @route POST /api/v1/notifications/:id/read
 * @description Marks a specific notification as read
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Notification ID
 * @returns { notification } with 200 status
 */
export const markNotificationReadController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = notificationIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Check if notification exists and belongs to user
    const notification = await getNotificationById(validatedParams.id);

    if (!notification) {
      sendError(res, "Notification not found", 404);
      return;
    }

    if (notification.userId !== userId && userRole !== "ADMIN") {
      sendError(
        res,
        "You do not have permission to mark this notification as read",
        403,
      );
      return;
    }

    const updated = await markNotificationRead(validatedParams.id);

    sendSuccess(res, updated, "Notification marked as read");
  },
);

/**
 * Mark all notifications as read for the authenticated user
 * @route POST /api/v1/notifications/read-all
 * @description Marks all notifications as read for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @returns { count } with 200 status
 */
export const markAllNotificationsReadController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const count = await markAllNotificationsRead(userId);

    sendSuccess(res, { count }, `${count} notifications marked as read`);
  },
);

// ============================================================
// GET UNREAD COUNT
// ============================================================

/**
 * Get unread notification count for the authenticated user
 * @route GET /api/v1/notifications/unread-count
 * @description Gets the count of unread notifications for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @returns { total, byType } with 200 status
 */
export const getUnreadCountController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const count = await getUnreadCountService(userId);

    sendSuccess(res, count, "Unread count retrieved successfully");
  },
);

/**
 * Check if user has unread notifications
 * @route GET /api/v1/notifications/has-unread
 * @description Checks if the authenticated user has any unread notifications
 * @header Authorization: Bearer {accessToken}
 * @returns { hasUnread: boolean } with 200 status
 */
export const hasUnreadNotificationsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const count = await getUnreadCountService(userId);

    sendSuccess(res, { hasUnread: count.total > 0 }, "Unread check completed");
  },
);

// ============================================================
// DELETE NOTIFICATIONS
// ============================================================

/**
 * Delete a notification
 * @route DELETE /api/v1/notifications/:id
 * @description Deletes a specific notification
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Notification ID
 * @returns { success: true } with 200 status
 */
export const deleteNotificationController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = notificationIdParamSchema.parse(req.params);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    // Check if notification exists and belongs to user
    const notification = await getNotificationById(validatedParams.id);

    if (!notification) {
      sendError(res, "Notification not found", 404);
      return;
    }

    if (notification.userId !== userId && userRole !== "ADMIN") {
      sendError(
        res,
        "You do not have permission to delete this notification",
        403,
      );
      return;
    }

    await deleteNotificationById(validatedParams.id);

    sendSuccess(res, null, "Notification deleted successfully");
  },
);

/**
 * Delete all notifications for the authenticated user
 * @route DELETE /api/v1/notifications
 * @description Deletes all notifications for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @returns { count } with 200 status
 */
export const deleteAllMyNotificationsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const count = await deleteAllUserNotifications(userId);

    sendSuccess(res, { count }, `${count} notifications deleted`);
  },
);

/**
 * Cleanup old notifications (admin only)
 * @route DELETE /api/v1/notifications/cleanup
 * @description Deletes notifications older than specified days (admin only)
 * @header Authorization: Bearer {accessToken}
 * @body { days }
 * @returns { count } with 200 status
 */
export const cleanupOldNotificationsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const { days } = req.body;

    const count = await cleanupOldNotifications(days || 30);

    sendSuccess(res, { count }, `${count} old notifications cleaned up`);
  },
);

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

/**
 * Get notification preferences for the authenticated user
 * @route GET /api/v1/notifications/preferences
 * @description Gets the notification preferences for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @returns { preferences } with 200 status
 */
export const getNotificationPreferencesController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const preferences = await getUserNotificationPreferences(userId);

    sendSuccess(
      res,
      preferences,
      "Notification preferences retrieved successfully",
    );
  },
);

/**
 * Update notification preferences for the authenticated user
 * @route PUT /api/v1/notifications/preferences
 * @description Updates the notification preferences for the authenticated user
 * @header Authorization: Bearer {accessToken}
 * @body { emailEnabled?, smsEnabled?, pushEnabled?, bookingUpdates?, promotionalEmails?, providerUpdates?, systemAlerts? }
 * @returns { preferences } with 200 status
 */
export const updateNotificationPreferencesController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const validatedData = updateNotificationPreferencesSchema.parse(req.body);

    const preferences = await updateUserNotificationPreferences(
      userId,
      validatedData,
    );

    sendSuccess(
      res,
      preferences,
      "Notification preferences updated successfully",
    );
  },
);

// ============================================================
// NOTIFICATION EXISTENCE CHECK
// ============================================================

/**
 * Check if notification exists
 * @route GET /api/v1/notifications/:id/exists
 * @description Checks if a notification exists
 * @param {id} - Notification ID
 * @returns { exists: boolean } with 200 status
 */
export const checkNotificationExistsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = notificationIdParamSchema.parse(req.params);

    const exists = await checkNotificationExists(validatedParams.id);

    sendSuccess(res, { exists }, "Notification existence check completed");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Send
  sendNotificationController,
  sendBulkNotificationController,
  sendEmailNotificationController,

  // Get
  getNotificationByIdController,
  getMyNotificationsController,
  getMyUnreadNotificationsController,
  adminGetAllNotificationsController,

  // Mark as read
  markNotificationReadController,
  markAllNotificationsReadController,

  // Unread count
  getUnreadCountController,
  hasUnreadNotificationsController,

  // Delete
  deleteNotificationController,
  deleteAllMyNotificationsController,
  cleanupOldNotificationsController,

  // Preferences
  getNotificationPreferencesController,
  updateNotificationPreferencesController,

  // Existence
  checkNotificationExistsController,
};
