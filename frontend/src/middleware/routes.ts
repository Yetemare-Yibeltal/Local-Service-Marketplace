'use client';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware, AuthMiddlewareConfig } from './auth';
import { i18nMiddleware, I18nConfig, I18nMiddlewareOptions } from './i18n';

// ============================================================
// TYPES
// ============================================================

export interface RoutesMiddlewareConfig {
  auth?: Partial<AuthMiddlewareConfig>;
  i18n?: Partial<I18nConfig>;
  excludedPaths?: string[];
  apiPaths?: string[];
}

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const defaultConfig: RoutesMiddlewareConfig = {
  auth: {
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
    loginPath: '/login',
    dashboardPath: '/dashboard',
    unauthorizedPath: '/unauthorized',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'am'],
    localeCookieName: 'NEXT_LOCALE',
    localeDetection: true,
    redirectToDefaultLocale: true,
  },
  excludedPaths: [
    '/api',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/images',
    '/fonts',
    '/icons',
    '/uploads',
  ],
  apiPaths: ['/api'],
};

// ============================================================
// MAIN MIDDLEWARE
// ============================================================

/**
 * Combined routes middleware that applies auth and i18n
 */
export function routesMiddleware(
  request: NextRequest,
  config: RoutesMiddlewareConfig = {}
): NextResponse | null {
  const fullConfig = { ...defaultConfig, ...config };

  const pathname = request.nextUrl.pathname;

  // Check if path is excluded
  if (
    fullConfig.excludedPaths?.some((path) => {
      if (path === '/') return pathname === '/';
      if (path.endsWith('/')) return pathname.startsWith(path);
      return pathname === path || pathname.startsWith(path + '/');
    })
  ) {
    return null;
  }

  // Check if path is API (skip i18n, but apply auth for protected API)
  const isApi = fullConfig.apiPaths?.some((path) => pathname.startsWith(path)) || false;

  // Step 1: Apply i18n (except for API and excluded paths)
  let response: NextResponse | null = null;
  if (!isApi) {
    response = i18nMiddleware(request, {
      config: fullConfig.i18n,
      excludedPaths: fullConfig.excludedPaths,
      apiPaths: fullConfig.apiPaths,
    });
  }

  // If i18n middleware returned a redirect/response, use it
  if (response) {
    return response;
  }

  // Step 2: Apply authentication
  // For API routes, we only check auth for protected endpoints
  // For non-API, apply auth middleware
  if (isApi) {
    // For API routes, we can skip auth middleware or apply it selectively
    // We'll apply auth for /api endpoints except webhooks
    if (!pathname.startsWith('/api/webhooks') && !pathname.startsWith('/api/health')) {
      const authResponse = authMiddleware(request, fullConfig.auth);
      if (authResponse) {
        return authResponse;
      }
    }
    return null;
  }

  // Apply auth for non-API routes
  const authResponse = authMiddleware(request, fullConfig.auth);
  if (authResponse) {
    return authResponse;
  }

  return null;
}

// ============================================================
// NEXT.JS MIDDLEWARE EXPORT
// ============================================================

/**
 * Export config for Next.js middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api routes (optional, we handle in middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default routesMiddleware;
