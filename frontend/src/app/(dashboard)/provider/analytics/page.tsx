'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  StarIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ChartBarIcon,
  BriefcaseIcon,
  UserIcon,
  ClockIcon,
  FireIcon,
  TrophyIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';

// ============================================================
// TYPES
// ============================================================

interface ProviderAnalytics {
  summary: {
    totalEarnings: number;
    totalBookings: number;
    completedBookings: number;
    averageRating: number;
    totalReviews: number;
    responseTime: number | null;
    completionRate: number;
    thisMonthEarnings: number;
    thisMonthBookings: number;
    growthEarnings: number;
    growthBookings: number;
  };
  bookingTrend: { date: string; count: number; revenue: number }[];
  revenueTrend: { date: string; amount: number }[];
  categoryDistribution: { category: string; count: number; revenue: number }[];
  ratingDistribution: { rating: number; count: number }[];
  topServices: { serviceName: string; count: number; revenue: number }[];
  recentActivity: {
    id: string;
    action: string;
    bookingNumber: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

interface PeriodOption {
  value: 'today' | 'week' | 'month' | 'quarter' | 'year';
  label: string;
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

async function getProviderAnalytics(period: string = 'month'): Promise<ProviderAnalytics> {
  return await fetchWithAuth(`/analytics/provider?period=${period}`);
}

// ============================================================
// COLORS
// ============================================================

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const RATING_COLORS = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Summary Card Component
 */
function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  isLoading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'pink' | 'teal';
  trend?: { value: number; positive: boolean };
  isLoading?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    pink: 'bg-pink-50 text-pink-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mt-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>{icon}</div>
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
 * Period Selector Component
 */
function PeriodSelector({
  period,
  onChange,
  isLoading,
}: {
  period: string;
  onChange: (period: string) => void;
  isLoading?: boolean;
}) {
  const options: PeriodOption[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-card p-1">
        {options.map((opt) => (
          <div key={opt.value} className="px-4 py-1.5 h-9 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-card p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            period === opt.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Custom Tooltip for Charts
 */
function CustomTooltip({ active, payload, label, formatter, labelFormatter }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((item: any, index: number) => (
        <p key={index} className="text-gray-700" style={{ color: item.color }}>
          {item.name}: {formatter ? formatter(item.value) : item.value}
        </p>
      ))}
    </div>
  );
}

/**
 * Recent Activity Row
 */
function ActivityRow({ activity }: { activity: ProviderAnalytics['recentActivity'][0] }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    DISPUTED: 'bg-orange-100 text-orange-800',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed',
  };

  const actionLabels: Record<string, string> = {
    BOOKING_CREATED: 'Booking Created',
    BOOKING_CONFIRMED: 'Booking Confirmed',
    BOOKING_STARTED: 'Booking Started',
    BOOKING_COMPLETED: 'Booking Completed',
    BOOKING_CANCELLED: 'Booking Cancelled',
    PAYMENT_RECEIVED: 'Payment Received',
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const actionLabel = actionLabels[activity.action] || activity.action.replace(/_/g, ' ');

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 truncate">
            {actionLabel}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[activity.status] || 'bg-gray-100 text-gray-600'}`}>
            {statusLabels[activity.status] || activity.status}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Booking #{activity.bookingNumber} · {timeAgo(activity.createdAt)}
        </p>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <p className="text-sm font-medium text-green-600">
          +ETB {activity.amount.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{icon || '📊'}</div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProviderAnalyticsPage() {
  const router = useRouter();

  const [data, setData] = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load analytics
  const loadAnalytics = useCallback(async (showRefreshing: boolean = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await getProviderAnalytics(period);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Error loading provider analytics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadAnalytics(true);
  };

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-56 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-card p-6 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mt-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-card p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-7xl">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Failed to load analytics</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-7xl">
          <EmptyState message="No analytics data available yet. Start booking services to see insights." icon="📊" />
        </div>
      </div>
    );
  }

  const { summary, bookingTrend, revenueTrend, categoryDistribution, ratingDistribution, topServices, recentActivity } = data;

  // Memoized chart data
  const hasBookingData = bookingTrend && bookingTrend.length > 0;
  const hasRevenueData = revenueTrend && revenueTrend.length > 0;
  const hasCategoryData = categoryDistribution && categoryDistribution.length > 0;
  const hasRatingData = ratingDistribution && ratingDistribution.length > 0;
  const hasTopServices = topServices && topServices.length > 0;
  const hasRecentActivity = recentActivity && recentActivity.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
            <p className="text-gray-600 mt-0.5">Track your performance and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <PeriodSelector period={period} onChange={handlePeriodChange} isLoading={isRefreshing} />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total Earnings"
            value={`ETB ${summary.totalEarnings.toFixed(2)}`}
            subtitle={`This month: ETB ${summary.thisMonthEarnings.toFixed(2)}`}
            icon={<CurrencyDollarIcon className="w-5 h-5" />}
            color="green"
            trend={{ value: summary.growthEarnings, positive: summary.growthEarnings >= 0 }}
            isLoading={isRefreshing}
          />
          <SummaryCard
            title="Total Bookings"
            value={summary.totalBookings}
            subtitle={`${summary.completedBookings} completed`}
            icon={<CalendarIcon className="w-5 h-5" />}
            color="blue"
            trend={{ value: summary.growthBookings, positive: summary.growthBookings >= 0 }}
            isLoading={isRefreshing}
          />
          <SummaryCard
            title="Average Rating"
            value={`${summary.averageRating.toFixed(1)} ★`}
            subtitle={`${summary.totalReviews} reviews`}
            icon={<StarIcon className="w-5 h-5" />}
            color="yellow"
            isLoading={isRefreshing}
          />
          <SummaryCard
            title="Completion Rate"
            value={`${summary.completionRate.toFixed(0)}%`}
            subtitle={`${summary.responseTime ? `${summary.responseTime} min avg response` : 'No response data'}`}
            icon={<ChartBarIcon className="w-5 h-5" />}
            color="purple"
            isLoading={isRefreshing}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Booking & Revenue Trend */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Booking & Revenue Trend</h3>
              <span className="text-xs text-gray-400">{period}</span>
            </div>
            {isRefreshing ? (
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            ) : !hasBookingData ? (
              <EmptyState message="No booking data available for this period" icon="📈" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={bookingTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Bookings" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name="Revenue (ETB)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Revenue Trend (Area) */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
              <span className="text-xs text-gray-400">{period}</span>
            </div>
            {isRefreshing ? (
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            ) : !hasRevenueData ? (
              <EmptyState message="No revenue data available for this period" icon="💰" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `ETB ${v}`} />
                    <Tooltip content={<CustomTooltip formatter={(v: number) => `ETB ${v.toFixed(2)}`} />} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#revenueGradient)" name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Category Breakdown</h3>
            </div>
            {isRefreshing ? (
              <div className="h-56 bg-gray-100 rounded animate-pulse"></div>
            ) : !hasCategoryData ? (
              <EmptyState message="No category data" icon="📊" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={(v: number) => `${v} bookings`} />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Rating Distribution</h3>
            </div>
            {isRefreshing ? (
              <div className="h-56 bg-gray-100 rounded animate-pulse"></div>
            ) : !hasRatingData ? (
              <EmptyState message="No rating data" icon="⭐" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip formatter={(v: number) => `${v} reviews`} />} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Services */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Top Services</h3>
            </div>
            {isRefreshing ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 mt-1 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : !hasTopServices ? (
              <EmptyState message="No services data" icon="📦" />
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {topServices.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{service.serviceName}</p>
                      <p className="text-xs text-gray-400">{service.count} bookings</p>
                    </div>
                    <p className="font-medium text-green-600 text-sm ml-4">ETB {service.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <span className="text-xs text-gray-400">{period}</span>
          </div>
          {isRefreshing ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3 mt-1 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : !hasRecentActivity ? (
            <EmptyState message="No recent activity" icon="📋" />
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-card p-5 text-white">
            <div className="flex items-center gap-3">
              <FireIcon className="w-6 h-6 text-blue-200" />
              <div>
                <p className="text-blue-200 text-sm">Completion Rate</p>
                <p className="text-2xl font-bold">{summary.completionRate.toFixed(0)}%</p>
              </div>
            </div>
            <p className="text-blue-200 text-xs mt-2">
              {summary.completedBookings} out of {summary.totalBookings} bookings completed
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-card p-5 text-white">
            <div className="flex items-center gap-3">
              <TrophyIcon className="w-6 h-6 text-green-200" />
              <div>
                <p className="text-green-200 text-sm">Average Rating</p>
                <p className="text-2xl font-bold">{summary.averageRating.toFixed(1)} ★</p>
              </div>
            </div>
            <p className="text-green-200 text-xs mt-2">Based on {summary.totalReviews} reviews</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-card p-5 text-white">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-6 h-6 text-purple-200" />
              <div>
                <p className="text-purple-200 text-sm">Response Time</p>
                <p className="text-2xl font-bold">{summary.responseTime ? `${summary.responseTime} min` : 'N/A'}</p>
              </div>
            </div>
            <p className="text-purple-200 text-xs mt-2">
              {summary.responseTime ? 'Average time to respond to booking requests' : 'No response data yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}