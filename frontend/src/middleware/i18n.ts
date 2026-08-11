'use client';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// TYPES
// ============================================================

export interface I18nConfig {
  defaultLocale: string;
  locales: string[];
  localeCookieName: string;
  localeDetection: boolean;
  redirectToDefaultLocale: boolean;
}

export interface I18nMiddlewareOptions {
  config?: Partial<I18nConfig>;
  excludedPaths?: string[];
  apiPaths?: string[];
}

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const defaultConfig: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'am'],
  localeCookieName: 'NEXT_LOCALE',
  localeDetection: true,
  redirectToDefaultLocale: true,
};

const defaultExcludedPaths = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/images',
  '/fonts',
  '/icons',
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get the preferred locale from the request
 */
function getPreferredLocale(request: NextRequest, config: I18nConfig): string | null {
  // Check URL path first
  const pathname = request.nextUrl.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0 && config.locales.includes(pathSegments[0])) {
    return pathSegments[0];
  }

  // Check cookie
  const cookieLocale = request.cookies.get(config.localeCookieName);
  if (cookieLocale && config.locales.includes(cookieLocale.value)) {
    return cookieLocale.value;
  }

  // Check accept-language header
  if (config.localeDetection) {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
      if (config.locales.includes(preferred)) {
        return preferred;
      }
    }
  }

  return null;
}

/**
 * Get the locale from the URL path
 */
function getLocaleFromPath(pathname: string, config: I18nConfig): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && config.locales.includes(segments[0])) {
    return segments[0];
  }
  return null;
}

/**
 * Remove locale prefix from path
 */
function removeLocaleFromPath(pathname: string, config: I18nConfig): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && config.locales.includes(segments[0])) {
    return '/' + segments.slice(1).join('/');
  }
  return pathname;
}

/**
 * Add locale prefix to path
 */
function addLocaleToPath(pathname: string, locale: string, config: I18nConfig): string {
  const cleanPath = removeLocaleFromPath(pathname, config);
  if (cleanPath === '/') {
    return `/${locale}`;
  }
  return `/${locale}${cleanPath}`;
}

/**
 * Check if a path is excluded
 */
function isExcludedPath(pathname: string, excludedPaths: string[]): boolean {
  return excludedPaths.some((path) => {
    if (path === '/') return pathname === '/';
    if (path.endsWith('/')) {
      return pathname.startsWith(path);
    }
    return pathname === path || pathname.startsWith(path + '/');
  });
}

/**
 * Check if a path is an API route
 */
function isApiPath(pathname: string, apiPaths: string[]): boolean {
  return apiPaths.some((path) => {
    if (path === '/api') return pathname.startsWith('/api');
    return pathname.startsWith(path);
  });
}

// ============================================================
// MAIN MIDDLEWARE
// ============================================================

/**
 * Internationalization middleware for Next.js App Router
 */
export function i18nMiddleware(
  request: NextRequest,
  options: I18nMiddlewareOptions = {}
): NextResponse | null {
  const config = { ...defaultConfig, ...options.config };
  const excludedPaths = [...defaultExcludedPaths, ...(options.excludedPaths || [])];
  const apiPaths = ['/api', ...(options.apiPaths || [])];

  const pathname = request.nextUrl.pathname;

  // Skip excluded paths
  if (isExcludedPath(pathname, excludedPaths)) {
    return null;
  }

  // Skip API paths
  if (isApiPath(pathname, apiPaths)) {
    return null;
  }

  // Get current locale from path
  const pathLocale = getLocaleFromPath(pathname, config);

  // Get preferred locale
  const preferredLocale = getPreferredLocale(request, config);
  const finalLocale = pathLocale || preferredLocale || config.defaultLocale;

  // If path has no locale, redirect to add it
  if (!pathLocale && config.redirectToDefaultLocale) {
    const newPath = addLocaleToPath(pathname, finalLocale, config);
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    const response = NextResponse.redirect(url);
    response.cookies.set(config.localeCookieName, finalLocale);
    return response;
  }

  // If path has a different locale than preferred, maybe redirect
  if (pathLocale && pathLocale !== finalLocale && config.redirectToDefaultLocale) {
    const newPath = addLocaleToPath(removeLocaleFromPath(pathname, config), finalLocale, config);
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    const response = NextResponse.redirect(url);
    response.cookies.set(config.localeCookieName, finalLocale);
    return response;
  }

  // Set locale cookie for future requests
  if (pathLocale) {
    const response = NextResponse.next();
    response.cookies.set(config.localeCookieName, pathLocale);
    return response;
  }

  return null;
}

