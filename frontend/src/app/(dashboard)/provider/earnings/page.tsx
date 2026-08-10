'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

// ============================================================
// TYPES
// ============================================================

interface EarningsSummary {
  totalEarnings: number;
  totalBookings: number;
  pendingPayouts: number;
  completedPayouts: number;
  averagePerBooking: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  thisWeekEarnings: number;
  growthPercentage: number;
}

interface EarningsTransaction {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  serviceTitle: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'PENDING' | 'PAID' | 'HOLD';
  paidAt: string | null;
  createdAt: string;
}

interface EarningsByPeriod {
  period: string;
  amount: number;
  count: number;
}

interface PayoutSummary {
  availableBalance: number;
  pendingBalance: number;
  totalPaid: number;
  nextPayoutDate: string | null;
}

interface ApiResponse {
  earnings: {
    summary: EarningsSummary;
    transactions: EarningsTransaction[];
    byPeriod: EarningsByPeriod[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
  payout: PayoutSummary;
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

async function getEarningsData(
  period: 'today' | 'week' | 'month' | 'year' = 'month',
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('period', period);
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const earnings = await fetchWithAuth(`/payments/earnings?${params.toString()}`);
  const payout = await fetchWithAuth('/payments/payout/summary');

  return {
    earnings,
    payout,
  };
}

async function requestPayout(amount?: number): Promise<any> {
  return await fetchWithAuth('/payments/payout/request', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

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
  value: string;
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
    <div className="bg-white rounded-xl shadow-card p-5">
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
 * Earnings Chart Component (Bar Chart using SVG)
 */
function EarningsChart({
  data,
  height = 150,
  barColor = '#2563eb',
}: {
  data: EarningsByPeriod[];
  height?: number;
  barColor?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No earnings data available
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const padding = { top: 10, bottom: 20, left: 5, right: 5 };
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = Math.min(32, (data.length > 0 ? 320 / data.length : 32));

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${Math.max(320, data.length * 36)} ${height}`}>
        {data.map((item, index) => {
          const x = index * (barWidth + 4) + 8;
          const value = item.amount || 0;
          const barHeight = maxAmount > 0 ? (value / maxAmount) * chartHeight : 0;
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
                <title>{item.period}: ETB {value.toFixed(2)}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 14}
                fontSize="8"
                fill="#9ca3af"
                textAnchor="middle"
                className="select-none"
              >
                {item.period.slice(0, 3)}
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
                  {value > 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
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
 * Transaction Row Component
 */
function TransactionRow({ transaction }: { transaction: EarningsTransaction }) {
  const statusConfig = {
    PAID: { label: 'Paid', color: 'bg-green-100 text-green-800' },
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    HOLD: { label: 'On Hold', color: 'bg-red-100 text-red-800' },
  };

  const status = statusConfig[transaction.status as keyof typeof statusConfig] || statusConfig.PENDING;

  const date = new Date(transaction.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm truncate">
            {transaction.serviceTitle || transaction.bookingNumber}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        <p className="text-xs text-gray-500">{transaction.customerName}</p>
        <p className="text-xs text-gray-400">{formattedDate}</p>
        <p className="text-xs text-gray-400">Booking #{transaction.bookingNumber}</p>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <p className="font-medium text-gray-900">ETB {transaction.netAmount.toFixed(2)}</p>
        {transaction.commission > 0 && (
          <p className="text-xs text-gray-400">Fee: ETB {transaction.commission.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Payout Card Component
 */
function PayoutCard({
  summary,
  onRequestPayout,
  loading,
}: {
  summary: PayoutSummary;
  onRequestPayout: () => void;
  loading: boolean;
}) {
  const nextPayoutDate = summary.nextPayoutDate
    ? new Date(summary.nextPayoutDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not scheduled';

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-blue-100 text-sm font-medium">Available Balance</p>
          <p className="text-3xl font-bold mt-1">
            ETB {summary.availableBalance.toFixed(2)}
          </p>
        </div>
        <div className="p-2 bg-white/20 rounded-lg">
          <WalletIcon className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-500/30">
        <div>
          <p className="text-blue-200 text-xs">Pending</p>
          <p className="text-white font-semibold">ETB {summary.pendingBalance.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-blue-200 text-xs">Total Paid</p>
          <p className="text-white font-semibold">ETB {summary.totalPaid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-blue-200 text-xs">Next Payout</p>
          <p className="text-white text-xs font-medium truncate">{nextPayoutDate}</p>
        </div>
      </div>

      <button
        onClick={onRequestPayout}
        disabled={loading || summary.availableBalance < 100}
        className="mt-4 w-full py-2.5 bg-white text-blue-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        ) : (
          <BanknotesIcon className="w-4 h-4" />
        )}
        {loading
          ? 'Processing...'
          : summary.availableBalance < 100
          ? 'Minimum payout is ETB 100'
          : 'Request Payout'}
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProviderEarningsPage() {
  const router = useRouter();

  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Load earnings data
  const loadEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEarningsData(period, page, limit);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [period, page, limit]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  // Handle period change
  const handlePeriodChange = (newPeriod: typeof period) => {
    setPeriod(newPeriod);
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (data?.earnings.pagination.totalPages || 1)) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle payout request
  const handleRequestPayout = async () => {
    if (!data) return;
    if (data.payout.availableBalance < 100) {
      alert('Minimum payout amount is ETB 100');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to request payout of ETB ${data.payout.availableBalance.toFixed(2)}?`
    );
    if (!confirmed) return;

    setPayoutLoading(true);
    try {
      await requestPayout();
      alert('Payout request submitted successfully!');
      await loadEarnings();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to request payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading earnings data...</p>
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
            <button
              onClick={loadEarnings}
              className="ml-auto text-sm text-red-700 hover:text-red-900 font-medium"
            >
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
          <p className="text-gray-500">No earnings data available</p>
        </div>
      </div>
    );
  }

  const { summary, transactions, byPeriod } = data.earnings;
  const { pagination } = data.earnings;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
            <p className="text-gray-600 mt-0.5">Track your service earnings and payouts</p>
          </div>
          <button
            onClick={loadEarnings}
            className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-6 bg-white rounded-lg shadow-card p-1 w-fit">
          {(['today', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total Earnings"
            value={formatCurrency(summary.totalEarnings)}
            subtitle={`${summary.totalBookings} bookings`}
            icon={<CurrencyDollarIcon className="w-5 h-5" />}
            color="green"
          />
          <SummaryCard
            title="This Period"
            value={formatCurrency(summary.thisMonthEarnings)}
            subtitle={`${summary.totalBookings} bookings this month`}
            icon={<CalendarIcon className="w-5 h-5" />}
            color="blue"
            trend={{
              value: summary.growthPercentage || 0,
              positive: (summary.growthPercentage || 0) >= 0,
            }}
          />
          <SummaryCard
            title="Average Per Booking"
            value={formatCurrency(summary.averagePerBooking)}
            icon={<ChartBarIcon className="w-5 h-5" />}
            color="purple"
          />
          <SummaryCard
            title="Pending Payouts"
            value={formatCurrency(data.payout.pendingBalance)}
            subtitle="Awaiting confirmation"
            icon={<ClockIcon className="w-5 h-5" />}
            color="yellow"
          />
        </div>

        {/* Payout Card and Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <PayoutCard
              summary={data.payout}
              onRequestPayout={handleRequestPayout}
              loading={payoutLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-card p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Earnings Trend</h3>
                <span className="text-xs text-gray-400">{period} view</span>
              </div>
              <EarningsChart data={byPeriod} height={150} />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Transaction History</h3>
            <span className="text-sm text-gray-500">
              {pagination.totalItems} transactions
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="px-6 divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              {[...Array(Math.min(pagination.totalPages, 7))].map((_, i) => {
                let p: number;
                if (pagination.totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= pagination.totalPages - 3) {
                  p = pagination.totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                if (p > pagination.totalPages) return null;
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
              {pagination.totalPages > 7 && page < pagination.totalPages - 3 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              {pagination.totalPages > 7 && page < pagination.totalPages - 3 && (
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {pagination.totalPages}
                </button>
              )}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}