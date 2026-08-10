'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  login as loginApi,
  register as registerApi,
  refreshToken as refreshTokenApi,
  logout as logoutApi,
  getCurrentUser as getCurrentUserApi,
} from '../api/auth';

// ============================================================
// TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  profileImage: string | null;
  bio: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: 'CUSTOMER' | 'PROVIDER';
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  getCurrentUser: () => Promise<User | null>;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

// ============================================================
// STORE
// ============================================================

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  isInitialized: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Login action
      login: async (credentials: LoginCredentials): Promise<User> => {
        set({ isLoading: true, error: null });

        try {
          const response = await loginApi(credentials);
          const { user, tokens } = response;

          // Store tokens and user
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // Register action
      register: async (data: RegisterData): Promise<User> => {
        set({ isLoading: true, error: null });

        try {
          const response = await registerApi(data);

          // Check if registration returned tokens (auto-login)
          if (response.tokens) {
            const { user, tokens } = response;
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return user;
          }

          // Registration without auto-login (just return user)
          set({ isLoading: false });
          return response.user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Logout action
      logout: async (): Promise<void> => {
        set({ isLoading: true });

        try {
          await logoutApi();
        } catch (error) {
          // Ignore errors on logout
          console.error('Logout error:', error);
        } finally {
          // Always clear local state
          set({
            ...initialState,
            isInitialized: true,
          });

          // Clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      },

      // Refresh token action
      refreshToken: async (): Promise<string | null> => {
        const { tokens } = get();

        if (!tokens?.refreshToken) {
          return null;
        }

        try {
          const response = await refreshTokenApi(tokens.refreshToken);
          const newTokens = {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken || tokens.refreshToken,
            expiresIn: response.expiresIn || 900,
          };

          set({ tokens: newTokens });
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('refreshToken', newTokens.refreshToken);

          return newTokens.accessToken;
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Clear auth on refresh failure
          get().clearAuth();
          return null;
        }
      },

      // Get current user
      getCurrentUser: async (): Promise<User | null> => {
        set({ isLoading: true, error: null });

        try {
          const user = await getCurrentUserApi();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          localStorage.setItem('user', JSON.stringify(user));
          return user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get user';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          return null;
        }
      },

      // Set user
      setUser: (user: User): void => {
        set({ user });
        localStorage.setItem('user', JSON.stringify(user));
      },

      // Set tokens
      setTokens: (tokens: AuthTokens): void => {
        set({ tokens, isAuthenticated: true });
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      },

      // Clear auth
      clearAuth: (): void => {
        set({
          ...initialState,
          isInitialized: true,
        });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      },

      // Set loading
      setLoading: (loading: boolean): void => {
        set({ isLoading: loading });
      },

      // Set error
      setError: (error: string | null): void => {
        set({ error });
      },

      // Initialize store from localStorage
      initialize: async (): Promise<void> => {
        // Check if already initialized
        if (get().isInitialized) {
          return;
        }

        set({ isLoading: true });

        try {
          // Get tokens from localStorage
          const accessToken = localStorage.getItem('accessToken');
          const refreshToken = localStorage.getItem('refreshToken');
          const userData = localStorage.getItem('user');

          if (accessToken && refreshToken && userData) {
            const user = JSON.parse(userData);

            // Verify token by getting current user
            try {
              const currentUser = await getCurrentUserApi();
              set({
                user: currentUser,
                tokens: {
                  accessToken,
                  refreshToken,
                  expiresIn: 900,
                },
                isAuthenticated: true,
                isLoading: false,
                error: null,
                isInitialized: true,
              });
            } catch (error) {
              // Token expired or invalid
              console.error('Token validation failed:', error);
              get().clearAuth();
              set({
                isLoading: false,
                isInitialized: true,
              });
            }
          } else {
            set({
              isLoading: false,
              isInitialized: true,
            });
          }
        } catch (error) {
          console.error('Initialization error:', error);
          set({
            isLoading: false,
            isInitialized: true,
            error: 'Failed to initialize auth',
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================================
// SELECTORS
// ============================================================

export const selectUser = (state: AuthStore) => state.user;
export const selectTokens = (state: AuthStore) => state.tokens;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectError = (state: AuthStore) => state.error;
export const selectRole = (state: AuthStore) => state.user?.role;
export const selectIsAdmin = (state: AuthStore) => state.user?.role === 'ADMIN';
export const selectIsProvider = (state: AuthStore) => state.user?.role === 'PROVIDER';
export const selectIsCustomer = (state: AuthStore) => state.user?.role === 'CUSTOMER';

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useAuthStore;
