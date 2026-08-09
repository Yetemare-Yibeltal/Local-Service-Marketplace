'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  provider?: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
  };
  service?: {
    id: string;
    title: string;
    description: string;
    price: number;
    priceType: string;
  } | null;
}

interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  priceType: 'FIXED' | 'HOURLY';
  price: number;
  discountPrice: number | null;
  estimatedDurationMinutes: number | null;
  isActive: boolean;
  category: string;
  images: string[];
}

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
}

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
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired - attempt refresh or redirect to login
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

async function getDashboardStats(userId: string, role: string): Promise<DashboardStats> {
  try {
    if (role === 'PROVIDER') {
      return await fetchWithAuth(`/bookings/provider/stats`);
    } else {
      return await fetchWithAuth(`/bookings/customer/stats`);
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
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
    };
  }
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

async function getProviderServices(providerId: string): Promise<Service[]> {
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
    <div className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          {trend.positive ? (
            <ArrowUpRightIcon className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDownRightIcon className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}%
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
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
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
              <p className="text-sm text-gray-500 truncate">{booking.bookingNumber}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColors[booking.status]}`}>
              {statusLabels[booking.status] || booking.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span className="text-xs text-gray-400">
              {formattedDate} at {formattedTime}
            </span>
            {isCustomer && booking.service && (
              <span className="text-xs text-gray-400">{booking.service.title}</span>
            )}
            <span className="text-xs font-medium text-blue-600">
              ETB {booking.totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleView}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
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
    <div className={`p-3 rounded-lg ${!isRead ? 'bg-blue-50 border border-blue-100' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {!isRead && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
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
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
    green: 'bg-green-50 hover:bg-green-100 text-green-700',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
    yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
    red: 'bg-red-50 hover:bg-red-100 text-red-700',
    indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${colorClasses[color]}`}
    >
      {icon}
      {label}
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
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'services' | 'profile'>('overview');

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
        const [statsData, upcomingData, recentData, notifData, unreadData] = await Promise.all([
          getDashboardStats(user.id, role),
          getUpcomingBookings(user.id, role),
          getRecentBookings(user.id, role),
          getNotifications(),
          getUnreadCount(),
        ]);

        setStats(statsData);
        setUpcomingBookings(upcomingData);
        setRecentBookings(recentData);
        setNotifications(notifData);
        setUnreadCount(unreadData.total);

        if (role === 'PROVIDER') {
          const [profileData, servicesData] = await Promise.all([
            getProviderProfile(),
            getProviderServices(user.id),
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

  // Customer Dashboard
  const isCustomer = role === 'CUSTOMER';
  const isProvider = role === 'PROVIDER';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-0.5">
              Welcome back, {user?.fullName || 'User'}!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BellIcon className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isCustomer ? (
            <>
              <StatsCard
                title="Total Bookings"
                value={stats?.totalBookings || 0}
                icon={<CalendarIcon className="w-5 h-5" />}
                color="blue"
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
                icon={<CurrencyDollarIcon className="w-5 h-5" />}
                color="purple"
              />
              <StatsCard
                title="Pending"
                value={stats?.pendingBookings || 0}
                icon={<ClockIcon className="w-5 h-5" />}
                color="yellow"
              />
            </>
          ) : (
            <>
              <StatsCard
                title="Earnings"
                value={`ETB ${(stats?.totalEarnings || 0).toFixed(2)}`}
                subtitle={`This month: ETB ${(stats?.monthlyEarnings || 0).toFixed(2)}`}
                icon={<CurrencyDollarIcon className="w-5 h-5" />}
                color="green"
              />
              <StatsCard
                title="Bookings"
                value={stats?.totalBookings || 0}
                icon={<CalendarIcon className="w-5 h-5" />}
                color="blue"
              />
              <StatsCard
                title="Rating"
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
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          {isCustomer ? (
            <>
              <QuickAction
                icon={<PlusIcon className="w-4 h-4" />}
                label="Book a Service"
                href="/search"
                color="blue"
              />
              <QuickAction
                icon={<CalendarIcon className="w-4 h-4" />}
                label="My Bookings"
                href="/dashboard/bookings"
                color="green"
              />
              <QuickAction
                icon={<UserIcon className="w-4 h-4" />}
                label="My Profile"
                href="/dashboard/profile"
                color="purple"
              />
            </>
          ) : (
            <>
              <QuickAction
                icon={<BriefcaseIcon className="w-4 h-4" />}
                label="Manage Services"
                href="/dashboard/provider/services"
                color="blue"
              />
              <QuickAction
                icon={<CalendarIcon className="w-4 h-4" />}
                label="View Bookings"
                href="/dashboard/provider/bookings"
                color="green"
              />
              <QuickAction
                icon={<CurrencyDollarIcon className="w-4 h-4" />}
                label="Earnings"
                href="/dashboard/provider/earnings"
                color="purple"
              />
              <QuickAction
                icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                label="Availability"
                href="/dashboard/provider/availability"
                color="yellow"
              />
            </>
          )}
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
                  href={isCustomer ? '/dashboard/bookings' : '/dashboard/provider/bookings'}
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
                  href={isCustomer ? '/dashboard/bookings' : '/dashboard/provider/bookings'}
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

          {/* Right Column - Notifications & Quick Info */}
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

            {/* Provider Quick Info */}
            {isProvider && providerProfile && (
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-start gap-3 mb-3">
                  {providerProfile.businessLogo ? (
                    <Image
                      src={providerProfile.businessLogo}
                      alt={providerProfile.businessName}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover w-12 h-12"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {providerProfile.businessName}
                    </h3>
                    <p className="text-sm text-gray-500">{providerProfile.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${providerProfile.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {providerProfile.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      {providerProfile.isVerified && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">Verified</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-gray-400">Jobs</p>
                    <p className="font-medium text-gray-900">{providerProfile.completedJobs}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Rating</p>
                    <p className="font-medium text-gray-900">{providerProfile.averageRating.toFixed(1)} ★</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Experience</p>
                    <p className="font-medium text-gray-900">{providerProfile.yearsExperience}+ years</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Response</p>
                    <p className="font-medium text-gray-900">{providerProfile.responseTime || 'N/A'} min</p>
                  </div>
                </div>
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
                    <h3 className="font-semibold text-gray-900">Account Info</h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-sm text-gray-500">{user?.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-gray-400">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Bookings</p>
                    <p className="font-medium text-gray-900">{stats?.totalBookings || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}