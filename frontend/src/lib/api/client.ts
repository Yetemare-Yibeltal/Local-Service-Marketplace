'use client';

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// ============================================================
// TYPES
// ============================================================

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  timestamp: string;
  statusCode: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: string[];
  data?: any;
}

export interface RequestOptions extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
}

// ============================================================
// TOKEN MANAGEMENT
// ============================================================

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('user');
}

// ============================================================
// API CLIENT CLASS
// ============================================================

class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private isRefreshing = false;
  private pendingRequests: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    config: InternalAxiosRequestConfig;
  }> = [];

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleRequestError.bind(this)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleResponseError.bind(this)
    );
  }

  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const token = getAccessToken();
    if (token && !config.headers?.['skipAuth']) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  }

  private handleRequestError(error: any): Promise<any> {
    return Promise.reject(error);
  }

  private handleResponse(response: AxiosResponse): AxiosResponse {
    return response;
  }

  private async handleResponseError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip token refresh for auth endpoints
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearTokens();
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Queue the request while refreshing
        const newToken = await this.refreshToken(refreshToken);

        if (newToken) {
          setAccessToken(newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return this.client.request(originalRequest);
        } else {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // User doesn't have permission
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10) * 1000;
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      return this.client.request(error.config as any);
    }

    // Handle 500+ Server Errors
    if (error.response?.status && error.response.status >= 500) {
      // Could retry with exponential backoff
      const retryCount = (error.config as any)?._retryCount || 0;
      if (retryCount < 3) {
        (error.config as any)._retryCount = retryCount + 1;
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.client.request(error.config as any);
      }
    }

    return Promise.reject(error);
  }

  private async refreshToken(refreshToken: string): Promise<string | null> {
    if (this.isRefreshing) {
      // Wait for the ongoing refresh to complete
      return new Promise((resolve, reject) => {
        this.pendingRequests.push({ resolve, reject, config: {} as any });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await axios.post(
        `${this.config.baseURL}/auth/refresh`,
        { refreshToken },
        { timeout: 10000 }
      );

      const data = response.data;
      const newToken = data.data?.accessToken;

      if (newToken) {
        setAccessToken(newToken);
        if (data.data?.refreshToken) {
          setRefreshToken(data.data.refreshToken);
        }

        // Resolve pending requests
        this.pendingRequests.forEach((req) => {
          req.resolve(newToken);
        });
        this.pendingRequests = [];

        return newToken;
      } else {
        this.pendingRequests.forEach((req) => {
          req.reject(new Error('Refresh failed'));
        });
        this.pendingRequests = [];
        return null;
      }
    } catch (error) {
      this.pendingRequests.forEach((req) => {
        req.reject(error);
      });
      this.pendingRequests = [];
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Public methods
  public async request<T = any>(config: RequestOptions): Promise<T> {
    const retries = config.retries || this.config.retries || 0;
    const retryDelay = config.retryDelay || this.config.retryDelay || 1000;
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.client.request<T>(config);
        return response.data;
      } catch (error) {
        lastError = error;
        if (attempt < retries && this.shouldRetry(error)) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          continue;
        }
        break;
      }
    }

    throw lastError;
  }

  private shouldRetry(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      // Retry on network errors, timeouts, and 5xx server errors
      if (!error.response) return true; // Network error
      if (status === 429) return true; // Rate limit
      if (status && status >= 500) return true; // Server error
    }
    return false;
  }

  // Convenience methods
  public get<T = any>(url: string, config?: RequestOptions): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  public post<T = any>(url: string, data?: any, config?: RequestOptions): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  public put<T = any>(url: string, data?: any, config?: RequestOptions): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  public patch<T = any>(url: string, data?: any, config?: RequestOptions): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  public delete<T = any>(url: string, config?: RequestOptions): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

// ============================================================
// INSTANCE CREATION
// ============================================================

let apiClient: ApiClient | null = null;

export function createApiClient(config: ApiClientConfig): ApiClient {
  if (!apiClient) {
    apiClient = new ApiClient(config);
  }
  return apiClient;
}

export function getApiClient(): ApiClient {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient first.');
  }
  return apiClient;
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default apiClient;
