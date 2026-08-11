'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================
// TYPES
// ============================================================

export type Theme = 'light' | 'dark' | 'system';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

export interface ModalConfig {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode | string;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export interface LoadingState {
  isGlobalLoading: boolean;
  loadingMessages: string[];
  loadingOverlay: boolean;
}

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
}

export interface UIState {
  // Theme
  theme: Theme;
  isDarkMode: boolean;

  // Sidebar
  sidebar: SidebarState;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Modals
  modals: Record<string, ModalConfig>;
  activeModal: string | null;

  // Toast messages
  toasts: ToastMessage[];

  // Loading
  loading: LoadingState;

  // Breakpoints
  breakpoint: BreakpointState;

  // Scroll position
  scrollPosition: number;
  isScrolled: boolean;

  // Focus
  focusedElement: string | null;

  // UI Flags
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isNotificationOpen: boolean;
  isUserMenuOpen: boolean;
  isCartOpen: boolean;
  isCommandPaletteOpen: boolean;
}

export interface UIActions {
  // Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Sidebar
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setSidebarState: (state: SidebarState) => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;

  // Modals
  openModal: (id: string, config?: Partial<ModalConfig>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  setModalConfig: (id: string, config: Partial<ModalConfig>) => void;
  getModal: (id: string) => ModalConfig | undefined;

  // Toast messages
  showToast: (
    message: string,
    type?: ToastType,
    options?: { duration?: number; dismissible?: boolean }
  ) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
  showSuccess: (message: string, options?: { duration?: number; dismissible?: boolean }) => string;
  showError: (message: string, options?: { duration?: number; dismissible?: boolean }) => string;
  showWarning: (message: string, options?: { duration?: number; dismissible?: boolean }) => string;
  showInfo: (message: string, options?: { duration?: number; dismissible?: boolean }) => string;

  // Loading
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  showLoadingOverlay: (message?: string) => void;
  hideLoadingOverlay: () => void;
  addLoadingMessage: (message: string) => void;
  removeLoadingMessage: (message: string) => void;
  clearLoadingMessages: () => void;

  // Breakpoints
  setBreakpoint: (breakpoint: Partial<BreakpointState>) => void;

  // Scroll
  setScrollPosition: (position: number) => void;

  // Focus
  setFocusedElement: (id: string | null) => void;

  // UI Flags
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
  openUserMenu: () => void;
  closeUserMenu: () => void;
  toggleUserMenu: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // Reset
  resetUI: () => void;
}

export type UIStore = UIState & UIActions;

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: UIState = {
  theme: 'system',
  isDarkMode: false,

  sidebar: 'expanded',
  isSidebarOpen: true,
  isSidebarCollapsed: false,

  modals: {},
  activeModal: null,

  toasts: [],

  loading: {
    isGlobalLoading: false,
    loadingMessages: [],
    loadingOverlay: false,
  },

  breakpoint: {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    width: 0,
    height: 0,
  },

  scrollPosition: 0,
  isScrolled: false,

  focusedElement: null,

  isMobileMenuOpen: false,
  isSearchOpen: false,
  isNotificationOpen: false,
  isUserMenuOpen: false,
  isCartOpen: false,
  isCommandPaletteOpen: false,
};

// ============================================================
// HELPERS
// ============================================================

let toastIdCounter = 0;

function generateToastId(): string {
  toastIdCounter++;
  return `toast-${Date.now()}-${toastIdCounter}`;
}

// ============================================================
// STORE
// ============================================================

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================================
      // THEME
      // ============================================================

