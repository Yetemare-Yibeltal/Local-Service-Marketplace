'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CalendarIcon,
  StarIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ChartBarIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  TrophyIcon,
  FireIcon,
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

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    daily: { date: string; amount: number }[];
    monthly: { month: string; amount: number }[];
    byCategory: { category: string; amount: number }[];
  };
  bookings: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    daily: { date: string; count: number }[];
    byStatus: { status: string; count: number }[];
    byCategory: { category: string; count: number }[];
  };
  users: {
    total: number;
    active: number;
    growth: number;
    daily: { date: string; count: number }[];
    byRole: { role: string; count: number }[];
  };
  providers: {
    total: number;
    verified: number;
    pending: number;
    growth: number;
    daily: { date: string; count: number }[];
    byCategory: { category: string; count: number }[];
  };
  disputes: {
    total: number;
    open: number;
    resolved: number;
    daily: { date: string; count: number }[];
  };
  reviews: {
    total: number;
    averageRating: number;
    daily: { date: string; count: number }[];
  };
  kpis: {
    revenue: { value: number; trend: number; label: string };
    bookings: { value: number; trend: number; label: string };
    users: { value: number; trend: number; label: string };
    providers: { value: number; trend: number; label: string };
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

async function getPlatformAnalytics(period: string = 'month'): Promise<AnalyticsData> {
  return await fetchWithAuth(`/admin/analytics?period=${period}`);
}

// ============================================================
// COLORS
// ============================================================

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  DISPUTED: '#f97316',
};

// ============================================================
// COMPONENTS
// ============================================================

/**
 * KPI Card Component
 */
function KPICard({
  title,
  value,
  trend,
  icon,
  color = 'blue',
}: {
  title: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  const isPositive = trend >= 0;

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <ArrowUpRightIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownRightIcon className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-gray-400">vs last month</span>
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
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

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPlatformAnalytics(period);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-0.5">Platform performance and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <PeriodSelector period={period} onChange={setPeriod} />
            <button onClick={loadAnalytics} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Revenue"
            value={`ETB ${data.kpis.revenue.value.toFixed(2)}`}
            trend={data.kpis.revenue.trend}
            icon={<CurrencyDollarIcon className="w-5 h-5" />}
            color="green"
          />
          <KPICard
            title="Bookings"
            value={data.kpis.bookings.value.toString()}
            trend={data.kpis.bookings.trend}
            icon={<CalendarIcon className="w-5 h-5" />}
            color="blue"
          />
          <KPICard
            title="Users"
            value={data.kpis.users.value.toString()}
            trend={data.kpis.users.trend}
            icon={<UserGroupIcon className="w-5 h-5" />}
            color="purple"
          />
          <KPICard
            title="Providers"
            value={data.kpis.providers.value.toString()}
            trend={data.kpis.providers.trend}
            icon={<BriefcaseIcon className="w-5 h-5" />}
            color="indigo"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
              <span className="text-xs text-gray-400">{period}</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue.daily}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `ETB ${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`ETB ${value.toFixed(2)}`, 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bookings Chart */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Booking Activity</h3>
              <span className="text-xs text-gray-400">{period}</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bookings.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [value, 'Bookings']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Booking Status Breakdown */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Booking Status</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.bookings.byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {data.bookings.byStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#9ca3af'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Bookings']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Revenue by Category</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.revenue.byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="amount"
                  >
                    {data.revenue.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`ETB ${value.toFixed(2)}`, 'Revenue']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provider Categories */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Provider Categories</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.providers.byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {data.providers.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Providers']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">User Growth</h3>
              <span className="text-xs text-gray-400">{period}</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.users.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [value, 'New Users']} />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reviews & Disputes */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Reviews & Disputes</h3>
              <span className="text-xs text-gray-400">{period}</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.reviews.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Reviews"
                  />
                  <Line
                    type="monotone"
                    data={data.disputes.daily}
                    dataKey="count"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="Disputes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Total Reviews</p>
                <p className="text-lg font-bold text-gray-900">{data.reviews.total}</p>
                <p className="text-xs text-gray-500">★ {data.reviews.averageRating.toFixed(1)} avg</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Disputes</p>
                <p className="text-lg font-bold text-gray-900">{data.disputes.total}</p>
                <p className="text-xs text-gray-500">{data.disputes.open} open</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow-card p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{data.users.total}</p>
            <p className="text-xs text-gray-500">Total Users</p>
            <p className="text-xs text-green-600">{data.users.active} active</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{data.providers.total}</p>
            <p className="text-xs text-gray-500">Total Providers</p>
            <p className="text-xs text-green-600">{data.providers.verified} verified</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{data.bookings.total}</p>
            <p className="text-xs text-gray-500">Total Bookings</p>
            <p className="text-xs text-blue-600">{data.bookings.thisMonth} this month</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">ETB {data.revenue.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-xs text-green-600">+{data.revenue.growth}% growth</p>
          </div>
        </div>
      </div>
    </div>
  );
}