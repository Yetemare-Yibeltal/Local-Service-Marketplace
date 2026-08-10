'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './useAuth';

// ============================================================
// TYPES
// ============================================================

export type AnalyticsEventCategory =
  | 'page_view'
  | 'user_action'
  | 'booking'
  | 'search'
  | 'payment'
  | 'provider'
  | 'review'
  | 'navigation'
  | 'engagement';

export type AnalyticsEventAction =
  | 'view'
  | 'click'
  | 'submit'
  | 'search'
  | 'create'
  | 'update'
  | 'delete'
  | 'cancel'
  | 'complete'
  | 'share'
  | 'like'
  | 'click'
  | 'hover'
  | 'scroll'
  | 'focus'
  | 'blur'
  | 'select'
  | 'upload';

export interface AnalyticsEvent {
  category: AnalyticsEventCategory;
  action: AnalyticsEventAction;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  properties?: Record<string, any>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  provider?: 'google' | 'mixpanel' | 'segment' | 'custom';
  trackingId?: string;
  debug?: boolean;
}

export interface PageViewData {
  path: string;
  title?: string;
  referrer?: string;
  searchParams?: string;
  properties?: Record<string, any>;
}

// ============================================================
// ANALYTICS CONTEXT
// ============================================================

let currentUser: AnalyticsUser | null = null;
let isInitialized = false;
let debugMode = false;

// ============================================================
// ANALYTICS FUNCTIONS
// ============================================================

/**
 * Initialize analytics with configuration
 */
export function initAnalytics(config: AnalyticsConfig): void {
  if (isInitialized) return;
  if (!config.enabled) return;

  debugMode = config.debug || false;
  isInitialized = true;

  if (debugMode) {
    console.log('[Analytics] Initialized with config:', config);
  }
}

/**
 * Set the current user for analytics tracking
 */
export function setAnalyticsUser(user: AnalyticsUser | null): void {
  currentUser = user;
  if (debugMode) {
    console.log('[Analytics] User set:', user);
  }

  // Set user for external providers
  if (typeof window !== 'undefined') {
    // Google Analytics
    if (window.gtag && user) {
      window.gtag('set', 'user_id', user.id);
    }
    // Mixpanel
    if (window.mixpanel && user) {
      window.mixpanel.identify(user.id);
      window.mixpanel.people.set({
        $email: user.email,
        $name: user.name,
        role: user.role,
        ...user.properties,
      });
    }
  }
}

/**
 * Track a page view
 */
export function trackPageView(data: PageViewData): void {
  if (!isInitialized) return;

  if (debugMode) {
    console.log('[Analytics] Page view:', data);
  }

  const pageData = {
    page_path: data.path,
    page_title: data.title || document?.title || '',
    page_referrer: data.referrer || document?.referrer || '',
    page_search_params: data.searchParams || '',
    ...data.properties,
  };

  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', window.gtagId || '', {
      page_path: data.path,
      page_title: data.title || document?.title,
      ...pageData,
    });
  }

  // Custom tracking (send to backend)
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/page-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path: data.path,
          title: data.title || document?.title,
          referrer: data.referrer || document?.referrer,
          userId: currentUser?.id,
          properties: data.properties,
        }),
      }).catch(() => {});
    }
  } catch (error) {
    // Silently fail
  }
}

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!isInitialized) return;

  const eventData = {
    event_category: event.category,
    event_action: event.action,
    event_label: event.label || '',
    event_value: event.value || 0,
    timestamp: event.timestamp || new Date(),
    user_id: currentUser?.id,
    ...event.properties,
  };

  if (debugMode) {
    console.log('[Analytics] Event:', eventData);
  }

  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.properties,
    });
  }

  // Mixpanel
  if (typeof window !== 'undefined' && window.mixpanel) {
    window.mixpanel.track(event.action, {
      category: event.category,
      label: event.label,
      value: event.value,
      ...event.properties,
    });
  }

  // Custom tracking (send to backend)
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event: event.action,
          category: event.category,
          label: event.label,
          value: event.value,
          userId: currentUser?.id,
          properties: event.properties,
          timestamp: event.timestamp || new Date(),
        }),
      }).catch(() => {});
    }
  } catch (error) {
    // Silently fail
  }
}

