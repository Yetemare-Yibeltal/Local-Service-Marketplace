'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';

// ============================================================
// TYPES
// ============================================================

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  } | null;
}

interface ApiResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
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

async function getAuditLogs(
  page: number = 1,
  limit: number = 20,
  userId?: string,
  action?: string,
  entity?: string,
  search?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (userId) params.append('userId', userId);
  if (action) params.append('action', action);
  if (entity) params.append('entity', entity);
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return await fetchWithAuth(`/admin/audit-logs?${params.toString()}`);
}

async function getAuditLogDetails(id: string): Promise<AuditLog> {
  return await fetchWithAuth(`/admin/audit-logs/${id}`);
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Action Color Mapping
 */
const actionColors: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
  REGISTER: 'bg-green-100 text-green-700',
  BOOKING_CREATED: 'bg-purple-100 text-purple-700',
  BOOKING_UPDATED: 'bg-indigo-100 text-indigo-700',
  BOOKING_CONFIRMED: 'bg-blue-100 text-blue-700',
  BOOKING_STARTED: 'bg-purple-100 text-purple-700',
  BOOKING_COMPLETED: 'bg-green-100 text-green-700',
  BOOKING_CANCELLED: 'bg-red-100 text-red-700',
  PAYMENT_INITIATED: 'bg-yellow-100 text-yellow-700',
  PAYMENT_VERIFIED: 'bg-green-100 text-green-700',
  PAYMENT_REFUNDED: 'bg-orange-100 text-orange-700',
  PROVIDER_REGISTERED: 'bg-blue-100 text-blue-700',
  PROVIDER_VERIFIED: 'bg-green-100 text-green-700',
  PROVIDER_REJECTED: 'bg-red-100 text-red-700',
  DISPUTE_CREATED: 'bg-orange-100 text-orange-700',
  DISPUTE_RESOLVED: 'bg-green-100 text-green-700',
  USER_UPDATED: 'bg-gray-100 text-gray-700',
  USER_DEACTIVATED: 'bg-red-100 text-red-700',
  USER_ACTIVATED: 'bg-green-100 text-green-700',
  SETTING_UPDATED: 'bg-yellow-100 text-yellow-700',
  ADMIN_LOGIN: 'bg-red-100 text-red-700',
  AUDIT_LOG_EXPORT: 'bg-gray-100 text-gray-700',
};

const actionLabels: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  REGISTER: 'Registration',
  BOOKING_CREATED: 'Booking Created',
  BOOKING_UPDATED: 'Booking Updated',
  BOOKING_CONFIRMED: 'Booking Confirmed',
  BOOKING_STARTED: 'Booking Started',
  BOOKING_COMPLETED: 'Booking Completed',
  BOOKING_CANCELLED: 'Booking Cancelled',
  PAYMENT_INITIATED: 'Payment Initiated',
  PAYMENT_VERIFIED: 'Payment Verified',
  PAYMENT_REFUNDED: 'Payment Refunded',
  PROVIDER_REGISTERED: 'Provider Registered',
  PROVIDER_VERIFIED: 'Provider Verified',
  PROVIDER_REJECTED: 'Provider Rejected',
  DISPUTE_CREATED: 'Dispute Created',
  DISPUTE_RESOLVED: 'Dispute Resolved',
  USER_UPDATED: 'User Updated',
  USER_DEACTIVATED: 'User Deactivated',
  USER_ACTIVATED: 'User Activated',
  SETTING_UPDATED: 'Setting Updated',
  ADMIN_LOGIN: 'Admin Login',
  AUDIT_LOG_EXPORT: 'Audit Export',
};

/**
 * Action Badge Component
 */
function ActionBadge({ action }: { action: string }) {
  const color = actionColors[action] || 'bg-gray-100 text-gray-700';
  const label = actionLabels[action] || action.replace(/_/g, ' ').toLowerCase();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

/**
 * Entity Badge Component
 */
function EntityBadge({ entity }: { entity: string }) {
  const colors: Record<string, string> = {
    User: 'bg-blue-100 text-blue-800',
    Booking: 'bg-purple-100 text-purple-800',
    Provider: 'bg-green-100 text-green-800',
    Payment: 'bg-yellow-100 text-yellow-800',
    Dispute: 'bg-orange-100 text-orange-800',
    SystemSetting: 'bg-gray-100 text-gray-700',
    Review: 'bg-pink-100 text-pink-800',
    Category: 'bg-indigo-100 text-indigo-800',
  };

  const color = colors[entity] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {entity}
    </span>
  );
}

/**
 * Audit Log Row Component
 */
