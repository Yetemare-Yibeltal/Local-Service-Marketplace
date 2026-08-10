'use client';

import { getApiClient } from './client';

// ============================================================
// TYPES
// ============================================================

export interface AdminUser {
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
  providerProfile?: {
    id: string;
    businessName: string;
    isVerified: boolean;
    averageRating: number;
    totalReviews: number;
    category: string;
  } | null;
}

export interface AdminProvider {
  id: string;
  userId: string;
  businessName: string;
  businessLogo: string | null;
  description: string;
  category: string;
  subCategory: string | null;
  yearsExperience: number;
  hourlyRate: number | null;
  isAvailable: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  locationLat: number;
  locationLng: number;
  address: string;
  city: string;
  subCity: string | null;
  workingHours: any;
  completedJobs: number;
  responseTime: number | null;
  isFeatured: boolean;
  verificationDate: string | null;
  verificationNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  services: {
    id: string;
    title: string;
    price: number;
    priceType: string;
  }[];
}

export interface AdminDispute {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  raisedBy: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  adminNotes: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    scheduledDate: string;
    totalPrice: number;
    status: string;
    customer: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
      profileImage: string | null;
    };
    provider: {
      id: string;
      businessName: string;
      businessLogo: string | null;
      category: string;
    };
  };
  disputeMessages: {
    id: string;
    senderId: string;
    senderRole: string;
    message: string;
    attachments: string[];
    isRead: boolean;
    createdAt: string;
  }[];
}

export interface AdminAuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  } | null;
}

export interface SystemSetting {
  key: string;
  value: any;
  description: string | null;
  isPublic: boolean;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  providers: {
    total: number;
    active: number;
    inactive: number;
    verified: number;
    pending: number;
    rejected: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    disputed: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    averagePerBooking: number;
  };
  disputes: {
    total: number;
    open: number;
    underReview: number;
    resolved: number;
    closed: number;
  };
  reviews: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    averageRating: number;
  };
}

export interface PlatformAnalytics {
  period: string;
  startDate: string;
  analytics: {
    newUsers: number;
    newProviders: number;
    totalBookings: number;
    totalRevenue: number;
    totalDisputes: number;
    totalReviews: number;
  };
}

