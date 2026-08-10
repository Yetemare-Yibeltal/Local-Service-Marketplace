'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BellIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  CheckIcon,
  ClockIcon,
  InboxIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// ============================================================
// TYPES
// ============================================================

interface Notification {
  id: string;
  userId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  title: string;
  message: string;
  data: any;
  status: 'PENDING' | 'SENT' | 'FAILED';
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  data: Notification[];
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
// API FUNCTIONS
// ============================================================

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  const result = await response.json();
  return result.data;
}

async function getNotifications(
  page: number = 1,
  limit: number = 20,
  type?: string,
  isRead?: boolean
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (type) params.append('type', type);
  if (isRead !== undefined) params.append('isRead', isRead.toString());

  const data = await fetchWithAuth(`/notifications?${params.toString()}`);
  const unreadCount = await fetchWithAuth('/notifications/unread-count');

  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: 20, totalItems: 0, totalPages: 0, hasNext: false, hasPrev: false },
    unreadCount: unreadCount.total || 0,
  };
}

async function markNotificationRead(notificationId: string): Promise<void> {
  await fetchWithAuth(`/notifications/${notificationId}/read`, {
    method: 'POST',
  });
}

async function markAllNotificationsRead(): Promise<number> {
  const result = await fetchWithAuth('/notifications/read-all', {
    method: 'POST',
  });
  return result.count || 0;
}

async function deleteNotification(notificationId: string): Promise<void> {
  await fetchWithAuth(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Notification Item Component
 */
function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isRead, setIsRead] = useState(!!notification.readAt);
  const [deleting, setDeleting] = useState(false);
  const [marking, setMarking] = useState(false);

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const typeIcon = {
    EMAIL: <EnvelopeIcon className="w-4 h-4 text-blue-500" />,
    SMS: <BellIcon className="w-4 h-4 text-purple-500" />,
    PUSH: <CheckCircleSolid className="w-4 h-4 text-green-500" />,
  };

  const handleMarkRead = async () => {
    if (isRead || marking) return;
    setMarking(true);
    try {
      await onMarkRead(notification.id);
      setIsRead(true);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setMarking(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete(notification.id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all duration-200 ${
        !isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className={`p-1.5 rounded-full ${!isRead ? 'bg-blue-100' : 'bg-gray-100'}`}>
            {typeIcon[notification.type] || <BellIcon className="w-4 h-4 text-gray-500" />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm ${!isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                {notification.message}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">{notification.type}</span>
                {!isRead && (
                  <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">New</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isRead && (
                <button
                  onClick={handleMarkRead}
                  disabled={marking}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Mark as read"
                >
                  {marking ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deleting ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Filter Dropdown Component
 */
function FilterDropdown({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState(searchParams.get('type') || '');
  const [filterRead, setFilterRead] = useState<string>(searchParams.get('read') || '');

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getNotifications(
        page,
        limit,
        filterType || undefined,
        filterRead === 'read' ? true : filterRead === 'unread' ? false : undefined
      );
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterType, filterRead]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Handle filter change
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('type', value);
    else params.delete('type');
    router.push(`/dashboard/notifications?${params.toString()}`);
  };

  const handleFilterReadChange = (value: string) => {
    setFilterRead(value);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('read', value);
    else params.delete('read');
    router.push(`/dashboard/notifications?${params.toString()}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mark notification as read
  const handleMarkRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
    setUnreadCount((prev) => Math.max(0, prev - 1));
    // Update local state
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    const confirmed = confirm(`Mark all ${unreadCount} unread notifications as read?`);
    if (!confirmed) return;

    try {
      const count = await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => (n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (error) {
      alert('Failed to mark all as read');
    }
  };

  // Delete notification
  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setTotalItems((prev) => prev - 1);
  };

  // Filter options
  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'PUSH', label: 'Push' },
  ];

  const readOptions = [
    { value: '', label: 'All Status' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BellIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Mark all as read
              </button>
            )}
            <button
              onClick={loadNotifications}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <FilterDropdown
            options={typeOptions}
            value={filterType}
            onChange={handleFilterTypeChange}
          />
          <FilterDropdown
            options={readOptions}
            value={filterRead}
            onChange={handleFilterReadChange}
          />
          {(filterType || filterRead) && (
            <button
              onClick={() => {
                handleFilterTypeChange('');
                handleFilterReadChange('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
          <div className="ml-auto text-sm text-gray-500">
            {totalItems} notification{totalItems !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Loading notifications...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={loadNotifications}
              className="ml-auto text-sm text-red-700 hover:text-red-900 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <>
            {notifications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-16 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <InboxIcon className="w-10 h-10 text-gray-300" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {filterType || filterRead
                    ? 'No notifications match your current filters.'
                    : 'You have no notifications yet. We\'ll notify you when there are updates.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  let p: number;
                  if (totalPages <= 7) {
                    p = i + 1;
                  } else if (page <= 4) {
                    p = i + 1;
                  } else if (page >= totalPages - 3) {
                    p = totalPages - 6 + i;
                  } else {
                    p = page - 3 + i;
                  }
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-4 py-2 rounded-lg border transition-colors min-w-[40px] ${
                        p === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {totalPages > 7 && page < totalPages - 3 && (
                  <span className="px-2 text-gray-400">...</span>
                )}
                {totalPages > 7 && page < totalPages - 3 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}