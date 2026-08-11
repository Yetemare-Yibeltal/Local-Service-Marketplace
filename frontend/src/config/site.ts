'use client';

// ============================================================
// SITE METADATA
// ============================================================

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  keywords: string[];
  url: string;
  ogImage: string;
  favicon: string;
  creator: string;
  publisher: string;
  locale: string;
  defaultLocale: string;
  locales: string[];
  themeColor: string;
}

export interface Author {
  name: string;
  url: string;
  email: string;
}

export interface SocialLinks {
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  telegram: string;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
  requiredRole?: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'ALL';
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
  requiredRole?: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'ALL';
}

export interface FooterSection {
  title: string;
  items: {
    name: string;
    href: string;
    external?: boolean;
  }[];
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  googleMapsUrl: string;
  businessHours: {
    mondayToFriday: string;
    saturday: string;
    sunday: string;
  };
}

// ============================================================
// SITE CONFIGURATION
// ============================================================

export const siteConfig: SiteConfig = {
  name: 'Local Service Provider Marketplace',
  title: 'Local Service Provider Marketplace - Find Trusted Professionals',
  description:
    'Connect with verified plumbers, electricians, tutors, cleaners, and more in your neighborhood. Book services with transparent pricing and real reviews.',
  keywords: [
    'service provider',
    'marketplace',
    'local services',
    'plumber',
    'electrician',
    'tutor',
    'cleaner',
    'Ethiopia',
    'Addis Ababa',
    'handyman',
    'mechanic',
    'photographer',
    'carpenter',
    'painter',
    'home services',
    'professional services',
    'verified providers',
  ],
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://marketplace.et',
  ogImage: '/images/og-image.jpg',
  favicon: '/favicon.ico',
  creator: 'Local Service Provider Marketplace',
  publisher: 'Local Service Provider Marketplace',
  locale: 'en_US',
  defaultLocale: 'en',
  locales: ['en', 'am'],
  themeColor: '#2563eb',
};

// ============================================================
// AUTHORS
// ============================================================

export const authors: Author[] = [
  {
    name: 'Local Service Provider Marketplace',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://marketplace.et',
    email: 'support@marketplace.et',
  },
];

// ============================================================
// SOCIAL LINKS
// ============================================================

export const socialLinks: SocialLinks = {
  facebook: 'https://facebook.com/marketplace.et',
  twitter: 'https://twitter.com/marketplace_et',
  instagram: 'https://instagram.com/marketplace.et',
  linkedin: 'https://linkedin.com/company/marketplace-et',
  youtube: 'https://youtube.com/@marketplace_et',
  tiktok: 'https://tiktok.com/@marketplace_et',
  telegram: 'https://t.me/marketplace_et',
};

// ============================================================
// CONTACT INFORMATION
// ============================================================

export const contactInfo: ContactInfo = {
  email: 'support@marketplace.et',
  phone: '+251 911 234 567',
  address: 'Bole, Rwanda Street, Addis Ababa, Ethiopia',
  googleMapsUrl: 'https://maps.google.com/?q=Addis+Ababa+Ethiopia',
  businessHours: {
    mondayToFriday: '8:00 AM - 6:00 PM',
    saturday: '9:00 AM - 4:00 PM',
    sunday: 'Closed',
  },
};

// ============================================================
// NAVIGATION
// ============================================================

export const mainNavigation: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
    requiredRole: 'ALL',
  },
  {
    name: 'Find Services',
    href: '/search',
    requiredRole: 'ALL',
  },
  {
    name: 'About',
    href: '/about',
    requiredRole: 'ALL',
  },
  {
    name: 'Contact',
    href: '/contact',
    requiredRole: 'ALL',
  },
];

