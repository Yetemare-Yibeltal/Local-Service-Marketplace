'use client';

// ============================================================
// HOOKS INDEX
// Central export point for all hooks
// ============================================================

// Auth
export { default as useAuth, AuthProvider, useAuth as useAuthHook } from './useAuth';
export type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AuthContextType,
} from './useAuth';

// Booking
export { default as useBooking } from './useBooking';
export type {
  Booking,
  CreateBookingData,
  UpdateBookingStatusData,
  BookingFilters,
  BookingStats,
  PaginatedResponse,
} from './useBooking';

// Provider
export { default as useProvider } from './useProvider';
export type {
  ProviderProfile,
  Service,
  CreateServiceData,
  UpdateServiceData,
  ProviderSearchData,
  ProviderStats,
  ProviderDashboard,
} from './useProvider';

// Search
export { default as useSearch } from './useSearch';
export type {
  SearchFilters,
  SearchData,
  SearchResult,
  SearchResponse,
  FacetResult,
  AutocompleteResult,
  SearchHistoryItem,
  SearchSuggestion,
} from './useSearch';

// Notification
export { default as useNotification } from './useNotification';
export type {
  Notification,
  NotificationPreferences,
  UnreadCount,
  NotificationFilters,
} from './useNotification';

// Toast
export { default as useToast, ToastProvider, useToast as useToastHook } from './useToast';
export type { Toast, ToastType, ToastOptions, ToastContextType } from './useToast';

// LocalStorage
export { default as useLocalStorage } from './useLocalStorage';
export type { UseLocalStorageOptions } from './useLocalStorage';

// Pagination
export { default as usePagination } from './usePagination';
export type { PaginationOptions, PaginationResult } from './usePagination';

// MediaQuery
export {
  default as useMediaQuery,
  useBreakpoint,
  useMaxBreakpoint,
  useCurrentBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsSmallDesktop,
  useIsLargeDesktop,
  useIsExtraLarge,
  useResponsiveValue,
  useResponsiveClasses,
  useIsPortrait,
  useIsLandscape,
  usePrefersDarkMode,
  usePrefersReducedMotion,
  useWindowSize,
  defaultBreakpoints,
  minBreakpoints,
  maxBreakpoints,
} from './useMediaQuery';
export type { Breakpoints, BreakpointKey } from './useMediaQuery';

// ClickOutside
export {
  default as useClickOutside,
  useClickOutsideMultiple,
  useClickOutsideWithIgnore,
  useClickOutsideToClose,
} from './useClickOutside';
export type { ClickOutsideHandler, UseClickOutsideOptions } from './useClickOutside';

// Form
export {
  default as useForm,
  createValidator,
  required,
  email,
  minLength,
  maxLength,
  pattern,
  ethiopianPhone,
} from './useForm';
export type { FormValidator, UseFormOptions, FieldProps, FormReturn } from './useForm';

// Analytics
export {
  default as useAnalytics,
  initAnalytics,
  setAnalyticsUser,
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
  trackTimeOnPage,
} from './useAnalytics';
export type {
  AnalyticsEvent,
  AnalyticsEventCategory,
  AnalyticsEventAction,
  AnalyticsUser,
  AnalyticsConfig,
  PageViewData,
} from './useAnalytics';

// Map
export { default as useMap } from './useMap';
export type { MapCoordinates, MapBounds, MapMarker, MapOptions, AddressResult } from './useMap';

// ============================================================
// ALL HOOKS EXPORT
// ============================================================

import useAuth from './useAuth';
import useBooking from './useBooking';
import useProvider from './useProvider';
import useSearch from './useSearch';
import useNotification from './useNotification';
import useToast from './useToast';
import useLocalStorage from './useLocalStorage';
import usePagination from './usePagination';
import useMediaQuery from './useMediaQuery';
import useClickOutside from './useClickOutside';
import useForm from './useForm';
import useAnalytics from './useAnalytics';
import useMap from './useMap';

export const hooks = {
  auth: useAuth,
  booking: useBooking,
  provider: useProvider,
  search: useSearch,
  notification: useNotification,
  toast: useToast,
  localStorage: useLocalStorage,
  pagination: usePagination,
  mediaQuery: useMediaQuery,
  clickOutside: useClickOutside,
  form: useForm,
  analytics: useAnalytics,
  map: useMap,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default hooks;
