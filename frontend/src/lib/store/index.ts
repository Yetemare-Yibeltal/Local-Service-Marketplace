'use client';

// ============================================================
// STORE INDEX
// Central export point for all Zustand stores
// ============================================================

// Auth Store
export { default as useAuthStore } from './auth.store';
export type {
  AuthState,
  AuthActions,
  AuthStore,
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from './auth.store';

// Booking Store
export { default as useBookingStore } from './booking.store';
export type {
  BookingState,
  BookingActions,
  BookingStore,
  Booking,
  CreateBookingData,
  UpdateBookingData,
  BookingFilters,
  BookingStats,
  PaginatedBookingResponse,
} from './booking.store';

// Provider Store
export { default as useProviderStore } from './provider.store';
export type {
  ProviderState,
  ProviderActions,
  ProviderStore,
  ProviderProfile,
  Service,
  CreateServiceData,
  UpdateServiceData,
  FavoriteProvider,
} from './provider.store';

// Search Store
export { default as useSearchStore } from './search.store';
export type {
  SearchState,
  SearchActions,
  SearchStore,
  SearchResult,
  SearchFilters,
  SearchData,
  SearchResponse,
  FacetResult,
  AutocompleteResult,
} from './search.store';

// Notification Store
export { default as useNotificationStore } from './notification.store';
export type {
  NotificationState,
  NotificationActions,
  NotificationStore,
  Notification,
  NotificationPreferences,
  UnreadCount,
  NotificationFilters,
} from './notification.store';

// UI Store
export { default as useUIStore } from './ui.store';
export type {
  UIState,
  UIActions,
  UIStore,
  ToastMessage,
  ToastType,
  ModalConfig,
  ModalSize,
  Theme,
  SidebarState,
  LoadingState,
} from './ui.store';

// ============================================================
// RE-EXPORT ALL STORES AS A SINGLE OBJECT FOR CONVENIENCE
// ============================================================

import useAuthStore from './auth.store';
import useBookingStore from './booking.store';
import useProviderStore from './provider.store';
import useSearchStore from './search.store';
import useNotificationStore from './notification.store';
import useUIStore from './ui.store';

export const stores = {
  auth: useAuthStore,
  booking: useBookingStore,
  provider: useProviderStore,
  search: useSearchStore,
  notification: useNotificationStore,
  ui: useUIStore,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default stores;
