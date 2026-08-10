'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  UserGroupIcon,
  UserIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  SendIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebounce } from '@/hooks/useDebounce';

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
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
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
}

interface UserSearchResult {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

// ============================================================
// SCHEMA
// ============================================================

const sendNotificationSchema = z.object({
  userIds: z.array(z.string()).min(1, 'Select at least one user'),
  type: z.enum(['EMAIL', 'SMS', 'PUSH']),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must not exceed 100 characters'),
  message: z.string().min(5, 'Message must be at least 5 characters').max(2000, 'Message must not exceed 2000 characters'),
  data: z.record(z.any()).optional(),
});

type SendNotificationData = z.infer<typeof sendNotificationSchema>;

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

async function getAdminNotifications(
  page: number = 1,
  limit: number = 20,
  type?: string,
  status?: string,
  userId?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  if (userId) params.append('userId', userId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return await fetchWithAuth(`/notifications/admin?${params.toString()}`);
}

async function sendNotification(data: SendNotificationData): Promise<Notification[]> {
  return await fetchWithAuth('/notifications/bulk', {
    method: 'POST',
    body: JSON.stringify({
      userIds: data.userIds,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
    }),
  });
}

async function resendNotification(notificationId: string): Promise<Notification> {
  return await fetchWithAuth(`/notifications/${notificationId}/resend`, {
    method: 'POST',
  });
}

async function deleteNotification(notificationId: string): Promise<void> {
  await fetchWithAuth(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

async function searchUsers(query: string): Promise<UserSearchResult[]> {
  if (!query || query.length < 2) return [];
  return await fetchWithAuth(`/users/search?q=${encodeURIComponent(query)}`);
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      icon: <ClockIcon className="w-3 h-3" />,
    },
    SENT: {
      label: 'Sent',
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircleIcon className="w-3 h-3" />,
    },
    FAILED: {
      label: 'Failed',
      color: 'bg-red-100 text-red-800',
      icon: <XCircleIcon className="w-3 h-3" />,
    },
  };

  const { label, color, icon } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

/**
 * Type Badge Component
 */
function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    EMAIL: {
      label: 'Email',
      color: 'bg-blue-100 text-blue-800',
      icon: <EnvelopeIcon className="w-3 h-3" />,
    },
    SMS: {
      label: 'SMS',
      color: 'bg-purple-100 text-purple-800',
      icon: <DevicePhoneMobileIcon className="w-3 h-3" />,
    },
    PUSH: {
      label: 'Push',
      color: 'bg-green-100 text-green-800',
      icon: <BellIcon className="w-3 h-3" />,
    },
  };

  const { label, color, icon } = config[type] || config.EMAIL;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

/**
 * Notification Row Component
 */
function NotificationRow({
  notification,
  onView,
  onResend,
  onDelete,
}: {
  notification: Notification;
  onView: (notification: Notification) => void;
  onResend: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
}) {
  const [resending, setResending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const createdAt = new Date(notification.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      await onResend(notification);
    } catch (error) {
      console.error('Error resending notification:', error);
    } finally {
      setResending(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!confirm('Are you sure you want to delete this notification?')) return;
    setDeleting(true);
    try {
      await onDelete(notification);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0">
          <TypeBadge type={notification.type} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{notification.title}</span>
            <StatusBadge status={notification.status} />
          </div>
          <p className="text-sm text-gray-600 truncate">{notification.message}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-400 mt-0.5">
            <span className="flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              {notification.user?.fullName || 'Unknown User'}
            </span>
            <span className="flex items-center gap-1">
              <BellIcon className="w-3.5 h-3.5" />
              {notification.type}
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {createdAt}
            </span>
            {notification.sentAt && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Sent {new Date(notification.sentAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
        <button
          onClick={() => onView(notification)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        {notification.status === 'FAILED' && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            title="Resend"
          >
            {resending ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Delete"
        >
          {deleting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/**
 * Notification Details Modal
 */
function NotificationDetailsModal({
  notification,
  isOpen,
  onClose,
}: {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !notification) return null;

  const createdAt = new Date(notification.createdAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900">Notification Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3">
            <TypeBadge type={notification.type} />
            <StatusBadge status={notification.status} />
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">{createdAt}</span>
          </div>

          {/* User */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Recipient</h4>
            {notification.user ? (
              <div>
                <p className="font-medium text-gray-900">{notification.user.fullName}</p>
                <p className="text-sm text-gray-500">{notification.user.email}</p>
                <p className="text-sm text-gray-500">{notification.user.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">User not found</p>
            )}
          </div>

          {/* Title & Message */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Title</h4>
            <p className="text-lg font-semibold text-gray-900">{notification.title}</p>
            <h4 className="text-sm font-medium text-gray-700 mt-3">Message</h4>
            <p className="text-gray-700 whitespace-pre-line">{notification.message}</p>
          </div>

          {/* Data */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Additional Data</h4>
              <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(notification.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Status Details */}
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Created</p>
              <p className="text-gray-900">{createdAt}</p>
            </div>
            {notification.sentAt && (
              <div>
                <p className="text-gray-400">Sent</p>
                <p className="text-gray-900">{new Date(notification.sentAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Send Notification Form Component
 */
function SendNotificationForm({
  onSend,
  loading,
}: {
  onSend: (data: SendNotificationData) => void;
  loading: boolean;
}) {
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SendNotificationData>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: {
      userIds: [],
      type: 'EMAIL',
      title: '',
      message: '',
      data: {},
    },
  });

  const userIds = watch('userIds');

  // Search users
  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (!userSearch || userSearch.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const results = await searchUsers(userSearch);
        // Filter out already selected users
        const filtered = results.filter(
          (u) => !selectedUsers.some((su) => su.id === u.id)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearching(false);
      }
    };

    const timeout = setTimeout(searchUsersDebounced, 300);
    return () => clearTimeout(timeout);
  }, [userSearch, selectedUsers]);

  const handleAddUser = (user: UserSearchResult) => {
    setSelectedUsers((prev) => [...prev, user]);
    setValue('userIds', [...userIds, user.id]);
    setUserSearch('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    setValue(
      'userIds',
      userIds.filter((id) => id !== userId)
    );
  };

  const onSubmit = (data: SendNotificationData) => {
    onSend(data);
    // Optionally reset form
    // reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* User Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recipients <span className="text-red-500">*</span>
        </label>
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedUsers.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {user.fullName} ({user.email})
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
            {searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleAddUser(user)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center justify-between"
              >
                <span>
                  <span className="font-medium">{user.fullName}</span>
                  <span className="text-sm text-gray-500 ml-2">{user.email}</span>
                </span>
                <PlusIcon className="w-4 h-4 text-blue-600" />
              </button>
            ))}
          </div>
        )}
        {searching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
        {errors.userIds && <p className="mt-1 text-sm text-red-600">{errors.userIds.message}</p>}
      </div>

      {/* Notification Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Channel <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['EMAIL', 'SMS', 'PUSH'].map((type) => (
            <label
              key={type}
              className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                watch('type') === type
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                value={type}
                {...register('type')}
                className="sr-only"
              />
              {type === 'EMAIL' && <EnvelopeIcon className="w-5 h-5" />}
              {type === 'SMS' && <DevicePhoneMobileIcon className="w-5 h-5" />}
              {type === 'PUSH' && <BellIcon className="w-5 h-5" />}
              <span className={`font-medium ${watch('type') === type ? 'text-blue-600' : 'text-gray-700'}`}>
                {type}
              </span>
            </label>
          ))}
        </div>
        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('title')}
          placeholder="Notification title"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('message')}
          rows={4}
          placeholder="Notification message"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.message ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
        <p className="mt-1 text-xs text-gray-400">
          {watch('message')?.length || 0} / 2000 characters
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || selectedUsers.length === 0}
        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
        {loading ? 'Sending...' : `Send to ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`}
      </button>
    </form>
  );
}

/**
 * Filter Dropdown Component
 */
function FilterDropdown({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">{placeholder}</option>
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

export default function AdminNotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('history');

  // Filters
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: searchParams.get('startDate') || '',
    end: searchParams.get('endDate') || '',
  });

  // Modals
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminNotifications(
        page,
        limit,
        typeFilter || undefined,
        statusFilter || undefined,
        undefined,
        dateRange.start || undefined,
        dateRange.end || undefined
      );
      setNotifications(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter, statusFilter, dateRange]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadNotifications();
    }
  }, [loadNotifications, activeTab]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (dateRange.start) params.set('startDate', dateRange.start);
    if (dateRange.end) params.set('endDate', dateRange.end);
    router.push(`/dashboard/admin/notifications?${params.toString()}`);
  }, [typeFilter, statusFilter, dateRange, router]);

  // Handlers
  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  const handleResendNotification = async (notification: Notification) => {
    try {
      await resendNotification(notification.id);
      await loadNotifications();
    } catch (error) {
      alert('Failed to resend notification');
    }
  };

  const handleDeleteNotification = async (notification: Notification) => {
    try {
      await deleteNotification(notification.id);
      await loadNotifications();
    } catch (error) {
      alert('Failed to delete notification');
    }
  };

  const handleSendNotification = async (data: SendNotificationData) => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await sendNotification(data);
      setSuccess(`Notification sent successfully to ${data.userIds.length} user${data.userIds.length !== 1 ? 's' : ''}!`);
      setTimeout(() => setSuccess(null), 5000);
      setActiveTab('history');
      loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSending(false);
    }
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear filters
  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setDateRange({ start: '', end: '' });
    setPage(1);
  };

  const typeOptions = [
    { value: 'EMAIL', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'PUSH', label: 'Push' },
  ];

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'SENT', label: 'Sent' },
    { value: 'FAILED', label: 'Failed' },
  ];

  const isFiltered = typeFilter || statusFilter || dateRange.start || dateRange.end;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-0.5">Send and manage system notifications</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadNotifications}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl shadow-card p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'send'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Send Notification
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <BellIcon className="w-4 h-4" />
              History
            </span>
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Send Tab */}
        {activeTab === 'send' && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <SendNotificationForm onSend={handleSendNotification} loading={sending} />
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap items-center gap-4">
              <FilterDropdown
                options={typeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
                placeholder="All Types"
              />
              <FilterDropdown
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
              />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start Date"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="End Date"
              />
              {isFiltered && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Clear
                </button>
              )}
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
              </div>
            )}

            {/* Notifications List */}
            {!loading && !error && (
              <>
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-card p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications found</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {isFiltered
                        ? 'No notifications match your current filters. Try adjusting your search.'
                        : 'There are no notifications sent yet. Use the "Send Notification" tab to send one.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-card overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-7">Notification</div>
                        <div className="col-span-3">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                    </div>
                    <div className="px-6 divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <NotificationRow
                          key={notification.id}
                          notification={notification}
                          onView={handleViewNotification}
                          onResend={handleResendNotification}
                          onDelete={handleDeleteNotification}
                        />
                      ))}
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
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
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Notification Details Modal */}
      <NotificationDetailsModal
        notification={selectedNotification}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedNotification(null);
        }}
      />
    </div>
  );
}

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}