function AuditLogRow({
  log,
  onView,
}: {
  log: AuditLog;
  onView: (log: AuditLog) => void;
}) {
  const createdAt = new Date(log.createdAt);
  const formattedDate = createdAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0">
          <div className={`p-1.5 rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
            <DocumentTextIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ActionBadge action={log.action} />
            <EntityBadge entity={log.entity} />
            <span className="text-xs text-gray-400">
              {log.user?.fullName || 'System'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-400 mt-0.5">
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {formattedTime}
            </span>
            {log.ipAddress && (
              <span className="flex items-center gap-1">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                {log.ipAddress}
              </span>
            )}
            {log.entityId && (
              <span className="text-gray-400">ID: {log.entityId.slice(0, 8)}</span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onView(log)}
        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-4 flex-shrink-0"
        title="View Details"
      >
        <EyeIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Audit Log Details Modal
 */
function AuditLogDetailsModal({
  log,
  isOpen,
  onClose,
}: {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !log) return null;

  const createdAt = new Date(log.createdAt).toLocaleString('en-US', {
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
          <h3 className="text-xl font-bold text-gray-900">Audit Log Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Action & Entity */}
          <div className="flex flex-wrap items-center gap-3">
            <ActionBadge action={log.action} />
            <EntityBadge entity={log.entity} />
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">{createdAt}</span>
          </div>

          {/* User */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">User</h4>
            {log.user ? (
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-shrink-0">
                  {log.user.profileImage ? (
                    <Image
                      src={log.user.profileImage}
                      alt={log.user.fullName}
                      width={40}
                      height={40}
                      className="rounded-full object-cover w-10 h-10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{log.user.fullName}</p>
                  <p className="text-sm text-gray-500">{log.user.email}</p>
                  <p className="text-sm text-gray-500">{log.user.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">System / Unauthenticated</p>
            )}
          </div>

          {/* Entity ID */}
          {log.entityId && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Entity ID</h4>
              <p className="text-sm text-gray-900 font-mono">{log.entityId}</p>
            </div>
          )}

          {/* Changes */}
          {log.changes && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Changes</h4>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* IP & User Agent */}
          <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {log.ipAddress && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">IP Address</h4>
                <p className="text-sm text-gray-900 font-mono">{log.ipAddress}</p>
              </div>
            )}
            {log.userAgent && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">User Agent</h4>
                <p className="text-sm text-gray-500 break-all">{log.userAgent}</p>
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

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [actionFilter, setActionFilter] = useState(searchParams.get('action') || '');
  const [entityFilter, setEntityFilter] = useState(searchParams.get('entity') || '');
  const [userIdFilter, setUserIdFilter] = useState(searchParams.get('userId') || '');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: searchParams.get('startDate') || '',
    end: searchParams.get('endDate') || '',
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Modals
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load audit logs
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAuditLogs(
        page,
        limit,
        userIdFilter || undefined,
        actionFilter || undefined,
        entityFilter || undefined,
        debouncedSearch || undefined,
        dateRange.start || undefined,
        dateRange.end || undefined
      );
      setLogs(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, userIdFilter, actionFilter, entityFilter, debouncedSearch, dateRange]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (actionFilter) params.set('action', actionFilter);
    if (entityFilter) params.set('entity', entityFilter);
    if (userIdFilter) params.set('userId', userIdFilter);
    if (dateRange.start) params.set('startDate', dateRange.start);
    if (dateRange.end) params.set('endDate', dateRange.end);
    router.push(`/dashboard/admin/audit-logs?${params.toString()}`);
  }, [searchTerm, actionFilter, entityFilter, userIdFilter, dateRange, router]);

  // Handlers
  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('');
    setEntityFilter('');
    setUserIdFilter('');
    setDateRange({ start: '', end: '' });
    setPage(1);
  };

  const actionOptions = Object.entries(actionLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const entityOptions = [
    { value: 'User', label: 'User' },
    { value: 'Booking', label: 'Booking' },
    { value: 'Provider', label: 'Provider' },
    { value: 'Payment', label: 'Payment' },
    { value: 'Dispute', label: 'Dispute' },
    { value: 'SystemSetting', label: 'System Setting' },
    { value: 'Review', label: 'Review' },
    { value: 'Category', label: 'Category' },
  ];

  const isFiltered = searchTerm || actionFilter || entityFilter || userIdFilter || dateRange.start || dateRange.end;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-0.5">
              {totalItems} log{totalItems !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadLogs}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user or entity ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <FilterDropdown
            options={actionOptions}
            value={actionFilter}
            onChange={setActionFilter}
            placeholder="All Actions"
          />
          <FilterDropdown
            options={entityOptions}
            value={entityFilter}
            onChange={setEntityFilter}
            placeholder="All Entities"
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
            <p className="mt-2 text-gray-500">Loading audit logs...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Audit Logs List */}
        {!loading && !error && (
          <>
            {logs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No audit logs found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {isFiltered
                    ? 'No logs match your current filters. Try adjusting your search.'
                    : 'There are no audit logs recorded yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-7">Activity</div>
                    <div className="col-span-3">Time</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                </div>
                <div className="px-6 divide-y divide-gray-100">
                  {logs.map((log) => (
                    <AuditLogRow
                      key={log.id}
                      log={log}
                      onView={handleViewLog}
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
      </div>

      {/* Audit Log Details Modal */}
      <AuditLogDetailsModal
        log={selectedLog}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}