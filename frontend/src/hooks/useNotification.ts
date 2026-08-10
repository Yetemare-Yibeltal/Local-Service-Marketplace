'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

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
  page?: number;
  limit?: number;
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
  unreadCount: number;
}

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// HOOK
// ============================================================

export function useNotification() {
  const { getToken, user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    bookingUpdates: true,
    promotionalEmails: false,
    providerUpdates: true,
    systemAlerts: true,
  });
  const [unreadCount, setUnreadCount] = useState<UnreadCount>({
    total: 0,
    byType: { EMAIL: 0, SMS: 0, PUSH: 0 },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Polling interval reference
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to make authenticated requests
  const fetchWithAuth = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        router.push('/login');
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Request failed');
      }

      const result = await response.json();
      return result.data;
    },
    [getToken, router]
  );

  // Get user notifications
  const getNotifications = useCallback(
    async (filters: NotificationFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.status) params.append('status', filters.status);
        if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString());
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.search) params.append('search', filters.search);
        params.append('page', (filters.page || 1).toString());
        params.append('limit', (filters.limit || 20).toString());

        const response = await fetchWithAuth(`/notifications?${params.toString()}`);

        setNotifications(response.data || []);
        setPagination(
          response.pagination || {
            page: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        );

        // Update unread count
        if (response.unreadCount !== undefined) {
          setUnreadCount((prev) => ({
            ...prev,
            total: response.unreadCount,
          }));
        }

        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
        showToast(error || 'Failed to load notifications', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Get unread notifications
  const getUnreadNotifications = useCallback(
    async (page: number = 1, limit: number = 20) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithAuth(`/notifications/unread?page=${page}&limit=${limit}`);
        setNotifications(response.data || []);
        setPagination(
          response.pagination || {
            page: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        );
        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load unread notifications');
        showToast(error || 'Failed to load unread notifications', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Get notification by ID
  const getNotificationById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const notification = await fetchWithAuth(`/notifications/${id}`);
        setSelectedNotification(notification);
        return notification;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notification');
        showToast(error || 'Failed to load notification', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Get unread count
  const getUnreadCount = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/notifications/unread-count');
      setUnreadCount(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      return null;
    }
  }, [fetchWithAuth]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const notification = await fetchWithAuth(`/notifications/${id}/read`, {
          method: 'POST',
        });

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
        if (selectedNotification?.id === id) {
          setSelectedNotification({ ...selectedNotification, readAt: new Date().toISOString() });
        }

        // Update unread count
        setUnreadCount((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));

        showToast('Notification marked as read', 'success');
        return notification;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
        showToast(error || 'Failed to mark notification as read', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast, selectedNotification]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const count = await fetchWithAuth('/notifications/read-all', {
        method: 'POST',
      });

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));

      // Reset unread count
      setUnreadCount({
        total: 0,
        byType: { EMAIL: 0, SMS: 0, PUSH: 0 },
      });

      showToast(`Marked ${count || 0} notifications as read`, 'success');
      return count;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
      showToast(error || 'Failed to mark all as read', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        await fetchWithAuth(`/notifications/${id}`, {
          method: 'DELETE',
        });

        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selectedNotification?.id === id) {
          setSelectedNotification(null);
        }

        showToast('Notification deleted', 'success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete notification');
        showToast(error || 'Failed to delete notification', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast, selectedNotification]
  );

  // Delete all notifications
  const deleteAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const count = await fetchWithAuth('/notifications', {
        method: 'DELETE',
      });

      setNotifications([]);
      setUnreadCount({
        total: 0,
        byType: { EMAIL: 0, SMS: 0, PUSH: 0 },
      });

      showToast(`Deleted ${count || 0} notifications`, 'success');
      return count;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notifications');
      showToast(error || 'Failed to delete notifications', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Get notification preferences
  const getPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth('/notifications/preferences');
      setPreferences(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
      showToast(error || 'Failed to load preferences', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showToast]);

  // Update notification preferences
  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchWithAuth('/notifications/preferences', {
          method: 'PUT',
          body: JSON.stringify(prefs),
        });

        setPreferences((prev) => ({ ...prev, ...data }));
        showToast('Preferences updated successfully', 'success');
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update preferences');
        showToast(error || 'Failed to update preferences', 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, showToast]
  );

  // Check if user has unread notifications
  const hasUnread = useCallback(() => {
    return unreadCount.total > 0;
  }, [unreadCount]);

  // Clear selected notification
  const clearSelected = useCallback(() => {
    setSelectedNotification(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset notification state
  const reset = useCallback(() => {
    setNotifications([]);
    setSelectedNotification(null);
    setError(null);
    setPagination({
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  }, []);

  // Start polling for new notifications
  const startPolling = useCallback(
    (intervalMs: number = 30000) => {
      // Clear existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      // Initial fetch
      getUnreadCount();

      // Set up polling
      pollIntervalRef.current = setInterval(() => {
        getUnreadCount().catch(() => {
          // Silently fail on polling errors
        });
      }, intervalMs);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    },
    [getUnreadCount]
  );

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Auto-start polling when user is authenticated
  useEffect(() => {
    if (user) {
      const cleanup = startPolling(30000);
      return cleanup;
    } else {
      stopPolling();
    }
  }, [user, startPolling, stopPolling]);

  return {
    // State
    notifications,
    selectedNotification,
    preferences,
    unreadCount,
    pagination,
    loading,
    error,

    // Fetch operations
    getNotifications,
    getUnreadNotifications,
    getNotificationById,
    getUnreadCount,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,

    // Preferences
    getPreferences,
    updatePreferences,

    // Utilities
    hasUnread,
    clearSelected,
    clearError,
    reset,
    startPolling,
    stopPolling,
  };
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useNotification;
