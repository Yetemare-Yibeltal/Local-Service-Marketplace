'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
  trend?: { value: number; positive: boolean };
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
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
}: {
  period: string;
  onChange: (period: string) => void;
}) {
  const options = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ];

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-card p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            period === opt.value
              ? 'bg-blue-600 text-white'
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
 * Recent Activity Row
 */
function ActivityRow({ activity }: { activity: ProviderAnalytics['recentActivity'][0] }) {
  const statusColors: Record<string, string> = {
    PENDING: 'text-yellow-600 bg-yellow-50',
    CONFIRMED: 'text-blue-600 bg-blue-50',
    IN_PROGRESS: 'text-purple-600 bg-purple-50',
    COMPLETED: 'text-green-600 bg-green-50',
    CANCELLED: 'text-red-600 bg-red-50',
    DISPUTED: 'text-orange-600 bg-orange-50',
  };

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

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 truncate">
          <span className="font-medium">{activity.action}</span>
          <span className="text-gray-400 ml-1">Booking #{activity.bookingNumber}</span>
        </p>
        <p className="text-xs text-gray-400">{timeAgo(activity.createdAt)}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[activity.status] || 'bg-gray-100 text-gray-600'}`}>
          {activity.status}
        </span>
        <span className="text-sm font-medium text-gray-900">ETB {activity.amount.toFixed(2)}</span>
      </div>
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
  const [period, setPeriod] = useState('month');

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProviderAnalytics(period);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading analytics...</p>
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
            <button onClick={loadAnalytics} className="ml-auto text-sm text-red-700 hover:text-red-900 font-medium">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-7xl text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  const { summary, bookingTrend, revenueTrend, categoryDistribution, ratingDistribution, topServices, recentActivity } = data;

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
            <PeriodSelector period={period} onChange={setPeriod} />
            <button onClick={loadAnalytics} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
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
          />
          <SummaryCard
            title="Bookings"
            value={summary.totalBookings}
            subtitle={`${summary.completedBookings} completed`}
            icon={<CalendarIcon className="w-5 h-5" />}
            color="blue"
            trend={{ value: summary.growthBookings, positive: summary.growthBookings >= 0 }}
          />
          <SummaryCard
            title="Rating"
            value={`${summary.averageRating.toFixed(1)} ★`}
            subtitle={`${summary.totalReviews} reviews`}
            icon={<StarIcon className="w-5 h-5" />}
            color="yellow"
          />
          <SummaryCard
            title="Completion Rate"
            value={`${summary.completionRate.toFixed(0)}%`}
            subtitle={`${summary.responseTime ? `${summary.responseTime} min avg response` : 'No response data'}`}
            icon={<ChartBarIcon className="w-5 h-5" />}
            color="purple"
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Bookings"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue (ETB)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend (Area) */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
              <span className="text-xs text-gray-400">{period}</span>
            </div>
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
                  <Tooltip formatter={(value: number) => [`ETB ${value.toFixed(2)}`, 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Category Breakdown</h3>
            </div>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Bookings']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Rating Distribution</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [value, 'Reviews']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Services */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Top Services</h3>
            </div>
            {topServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No services data</div>
            ) : (
              <div className="space-y-3">
                {topServices.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{service.serviceName}</p>
                      <p className="text-xs text-gray-400">{service.count} bookings</p>
                    </div>
                    <p className="font-medium text-green-600 text-sm">ETB {service.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No recent activity</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}