export interface AdminFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserAdminFilters extends AdminFilters {
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface ProviderAdminFilters extends AdminFilters {
  category?: string;
  city?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface DisputeAdminFilters extends AdminFilters {
  status?: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  raisedBy?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogFilters extends AdminFilters {
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================
// DASHBOARD
// ============================================================

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboard(): Promise<AdminDashboardStats> {
  const client = getApiClient();
  const response = await client.get<{ data: AdminDashboardStats }>('/admin/dashboard');
  return response.data;
}

/**
 * Get platform analytics
 */
export async function getPlatformAnalytics(
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<PlatformAnalytics> {
  const client = getApiClient();
  const response = await client.get<{ data: PlatformAnalytics }>(
    `/admin/analytics?period=${period}`
  );
  return response.data;
}

// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * Get all users with filters (admin only)
 */
export async function adminGetUsers(
  filters: UserAdminFilters = {}
): Promise<PaginatedResponse<AdminUser>> {
  const client = getApiClient();
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.role) params.append('role', filters.role);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  if (filters.isEmailVerified !== undefined)
    params.append('isEmailVerified', filters.isEmailVerified.toString());
  if (filters.isPhoneVerified !== undefined)
    params.append('isPhoneVerified', filters.isPhoneVerified.toString());
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 20).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await client.get<{ data: AdminUser[]; pagination: any }>(
    `/admin/users?${params.toString()}`
  );
  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

/**
 * Get user by ID (admin only)
 */
export async function adminGetUser(userId: string): Promise<AdminUser> {
  const client = getApiClient();
  const response = await client.get<{ data: AdminUser }>(`/admin/users/${userId}`);
  return response.data;
}

/**
 * Update user (admin only)
 */
export async function adminUpdateUser(
  userId: string,
  data: Partial<{
    fullName: string;
    phone: string;
    email: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    bio: string;
  }>
): Promise<AdminUser> {
  const client = getApiClient();
  const response = await client.put<{ data: AdminUser }>(`/admin/users/${userId}`, data);
  return response.data;
}

/**
 * Deactivate user (admin only)
 */
export async function adminDeactivateUser(userId: string, reason?: string): Promise<AdminUser> {
  const client = getApiClient();
  const response = await client.post<{ data: AdminUser }>(`/admin/users/${userId}/deactivate`, {
    reason: reason || 'Admin action',
  });
  return response.data;
}

/**
 * Activate user (admin only)
 */
export async function adminActivateUser(userId: string): Promise<AdminUser> {
  const client = getApiClient();
  const response = await client.post<{ data: AdminUser }>(`/admin/users/${userId}/activate`);
  return response.data;
}

// ============================================================
// PROVIDER MANAGEMENT
// ============================================================

/**
 * Get all providers with filters (admin only)
 */
export async function adminGetProviders(
  filters: ProviderAdminFilters = {}
): Promise<PaginatedResponse<AdminProvider>> {
  const client = getApiClient();
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.city) params.append('city', filters.city);
  if (filters.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString());
  if (filters.isAvailable !== undefined)
    params.append('isAvailable', filters.isAvailable.toString());
  if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 20).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await client.get<{ data: AdminProvider[]; pagination: any }>(
    `/admin/providers?${params.toString()}`
  );
  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

/**
 * Get provider by ID (admin only)
 */
export async function adminGetProvider(providerId: string): Promise<AdminProvider> {
  const client = getApiClient();
  const response = await client.get<{ data: AdminProvider }>(`/admin/providers/${providerId}`);
  return response.data;
}

/**
 * Get pending providers (admin only)
 */
export async function adminGetPendingProviders(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<AdminProvider>> {
  const client = getApiClient();
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await client.get<{ data: AdminProvider[]; pagination: any }>(
    `/admin/providers/pending?${params.toString()}`
  );
  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

/**
 * Verify provider (admin only)
 */
export async function adminVerifyProvider(
  providerId: string,
  status: 'APPROVED' | 'REJECTED',
  notes?: string
): Promise<AdminProvider> {
  const client = getApiClient();
  const response = await client.patch<{ data: AdminProvider }>(
    `/admin/providers/${providerId}/verify`,
    { status, notes }
  );
  return response.data;
}

// ============================================================
// DISPUTE MANAGEMENT
// ============================================================

/**
 * Get all disputes with filters (admin only)
 */
export async function adminGetDisputes(
  filters: DisputeAdminFilters = {}
): Promise<PaginatedResponse<AdminDispute>> {
  const client = getApiClient();
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.raisedBy) params.append('raisedBy', filters.raisedBy);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 20).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await client.get<{ data: AdminDispute[]; pagination: any }>(
    `/admin/disputes?${params.toString()}`
  );
  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

/**
 * Get dispute by ID (admin only)
 */
export async function adminGetDispute(disputeId: string): Promise<AdminDispute> {
  const client = getApiClient();
  const response = await client.get<{ data: AdminDispute }>(`/admin/disputes/${disputeId}`);
  return response.data;
}

/**
 * Resolve dispute (admin only)
 */
export async function adminResolveDispute(
  disputeId: string,
  resolution: string,
  status: 'RESOLVED' | 'CLOSED' = 'RESOLVED'
): Promise<AdminDispute> {
  const client = getApiClient();
  const response = await client.put<{ data: AdminDispute }>(
    `/admin/disputes/${disputeId}/resolve`,
    { resolution, status }
  );
  return response.data;
}

/**
 * Add message to dispute (admin only)
 */
export async function adminAddDisputeMessage(
  disputeId: string,
  message: string
): Promise<{ id: string; message: string; createdAt: string }> {
  const client = getApiClient();
  const response = await client.post<{ data: any }>(`/admin/disputes/${disputeId}/messages`, {
    message,
  });
  return response.data;
}

// ============================================================
// SYSTEM SETTINGS
// ============================================================

/**
 * Get all system settings (admin only)
 */
export async function adminGetSettings(): Promise<SystemSetting[]> {
  const client = getApiClient();
  const response = await client.get<{ data: SystemSetting[] }>('/admin/settings');
  return response.data || [];
}

/**
 * Get system setting by key (admin only)
 */
export async function adminGetSetting(key: string): Promise<SystemSetting> {
  const client = getApiClient();
  const response = await client.get<{ data: SystemSetting }>(`/admin/settings/${key}`);
  return response.data;
}

/**
 * Update system setting (admin only)
 */
export async function adminUpdateSetting(
  key: string,
  value: any,
  description?: string
): Promise<SystemSetting> {
  const client = getApiClient();
  const response = await client.put<{ data: SystemSetting }>(`/admin/settings/${key}`, {
    value,
    description,
  });
  return response.data;
}

// ============================================================
// AUDIT LOGS
// ============================================================

/**
 * Get audit logs with filters (admin only)
 */
export async function adminGetAuditLogs(
  filters: AuditLogFilters = {}
): Promise<PaginatedResponse<AdminAuditLog>> {
  const client = getApiClient();
  const params = new URLSearchParams();

  if (filters.userId) params.append('userId', filters.userId);
  if (filters.action) params.append('action', filters.action);
  if (filters.entity) params.append('entity', filters.entity);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 50).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await client.get<{ data: AdminAuditLog[]; pagination: any }>(
    `/admin/audit-logs?${params.toString()}`
  );
  return {
    data: response.data || [],
    pagination: response.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 50,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Dashboard
  getAdminDashboard,
  getPlatformAnalytics,

  // User Management
  adminGetUsers,
  adminGetUser,
  adminUpdateUser,
  adminDeactivateUser,
  adminActivateUser,

  // Provider Management
  adminGetProviders,
  adminGetProvider,
  adminGetPendingProviders,
  adminVerifyProvider,

  // Dispute Management
  adminGetDisputes,
  adminGetDispute,
  adminResolveDispute,
  adminAddDisputeMessage,

  // System Settings
  adminGetSettings,
  adminGetSetting,
  adminUpdateSetting,

  // Audit Logs
  adminGetAuditLogs,
};
