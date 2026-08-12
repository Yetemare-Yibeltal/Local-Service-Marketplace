// ============================================================
// USER TYPES
// Complete user type definitions for the application
// ============================================================

// ============================================================
// BASE USER TYPES
// ============================================================

/**
 * User role enum
 */
export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";

/**
 * User status enum
 */
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

/**
 * User verification status
 */
export interface UserVerification {
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  verificationDate?: Date;
}

/**
 * Base user interface
 */
export interface User {
  id: string;
  email: string;
  phone: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  profileImage: string | null;
  bio: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User profile (public view)
 */
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  profileImage: string | null;
  bio: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
}

/**
 * User with provider profile
 */
export interface UserWithProvider extends User {
  providerProfile?: {
    id: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    isVerified: boolean;
    averageRating: number;
    totalReviews: number;
    isAvailable: boolean;
  } | null;
}

// ============================================================
// USER FILTERS AND QUERIES
// ============================================================

/**
 * User filter parameters for listing users
 */
export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * User sort options
 */
export interface UserSortOptions {
  field: "createdAt" | "fullName" | "email" | "role" | "lastLoginAt";
  order: "asc" | "desc";
}

/**
 * User pagination parameters
 */
export interface UserPaginationParams {
  page: number;
  limit: number;
  filters?: UserFilters;
  sort?: UserSortOptions;
}

// ============================================================
// USER CRUD TYPES
// ============================================================

/**
 * User creation input
 */
export interface UserCreateInput {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role: UserRole;
  profileImage?: string;
  bio?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
}

/**
 * User update input
 */
export interface UserUpdateInput {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  profileImage?: string;
  bio?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

/**
 * Admin create user input
 */
export interface AdminCreateUserInput {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role: UserRole;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
}

/**
 * Admin update user input
 */
export interface AdminUpdateUserInput {
  fullName?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  bio?: string;
}

// ============================================================
// USER STATISTICS TYPES
// ============================================================

/**
 * User statistics
 */
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  customers: number;
  providers: number;
  admins: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: {
    CUSTOMER: number;
    PROVIDER: number;
    ADMIN: number;
  };
  usersByStatus: {
    ACTIVE: number;
    INACTIVE: number;
    SUSPENDED: number;
    DELETED: number;
  };
}

/**
 * User growth data
 */
export interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

/**
 * User dashboard statistics
 */
export interface UserDashboardStats {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    profileImage: string | null;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  stats: {
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    providerStats?: {
      totalBookings: number;
      completedBookings: number;
      pendingBookings: number;
      totalEarnings: number;
      averageRating: number;
      totalReviews: number;
    };
  };
}

// ============================================================
// USER ACTIVITY TYPES
// ============================================================

/**
 * User activity log
 */
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * User session
 */
export interface UserSession {
  sessionId: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

/**
 * User login history
 */
export interface UserLoginHistory {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  loginAt: Date;
  logoutAt?: Date;
  isActive: boolean;
}

// ============================================================
// USER PREFERENCES TYPES
// ============================================================

/**
 * User notification preferences
 */
export interface UserNotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  bookingUpdates: boolean;
  promotionalEmails: boolean;
  providerUpdates: boolean;
  systemAlerts: boolean;
}

/**
 * User language preferences
 */
export interface UserLanguagePreferences {
  language: "en" | "am";
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

/**
 * User privacy preferences
 */
export interface UserPrivacyPreferences {
  showProfile: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showBio: boolean;
  showBookingHistory: boolean;
}

/**
 * Complete user preferences
 */
export interface UserPreferences {
  notifications: UserNotificationPreferences;
  language: UserLanguagePreferences;
  privacy: UserPrivacyPreferences;
}

// ============================================================
// USER RESPONSE TYPES
// ============================================================

/**
 * User list response
 */
export interface UserListResponse {
  data: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * User count response
 */
export interface UserCountResponse {
  total: number;
  active: number;
  inactive: number;
  customers: number;
  providers: number;
  admins: number;
  verified: number;
  unverified: number;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Base types
  User,
  UserRole,
  UserStatus,
  UserVerification,
  UserProfile,
  UserWithProvider,

  // Filter types
  UserFilters,
  UserSortOptions,
  UserPaginationParams,

  // CRUD types
  UserCreateInput,
  UserUpdateInput,
  AdminCreateUserInput,
  AdminUpdateUserInput,

  // Statistics types
  UserStatistics,
  UserGrowthData,
  UserDashboardStats,

  // Activity types
  UserActivity,
  UserSession,
  UserLoginHistory,

  // Preferences types
  UserNotificationPreferences,
  UserLanguagePreferences,
  UserPrivacyPreferences,
  UserPreferences,

  // Response types
  UserListResponse,
  UserCountResponse,
};