/**
 * Track a user action (convenience wrapper)
 */
export function trackAction(
  action: AnalyticsEventAction,
  category: AnalyticsEventCategory = 'user_action',
  label?: string,
  value?: number,
  properties?: Record<string, any>
): void {
  trackEvent({
    category,
    action,
    label,
    value,
    properties,
  });
}

/**
 * Track booking creation
 */
export function trackBookingCreated(bookingId: string, providerId: string, amount: number): void {
  trackEvent({
    category: 'booking',
    action: 'create',
    label: `booking_${bookingId}`,
    value: amount,
    properties: {
      bookingId,
      providerId,
      amount,
    },
  });
}

/**
 * Track booking completion
 */
export function trackBookingCompleted(bookingId: string, providerId: string, amount: number): void {
  trackEvent({
    category: 'booking',
    action: 'complete',
    label: `booking_${bookingId}`,
    value: amount,
    properties: {
      bookingId,
      providerId,
      amount,
    },
  });
}

/**
 * Track search
 */
export function trackSearch(
  query: string,
  resultsCount: number,
  filters?: Record<string, any>
): void {
  trackEvent({
    category: 'search',
    action: 'search',
    label: query,
    value: resultsCount,
    properties: {
      query,
      resultsCount,
      ...filters,
    },
  });
}

/**
 * Track payment
 */
export function trackPayment(
  bookingId: string,
  amount: number,
  method: string,
  status: string
): void {
  trackEvent({
    category: 'payment',
    action: 'submit',
    label: `payment_${bookingId}`,
    value: amount,
    properties: {
      bookingId,
      amount,
      method,
      status,
    },
  });
}

/**
 * Track provider view
 */
export function trackProviderView(providerId: string, providerName: string): void {
  trackEvent({
    category: 'provider',
    action: 'view',
    label: providerName,
    properties: {
      providerId,
      providerName,
    },
  });
}

/**
 * Track review submission
 */
export function trackReviewSubmitted(bookingId: string, rating: number): void {
  trackEvent({
    category: 'review',
    action: 'create',
    label: `review_${bookingId}`,
    value: rating,
    properties: {
      bookingId,
      rating,
    },
  });
}

/**
 * Track error
 */
export function trackError(error: Error, context?: string): void {
  trackEvent({
    category: 'user_action',
    action: 'error',
    label: error.name || 'Error',
    properties: {
      message: error.message,
      stack: error.stack,
      context,
    },
  });
}

/**
 * Track time on page
 */
export function trackTimeOnPage(path: string, duration: number): void {
  trackEvent({
    category: 'engagement',
    action: 'time_on_page',
    label: path,
    value: duration,
    properties: {
      path,
      duration,
    },
  });
}

// ============================================================
// REACT HOOK
// ============================================================

/**
 * Hook for analytics tracking in React components
 */
export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Track page views on route change
  useEffect(() => {
    if (!isInitialized) return;

    const path = pathname || '/';
    const search = searchParams?.toString() || '';

    trackPageView({
      path: path + (search ? `?${search}` : ''),
      searchParams: search,
      properties: {
        userId: currentUser?.id,
      },
    });
  }, [pathname, searchParams]);

  // Update user when auth changes
  useEffect(() => {
    if (user) {
      setAnalyticsUser({
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
      });
    } else {
      setAnalyticsUser(null);
    }
  }, [user]);

  // Track time on page
  useEffect(() => {
    if (!isInitialized) return;

    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      // Only track if duration is significant (> 1 second)
      if (duration > 1000) {
        trackTimeOnPage(pathname || '/', duration);
      }
    };
  }, [pathname]);

  return {
    trackPageView,
    trackEvent,
    trackAction,
    trackBookingCreated,
    trackBookingCompleted,
    trackSearch,
    trackPayment,
    trackProviderView,
    trackReviewSubmitted,
    trackError,
    setAnalyticsUser,
    trackTimeOnPage,
  };
}

// ============================================================
// WINDOW TYPE DECLARATIONS
// ============================================================

declare global {
  interface Window {
    gtag: any;
    gtagId: string;
    mixpanel: any;
    dataLayer: any[];
  }
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useAnalytics;