      setTheme: (theme: Theme) => {
        const isDarkMode =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        set({
          theme,
          isDarkMode,
        });

        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', isDarkMode);
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // ============================================================
      // SIDEBAR
      // ============================================================

      openSidebar: () => {
        set({
          isSidebarOpen: true,
          isSidebarCollapsed: false,
          sidebar: 'expanded',
        });
      },

      closeSidebar: () => {
        set({
          isSidebarOpen: false,
          sidebar: 'hidden',
        });
      },

      toggleSidebar: () => {
        const { isSidebarOpen } = get();
        if (isSidebarOpen) {
          get().closeSidebar();
        } else {
          get().openSidebar();
        }
      },

      setSidebarState: (state: SidebarState) => {
        set({
          sidebar: state,
          isSidebarOpen: state !== 'hidden',
          isSidebarCollapsed: state === 'collapsed',
        });
      },

      collapseSidebar: () => {
        set({
          sidebar: 'collapsed',
          isSidebarOpen: true,
          isSidebarCollapsed: true,
        });
      },

      expandSidebar: () => {
        set({
          sidebar: 'expanded',
          isSidebarOpen: true,
          isSidebarCollapsed: false,
        });
      },

      // ============================================================
      // MODALS
      // ============================================================

      openModal: (id: string, config: Partial<ModalConfig> = {}) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [id]: {
              isOpen: true,
              size: config.size || 'md',
              closeOnOverlayClick:
                config.closeOnOverlayClick !== undefined ? config.closeOnOverlayClick : true,
              ...config,
            },
          },
          activeModal: id,
        }));
      },

      closeModal: (id: string) => {
        const { modals, activeModal } = get();

        // Get onClose callback before closing
        const modal = modals[id];
        if (modal?.onClose) {
          modal.onClose();
        }

        set((state) => {
          const newModals = { ...state.modals };
          delete newModals[id];

          return {
            modals: newModals,
            activeModal: activeModal === id ? null : activeModal,
          };
        });
      },

      closeAllModals: () => {
        const { modals } = get();

        // Call onClose for all open modals
        Object.values(modals).forEach((modal) => {
          if (modal.onClose) {
            modal.onClose();
          }
        });

        set({
          modals: {},
          activeModal: null,
        });
      },

      setModalConfig: (id: string, config: Partial<ModalConfig>) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [id]: {
              ...state.modals[id],
              ...config,
            },
          },
        }));
      },

      getModal: (id: string) => {
        return get().modals[id];
      },

      // ============================================================
      // TOAST MESSAGES
      // ============================================================

      showToast: (message: string, type: ToastType = 'info', options = {}) => {
        const { duration = 5000, dismissible = true } = options;
        const id = generateToastId();

        set((state) => ({
          toasts: [
            ...state.toasts,
            {
              id,
              type,
              message,
              duration,
              dismissible,
            },
          ],
        }));

        // Auto dismiss
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }

        return id;
      },

      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      removeAllToasts: () => {
        set({ toasts: [] });
      },

      showSuccess: (message: string, options = {}) => {
        return get().showToast(message, 'success', options);
      },

      showError: (message: string, options = {}) => {
        return get().showToast(message, 'error', options);
      },

      showWarning: (message: string, options = {}) => {
        return get().showToast(message, 'warning', options);
      },

      showInfo: (message: string, options = {}) => {
        return get().showToast(message, 'info', options);
      },

      // ============================================================
      // LOADING
      // ============================================================

      showLoading: (message?: string) => {
        set((state) => ({
          loading: {
            ...state.loading,
            isGlobalLoading: true,
            loadingMessages: message
              ? [...state.loading.loadingMessages, message]
              : state.loading.loadingMessages,
          },
        }));
      },

      hideLoading: () => {
        set((state) => ({
          loading: {
            ...state.loading,
            isGlobalLoading: false,
            loadingMessages: [],
          },
        }));
      },

      showLoadingOverlay: (message?: string) => {
        set((state) => ({
          loading: {
            ...state.loading,
            loadingOverlay: true,
            loadingMessages: message
              ? [...state.loading.loadingMessages, message]
              : state.loading.loadingMessages,
          },
        }));
      },

      hideLoadingOverlay: () => {
        set((state) => ({
          loading: {
            ...state.loading,
            loadingOverlay: false,
          },
        }));
      },

      addLoadingMessage: (message: string) => {
        set((state) => ({
          loading: {
            ...state.loading,
            loadingMessages: [...state.loading.loadingMessages, message],
          },
        }));
      },

      removeLoadingMessage: (message: string) => {
        set((state) => ({
          loading: {
            ...state.loading,
            loadingMessages: state.loading.loadingMessages.filter((msg) => msg !== message),
          },
        }));
      },

      clearLoadingMessages: () => {
        set((state) => ({
          loading: {
            ...state.loading,
            loadingMessages: [],
          },
        }));
      },

      // ============================================================
      // BREAKPOINTS
      // ============================================================

      setBreakpoint: (breakpoint: Partial<BreakpointState>) => {
        set((state) => ({
          breakpoint: {
            ...state.breakpoint,
            ...breakpoint,
          },
        }));
      },

      // ============================================================
      // SCROLL
      // ============================================================

      setScrollPosition: (position: number) => {
        set({
          scrollPosition: position,
          isScrolled: position > 10,
        });
      },

      // ============================================================
      // FOCUS
      // ============================================================

      setFocusedElement: (id: string | null) => {
        set({ focusedElement: id });
      },

      // ============================================================
      // UI FLAGS
      // ============================================================

      openMobileMenu: () => {
        set({ isMobileMenuOpen: true });
        document.body.style.overflow = 'hidden';
      },

      closeMobileMenu: () => {
        set({ isMobileMenuOpen: false });
        document.body.style.overflow = '';
      },

      toggleMobileMenu: () => {
        const { isMobileMenuOpen } = get();
        if (isMobileMenuOpen) {
          get().closeMobileMenu();
        } else {
          get().openMobileMenu();
        }
      },

      openSearch: () => {
        set({ isSearchOpen: true });
        document.body.style.overflow = 'hidden';
      },

      closeSearch: () => {
        set({ isSearchOpen: false });
        document.body.style.overflow = '';
      },

      toggleSearch: () => {
        const { isSearchOpen } = get();
        if (isSearchOpen) {
          get().closeSearch();
        } else {
          get().openSearch();
        }
      },

      openNotifications: () => {
        set({ isNotificationOpen: true });
      },

      closeNotifications: () => {
        set({ isNotificationOpen: false });
      },

      toggleNotifications: () => {
        const { isNotificationOpen } = get();
        if (isNotificationOpen) {
          get().closeNotifications();
        } else {
          get().openNotifications();
        }
      },

      openUserMenu: () => {
        set({ isUserMenuOpen: true });
      },

      closeUserMenu: () => {
        set({ isUserMenuOpen: false });
      },

      toggleUserMenu: () => {
        const { isUserMenuOpen } = get();
        if (isUserMenuOpen) {
          get().closeUserMenu();
        } else {
          get().openUserMenu();
        }
      },

      openCart: () => {
        set({ isCartOpen: true });
        document.body.style.overflow = 'hidden';
      },

      closeCart: () => {
        set({ isCartOpen: false });
        document.body.style.overflow = '';
      },

      toggleCart: () => {
        const { isCartOpen } = get();
        if (isCartOpen) {
          get().closeCart();
        } else {
          get().openCart();
        }
      },

      openCommandPalette: () => {
        set({ isCommandPaletteOpen: true });
        document.body.style.overflow = 'hidden';
      },

      closeCommandPalette: () => {
        set({ isCommandPaletteOpen: false });
        document.body.style.overflow = '';
      },

      toggleCommandPalette: () => {
        const { isCommandPaletteOpen } = get();
        if (isCommandPaletteOpen) {
          get().closeCommandPalette();
        } else {
          get().openCommandPalette();
        }
      },

      // ============================================================
      // RESET
      // ============================================================

      resetUI: () => {
        // Close all modals and toasts first
        get().closeAllModals();
        get().removeAllToasts();
        get().hideLoading();
        get().hideLoadingOverlay();

        set({
          ...initialState,
          theme: get().theme,
          isDarkMode: get().isDarkMode,
          sidebar: get().sidebar,
          isSidebarOpen: get().isSidebarOpen,
          isSidebarCollapsed: get().isSidebarCollapsed,
        });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        isDarkMode: state.isDarkMode,
        sidebar: state.sidebar,
        isSidebarOpen: state.isSidebarOpen,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);

