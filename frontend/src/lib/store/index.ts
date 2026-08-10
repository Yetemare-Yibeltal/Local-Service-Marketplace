'use client';

// ============================================================
// STORE INDEX
// Central export point for all Zustand stores
// ============================================================

// Auth Store
export { default as useAuthStore, useAuthStore as useAuth } from './auth.store';
export type { AuthState, AuthActions, AuthStore, User, AuthTokens } from './auth.store';

// Booking Store
export { default as useBookingStore, useBookingStore as useBooking } from './booking.store';
export type {
  BookingState,
  BookingActions,
  BookingStore,
  Booking,
  CreateBookingData,
  BookingFilters,
  BookingStats,
} from './booking.store';

// Provider Store
export { default as useProviderStore, useProviderStore as useProvider } from './provider.store';
export type {
  ProviderState,
  ProviderActions,
  ProviderStore,
  ProviderProfile,
  Service,
  CreateServiceData,
  UpdateServiceData,
} from './provider.store';

// Search Store
export { default as useSearchStore, useSearchStore as useSearch } from './search.store';
export type {
  SearchState,
  SearchActions,
  SearchStore,
  SearchResult,
  SearchFilters,
  SearchData,
  SearchResponse,
  FacetResult,
} from './search.store';

// Notification Store
export {
  default as useNotificationStore,
  useNotificationStore as useNotification,
} from './notification.store';
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
export { default as useUIStore, useUIStore as useUI } from './ui.store';
export type { UIState, UIActions, UIStore, ToastMessage, ModalConfig, Theme } from './ui.store';

// ============================================================
// RE-EXPORT ALL STORES AS A SINGLE OBJECT
// ============================================================

import * as authStore from './auth.store';
import * as bookingStore from './booking.store';
import * as providerStore from './provider.store';
import * as searchStore from './search.store';
import * as notificationStore from './notification.store';
import * as uiStore from './ui.store';

export const stores = {
  auth: authStore,
  booking: bookingStore,
  provider: providerStore,
  search: searchStore,
  notification: notificationStore,
  ui: uiStore,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default stores;
