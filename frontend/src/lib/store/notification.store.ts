'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getNotifications as getNotificationsApi,
  getUnreadNotifications as getUnreadNotificationsApi,
  getNotificationById as getNotificationByIdApi,
  getUnreadCount as getUnreadCountApi,
  markNotificationRead as markNotificationReadApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
  deleteNotification as deleteNotificationApi,
  deleteAllNotifications as deleteAllNotificationsApi,
  getNotificationPreferences as getNotificationPreferencesApi,
  updateNotificationPreferences as updateNotificationPreferencesApi,
  hasUnreadNotifications as hasUnreadNotificationsApi,
} from '../api/notifications';

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

export interface NotificationState {
  // State
  notifications: Notification[];
  selectedNotification: Notification | null;
  preferences: NotificationPreferences;
  unreadCount: UnreadCount;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: NotificationFilters;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  isPolling: boolean;
  pollingIntervalId: NodeJS.Timeout | null;
}

export interface NotificationActions {
  // Fetch operations
  getNotifications: (filters?: NotificationFilters) => Promise<{
    data: Notification[];
    pagination: any;
    unreadCount?: number;
  }>;
  getUnreadNotifications: (
    page?: number,
    limit?: number
  ) => Promise<{
    data: Notification[];
    pagination: any;
    unreadCount: number;
  }>;
  getNotificationById: (id: string) => Promise<Notification>;
  getUnreadCount: () => Promise<UnreadCount>;

  // Actions
  markAsRead: (id: string) => Promise<Notification>;
  markAllAsRead: () => Promise<number>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAll: () => Promise<number>;

  // Preferences
  getPreferences: () => Promise<NotificationPreferences>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<NotificationPreferences>;

  // Polling
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  refreshUnreadCount: () => Promise<void>;

  // State management
  setFilters: (filters: Partial<NotificationFilters>) => void;
  setPage: (page: number) => void;
  clearSelected: () => void;
  clearError: () => void;
  reset: () => void;
}

