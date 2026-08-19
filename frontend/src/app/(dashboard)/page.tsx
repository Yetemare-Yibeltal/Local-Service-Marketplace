'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  EnvelopeIcon,
  HomeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
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
  ArrowPathRoundedSquareIcon,
  Square3Stack3DIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// ============================================================
// TYPES
// ============================================================

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  disputedBookings: number;
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyBookings: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  totalSpent: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  bookingTrend: { date: string; count: number; revenue: number }[];
  earningsTrend: { date: string; amount: number }[];
  categoryBreakdown: { category: string; count: number; revenue: number }[];
  peakHours: { hour: number; count: number }[];
  responseTimeAvg: number | null;
  topServices: { id: string; title: string; count: number; revenue: number }[];
  customerSegment?: { segment: string; count: number; percentage: number }[];
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  providerId: string;
  serviceId: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  scheduledDate: string;
  address: string;
  totalPrice: number;
  createdAt: string;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };

interface ProviderProfile {
  id: string;
  businessName: string;
  businessLogo: string | null;
  description: string;
  category: string;
  subCategory: string | null;
  yearsExperience: number;
  hourlyRate: number | null;
  isAvailable: boolean;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  locationLat: number;
  locationLng: number;
  address: string;
  city: string;
  completedJobs: number;
  responseTime: number | null;
  isFeatured: boolean;
  workingHours: any;
}

interface FavoriteProvider {
  id: string;
  providerId: string;
  customerId: string;
  createdAt: string;
  provider: {
    id: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    averageRating: number;
    isVerified: boolean;
  };
}

interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProviders: number;
  activeProviders: number;
  verifiedProviders: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingProviders: number;
  totalDisputes: number;
  openDisputes: number;
  userGrowth: { date: string; count: number }[];
  revenueGrowth: { date: string; amount: number }[];
  topCategories: { name: string; bookings: number; revenue: number }[];
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
    localStorage.removeItem
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  const result = await response.json();
  return result.data;
}

