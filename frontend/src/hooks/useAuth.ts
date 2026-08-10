'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
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
  role: 'CUSTOMER' | 'PROVIDER';
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  updateUser: (user: User) => void;
  getToken: () => string | null;
}

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// CONTEXT
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================
// PROVIDER
// ============================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Helper to store tokens
  const storeTokens = useCallback((tokens: AuthTokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }, []);

  // Helper to get token
  const getToken = useCallback((): string | null => {
    return localStorage.getItem('accessToken');
  }, []);

  // Helper to get refresh token
  const getRefreshToken = useCallback((): string | null => {
    return localStorage.getItem('refreshToken');
  }, []);

  // Clear all auth data
  const clearAuth = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Load user from localStorage
  const loadUser = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        return parsedUser;
      }
    } catch (error) {
      console.error('Error loading user:', error);
      clearAuth();
    }
    return null;
  }, [clearAuth]);

  // Refresh token
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue) {
        clearAuth();
        return null;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        clearAuth();
        return null;
      }

      const result = await response.json();
      const newTokens = result.data;

      storeTokens({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn || 900,
      });

      return newTokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuth();
      return null;
    }
  }, [clearAuth, getRefreshToken, storeTokens]);

  // Login
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const result = await response.json();
      const data: AuthResponse = result.data;

      // Store tokens and user
      storeTokens(data.tokens);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      clearAuth();
      throw error;
    }
  }, [clearAuth, storeTokens]);

  // Register
  const register = useCallback(async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          password: data.password,
          role: data.role || 'CUSTOMER',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const result = await response.json();
      const authData: AuthResponse = result.data;

      // Auto-login after registration if tokens are returned
      if (authData.tokens) {
        storeTokens(authData.tokens);
        localStorage.setItem('user', JSON.stringify(authData.user));
        setUser(authData.user);
        setIsAuthenticated(true);
      }

      return authData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, [storeTokens]);

  // Logout
  const logout = useCallback(() => {
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  // Update user
  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const userLoaded = loadUser();

    // If user loaded, verify token validity
    if (userLoaded) {
      const token = getToken();
      if (!token) {
        clearAuth();
      } else {
        // Optionally verify token with backend
        // For now, assume valid
      }
    }

    setIsLoading(false);
  }, [loadUser, getToken, clearAuth]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Refresh token every 10 minutes (assuming 15min expiry)
    const interval = setInterval(() => {
      refreshToken();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, refreshToken]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// EXPORTS
// ============================================================

export default useAuth;