export type NotificationStore = NotificationState & NotificationActions;

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: NotificationState = {
  notifications: [],
  selectedNotification: null,
  preferences: {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    bookingUpdates: true,
    promotionalEmails: false,
    providerUpdates: true,
    systemAlerts: true,
  },
  unreadCount: {
    total: 0,
    byType: { EMAIL: 0, SMS: 0, PUSH: 0 },
  },
  pagination: {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  isLoading: false,
  isSubmitting: false,
  error: null,
  isPolling: false,
  pollingIntervalId: null,
};

// ============================================================
// STORE
// ============================================================

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  ...initialState,

  // ============================================================
  // FETCH OPERATIONS
  // ============================================================

  getNotifications: async (filters?: NotificationFilters) => {
    set({ isLoading: true, error: null });

    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await getNotificationsApi(mergedFilters);

      set({
        notifications: response.data || [],
        pagination: response.pagination || {
          page: mergedFilters.page || 1,
          limit: mergedFilters.limit || 20,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: mergedFilters,
        isLoading: false,
        error: null,
      });

      // Update unread count if available
      if (response.unreadCount !== undefined) {
        set((state) => ({
          unreadCount: {
            ...state.unreadCount,
            total: response.unreadCount || 0,
          },
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notifications';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  getUnreadNotifications: async (page: number = 1, limit: number = 20) => {
    set({ isLoading: true, error: null });

    try {
      const response = await getUnreadNotificationsApi(page, limit);

      set({
        notifications: response.data || [],
        pagination: response.pagination || {
          page: 1,
          limit: 20,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load unread notifications';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  getNotificationById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const notification = await getNotificationByIdApi(id);

      set({
        selectedNotification: notification,
        isLoading: false,
        error: null,
      });

      return notification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notification';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const unreadCount = await getUnreadCountApi();

      set({
        unreadCount,
        error: null,
      });

      return unreadCount;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Don't set error state for this background operation
      return get().unreadCount;
    }
  },

  // ============================================================
  // ACTIONS
  // ============================================================

  markAsRead: async (id: string) => {
    set({ isSubmitting: true, error: null });

    try {
      const notification = await markNotificationReadApi(id);

      // Update in notifications list
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        ),
        selectedNotification:
          state.selectedNotification?.id === id
            ? { ...notification, readAt: new Date().toISOString() }
            : state.selectedNotification,
        unreadCount: {
          ...state.unreadCount,
          total: Math.max(0, state.unreadCount.total - 1),
        },
        isSubmitting: false,
        error: null,
      }));

      return notification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as read';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  markAllAsRead: async () => {
    set({ isSubmitting: true, error: null });

    try {
      const result = await markAllNotificationsReadApi();

      // Update all notifications to read
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          readAt: new Date().toISOString(),
        })),
        unreadCount: {
          total: 0,
          byType: { EMAIL: 0, SMS: 0, PUSH: 0 },
        },
        isSubmitting: false,
        error: null,
      }));

      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all as read';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  deleteNotification: async (id: string) => {
    set({ isSubmitting: true, error: null });

    try {
      await deleteNotificationApi(id);

      // Remove from notifications list
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        selectedNotification:
          state.selectedNotification?.id === id ? null : state.selectedNotification,
        isSubmitting: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  deleteAll: async () => {
    set({ isSubmitting: true, error: null });

    try {
      const result = await deleteAllNotificationsApi();

      set({
        notifications: [],
        unreadCount: {
          total: 0,
          byType: { EMAIL: 0, SMS: 0, PUSH: 0 },
        },
        isSubmitting: false,
        error: null,
      });

      return result.count;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete notifications';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  // ============================================================
  // PREFERENCES
  // ============================================================

  getPreferences: async () => {
    set({ isLoading: true, error: null });

    try {
      const preferences = await getNotificationPreferencesApi();

      set({
        preferences,
        isLoading: false,
        error: null,
      });

      return preferences;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load preferences';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  updatePreferences: async (prefs: Partial<NotificationPreferences>) => {
    set({ isSubmitting: true, error: null });

    try {
      const updatedPreferences = await updateNotificationPreferencesApi(prefs);

      set({
        preferences: { ...get().preferences, ...updatedPreferences },
        isSubmitting: false,
        error: null,
      });

      return updatedPreferences;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update preferences';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  // ============================================================
  // POLLING
  // ============================================================

  refreshUnreadCount: async () => {
    try {
      const unreadCount = await getUnreadCountApi();
      set({ unreadCount });
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  },

  startPolling: (intervalMs: number = 30000) => {
    // Stop existing polling
    get().stopPolling();

    // Initial fetch
    get().refreshUnreadCount();

    // Start new polling
    const intervalId = setInterval(() => {
      get().refreshUnreadCount();
    }, intervalMs);

    set({
      isPolling: true,
      pollingIntervalId: intervalId,
    });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();

    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }

    set({
      isPolling: false,
      pollingIntervalId: null,
    });
  },

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  setFilters: (filters: Partial<NotificationFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: filters.page || 1 },
    }));
  },

  setPage: (page: number) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
      filters: { ...state.filters, page },
    }));
  },

  clearSelected: () => {
    set({ selectedNotification: null });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    // Stop polling before reset
    get().stopPolling();

    set({
      ...initialState,
      preferences: {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        bookingUpdates: true,
        promotionalEmails: false,
        providerUpdates: true,
        systemAlerts: true,
      },
    });
  },
}));

// ============================================================
// SELECTORS
// ============================================================

export const selectNotifications = (state: NotificationStore) => state.notifications;
export const selectSelectedNotification = (state: NotificationStore) => state.selectedNotification;
export const selectPreferences = (state: NotificationStore) => state.preferences;
export const selectUnreadCount = (state: NotificationStore) => state.unreadCount;
export const selectUnreadTotal = (state: NotificationStore) => state.unreadCount.total;
export const selectHasUnread = (state: NotificationStore) => state.unreadCount.total > 0;
export const selectPagination = (state: NotificationStore) => state.pagination;
export const selectFilters = (state: NotificationStore) => state.filters;
export const selectIsLoading = (state: NotificationStore) => state.isLoading;
export const selectIsSubmitting = (state: NotificationStore) => state.isSubmitting;
export const selectError = (state: NotificationStore) => state.error;
export const selectIsPolling = (state: NotificationStore) => state.isPolling;

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useNotificationStore;