// ============================================================
// SELECTORS
// ============================================================

export const selectTheme = (state: UIStore) => state.theme;
export const selectIsDarkMode = (state: UIStore) => state.isDarkMode;
export const selectSidebar = (state: UIStore) => state.sidebar;
export const selectIsSidebarOpen = (state: UIStore) => state.isSidebarOpen;
export const selectIsSidebarCollapsed = (state: UIStore) => state.isSidebarCollapsed;
export const selectActiveModal = (state: UIStore) => state.activeModal;
export const selectToasts = (state: UIStore) => state.toasts;
export const selectIsLoading = (state: UIStore) => state.loading.isGlobalLoading;
export const selectLoadingMessages = (state: UIStore) => state.loading.loadingMessages;
export const selectLoadingOverlay = (state: UIStore) => state.loading.loadingOverlay;
export const selectIsMobile = (state: UIStore) => state.breakpoint.isMobile;
export const selectIsTablet = (state: UIStore) => state.breakpoint.isTablet;
export const selectIsDesktop = (state: UIStore) => state.breakpoint.isDesktop;
export const selectBreakpoint = (state: UIStore) => state.breakpoint;
export const selectIsScrolled = (state: UIStore) => state.isScrolled;
export const selectIsMobileMenuOpen = (state: UIStore) => state.isMobileMenuOpen;
export const selectIsSearchOpen = (state: UIStore) => state.isSearchOpen;
export const selectIsNotificationOpen = (state: UIStore) => state.isNotificationOpen;
export const selectIsUserMenuOpen = (state: UIStore) => state.isUserMenuOpen;
export const selectIsCartOpen = (state: UIStore) => state.isCartOpen;
export const selectIsCommandPaletteOpen = (state: UIStore) => state.isCommandPaletteOpen;

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useUIStore;
