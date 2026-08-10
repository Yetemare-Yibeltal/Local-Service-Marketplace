'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon,
  Cog6ToothIcon,
  BellIcon,
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  TagIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  HeartIcon,
  ClockIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  UserIcon as UserSolidIcon,
  BriefcaseIcon as BriefcaseSolidIcon,
  CalendarIcon as CalendarSolidIcon,
  CurrencyDollarIcon as CurrencyDollarSolidIcon,
  StarIcon as StarSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
  BellIcon as BellSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  ShieldCheckIcon as ShieldCheckSolidIcon,
  TagIcon as TagSolidIcon,
  ExclamationTriangleIcon as ExclamationTriangleSolidIcon,
  DocumentTextIcon as DocumentTextSolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';

// ============================================================
// TYPES
// ============================================================

interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  profileImage: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  roles: ('CUSTOMER' | 'PROVIDER' | 'ADMIN')[];
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Navigation Item Component
 */
function NavItemLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
        isActive
          ? 'bg-blue-50 text-blue-700 shadow-sm'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className={`flex-shrink-0 transition-colors ${
        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
      }`}>
        {Icon}
      </span>
      <span className="flex-1 text-sm font-medium">{item.name}</span>
      {item.badge && item.badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-medium min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Sidebar Component
 */
function Sidebar({
  isOpen,
  onClose,
  userRole,
  pathname,
  unreadCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  pathname: string;
  unreadCount: number;
}) {
  const router = useRouter();

  // Get navigation sections based on user role
  const getNavSections = useCallback((): NavSection[] => {
    const commonItems: NavSection[] = [
      {
        title: 'Main',
        items: [
          {
            name: 'Dashboard',
            href: '/dashboard',
            icon: <HomeIcon className="w-5 h-5" />,
            activeIcon: <HomeSolidIcon className="w-5 h-5" />,
            roles: ['CUSTOMER', 'PROVIDER', 'ADMIN'],
          },
        ],
      },
    ];

    if (userRole === 'CUSTOMER') {
      return [
        ...commonItems,
        {
          title: 'Bookings',
          items: [
            {
              name: 'My Bookings',
              href: '/dashboard/customer/bookings',
              icon: <CalendarIcon className="w-5 h-5" />,
              activeIcon: <CalendarSolidIcon className="w-5 h-5" />,
              roles: ['CUSTOMER'],
            },
          ],
        },
        {
          title: 'Favorites',
          items: [
            {
              name: 'Saved Providers',
              href: '/dashboard/customer/favorites',
              icon: <HeartIcon className="w-5 h-5" />,
              activeIcon: <HeartSolidIcon className="w-5 h-5" />,
              roles: ['CUSTOMER'],
            },
          ],
        },
        {
          title: 'Account',
          items: [
            {
              name: 'My Profile',
              href: '/dashboard/customer/profile',
              icon: <UserIcon className="w-5 h-5" />,
              activeIcon: <UserSolidIcon className="w-5 h-5" />,
              roles: ['CUSTOMER'],
            },
            {
              name: 'Settings',
              href: '/dashboard/settings',
              icon: <Cog6ToothIcon className="w-5 h-5" />,
              activeIcon: <Cog6ToothSolidIcon className="w-5 h-5" />,
              roles: ['CUSTOMER', 'PROVIDER', 'ADMIN'],
            },
          ],
        },
      ];
    }

    if (userRole === 'PROVIDER') {
      return [
        ...commonItems,
        {
          title: 'Business',
          items: [
            {
              name: 'Bookings',
              href: '/dashboard/provider/bookings',
              icon: <CalendarIcon className="w-5 h-5" />,
              activeIcon: <CalendarSolidIcon className="w-5 h-5" />,
              roles: ['PROVIDER'],
            },
            {
              name: 'Services',
              href: '/dashboard/provider/services',
              icon: <BriefcaseIcon className="w-5 h-5" />,
              activeIcon: <BriefcaseSolidIcon className="w-5 h-5" />,
              roles: ['PROVIDER'],
            },
            {
              name: 'Earnings',
              href: '/dashboard/provider/earnings',
              icon: <CurrencyDollarIcon className="w-5 h-5" />,
              activeIcon: <CurrencyDollarSolidIcon className="w-5 h-5" />,
              roles: ['PROVIDER'],
            },
          ],
        },
        {
          title: 'Performance',
          items: [
            {
              name: 'Analytics',
              href: '/dashboard/provider/analytics',
              icon: <ChartBarIcon className="w-5 h-5" />,
              activeIcon: <ChartBarSolidIcon className="w-5 h-5" />,
              roles: ['PROVIDER'],
            },
            {
              name: 'Reviews',
              href: '/dashboard/provider/reviews',
              icon: <StarIcon className="w-5 h-5" />,
              activeIcon: <StarSolidIcon className="w-5 h-5" />,
              roles: ['PROVIDER'],
            },
          ],
        },
        {
          title: 'Settings',
          items: [
            {
              name: 'Availability',
              href: '/dashboard/provider/availability',
              icon: <ClockIcon className="w-5 h-5" />,
              activeIcon: <ClockIcon className="w-5 h-5" />,
              roles: ['PROVIDER'],
            },
            {
              name: 'Business Profile',
              href: '/dashboard/provider/profile',
              icon: <BuildingOfficeIcon className="w-5 h-5" />,
              activeIcon: <BuildingOfficeIcon className="w-5 h-5" />,
              roles: ['PROVIDER'],
            },
            {
              name: 'Settings',
              href: '/dashboard/settings',
              icon: <Cog6ToothIcon className="w-5 h-5" />,
              activeIcon: <Cog6ToothSolidIcon className="w-5 h-5" />,
              roles: ['CUSTOMER', 'PROVIDER', 'ADMIN'],
            },
          ],
        },
      ];
    }

    if (userRole === 'ADMIN') {
      return [
        ...commonItems,
        {
          title: 'Management',
          items: [
            {
              name: 'Users',
              href: '/dashboard/admin/users',
              icon: <UserGroupIcon className="w-5 h-5" />,
              activeIcon: <UserGroupSolidIcon className="w-5 h-5" />,
              roles: ['ADMIN'],
            },
            {
              name: 'Providers',
              href: '/dashboard/admin/providers',
              icon: <BriefcaseIcon className="w-5 h-5" />,
              activeIcon: <BriefcaseSolidIcon className="w-5 h-5" />,
              roles: ['ADMIN'],
            },
            {
              name: 'Bookings',
              href: '/dashboard/admin/bookings',
              icon: <CalendarIcon className="w-5 h-5" />,
              activeIcon: <CalendarSolidIcon className="w-5 h-5" />,
              roles: ['ADMIN'],
            },
          ],
        },
        {
          title: 'Platform',
          items: [
            {
              name: 'Analytics',
              href: '/dashboard/admin/analytics',
              icon: <ChartBarIcon className="w-5 h-5" />,
              activeIcon: <ChartBarSolidIcon className="w-5 h-5" />,
              roles: ['ADMIN'],
            },
            {
              name: 'Reviews',
              href: '/dashboard/admin/reviews',
              icon: <StarIcon className="w-5 h-5" />,
              activeIcon: <StarSolidIcon className="w-5 h-5" />,
              roles: ['ADMIN'],
            },
            {
              name: 'Disputes',
              href: '/dashboard/admin/disputes',
              icon: <ExclamationTriangleIcon className="w-5 h-5" />,
              activeIcon: <ExclamationTriangleSolidIcon className="w-5 h-5" />,
              roles: ['ADMIN'],
            },
            {
              name: 'Categories',
              href: '/dashboard/admin/categories',
              icon: <TagIcon className="w-5 h-5" />,
              activeIcon: <TagSolidIcon className="w-5 h-5" />,
              roles: ['ADMIN'],
            },
          ],
        },
        {
          title: 'System',
          items: [
            {
              name: 'Audit Logs',
              href: '/dashboard/admin/audit-logs',
              icon: <DocumentTextIcon className="w-5 h-5" />,
              activeIcon: <DocumentTextSolidIcon className="w-5 h-5" />,
              roles: ['ADMIN'],
            },
            {
              name: 'Settings',
              href: '/dashboard/admin/settings',
              icon: <Cog6ToothIcon className="w-5 h-5" />,
              activeIcon: <Cog6ToothSolidIcon className="w-5 h-5" />,
              roles: ['ADMIN'],
            },
          ],
        },
      ];
    }

    return commonItems;
  }, [userRole]);

  const navSections = getNavSections();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    return pathname.startsWith(href);
  };

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-xl">🏪</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Market<span className="text-blue-600">Place</span></span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 bg-white">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItemLink
                  key={item.name}
                  item={item}
                  isActive={isActive(item.href)}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="border-t border-gray-200 pt-4 mt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors group"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-500 group-hover:text-red-600" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <p className="text-xs text-gray-400 text-center">Version 1.0.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0 overflow-y-auto bg-white border-r border-gray-200">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="absolute left-0 top-0 w-80 h-full bg-white shadow-xl overflow-y-auto animate-slide-in-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Header Component
 */
function Header({
  user,
  onMenuClick,
  unreadCount,
}: {
  user: User | null;
  onMenuClick: () => void;
  unreadCount: number;
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Bars3Icon className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 truncate">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <BellIcon className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-medium min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.fullName || 'User'}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-blue-600 font-medium text-sm">
                  {user?.fullName ? getInitials(user.fullName) : 'U'}
                </span>
              )}
            </div>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade-in-down">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                  user?.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                  user?.role === 'PROVIDER' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {user?.role || 'Customer'}
                </span>
              </div>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <UserIcon className="w-4 h-4" />
                My Profile
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Settings
              </Link>
              <div className="border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Custom hook for authentication
 */
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoading };
}

// ============================================================
// MAIN LAYOUT
// ============================================================

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoading, user, router, fetchUnreadCount]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userRole = user.role || 'CUSTOMER';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
        pathname={pathname}
        unreadCount={unreadCount}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Local Service Provider Marketplace. All rights reserved.
        </footer>
      </div>
    </div>
  );
}