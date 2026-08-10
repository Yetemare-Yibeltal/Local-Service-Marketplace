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

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  statusCode: number;
}

export interface ApiError {
  success: false;
  message: string;
  errors: string[];
  statusCode: number;
  timestamp: string;
  path?: string;
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  retry?: boolean;
  retryCount?: number;
  maxRetries?: number;
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================
// API CLIENT CLASS
// ============================================================

class ApiClient {
  private client: AxiosInstance;
  private readonly baseURL: string;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1') {
    this.baseURL = baseURL;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // ============================================================
  // INTERCEPTORS
  // ============================================================

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && !(config as ApiRequestConfig).skipAuth) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as ApiRequestConfig;

        // If error is 401 and we haven't retried yet
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.skipAuth
        ) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        return this.handleError(error);
      }
    );
  }

  // ============================================================
  // AUTH TOKEN MANAGEMENT
  // ============================================================

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // ============================================================
  // TOKEN REFRESH
  // ============================================================

  private async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.handleAuthError();
      return null;
    }

    // Prevent multiple concurrent refresh requests
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
        `${this.baseURL}/auth/refresh`,
        { refreshToken }
      );

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        this.setTokens(accessToken, newRefreshToken);

        // Process failed queue
        this.failedQueue.forEach(({ resolve }) => resolve(accessToken));
        this.failedQueue = [];

        return accessToken;
      }

      throw new Error('Refresh failed');
    } catch (error) {
      // Process failed queue with rejection
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];
      this.handleAuthError();
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  private handleAuthError(): void {
    this.clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  private handleError(error: AxiosError): Promise<never> {
    const apiError = this.parseError(error);
    return Promise.reject(apiError);
  }

  private parseError(error: AxiosError): ApiError {
    const defaultError: ApiError = {
      success: false,
      message: 'An unexpected error occurred',
      errors: ['An unexpected error occurred'],
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };

    if (error.response) {
      const data = error.response.data as any;
      return {
        success: false,
        message: data?.message || defaultError.message,
        errors: data?.errors || [defaultError.message],
        statusCode: error.response.status,
        timestamp: data?.timestamp || defaultError.timestamp,
        path: data?.path || error.config?.url,
      };
    }

    if (error.request) {
      return {
        ...defaultError,
        message: 'No response from server',
        errors: ['No response from server'],
      };
    }

    return defaultError;
  }

  // ============================================================
  // REQUEST METHODS
  // ============================================================

  public async request<T>(config: ApiRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async get<T>(url: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  public async post<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  public async put<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  public async patch<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  public async delete<T>(url: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  public async upload<T>(url: string, formData: FormData, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  public getClient(): AxiosInstance {
    return this.client;
  }

  public setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }

  public setDefaultHeaders(headers: Record<string, string>): void {
    this.client.defaults.headers.common = {
      ...this.client.defaults.headers.common,
      ...headers,
    };
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

const apiClient = new ApiClient();

// ============================================================
// EXPORTS
// ============================================================

export { apiClient, ApiClient };
export default apiClient;
