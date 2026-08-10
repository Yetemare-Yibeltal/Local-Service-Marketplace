'use client';

import { getApiClient } from './client';

// ============================================================
// TYPES
// ============================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  title: string;
  message: string;
  data: any;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  bookingUpdates: boolean;
  promotionalEmails: boolean;
  providerUpdates: boolean;
  systemAlerts: boolean;
}

export interface UnreadCount {
  total: number;
  byType: {
    EMAIL: number;
    SMS: number;
    PUSH: number;
  };
}

export interface NotificationFilters {
  type?: 'EMAIL' | 'SMS' | 'PUSH';
  status?: 'PENDING' | 'SENT' | 'FAILED';
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount?: number;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Get user notifications with filters and pagination
 */
export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<PaginatedResponse<Notification>> {
  const client = getApiClient();
  const params = new URLSearchParams();

  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString());
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  if (filters.userId) params.append('userId', filters.userId);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 20).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await client.get<{
    data: Notification[];
    pagination: any;
    unreadCount?: number;
  }>(`/notifications?${params.toString()}`);

  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    unreadCount: response.unreadCount || 0,
  };
}

/**
 * Get unread notifications for the authenticated user
 */
export async function getUnreadNotifications(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Notification>> {
  const client = getApiClient();
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await client.get<{
    data: Notification[];
    pagination: any;
    unreadCount: number;
  }>(`/notifications/unread?${params.toString()}`);

  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    unreadCount: response.unreadCount || 0,
  };
}

/**
 * Get notification by ID
 */
export async function getNotificationById(id: string): Promise<Notification> {
  const client = getApiClient();
  const response = await client.get<{ data: Notification }>(`/notifications/${id}`);
  return response.data;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<UnreadCount> {
  const client = getApiClient();
  const response = await client.get<{ data: UnreadCount }>('/notifications/unread-count');
  return response.data;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(id: string): Promise<Notification> {
  const client = getApiClient();
  const response = await client.post<{ data: Notification }>(`/notifications/${id}/read`);
  return response.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<{ count: number }> {
  const client = getApiClient();
  const response = await client.post<{ data: { count: number } }>('/notifications/read-all');
  return response.data;
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/notifications/${id}`);
}

/**
 * Delete all notifications for the authenticated user
 */
export async function deleteAllNotifications(): Promise<{ count: number }> {
  const client = getApiClient();
  const response = await client.delete<{ data: { count: number } }>('/notifications');
  return response.data;
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const client = getApiClient();
  const response = await client.get<{ data: NotificationPreferences }>(
    '/notifications/preferences'
  );
  return response.data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const client = getApiClient();
  const response = await client.put<{ data: NotificationPreferences }>(
    '/notifications/preferences',
    preferences
  );
  return response.data;
}

/**
 * Check if user has unread notifications
 */
export async function hasUnreadNotifications(): Promise<{ hasUnread: boolean }> {
  const client = getApiClient();
  return await client.get<{ hasUnread: boolean }>('/notifications/has-unread');
}

/**
 * Send notification (admin only)
 */
export async function sendNotification(data: {
  userId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  title: string;
  message: string;
  data?: any;
}): Promise<Notification> {
  const client = getApiClient();
  const response = await client.post<{ data: Notification }>('/notifications', data);
  return response.data;
}

/**
 * Send bulk notifications (admin only)
 */
export async function sendBulkNotifications(data: {
  userIds: string[];
  type: 'EMAIL' | 'SMS' | 'PUSH';
  title: string;
  message: string;
  data?: any;
}): Promise<Notification[]> {
  const client = getApiClient();
  const response = await client.post<{ data: Notification[] }>('/notifications/bulk', data);
  return response.data;
}

/**
 * Resend failed notification (admin only)
 */
export async function resendNotification(id: string): Promise<Notification> {
  const client = getApiClient();
  const response = await client.post<{ data: Notification }>(`/notifications/${id}/resend`);
  return response.data;
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  getNotifications,
  getUnreadNotifications,
  getNotificationById,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  hasUnreadNotifications,
  sendNotification,
  sendBulkNotifications,
  resendNotification,
};
