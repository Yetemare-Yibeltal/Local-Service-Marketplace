'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserGroupIcon,
  BriefcaseIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserIcon,
  AdjustmentsHorizontalIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  TrophyIcon,
  FireIcon,
  BoltIcon,
  SparklesIcon,
  BookmarkIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  CreditCardIcon,
  WalletIcon,
  TicketIcon,
  GiftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// ============================================================
// TYPES
// ============================================================

interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  providers: {
    total: number;
    active: number;
    inactive: number;
    verified: number;
    pending: number;
    rejected: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    disputed: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    averagePerBooking: number;
  };
  disputes: {
    total: number;
    open: number;
    underReview: number;
    resolved: number;
    closed: number;
  };
  reviews: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    averageRating: number;
  };
  bookingTrend: { date: string; count: number }[];
  revenueTrend: { date: string; amount: number }[];
  categoryBreakdown: { category: string; count: number; revenue: number }[];
}

interface PendingProvider {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  category: string;
  locationLat: number;
  locationLng: number;
  address: string;
  city: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

interface RecentActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  changes: any;
  userId: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

interface ApiResponse<T> {
  data: T;
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

async function getAdminDashboardStats(): Promise<AdminStats> {
  return await fetchWithAuth('/admin/dashboard');
}

async function getPendingProviders(page: number = 1, limit: number = 5): Promise<ApiResponse<PendingProvider[]>> {
  return await fetchWithAuth(`/admin/providers/pending?page=${page}&limit=${limit}`);
}

async function getRecentActivities(page: number = 1, limit: number = 5): Promise<ApiResponse<RecentActivity[]>> {
  return await fetchWithAuth(`/admin/audit-logs?page=${page}&limit=${limit}&sortBy=createdAt&sortOrder=desc`);
}

async function verifyProvider(providerId: string, status: 'APPROVED' | 'REJECTED', notes?: string): Promise<void> {
  await fetchWithAuth(`/admin/providers/${providerId}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Stats Card Component
 */
function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'pink' | 'teal';
  trend?: { value: number; positive: boolean };
  onClick?: () => void;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
    pink: 'bg-pink-50 text-pink-600 group-hover:bg-pink-100',
    teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5 border border-gray-50 group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg transition-colors ${colorClasses[color]}`}>{icon}</div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
          {trend.positive ? (
            <ArrowUpRightIcon className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDownRightIcon className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-400 ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}

/**
 * Bar Chart Component
 */
function BarChart({
  data,
  height = 120,
  barColor = '#3b82f6',
  labelKey = 'date',
  valueKey = 'count',
  maxValue,
}: {
  data: any[];
  height?: number;
  barColor?: string;
  labelKey?: string;
  valueKey?: string;
  maxValue?: number;
}) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-400 text-sm py-4">No data</div>;
  }
  const maxVal = maxValue || Math.max(...data.map((d) => d[valueKey]), 1);
  const padding = { top: 10, bottom: 20, left: 5, right: 5 };
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = Math.min(24, (data.length > 0 ? 320 / data.length : 24));

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${Math.max(320, data.length * 30)} ${height}`}>
        {data.map((item, index) => {
          const x = index * (barWidth + 4) + 8;
          const value = item[valueKey] || 0;
          const barHeight = maxVal > 0 ? (value / maxVal) * chartHeight : 0;
          const y = padding.top + chartHeight - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                rx={2}
                className="transition-all duration-500 hover:opacity-80"
              >
                <title>{item[labelKey]}: {value}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 14}
                fontSize="8"
                fill="#9ca3af"
                textAnchor="middle"
                className="select-none"
              >
                {item[labelKey]?.slice(0, 3) || ''}
              </text>
              {value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  fontSize="7"
                  fill="#6b7280"
                  textAnchor="middle"
                  className="select-none"
                >
                  {value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Donut Chart Component
 */
function DonutChart({
  data,
  size = 100,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
}: {
  data: { label: string; value: number }[];
  size?: number;
  colors?: string[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div className="text-center text-gray-400 text-sm">No data</div>;

  const radius = size / 2 - 10;
  let cumulativeAngle = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          const startAngle = cumulativeAngle;
          const endAngle = cumulativeAngle + angle;
          cumulativeAngle = endAngle;

          const startRad = (startAngle - 90) * Math.PI / 180;
          const endRad = (endAngle - 90) * Math.PI / 180;
          const x1 = size / 2 + radius * Math.cos(startRad);
          const y1 = size / 2 + radius * Math.sin(startRad);
          const x2 = size / 2 + radius * Math.cos(endRad);
          const y2 = size / 2 + radius * Math.sin(endRad);
          const largeArcFlag = angle > 180 ? 1 : 0;

          const path = `
            M ${size / 2} ${size / 2}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
            Z
          `;

          return (
            <path
              key={index}
              d={path}
              fill={colors[index % colors.length]}
              className="transition-all duration-300 hover:opacity-80"
            >
              <title>{item.label}: {item.value} ({percentage.toFixed(1)}%)</title>
            </path>
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={radius * 0.5} fill="white" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900">{total}</span>
      </div>
    </div>
  );
}

/**
 * Pending Provider Row Component
 */
function PendingProviderRow({
  provider,
  onVerify,
  onReject,
}: {
  provider: PendingProvider;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onVerify(provider.id);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onReject(provider.id);
    } finally {
      setLoading(false);
    }
  };

  const createdAt = new Date(provider.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{provider.businessName}</span>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Pending</span>
        </div>
        <p className="text-sm text-gray-500 truncate">{provider.category}</p>
        <p className="text-xs text-gray-400">{provider.user.fullName} • {provider.user.email}</p>
        <p className="text-xs text-gray-400">Submitted {createdAt}</p>
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <button
          onClick={handleVerify}
          disabled={loading}
          className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : 'Verify'}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

/**
 * Activity Row Component
 */
function ActivityRow({ activity }: { activity: RecentActivity }) {
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffMs / 86400000);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const actionColors: Record<string, string> = {
    LOGIN: 'bg-blue-100 text-blue-700',
    REGISTER: 'bg-green-100 text-green-700',
    BOOKING_CREATED: 'bg-purple-100 text-purple-700',
    BOOKING_COMPLETED: 'bg-green-100 text-green-700',
    PAYMENT: 'bg-yellow-100 text-yellow-700',
    VERIFY_PROVIDER: 'bg-indigo-100 text-indigo-700',
    RESOLVE_DISPUTE: 'bg-orange-100 text-orange-700',
    DEACTIVATE_USER: 'bg-red-100 text-red-700',
    UPDATE_USER: 'bg-gray-100 text-gray-700',
    ADMIN_LOGIN: 'bg-blue-100 text-blue-700',
  };

  const actionLabel = activity.action.replace(/_/g, ' ').toLowerCase();

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className={`flex-shrink-0 p-1.5 rounded-full ${actionColors[activity.action] || 'bg-gray-100 text-gray-700'}`}>
        <DocumentTextIcon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{activity.user?.fullName || 'System'}</span>
          <span className="text-gray-500"> {actionLabel}</span>
          {activity.entity && <span className="text-gray-500"> on {activity.entity}</span>}
        </p>
        <p className="text-xs text-gray-400">{timeAgo(activity.createdAt)}</p>
      </div>
    </div>
  );
}

/**
 * Pagination Component
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [pendingPagination, setPendingPagination] = useState({ page: 1, totalPages: 1 });
  const [activityPagination, setActivityPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load admin data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, pendingData, activityData] = await Promise.all([
        getAdminDashboardStats(),
        getPendingProviders(1, 5),
        getRecentActivities(1, 5),
      ]);

      setStats(statsData);
      setPendingProviders(pendingData.data);
      setPendingPagination({ page: pendingData.pagination.page, totalPages: pendingData.pagination.totalPages });
      setActivities(activityData.data);
      setActivityPagination({ page: activityData.pagination.page, totalPages: activityData.pagination.totalPages });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle verify/reject provider
  const handleVerifyProvider = async (providerId: string) => {
    try {
      await verifyProvider(providerId, 'APPROVED');
      await loadData();
    } catch (error) {
      alert('Failed to verify provider');
    }
  };

  const handleRejectProvider = async (providerId: string) => {
    try {
      await verifyProvider(providerId, 'REJECTED');
      await loadData();
    } catch (error) {
      alert('Failed to reject provider');
    }
  };

  // Pagination handlers for pending providers and activities
  const handlePendingPageChange = async (page: number) => {
    try {
      const data = await getPendingProviders(page, 5);
      setPendingProviders(data.data);
      setPendingPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      console.error('Failed to load pending providers:', error);
    }
  };

  const handleActivityPageChange = async (page: number) => {
    try {
      const data = await getRecentActivities(page, 5);
      setActivities(data.data);
      setActivityPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-7xl">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={loadData} className="ml-auto text-sm text-red-700 hover:text-red-900 font-medium">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-7xl text-center py-12">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const bookingTrendData = stats.bookingTrend || [];
  const revenueTrendData = stats.revenueTrend || [];
  const categoryData = stats.categoryBreakdown || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-0.5">Platform overview and management</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Users"
            value={stats.users.total}
            subtitle={`${stats.users.active} active • ${stats.users.inactive} inactive`}
            icon={<UserGroupIcon className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title="Providers"
            value={stats.providers.total}
            subtitle={`${stats.providers.verified} verified • ${stats.providers.pending} pending`}
            icon={<BriefcaseIcon className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title="Total Revenue"
            value={`ETB ${stats.revenue.total.toFixed(2)}`}
            subtitle={`This month: ETB ${stats.revenue.thisMonth.toFixed(2)}`}
            icon={<CurrencyDollarIcon className="w-5 h-5" />}
            color="purple"
            trend={{ value: 12.5, positive: true }}
          />
          <StatsCard
            title="Bookings"
            value={stats.bookings.total}
            subtitle={`${stats.bookings.pending} pending • ${stats.bookings.completed} completed`}
            icon={<CalendarIcon className="w-5 h-5" />}
            color="yellow"
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Disputes"
            value={stats.disputes.total}
            subtitle={`${stats.disputes.open} open`}
            icon={<ExclamationTriangleIcon className="w-5 h-5" />}
            color="red"
          />
          <StatsCard
            title="Reviews"
            value={stats.reviews.total}
            subtitle={`${stats.reviews.averageRating.toFixed(1)} ★ average`}
            icon={<StarIcon className="w-5 h-5" />}
            color="indigo"
          />
          <StatsCard
            title="New Users (Today)"
            value={stats.users.newToday}
            icon={<UserIcon className="w-5 h-5" />}
            color="pink"
          />
          <StatsCard
            title="New Providers (Today)"
            value={stats.providers.newToday}
            icon={<BuildingOfficeIcon className="w-5 h-5" />}
            color="teal"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Booking Trend Chart */}
          <div className="bg-white rounded-xl shadow-card p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Booking Activity</h3>
              <span className="text-xs text-gray-400">Last 7 days</span>
            </div>
            <BarChart data={bookingTrendData} labelKey="date" valueKey="count" barColor="#3b82f6" />
            <div className="mt-2 text-center text-sm text-gray-500">
              Total: {stats.bookings.thisWeek} bookings this week
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl shadow-card p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
              <span className="text-xs text-gray-400">Last 7 days</span>
            </div>
            <BarChart data={revenueTrendData} labelKey="date" valueKey="amount" barColor="#10b981" />
            <div className="mt-2 text-center text-sm text-gray-500">
              This week: ETB {stats.revenue.thisWeek.toFixed(2)}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-card p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Category Breakdown</h3>
              <span className="text-xs text-gray-400">By bookings</span>
            </div>
            {categoryData.length > 0 ? (
              <div className="flex items-center justify-center gap-6">
                <DonutChart
                  data={categoryData.map(c => ({ label: c.category, value: c.count }))}
                  size={120}
                />
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {categoryData.slice(0, 5).map((c, i) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: colors[i % colors.length] }} />
                        <span className="text-gray-700">{c.category}</span>
                        <span className="text-gray-400 ml-auto">{c.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">No category data</div>
            )}
          </div>
        </div>

        {/* Pending Providers & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Providers */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Pending Provider Verifications</h2>
                <Link href="/dashboard/admin/providers" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all
                </Link>
              </div>
              {pendingProviders.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No pending verifications</div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {pendingProviders.map((provider) => (
                      <PendingProviderRow
                        key={provider.id}
                        provider={provider}
                        onVerify={handleVerifyProvider}
                        onReject={handleRejectProvider}
                      />
                    ))}
                  </div>
                  {pendingPagination.totalPages > 1 && (
                    <Pagination
                      currentPage={pendingPagination.page}
                      totalPages={pendingPagination.totalPages}
                      onPageChange={handlePendingPageChange}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                <Link href="/dashboard/admin/audit-logs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all
                </Link>
              </div>
              {activities.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No recent activity</div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50">
                    {activities.map((activity) => (
                      <ActivityRow key={activity.id} activity={activity} />
                    ))}
                  </div>
                  {activityPagination.totalPages > 1 && (
                    <Pagination
                      currentPage={activityPagination.page}
                      totalPages={activityPagination.totalPages}
                      onPageChange={handleActivityPageChange}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Link
            href="/dashboard/admin/users"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Manage Users</p>
              <p className="text-xs text-gray-500">View and manage users</p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/providers"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-green-50 rounded-lg">
              <BriefcaseIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Manage Providers</p>
              <p className="text-xs text-gray-500">Verify and manage</p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/disputes"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-red-50 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Disputes</p>
              <p className="text-xs text-gray-500">{stats.disputes.open} open disputes</p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/settings"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-gray-50 rounded-lg">
              <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">System Settings</p>
              <p className="text-xs text-gray-500">Configuration</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}