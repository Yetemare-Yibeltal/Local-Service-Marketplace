'use client';

import React, { useState, useEffect } from 'react';
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
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  BuildingOfficeIcon,
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
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';

// ============================================================
// TYPES
// ============================================================

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
// COMPONENTS
// ============================================================

/**
 * Sidebar Navigation Component
 */
function Sidebar({
  isOpen,
  onClose,
  userRole,
  pathname,
}: {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  pathname: string;
}) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  // Get unread notifications count
  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/unread-count`, {
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
    }
    fetchUnreadCount();
  }, []);

  // Navigation sections based on user role
  const getNavSections = (): NavSection[] => {
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
      {
        title: 'Notifications',
        items: [
          {
            name: 'Notifications',
            href: '/notifications',
            icon: <BellIcon className="w-5 h-5" />,
            activeIcon: <BellSolidIcon className="w-5 h-5" />,
            roles: ['CUSTOMER', 'PROVIDER', 'ADMIN'],
            badge: unreadCount > 0 ? unreadCount : undefined,
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
              name: 'Favorites',
              href: '/dashboard/customer/favorites',
              icon: <HeartIcon className="w-5 h-5" />,
              activeIcon: <HeartSolidIcon className="w-5 h-5" />,
              roles: ['CUSTOMER'],
            },
          ],
        },
        {
          title: 'Profile',
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
              name: 'Profile',
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
            {
              name: 'Notifications',
              href: '/dashboard/admin/notifications',
              icon: <BellIcon className="w-5 h-5" />,
              activeIcon: <BellSolidIcon className="w-5 h-5" />,
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
  };

  const navSections = getNavSections();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
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
      <div className="flex items-center gap-2 px-4 py-6 border-b border-gray-200">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">🏪</span>
        </div>
        <span className="text-xl font-bold text-gray-900">Market<span className="text-blue-600">Place</span></span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = active && item.activeIcon ? item.activeIcon : item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex-shrink-0">{Icon}</span>
                    <span className="flex-1 text-sm font-medium">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </nav>
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
          <div className="absolute left-0 top-0 w-80 h-full bg-white shadow-xl overflow-y-auto">
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
}: {
  user: any;
  onMenuClick: () => void;
}) {
  const router = useRouter();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900 truncate">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block">
          {user?.fullName || 'User'}
        </span>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
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
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          )}
        </div>
      </div>
    </header>
  );
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading...</p>
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
      />
      <div className="flex-1 min-w-0">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}