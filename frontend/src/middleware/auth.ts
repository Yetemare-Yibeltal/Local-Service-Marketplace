'use client';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// TYPES
// ============================================================

export interface AuthMiddlewareConfig {
  publicRoutes: string[];
  authRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: string[];
  providerRoutes: string[];
  apiRoutes: string[];
  loginPath: string;
  dashboardPath: string;
  unauthorizedPath: string;
}

export interface SessionUser {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  profileImage: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
}

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const defaultConfig: AuthMiddlewareConfig = {
  publicRoutes: [
    '/',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/faq',
    '/provider',
    '/search',
    '/booking',
    '/api/webhooks',
    '/api/health',
  ],
  authRoutes: ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp'],
  protectedRoutes: ['/dashboard', '/settings', '/notifications', '/profile'],
  adminRoutes: ['/dashboard/admin'],
  providerRoutes: ['/dashboard/provider'],
  apiRoutes: ['/api/auth/me', '/api/auth/refresh', '/api/auth/logout'],
  loginPath: '/login',
  dashboardPath: '/dashboard',
  unauthorizedPath: '/unauthorized',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if a path matches a route pattern
 */
function matchRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route.endsWith('/')) {
      return path.startsWith(route);
    }
    if (route.includes('[') && route.includes(']')) {
      // Handle dynamic routes like /provider/[id]
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    }
    return path === route || path.startsWith(route + '/');
  });
}

/**
 * Get token from request
 */
function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookie = request.cookies.get('accessToken');
  if (cookie) {
    return cookie.value;
  }

  return null;
}

/**
 * Decode JWT token (client-side only)
 */
function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Validate token expiration
 */
function isTokenValid(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;
  return decoded.exp * 1000 > Date.now();
}

// ============================================================
// MAIN MIDDLEWARE
// ============================================================

/**
 * Authentication middleware for Next.js App Router
 */
export function authMiddleware(
  request: NextRequest,
  config: Partial<AuthMiddlewareConfig> = {}
): NextResponse | null {
  const fullConfig = { ...defaultConfig, ...config };

  const { pathname } = request.nextUrl;

  // Check if path is public
  if (matchRoute(pathname, fullConfig.publicRoutes)) {
    return null;
  }

  // Check if path is an auth route (login, register, etc.)
  if (matchRoute(pathname, fullConfig.authRoutes)) {
    // If user is already logged in, redirect to dashboard
    const token = getToken(request);
    if (token && isTokenValid(token)) {
      return NextResponse.redirect(new URL(fullConfig.dashboardPath, request.url));
    }
    return null;
  }

  // Check if path is an API route
  if (matchRoute(pathname, fullConfig.apiRoutes)) {
    return null;
  }

  // Check if path is protected (requires authentication)
  if (
    matchRoute(pathname, fullConfig.protectedRoutes) ||
    matchRoute(pathname, fullConfig.adminRoutes) ||
    matchRoute(pathname, fullConfig.providerRoutes)
  ) {
    const token = getToken(request);

    // No token, redirect to login
    if (!token) {
      const loginUrl = new URL(fullConfig.loginPath, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Invalid token, redirect to login
    if (!isTokenValid(token)) {
      const loginUrl = new URL(fullConfig.loginPath, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const decoded = decodeToken(token);
    const userRole = decoded?.role || 'CUSTOMER';

    // Admin routes require ADMIN role
    if (matchRoute(pathname, fullConfig.adminRoutes) && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(fullConfig.unauthorizedPath, request.url));
    }

    // Provider routes require PROVIDER or ADMIN role
    if (
      matchRoute(pathname, fullConfig.providerRoutes) &&
      userRole !== 'PROVIDER' &&
      userRole !== 'ADMIN'
    ) {
      return NextResponse.redirect(new URL(fullConfig.unauthorizedPath, request.url));
    }

    return null;
  }

  return null;
}

// ============================================================
// HELPER FUNCTIONS FOR CLIENT-SIDE
// ============================================================

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    return isTokenValid(token);
  } catch {
    return false;
  }
}

/**
 * Get current user from localStorage (client-side)
 */
export function getCurrentUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Get user role (client-side)
 */
export function getUserRole(): string | null {
  const user = getCurrentUser();
  return user?.role || null;
}

/**
 * Check if user has a specific role (client-side)
 */
export function hasRole(role: string | string[]): boolean {
  const userRole = getUserRole();
  if (!userRole) return false;

  if (Array.isArray(role)) {
    return role.includes(userRole);
  }

  return userRole === role;
}

/**
 * Check if user is admin (client-side)
 */
export function isAdmin(): boolean {
  return hasRole('ADMIN');
}

/**
 * Check if user is provider (client-side)
 */
export function isProvider(): boolean {
  return hasRole('PROVIDER');
}

/**
 * Check if user is customer (client-side)
 */
export function isCustomer(): boolean {
  return hasRole('CUSTOMER');
}

/**
 * Require authentication for client-side components
 */
export function requireAuth(): boolean {
  if (!isAuthenticated()) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  }
  return true;
}

/**
 * Require a specific role for client-side components
 */
export function requireRole(role: string | string[]): boolean {
  if (!requireAuth()) return false;

  if (!hasRole(role)) {
    if (typeof window !== 'undefined') {
      window.location.href = '/unauthorized';
    }
    return false;
  }

  return true;
}

// ============================================================
// EXPORTS
// ============================================================

export default authMiddleware;