// ============================================================
// CLIENT-SIDE HELPERS
// ============================================================

/**
 * Get current locale (client-side)
 */
export function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';

  try {
    // Check URL path first
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const locales = ['en', 'am'];
    if (pathSegments.length > 0 && locales.includes(pathSegments[0])) {
      return pathSegments[0];
    }

    // Check cookie
    const cookie = document.cookie.split('; ').find((row) => row.startsWith('NEXT_LOCALE='));
    if (cookie) {
      const value = cookie.split('=')[1];
      if (locales.includes(value)) {
        return value;
      }
    }

    // Check localStorage
    const stored = localStorage.getItem('NEXT_LOCALE');
    if (stored && locales.includes(stored)) {
      return stored;
    }

    // Check navigator language
    const navLang = navigator.language?.split('-')[0]?.toLowerCase();
    if (navLang && locales.includes(navLang)) {
      return navLang;
    }

    return 'en';
  } catch {
    return 'en';
  }
}

/**
 * Set locale (client-side)
 */
export function setLocale(locale: string): void {
  if (typeof window === 'undefined') return;

  const locales = ['en', 'am'];
  if (!locales.includes(locale)) return;

  // Update cookie
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;

  // Update localStorage
  localStorage.setItem('NEXT_LOCALE', locale);

  // Update URL path
  const pathname = window.location.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);

  let newPath = pathname;
  if (pathSegments.length > 0 && locales.includes(pathSegments[0])) {
    // Replace existing locale
    pathSegments[0] = locale;
    newPath = '/' + pathSegments.join('/');
  } else {
    // Add locale prefix
    newPath = '/' + locale + pathname;
  }

  // Redirect to new path
  window.location.href = newPath;
}

/**
 * Get translated text for a key
 */
export function getTranslation(
  key: string,
  locale: string = 'en',
  params: Record<string, string | number> = {}
): string {
  try {
    // Import translations dynamically
    const translations = require(`../lib/i18n/locales/${locale}/common.json`);
    const value = translations[key] || key;

    // Replace params
    return Object.entries(params).reduce(
      (str, [paramKey, paramValue]) => str.replace(`{{${paramKey}}}`, String(paramValue)),
      value
    );
  } catch {
    return key;
  }
}

/**
 * Get translated text for a key with locale detection
 */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const locale = getCurrentLocale();
  return getTranslation(key, locale, params);
}

/**
 * Get available locales
 */
export function getAvailableLocales(): string[] {
  return ['en', 'am'];
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: string): string {
  const names: Record<string, string> = {
    en: 'English',
    am: 'አማርኛ',
  };
  return names[locale] || locale;
}

/**
 * Get locale direction (LTR/RTL)
 */
export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(locale: string): boolean {
  return getAvailableLocales().includes(locale);
}

// ============================================================
// REACT HOOKS
// ============================================================

import { useState, useEffect } from 'react';

/**
 * Hook to get current locale
 */
export function useLocale(): string {
  const [locale, setLocale] = useState<string>('en');

  useEffect(() => {
    setLocale(getCurrentLocale());
  }, []);

  return locale;
}

/**
 * Hook to get translation function
 */
export function useTranslation(): (
  key: string,
  params?: Record<string, string | number>
) => string {
  const locale = useLocale();

  return (key: string, params: Record<string, string | number> = {}) => {
    return getTranslation(key, locale, params);
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default i18nMiddleware;
