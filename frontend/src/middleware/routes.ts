'use client';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// TYPES
// ============================================================

export interface RouteConfig {
  path: string;
  type: 'public' | 'protected' | 'auth' | 'admin' | 'provider' | 'api' | 'webhook';
  roles?: ('CUSTOMER' | 'PROVIDER' | 'ADMIN')[];
  redirectTo?: string;
  exact?: boolean;
}

export interface RoutesConfig {
  routes: RouteConfig[];
  defaultRedirects: {
    unauthenticated: string;
    authenticated: string;
    unauthorized: string;
  };
  apiPrefix: string;
  publicPrefixes: string[];
}

export interface RouteMatch {
  matched: boolean;
  config?: RouteConfig;
  pathname: string;
  params?: Record<string, string>;
}

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const defaultRoutes: RouteConfig[] = [
  // Public routes
  { path: '/', type: 'public' },
  { path: '/about', type: 'public' },
  { path: '/contact', type: 'public' },
  { path: '/terms', type: 'public' },
  { path: '/privacy', type: 'public' },
  { path: '/faq', type: 'public' },
  { path: '/search', type: 'public' },
  { path: '/provider', type: 'public' },
  { path: '/provider/[id]', type: 'public' },
  { path: '/booking', type: 'public' },

  // Auth routes (redirect to dashboard if authenticated)
  { path: '/login', type: 'auth', redirectTo: '/dashboard' },
  { path: '/register', type: 'auth', redirectTo: '/dashboard' },
  { path: '/forgot-password', type: 'auth' },
  { path: '/reset-password', type: 'auth' },
  { path: '/verify-otp', type: 'auth' },

  // Protected routes (require authentication)
  { path: '/dashboard', type: 'protected' },
  { path: '/settings', type: 'protected' },
  { path: '/notifications', type: 'protected' },
  { path: '/profile', type: 'protected' },

  // Customer routes
  { path: '/dashboard/customer', type: 'protected', roles: ['CUSTOMER', 'ADMIN'] },
  { path: '/dashboard/customer/bookings', type: 'protected', roles: ['CUSTOMER', 'ADMIN'] },
  { path: '/dashboard/customer/favorites', type: 'protected', roles: ['CUSTOMER', 'ADMIN'] },
  { path: '/dashboard/customer/profile', type: 'protected', roles: ['CUSTOMER', 'ADMIN'] },

  // Provider routes
  { path: '/dashboard/provider', type: 'provider', roles: ['PROVIDER', 'ADMIN'] },
  { path: '/dashboard/provider/bookings', type: 'provider', roles: ['PROVIDER', 'ADMIN'] },
  { path: '/dashboard/provider/services', type: 'provider', roles: ['PROVIDER', 'ADMIN'] },
  { path: '/dashboard/provider/earnings', type: 'provider', roles: ['PROVIDER', 'ADMIN'] },
  { path: '/dashboard/provider/analytics', type: 'provider', roles: ['PROVIDER', 'ADMIN'] },
  { path: '/dashboard/provider/availability', type: 'provider', roles: ['PROVIDER', 'ADMIN'] },
  { path: '/dashboard/provider/profile', type: 'provider', roles: ['PROVIDER', 'ADMIN'] },
  { path: '/dashboard/provider/reviews', type: 'provider', roles: ['PROVIDER', 'ADMIN'] },

  // Admin routes
  { path: '/dashboard/admin', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/users', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/providers', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/bookings', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/disputes', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/categories', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/settings', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/analytics', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/reviews', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/notifications', type: 'admin', roles: ['ADMIN'] },
  { path: '/dashboard/admin/audit-logs', type: 'admin', roles: ['ADMIN'] },

  // API routes
  { path: '/api', type: 'api' },
  { path: '/api/auth', type: 'api' },
  { path: '/api/webhooks', type: 'webhook' },
];

const defaultConfig: RoutesConfig = {
  routes: defaultRoutes,
  defaultRedirects: {
    unauthenticated: '/login',
    authenticated: '/dashboard',
    unauthorized: '/unauthorized',
  },
  apiPrefix: '/api',
  publicPrefixes: [
    '/images',
    '/fonts',
    '/icons',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if a path matches a route pattern with dynamic segments
 */
function matchRoutePath(
  path: string,
  pattern: string
): { matched: boolean; params: Record<string, string> } {
  // Exact match
  if (pattern === path) {
    return { matched: true, params: {} };
  }

  // Check if pattern has dynamic segments
  if (!pattern.includes('[') && !pattern.includes(']')) {
    // Static path - check if path starts with pattern
    if (pattern.endsWith('/')) {
      return {
        matched: path.startsWith(pattern),
        params: {},
      };
    }
    return {
      matched: path === pattern || path.startsWith(pattern + '/'),
      params: {},
    };
  }

  // Dynamic path matching
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = path.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const seg = patternSegments[i];
    if (seg.startsWith('[') && seg.endsWith(']')) {
      const key = seg.slice(1, -1);
      params[key] = pathSegments[i];
    } else if (seg !== pathSegments[i]) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

/**
 * Find matching route config
 */
function findRouteConfig(pathname: string, routes: RouteConfig[]): RouteMatch {
  // Check for exact matches first
  for (const route of routes) {
    const result = matchRoutePath(pathname, route.path);
    if (result.matched) {
      return {
        matched: true,
        config: route,
        pathname,
        params: result.params,
      };
    }
  }

  // Check for prefix matches (for directories)
  for (const route of routes) {
    if (route.path.endsWith('/') && pathname.startsWith(route.path)) {
      return {
        matched: true,
        config: route,
        pathname,
        params: {},
      };
    }
  }

  return { matched: false, pathname };
}

/**
 * Check if path is public (no auth required)
 */
function isPublicPath(pathname: string, routes: RouteConfig[]): boolean {
  const match = findRouteConfig(pathname, routes);
  return match.matched && match.config?.type === 'public';
}

/**
 * Check if path is an auth route
 */
function isAuthPath(pathname: string, routes: RouteConfig[]): boolean {
  const match = findRouteConfig(pathname, routes);
  return match.matched && match.config?.type === 'auth';
}

/**
 * Check if path is protected
 */
function isProtectedPath(pathname: string, routes: RouteConfig[]): boolean {
  const match = findRouteConfig(pathname, routes);
  return (
    match.matched &&
    (match.config?.type === 'protected' ||
      match.config?.type === 'provider' ||
      match.config?.type === 'admin')
  );
}

/**
 * Check if path is an admin route
 */
function isAdminPath(pathname: string, routes: RouteConfig[]): boolean {
  const match = findRouteConfig(pathname, routes);
  return match.matched && match.config?.type === 'admin';
}

/**
 * Check if path is a provider route
 */
function isProviderPath(pathname: string, routes: RouteConfig[]): boolean {
  const match = findRouteConfig(pathname, routes);
  return match.matched && match.config?.type === 'provider';
}

/**
 * Check if path is an API route
 */
function isApiPath(pathname: string, routes: RouteConfig[]): boolean {
  const match = findRouteConfig(pathname, routes);
  return match.matched && match.config?.type === 'api';
}

/**
 * Check if path is a webhook route
 */
function isWebhookPath(pathname: string, routes: RouteConfig[]): boolean {
  const match = findRouteConfig(pathname, routes);
  return match.matched && match.config?.type === 'webhook';
}

/**
 * Get required roles for a path
 */
function getRequiredRoles(pathname: string, routes: RouteConfig[]): string[] | null {
  const match = findRouteConfig(pathname, routes);
  if (match.matched && match.config?.roles) {
    return match.config.roles;
  }
  return null;
}

/**
 * Get redirect target for a path
 */
function getRedirectTarget(pathname: string, routes: RouteConfig[]): string | null {
  const match = findRouteConfig(pathname, routes);
  if (match.matched && match.config?.redirectTo) {
    return match.config.redirectTo;
  }
  return null;
}

/**
 * Check if path is excluded from middleware
 */
function isExcludedPath(pathname: string, publicPrefixes: string[]): boolean {
  return publicPrefixes.some((prefix) => {
    if (prefix === '/') return pathname === '/';
    if (prefix.endsWith('/')) {
      return pathname.startsWith(prefix);
    }
    return pathname === prefix || pathname.startsWith(prefix + '/');
  });
}

// ============================================================
// MAIN MIDDLEWARE
// ============================================================

/**
 * Routes middleware for Next.js App Router
 */
export function routesMiddleware(
  request: NextRequest,
  config: Partial<RoutesConfig> = {}
): NextResponse | null {
  const fullConfig = { ...defaultConfig, ...config };
  const { routes, defaultRedirects, publicPrefixes } = fullConfig;

  const pathname = request.nextUrl.pathname;

  // Check if path is excluded
  if (isExcludedPath(pathname, publicPrefixes)) {
    return null;
  }

  // Check if path is an API route
  if (isApiPath(pathname, routes)) {
    return null;
  }

  // Check if path is a webhook route
  if (isWebhookPath(pathname, routes)) {
    return null;
  }

  // Check if path is public
  if (isPublicPath(pathname, routes)) {
    return null;
  }

  // Check if path is an auth route
  if (isAuthPath(pathname, routes)) {
    const redirectTo = getRedirectTarget(pathname, routes);
    if (redirectTo) {
      // Check if user is authenticated
      const token = request.cookies.get('accessToken');
      if (token) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }
    return null;
  }

  // Check if path is protected
  if (isProtectedPath(pathname, routes)) {
    // Check for token
    const token = request.cookies.get('accessToken');
    if (!token) {
      const loginUrl = new URL(defaultRedirects.unauthenticated, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check roles
    const requiredRoles = getRequiredRoles(pathname, routes);
    if (requiredRoles && requiredRoles.length > 0) {
      // Try to get user role from cookie or decode token
      // For simplicity, we check if the user has the required role
      // In production, you'd decode the JWT to get the role
      const userRole = request.cookies.get('userRole')?.value || 'CUSTOMER';

      // ADMIN has access to everything
      if (userRole === 'ADMIN') {
        return null;
      }

      if (!requiredRoles.includes(userRole as any)) {
        return NextResponse.redirect(new URL(defaultRedirects.unauthorized, request.url));
      }
    }

    return null;
  }

  return null;
}

// ============================================================
// CLIENT-SIDE HELPERS
// ============================================================

/**
 * Check if a route is accessible (client-side)
 */
export function isRouteAccessible(pathname: string, userRole?: string | null): boolean {
  const routes = defaultRoutes;

  // Check if path is public
  if (isPublicPath(pathname, routes)) {
    return true;
  }

  // Check if path is an auth route
  if (isAuthPath(pathname, routes)) {
    return true;
  }

  // Check if path is protected
  if (isProtectedPath(pathname, routes)) {
    // If no user role, not accessible
    if (!userRole) {
      return false;
    }

    // ADMIN has access to everything
    if (userRole === 'ADMIN') {
      return true;
    }

    const requiredRoles = getRequiredRoles(pathname, routes);
    if (requiredRoles && requiredRoles.length > 0) {
      return requiredRoles.includes(userRole as any);
    }

    return true;
  }

  return false;
}

/**
 * Get route type (client-side)
 */
export function getRouteType(pathname: string): string | null {
  const routes = defaultRoutes;

  if (isPublicPath(pathname, routes)) return 'public';
  if (isAuthPath(pathname, routes)) return 'auth';
  if (isAdminPath(pathname, routes)) return 'admin';
  if (isProviderPath(pathname, routes)) return 'provider';
  if (isProtectedPath(pathname, routes)) return 'protected';
  if (isApiPath(pathname, routes)) return 'api';
  if (isWebhookPath(pathname, routes)) return 'webhook';

  return null;
}

/**
 * Get route config (client-side)
 */
export function getRouteConfig(pathname: string): RouteConfig | null {
  const match = findRouteConfig(pathname, defaultRoutes);
  return match.config || null;
}

/**
 * Get all routes by type (client-side)
 */
export function getRoutesByType(type: RouteConfig['type']): RouteConfig[] {
  return defaultRoutes.filter((route) => route.type === type);
}

// ============================================================
// EXPORTS
// ============================================================

export default routesMiddleware;