export const dashboardNavigation: NavigationSection[] = [
  {
    title: 'Main',
    requiredRole: 'ALL',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        requiredRole: 'ALL',
      },
    ],
  },
  {
    title: 'Customer',
    requiredRole: 'CUSTOMER',
    items: [
      {
        name: 'My Bookings',
        href: '/dashboard/customer/bookings',
        requiredRole: 'CUSTOMER',
      },
      {
        name: 'Favorites',
        href: '/dashboard/customer/favorites',
        requiredRole: 'CUSTOMER',
      },
      {
        name: 'Profile',
        href: '/dashboard/customer/profile',
        requiredRole: 'CUSTOMER',
      },
    ],
  },
  {
    title: 'Provider',
    requiredRole: 'PROVIDER',
    items: [
      {
        name: 'Bookings',
        href: '/dashboard/provider/bookings',
        requiredRole: 'PROVIDER',
      },
      {
        name: 'Services',
        href: '/dashboard/provider/services',
        requiredRole: 'PROVIDER',
      },
      {
        name: 'Earnings',
        href: '/dashboard/provider/earnings',
        requiredRole: 'PROVIDER',
      },
      {
        name: 'Analytics',
        href: '/dashboard/provider/analytics',
        requiredRole: 'PROVIDER',
      },
      {
        name: 'Availability',
        href: '/dashboard/provider/availability',
        requiredRole: 'PROVIDER',
      },
      {
        name: 'Profile',
        href: '/dashboard/provider/profile',
        requiredRole: 'PROVIDER',
      },
      {
        name: 'Reviews',
        href: '/dashboard/provider/reviews',
        requiredRole: 'PROVIDER',
      },
    ],
  },
  {
    title: 'Admin',
    requiredRole: 'ADMIN',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard/admin',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Users',
        href: '/dashboard/admin/users',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Providers',
        href: '/dashboard/admin/providers',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Bookings',
        href: '/dashboard/admin/bookings',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Reviews',
        href: '/dashboard/admin/reviews',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Disputes',
        href: '/dashboard/admin/disputes',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Categories',
        href: '/dashboard/admin/categories',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Notifications',
        href: '/dashboard/admin/notifications',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Analytics',
        href: '/dashboard/admin/analytics',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Audit Logs',
        href: '/dashboard/admin/audit-logs',
        requiredRole: 'ADMIN',
      },
      {
        name: 'Settings',
        href: '/dashboard/admin/settings',
        requiredRole: 'ADMIN',
      },
    ],
  },
  {
    title: 'Account',
    requiredRole: 'ALL',
    items: [
      {
        name: 'Settings',
        href: '/dashboard/settings',
        requiredRole: 'ALL',
      },
      {
        name: 'Notifications',
        href: '/dashboard/notifications',
        requiredRole: 'ALL',
      },
    ],
  },
];

// ============================================================
// FOOTER NAVIGATION
// ============================================================

export const footerSections: FooterSection[] = [
  {
    title: 'Company',
    items: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Services',
    items: [
      { name: 'Find Providers', href: '/search' },
      { name: 'Become a Provider', href: '/register' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Support',
    items: [
      { name: 'Help Center', href: '/help' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  },
  {
    title: 'Connect',
    items: [
      { name: 'Facebook', href: socialLinks.facebook, external: true },
      { name: 'Twitter', href: socialLinks.twitter, external: true },
      { name: 'Instagram', href: socialLinks.instagram, external: true },
      { name: 'LinkedIn', href: socialLinks.linkedin, external: true },
    ],
  },
];

// ============================================================
// API CONFIGURATION
// ============================================================

export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// ============================================================
// FEATURE FLAGS
// ============================================================

export const featureFlags = {
  enableBookings: true,
  enablePayments: true,
  enableReviews: true,
  enableDisputes: true,
  enableAnalytics: true,
  enableNotifications: true,
  enableFavorites: true,
  enableSearch: true,
  enableCategories: true,
  enableMultilingual: true,
  enableDarkMode: true,
};

// ============================================================
// THEME CONFIGURATION
// ============================================================

export const themeConfig = {
  defaultTheme: 'light',
  themes: ['light', 'dark', 'system'],
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
};

// ============================================================
// SEO DEFAULT VALUES
// ============================================================

export const seoDefaults = {
  titleTemplate: '%s | Local Service Provider Marketplace',
  defaultTitle: 'Local Service Provider Marketplace - Find Trusted Professionals',
  defaultDescription:
    'Connect with verified plumbers, electricians, tutors, cleaners, and more in your neighborhood.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    site_name: 'Local Service Provider Marketplace',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Local Service Provider Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@marketplace_et',
    creator: '@marketplace_et',
  },
};

// ============================================================
// REGEX PATTERNS
// ============================================================

export const regexPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^(\+251|0)?[9][0-9]{8}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]).{8,72}$/,
  ethiopianPhone: /^(09|\+2519)[0-9]{8}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  siteConfig,
  authors,
  socialLinks,
  contactInfo,
  mainNavigation,
  dashboardNavigation,
  footerSections,
  apiConfig,
  featureFlags,
  themeConfig,
  seoDefaults,
  regexPatterns,
};
