import { Router } from "express";
import {
  sendNotificationController,
  sendBulkNotificationController,
  sendEmailNotificationController,
  getNotificationByIdController,
  getMyNotificationsController,
  getMyUnreadNotificationsController,
  adminGetAllNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  getUnreadCountController,
  hasUnreadNotificationsController,
  deleteNotificationController,
  deleteAllMyNotificationsController,
  cleanupOldNotificationsController,
  getNotificationPreferencesController,
  updateNotificationPreferencesController,
  checkNotificationExistsController,
} from "../../controllers/notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  sendNotificationSchema,
  sendBulkNotificationSchema,
  sendEmailNotificationSchema,
  notificationIdParamSchema,
  notificationFilterSchema,
  updateNotificationPreferencesSchema,
} from "../../schemas/notification.schema";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// NOTIFICATION ROUTES
// ============================================================

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// ============================================================
// USER NOTIFICATIONS
// ============================================================

/**
 * @route GET /api/v1/notifications
 * @description Get all notifications for authenticated user
 * @query { page, limit, type, isRead, startDate, endDate, sortBy, sortOrder }
 * @returns { notifications, pagination, unreadCount } with 200 status
 * @access Authenticated users only
 */
router.get(
  "/",
  validateQuery(notificationFilterSchema),
  catchAsync(getMyNotificationsController),
);

/**
 * @route GET /api/v1/notifications/unread
 * @description Get unread notifications for authenticated user
 * @query { page, limit }
 * @returns { notifications, pagination, unreadCount } with 200 status
 * @access Authenticated users only
 */
router.get("/unread", catchAsync(getMyUnreadNotificationsController));

/**
 * @route GET /api/v1/notifications/unread-count
 * @description Get unread notification count
 * @returns { total, byType } with 200 status
 * @access Authenticated users only
 */
router.get("/unread-count", catchAsync(getUnreadCountController));

/**
 * @route GET /api/v1/notifications/has-unread
 * @description Check if user has unread notifications
 * @returns { hasUnread: boolean } with 200 status
 * @access Authenticated users only
 */
router.get("/has-unread", catchAsync(hasUnreadNotificationsController));

/**
 * @route GET /api/v1/notifications/:id
 * @description Get notification by ID
 * @param {id} - Notification ID
 * @returns { notification } with 200 status
 * @access Authenticated users only (must own notification)
 */
router.get(
  "/:id",
  validateParams(notificationIdParamSchema),
  catchAsync(getNotificationByIdController),
);

/**
 * @route GET /api/v1/notifications/:id/exists
 * @description Check if notification exists
 * @param {id} - Notification ID
 * @returns { exists: boolean } with 200 status
 * @access Authenticated users only
 */
router.get(
  "/:id/exists",
  validateParams(notificationIdParamSchema),
  catchAsync(checkNotificationExistsController),
);

// ============================================================
// NOTIFICATION STATUS MANAGEMENT
// ============================================================

/**
 * @route POST /api/v1/notifications/:id/read
 * @description Mark notification as read
 * @param {id} - Notification ID
 * @returns { notification } with 200 status
 * @access Authenticated users only
 */
router.post(
  "/:id/read",
  validateParams(notificationIdParamSchema),
  catchAsync(markNotificationReadController),
);

/**
 * @route POST /api/v1/notifications/read-all
 * @description Mark all notifications as read
 * @returns { count } with 200 status
 * @access Authenticated users only
 */
router.post("/read-all", catchAsync(markAllNotificationsReadController));

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

/**
 * @route GET /api/v1/notifications/preferences
 * @description Get notification preferences
 * @returns { preferences } with 200 status
 * @access Authenticated users only
 */
router.get("/preferences", catchAsync(getNotificationPreferencesController));

/**
 * @route PUT /api/v1/notifications/preferences
 * @description Update notification preferences
 * @body { emailEnabled?, smsEnabled?, pushEnabled?, bookingUpdates?, promotionalEmails?, providerUpdates?, systemAlerts? }
 * @returns { preferences } with 200 status
 * @access Authenticated users only
 */
router.put(
  "/preferences",
  validateBody(updateNotificationPreferencesSchema),
  catchAsync(updateNotificationPreferencesController),
);

// ============================================================
// NOTIFICATION DELETION
// ============================================================

/**
 * @route DELETE /api/v1/notifications
 * @description Delete all notifications for authenticated user
 * @returns { count } with 200 status
 * @access Authenticated users only
 */
router.delete("/", catchAsync(deleteAllMyNotificationsController));

/**
 * @route DELETE /api/v1/notifications/:id
 * @description Delete a notification
 * @param {id} - Notification ID
 * @returns { success: true } with 200 status
 * @access Authenticated users only
 */
router.delete(
  "/:id",
  validateParams(notificationIdParamSchema),
  catchAsync(deleteNotificationController),
);

// ============================================================
// ADMIN NOTIFICATIONS
// ============================================================

/**
 * @route GET /api/v1/notifications/admin
 * @description Get all notifications with filters (admin only)
 * @query { page, limit, userId, type, status, isRead, startDate, endDate, sortBy, sortOrder }
 * @returns { notifications, pagination } with 200 status
 * @access Admin only
 */
router.get("/admin", catchAsync(adminGetAllNotificationsController));

/**
 * @route POST /api/v1/notifications
 * @description Send a notification (admin only)
 * @body { userId, type, title, message, data? }
 * @returns { notification } with 201 status
 * @access Admin only
 */
router.post(
  "/",
  validateBody(sendNotificationSchema),
  catchAsync(sendNotificationController),
);

/**
 * @route POST /api/v1/notifications/bulk
 * @description Send bulk notifications (admin only)
 * @body { userIds, type, title, message, data? }
 * @returns { notifications } with 201 status
 * @access Admin only
 */
router.post(
  "/bulk",
  validateBody(sendBulkNotificationSchema),
  catchAsync(sendBulkNotificationController),
);

/**
 * @route POST /api/v1/notifications/email
 * @description Send email notification (admin only)
 * @body { userId, to, subject, html, type, title, message, data? }
 * @returns { notification } with 201 status
 * @access Admin only
 */
router.post(
  "/email",
  validateBody(sendEmailNotificationSchema),
  catchAsync(sendEmailNotificationController),
);

/**
 * @route DELETE /api/v1/notifications/cleanup
 * @description Cleanup old notifications (admin only)
 * @body { days }
 * @returns { count } with 200 status
 * @access Admin only
 */
router.delete("/cleanup", catchAsync(cleanupOldNotificationsController));

// ============================================================
// EXPORTS
// ============================================================

export default router;