async function getDashboardStats(userId: string, role: string): Promise<DashboardStats> {
  try {
    if (role === 'PROVIDER') {
      return await fetchWithAuth(`/bookings/provider/stats`);
    } else if (role === 'ADMIN') {
      return await fetchWithAuth(`/admin/dashboard`);
    } else {
      return await fetchWithAuth(`/bookings/customer/stats`);
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return getDefaultStats(role);
  }
}

function getDefaultStats(role: string): DashboardStats {
  return {
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    inProgressBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    disputedBookings: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    weeklyBookings: 0,
    completionRate: 0,
    averageRating: 0,
    totalReviews: 0,
    totalSpent: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    bookingTrend: [],
    earningsTrend: [],
    categoryBreakdown: [],
    peakHours: [],
    responseTimeAvg: null,
    topServices: [],
    customerSegment: [],
  };
}

async function getUpcomingBookings(userId: string, role: string): Promise<Booking[]> {
  try {
    if (role === 'PROVIDER') {
      return await fetchWithAuth(`/bookings/provider?status=PENDING&limit=5`);
    } else {
      return await fetchWithAuth(`/bookings/customer?status=CONFIRMED&limit=5`);
    }
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    return [];
  }
}

async function getRecentBookings(userId: string, role: string): Promise<Booking[]> {
  try {
    if (role === 'PROVIDER') {
      return await fetchWithAuth(`/bookings/provider?limit=5&sortBy=createdAt&sortOrder=desc`);
    } else {
      return await fetchWithAuth(`/bookings/customer?limit=5&sortBy=createdAt&sortOrder=desc`);
    }
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    return [];
  }
}

async function getProviderServices(): Promise<Service[]> {
  try {
    return await fetchWithAuth(`/providers/services`);
  } catch (error) {
    console.error('Error fetching provider services:', error);
    return [];
  }
}

async function getProviderProfile(): Promise<ProviderProfile | null> {
  try {
    return await fetchWithAuth(`/providers/profile`);
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    return null;
  }
}

async function getNotifications(): Promise<Notification[]> {
  try {
    return await fetchWithAuth(`/notifications?limit=5`);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

async function getUnreadCount(): Promise<{ total: number }> {
  try {
    return await fetchWithAuth(`/notifications/unread-count`);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return { total: 0 };
  }
}
{
  try {
    return await fetchWithAuth(`/providers/favorites`);
  } catch (error) {
    console.error('Error fetching favorite providers:', error);
    return [];
  }
}

// ============================================================
// CHART COMPONENTS (Pure SVG)
// ============================================================

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
  const maxVal = maxValue || Math.max(...data.map((d) => d[valueKey]), 1);
  const padding = { top: 10, bottom: 20, left: 5, right: 5 };
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = Math.min(24, (data.length > 0 ? 320 / data.length : 24));

  return (
   
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
 * Donut Chart Component (Pure SVG)
 */
function DonutChart({
  data,
  size = 100,
  colors = string; value: number }[];
  size?: number;
  colors?: string[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div className="text-center text-gray-400 text-sm">No data</div>;

  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;

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

          // Calculate SVG arc path
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
      <div>
        <span className="text-sm font-bold text-gray-900">{total}</span>
      </div>
    </div>
  );
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
    blue: 
  const borderColors = {
    blue: 'border-blue-200',
    green: 'border-green-200',
    yellow: 'border-yellow-200',
    purple: 'border-purple-200',
    red: 'border-red-200',
    indigo: 'border-indigo-200',
    pink: 'border-pink-200',
    teal: 'border-teal-200',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} border border-gray-50 group`}
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
 * Booking Card Component
 */
function BookingCard({ booking, role }: { booking: Booking; role: string }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-blue-50 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-purple-50 text-purple-800 border-purple-200',
    COMPLETED: 'bg-green-50 text-green-800 border-green-200',
    CANCELLED: 'bg-red-50 text-red-800 border-red-200',
    DISPUTED: 'bg-orange-50 text-orange-800 border-orange-200',
  };

  const statusIcons: = {
    PENDING: <ClockIcon className="w-3 h-3" />,
    CONFIRMED: <CheckCircleIcon className="w-3 h-3" />,
    IN_PROGRESS: <ArrowPathIcon className="w-3 h-3" />,
    COMPLETED: <CheckCircleIcon className="w-3 h-3" />,
    CANCELLED: <XCircleIcon className="w-3 h-3" />,
    DISPUTED: <ExclamationTriangleIcon className="w-3 h-3" />,
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed',
  };

  const router = useRouter();

  const scheduledDate = new Date(booking.scheduledDate);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayName = role === 'PROVIDER'
    ? booking.customer?.fullName || 'Customer'
    : booking.provider?.businessName || 'Provider';

  const displayImage = role === 'PROVIDER'
    ? booking.customer?.profileImage
    : booking.provider?.businessLogo;

  const isCustomer = role === 'CUSTOMER';

  const handleView = () => {
    router.push(`/dashboard/bookings/${booking.bookingNumber}`);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={displayName || 'User'}
              width={44}
              height={44}
              className="rounded-full object-cover w-11 h-11"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {displayName?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{booking.bookingNumber}</p>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[booking.status] || statusColors.PENDING}`}>
              {statusIcons[booking.status] || statusIcons.PENDING}
              {statusLabels[booking.status] || booking.status}
            </span>
          </div>
          <div >
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {formattedDate} at {formattedTime}
            </span>
            {isCustomer && booking.service && (
              <span className="text-xs text-gray-400">{booking.service.title}</span>
            )}
            <span className="text-xs font-semibold text-blue-600">
              ETB {booking.totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleView}
            className="mt-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
          >
            View Details
            <ChevronRightIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification Item Component
 */
function NotificationItem({ notification }: { notification: Notification }) {
  const [isRead, setIsRead] = useState(!!notification.readAt);

  const handleMarkRead = async () => {
    try {
      await fetchWithAuth(`/notifications/${notification.id}/read`, {
        method: 'POST',
      });
      setIsRead(true);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const timeAgo = new Date(notification.createdAt);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - timeAgo.getTime()) / 60000);
  let timeDisplay = 'Just now';
  if (diffMinutes > 60) {
    const hours = Math.floor(diffMinutes / 60);
    timeDisplay = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (diffMinutes > 0) {
    timeDisplay = diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  return (
    <div className={`p-3 rounded-lg transition-colors ${!isRead ? 'bg-blue-50 border border-blue-100' : 'bg-white hover:bg-gray-50'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {!isRead && <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${!isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
              {notification.message}
            </p>
            {!isRead && (
              <button
                onClick={handleMarkRead}
                className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                Mark read
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{timeDisplay}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Action Button Component
 */
function QuickAction({
  icon,
  label,
  href,
  color = 'blue',
  description,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo' | 'pink' | 'teal';
  description?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100',
    green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-100',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-100',
    yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-100',
    red: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-100',
    indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100',
    pink: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-100',
    teal: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-100',
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${colorClasses[color]}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <div className="font-medium text-sm">{label}</div>
        {description && <div className="text-xs opacity-75">{description}</div>}
      </div>
    </Link>
  );
}

/**
 * Favorite Provider Card
 */
function FavoriteProviderCard({ favorite }: { favorite: FavoriteProvider }) {
  return (
    <Link
      href={`/provider/${favorite.provider.id}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
    >
      {favorite.provider.businessLogo ? (
        <Image
          src={favorite.provider.businessLogo}
          alt={favorite.provider.businessName}
          width={40}
          height={40}
          className="rounded-full object-cover w-10 h-10"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <BriefcaseIcon className="w-5 h-5 text-blue-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">
          {favorite.provider.businessName}
        </p>
        <p className="text-xs text-gray-500">{favorite.provider.category}</p>
      </div>
      <div className="flex items-center gap-1">
        <StarSolidIcon className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-xs font-medium text-gray-700">{favorite.provider.averageRating.toFixed(1)}</span>
      </div>
    </Link>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'CUSTOMER' | 'PROVIDER' | 'ADMIN'>('CUSTOMER');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'services' | 'analytics'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Load user data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setRole(parsed.role || 'CUSTOMER');
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Load dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) return;

      setLoading(true);
      try {
        const [statsData, upcomingData, recentData, notifData, unreadData, favoritesData] = await Promise.all([
          getDashboardStats(user.id, role),
          getUpcomingBookings(user.id, role),
          getRecentBookings(user.id, role),
          getNotifications(),
          getUnreadCount(),
          getFavoriteProviders().catch(() => []),
        ]);

        setStats(statsData);
        setUpcomingBookings(upcomingData);
        setRecentBookings(recentData);
        setNotifications(notifData);
        setUnreadCount(unreadData.total);
        setFavorites(favoritesData);

        if (role === 'PROVIDER') {
          const [profileData, servicesData] = await Promise.all([
            getProviderProfile(),
            getProviderServices(),
          ]);
          setProviderProfile(profileData);
          setServices(servicesData);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user, role]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCustomer = role === 'CUSTOMER';
  const isProvider = role === 'PROVIDER';
  const isAdmin = role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-0.5">
              Welcome back, {user?.fullName || 'User'}!
              {isProvider && providerProfile && (
                <span className="ml-2 text-sm text-gray-400">
                  • {providerProfile.businessName}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="relative p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BellIcon className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard/settings"
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 mb-6 bg-white rounded-lg shadow-card p-1 w-fit">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isCustomer && (
            <>
              <StatsCard
                title="Total Bookings"
                value={stats?.totalBookings || 0}
                icon={<CalendarIcon className="w-5 h-5" />}
                color="blue"
                trend={stats?.weeklyGrowth ? { value: stats.weeklyGrowth, positive: stats.weeklyGrowth > 0 } : undefined}
              />
              <StatsCard
                title="Completed"
                value={stats?.completedBookings || 0}
                subtitle={`${stats?.completionRate || 0}% completion rate`}
                icon={<CheckCircleIcon className="w-5 h-5" />}
                color="green"
              />
              <StatsCard
                title="Total Spent"
                value={`ETB ${(stats?.totalSpent || 0).toFixed(2)}`}
                icon={<CreditCardIcon className="w-5 h-5" />}
                color="purple"
              />
              <StatsCard
                title="Pending"
                value={stats?.pendingBookings || 0}
                icon={<ClockIcon className="w-5 h-5" />}
                color="yellow"
              />
            </>
          )}

          {isProvider && (
            <>
              <StatsCard
                title="Total Earnings"
                value={`ETB ${(stats?.totalEarnings || 0).toFixed(2)}`}
                subtitle={`This month: ETB ${(stats?.monthlyEarnings || 0).toFixed(2)}`}
                icon={<WalletIcon className="w-5 h-5" />}
                color="green"
                trend={stats?.monthlyGrowth ? { value: stats.monthlyGrowth, positive: stats.monthlyGrowth > 0 } : undefined}
              />
              <StatsCard
                title="Total Bookings"
                value={stats?.totalBookings || 0}
                icon={<CalendarIcon className="w-5 h-5" />}
                color="blue"
              />
              <StatsCard
                title="Average Rating"
                value={`${(stats?.averageRating || 0).toFixed(1)} ★`}
                subtitle={`${stats?.totalReviews || 0} reviews`}
                icon={<StarIcon className="w-5 h-5" />}
                color="yellow"
              />
              <StatsCard
                title="Completion Rate"
                value={`${Math.round(stats?.completionRate || 0)}%`}
                icon={<CheckCircleIcon className="w-5 h-5" />}
                color="purple"
              />
            </>
          )}

          {isAdmin && (
            <>
              <StatsCard
                title="Total Users"
                value={stats?.totalBookings || 0}
                icon={<UserGroupIcon className="w-5 h-5" />}
                color="blue"
              />
              <StatsCard
                title="Total Providers"
                value={stats?.completedBookings || 0}
                icon={<BriefcaseIcon className="w-5 h-5" />}
                color="green"
              />
              <StatsCard
                title="Total Revenue"
                value={`ETB ${(stats?.totalEarnings || 0).toFixed(2)}`}
                icon={<CurrencyDollarIcon className="w-5 h-5" />}
                color="purple"
              />
              <StatsCard
                title="Active Bookings"
                value={stats?.pendingBookings || 0}
                icon={<CalendarIcon className="w-5 h-5" />}
                color="yellow"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {isCustomer ? (
            <>
              <QuickAction
                icon={<PlusIcon className="w-5 h-5" />}
                label="Book a Service"
                href="/search"
                color="blue"
                description="Find providers"
              />
              <QuickAction
                icon={<CalendarIcon className="w-5 h-5" />}
                label="My Bookings"
                href="/dashboard/customer/bookings"
                color="green"
                description="View history"
              />
              <QuickAction
                icon={<HeartIcon className="w-5 h-5" />}
                label="Favorites"
                href="/dashboard/customer/favorites"
                color="red"
                description={`${favorites.length} saved`}
              />
              <QuickAction
                icon={<UserIcon className="w-5 h-5" />}
                label="My Profile"
                href="/dashboard/customer/profile"
                color="purple"
                description="Update info"
              />
              <QuickAction
                icon={<ChartBarIcon className="w-5 h-5" />}
                label="Analytics"
                href="/dashboard/customer/analytics"
                color="indigo"
                description="Insights"
              />
            </>
          ) : (
            <>
              <QuickAction
                icon={<PlusIcon className="w-5 h-5" />}
                label="Add Service"
                href="/dashboard/provider/services/add"
                color="blue"
                description="New listing"
              />
              <QuickAction
                icon={<CalendarIcon className="w-5 h-5" />}
                label="Bookings"
                href="/dashboard/provider/bookings"
                color="green"
                description="Manage requests"
              />
              <QuickAction
                icon={<CurrencyDollarIcon className="w-5 h-5" />}
                label="Earnings"
                href="/dashboard/provider/earnings"
                color="purple"
                description={`ETB ${(stats?.monthlyEarnings || 0).toFixed(2)} this month`}
              />
              <QuickAction
                icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />}
                label="Availability"
                href="/dashboard/provider/availability"
                color="yellow"
                description={providerProfile?.isAvailable ? 'Available' : 'Unavailable'}
              />
              <QuickAction
                icon={<ChartBarIcon className="w-5 h-5" />}
                label="Analytics"
                href="/dashboard/provider/analytics"
                color="indigo"
                description="Performance"
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Booking Trend Chart */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Booking Activity</h3>
              <span className="text-xs text-gray-400">{timeRange} view</span>
            </div>
            {stats?.bookingTrend && stats.bookingTrend.length > 0 ? (
              <BarChart
                data={stats.bookingTrend}
                labelKey="date"
                valueKey="count"
                barColor="#3b82f6"
              />
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">No booking data available</div>
            )}
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Past {stats?.bookingTrend?.length || 7} days</span>
              <span>Total: {stats?.totalBookings || 0} bookings</span>
            </div>
          </div>

          {/* Category Breakdown Chart */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Category Breakdown</h3>
              <span className="text-xs text-gray-400">By bookings</span>
            </div>
            {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
              <div className="flex items-center justify-center gap-6">
                <DonutChart
                  data={stats.categoryBreakdown.map(c => ({
                    label: c.category,
                    value: c.count,
                  }))}
                  size={140}
                />
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {stats.categoryBreakdown.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className={`w-3 h-3 rounded-full bg-${['blue','green','yellow','purple','pink'][i % 5]}-500`} />
                      <span className="text-gray-700">{c.category}</span>
                      <span className="text-gray-400 ml-auto">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">No category data available</div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Bookings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Bookings */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                  {isCustomer ? 'Upcoming Bookings' : 'Pending Requests'}
                </h2>
                <Link
                  href={isCustomer ? '/dashboard/customer/bookings' : '/dashboard/provider/bookings'}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View all
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-gray-500">No upcoming bookings</p>
                  {isCustomer && (
                    <Link
                      href="/search"
                      className="mt-2 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Find a service →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} role={role} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                <Link
                  href={isCustomer ? '/dashboard/customer/bookings' : '/dashboard/provider/bookings'}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View all
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} role={role} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Notifications</h2>
                <Link
                  href="/dashboard/notifications"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </Link>
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-gray-500 text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              )}
            </div>

            {/* Favorite Providers (Customer) */}
            {isCustomer && favorites.length > 0 && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Favorite Providers</h2>
                  <Link
                    href="/dashboard/customer/favorites"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {favorites.slice(0, 3).map((favorite) => (
                    <FavoriteProviderCard key={favorite.id} favorite={favorite} />
                  ))}
                </div>
              </div>
            )}

            {/* Provider Quick Info */}
            {isProvider && providerProfile && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-start gap-3 mb-3">
                  {providerProfile.businessLogo ? (
                    <Image
                      src={providerProfile.businessLogo}
                      alt={providerProfile.businessName}
                      width={52}
                      height={52}
                      className="rounded-lg object-cover w-13 h-13"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BriefcaseIcon className="w-7 h-7 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {providerProfile.businessName}
                    </h3>
                    <p className="text-sm text-gray-500">{providerProfile.category}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${providerProfile.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {providerProfile.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      {providerProfile.isVerified && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                          <ShieldCheckIcon className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                      {providerProfile.isFeatured && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                          <SparklesIcon className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-gray-400 text-xs">Completed Jobs</p>
                    <p className="font-medium text-gray-900">{providerProfile.completedJobs}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Rating</p>
                    <p className="font-medium text-gray-900">{providerProfile.averageRating.toFixed(1)} ★</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Experience</p>
                    <p className="font-medium text-gray-900">{providerProfile.yearsExperience}+ years</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Response Time</p>
                    <p className="font-medium text-gray-900">{providerProfile.responseTime || 'N/A'} min</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/provider/profile"
                  className="mt-3 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Manage Profile →
                </Link>
              </div>
            )}

            {/* Customer Quick Info */}
            {isCustomer && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">Account Overview</h3>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    <p className="text-sm text-gray-500 truncate">{user?.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-gray-400 text-xs">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total Bookings</p>
                    <p className="font-medium text-gray-900">{stats?.totalBookings || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total Spent</p>
                    <p className="font-medium text-gray-900">ETB {(stats?.totalSpent || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Completion Rate</p>
                    <p className="font-medium text-gray-900">{stats?.completionRate || 0}%</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/customer/profile"
                  className="mt-3 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Edit Profile →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}