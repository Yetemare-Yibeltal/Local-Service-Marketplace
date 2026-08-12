// ============================================================
// PROVIDER TYPES
// Complete provider type definitions for the application
// ============================================================

// ============================================================
// BASE PROVIDER TYPES
// ============================================================

/**
 * Provider status enum
 */
export type ProviderStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING_VERIFICATION";

/**
 * Verification status enum
 */
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Price type enum for services
 */
export type ServicePriceType = "FIXED" | "HOURLY";

/**
 * Service status enum
 */
export type ServiceStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

/**
 * Availability day enum
 */
export type AvailabilityDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

/**
 * Working hours interface
 */
export interface WorkingHours {
  start: string; // Format: "09:00"
  end: string; // Format: "17:00"
}

/**
 * Working hours by day
 */
export interface WorkingHoursByDay {
  monday?: WorkingHours;
  tuesday?: WorkingHours;
  wednesday?: WorkingHours;
  thursday?: WorkingHours;
  friday?: WorkingHours;
  saturday?: WorkingHours;
  sunday?: WorkingHours;
}

/**
 * Provider base interface
 */
export interface Provider {
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
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationDate: Date | null;
  verificationNotes: string | null;
  averageRating: number;
  totalReviews: number;
  locationLat: number;
  locationLng: number;
  address: string;
  city: string;
  subCity: string | null;
  workingHours: WorkingHoursByDay | null;
  completedJobs: number;
  responseTime: number | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider with user details
 */
export interface ProviderWithUser extends Provider {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
}

// ============================================================
// PROVIDER PROFILE TYPES
// ============================================================

/**
 * Provider profile update input
 */
export interface ProviderProfileUpdateInput {
  businessName?: string;
  businessLogo?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
  address?: string;
  city?: string;
  subCity?: string;
  workingHours?: WorkingHoursByDay;
}

/**
 * Provider registration input
 */
export interface ProviderRegistrationInput {
  userId: string;
  businessName: string;
  businessLogo?: string;
  description: string;
  category: string;
  subCategory?: string;
  yearsExperience: number;
  hourlyRate?: number;
  locationLat: number;
  locationLng: number;
  address: string;
  city: string;
  subCity?: string;
  workingHours?: WorkingHoursByDay;
}

/**
 * Provider verification input
 */
export interface ProviderVerificationInput {
  providerId: string;
  isVerified: boolean;
  notes?: string;
}

// ============================================================
// PROVIDER FILTERS AND QUERIES
// ============================================================

/**
 * Provider filter parameters
 */
export interface ProviderFilters {
  search?: string;
  category?: string;
  subCategory?: string;
  city?: string;
  minRating?: number;
  maxRating?: number;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  minExperience?: number;
  maxExperience?: number;
  verificationStatus?: VerificationStatus;
  createdAtStart?: Date;
  createdAtEnd?: Date;
}

/**
 * Provider sort options
 */
export interface ProviderSortOptions {
  field:
    | "businessName"
    | "category"
    | "averageRating"
    | "hourlyRate"
    | "createdAt"
    | "completedJobs"
    | "responseTime";
  order: "asc" | "desc";
}

/**
 * Provider search parameters (geolocation)
 */
export interface ProviderSearchParams {
  lat: number;
  lng: number;
  radius?: number;
  query?: string;
  category?: string;
  subCategory?: string;
  minRating?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?:
    | "relevance"
    | "distance"
    | "rating"
    | "price"
    | "experience"
    | "responseTime";
}

// ============================================================
// PROVIDER SEARCH RESULT TYPES
// ============================================================

/**
 * Provider search result (includes distance)
 */
export interface ProviderSearchResult {
  id: string;
  userId: string;
  businessName: string;
  businessLogo: string | null;
  category: string;
  subCategory: string | null;
  averageRating: number;
  totalReviews: number;
  hourlyRate: number | null;
  isAvailable: boolean;
  isVerified: boolean;
  distance: number;
  address: string;
  city: string;
  subCity: string | null;
  locationLat: number;
  locationLng: number;
  completedJobs: number;
  responseTime: number | null;
  yearsExperience: number;
  isFeatured: boolean;
}

/**
 * Provider search response
 */
export interface ProviderSearchResponse {
  data: ProviderSearchResult[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  facets?: {
    categories: Array<{ name: string; count: number }>;
    cities: Array<{ name: string; count: number }>;
    ratings: Array<{ rating: number; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
  };
}

// ============================================================
// SERVICE TYPES
// ============================================================

/**
 * Service interface
 */
export interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  priceType: ServicePriceType;
  price: number;
  discountPrice: number | null;
  estimatedDurationMinutes: number | null;
  isActive: boolean;
  category: string;
  subCategory: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service with provider details
 */
export interface ServiceWithProvider extends Service {
  provider: {
    id: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    averageRating: number;
    isVerified: boolean;
  };
}

/**
 * Service creation input
 */
export interface ServiceCreateInput {
  providerId: string;
  title: string;
  description: string;
  priceType: ServicePriceType;
  price: number;
  discountPrice?: number;
  estimatedDurationMinutes?: number;
  category: string;
  subCategory?: string;
  images?: string[];
}

/**
 * Service update input
 */
export interface ServiceUpdateInput {
  title?: string;
  description?: string;
  priceType?: ServicePriceType;
  price?: number;
  discountPrice?: number;
  estimatedDurationMinutes?: number;
  category?: string;
  subCategory?: string;
  isActive?: boolean;
  images?: string[];
}

/**
 * Service filter parameters
 */
export interface ServiceFilters {
  providerId?: string;
  category?: string;
  subCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  search?: string;
}

/**
 * Service statistics
 */
export interface ServiceStatistics {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  servicesByCategory: Record<string, number>;
  averagePrice: number;
  mostBookedServices: Array<{
    id: string;
    title: string;
    bookings: number;
    revenue: number;
  }>;
}

// ============================================================
// AVAILABILITY TYPES
// ============================================================

/**
 * Availability interface
 */
export interface Availability {
  id: string;
  providerId: string;
  day: AvailabilityDay;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Availability update input
 */
export interface AvailabilityUpdateInput {
  providerId: string;
  availability: Array<{
    day: AvailabilityDay;
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
  }>;
}

/**
 * Provider availability status
 */
export interface ProviderAvailabilityStatus {
  isAvailable: boolean;
  workingHours: WorkingHoursByDay | null;
  nextAvailableSlot?: Date;
  todayHours?: WorkingHours | null;
  isOpenNow?: boolean;
}

// ============================================================
// PROVIDER STATISTICS TYPES
// ============================================================

/**
 * Provider statistics
 */
export interface ProviderStatistics {
  totalProviders: number;
  activeProviders: number;
  inactiveProviders: number;
  verifiedProviders: number;
  pendingVerification: number;
  rejectedVerification: number;
  providersByCategory: Record<string, number>;
  providersByCity: Record<string, number>;
  averageRating: number;
  totalCompletedJobs: number;
  newProvidersToday: number;
  newProvidersThisWeek: number;
  newProvidersThisMonth: number;
}

/**
 * Provider performance metrics
 */
export interface ProviderPerformance {
  providerId: string;
  businessName: string;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancellationRate: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  averageResponseTime: number | null;
  completionRate: number;
  bookingTrend: Array<{ date: string; count: number }>;
  revenueTrend: Array<{ date: string; amount: number }>;
  performanceScore: number;
}

/**
 * Provider dashboard data
 */
export interface ProviderDashboardData {
  profile: ProviderWithUser;
  stats: {
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
    responseTime: number | null;
    completionRate: number;
  };
  recentServices: Service[];
  upcomingBookings: any[];
  recentReviews: any[];
}

// ============================================================
// PROVIDER DOCUMENT TYPES
// ============================================================

/**
 * Provider document types
 */
export type ProviderDocumentType =
  | "ID"
  | "LICENSE"
  | "CERTIFICATE"
  | "BUSINESS_REGISTRATION"
  | "OTHER";

/**
 * Provider document interface
 */
export interface ProviderDocument {
  id: string;
  providerId: string;
  documentType: ProviderDocumentType;
  documentUrl: string;
  verificationStatus: VerificationStatus;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider document upload input
 */
export interface ProviderDocumentUploadInput {
  providerId: string;
  documentType: ProviderDocumentType;
  file: Buffer | string;
  expiryDate?: Date;
}

// ============================================================
// PROVIDER EARNING TYPES
// ============================================================

/**
 * Provider earning interface
 */
export interface ProviderEarning {
  id: string;
  providerId: string;
  bookingId: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: "PENDING" | "PAID" | "HOLD";
  paidAt: Date | null;
  reference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider earning summary
 */
export interface ProviderEarningSummary {
  totalEarnings: number;
  totalBookings: number;
  pendingPayouts: number;
  completedPayouts: number;
  earningsByDate: Array<{
    date: string;
    amount: number;
    bookings: number;
  }>;
}

// ============================================================
// PROVIDER RESPONSE TYPES
// ============================================================

/**
 * Provider list response
 */
export interface ProviderListResponse {
  data: ProviderWithUser[];
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
 * Provider detail response
 */
export interface ProviderDetailResponse {
  provider: ProviderWithUser;
  services: Service[];
  stats: {
    totalBookings: number;
    completedJobs: number;
    averageRating: number;
    totalReviews: number;
    responseTime: number | null;
  };
}

/**
 * Provider verification status response
 */
export interface ProviderVerificationStatusResponse {
  isVerified: boolean;
  status: VerificationStatus;
  verificationDate: Date | null;
  notes: string | null;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Base types
  ProviderStatus,
  VerificationStatus,
  ServicePriceType,
  ServiceStatus,
  AvailabilityDay,
  WorkingHours,
  WorkingHoursByDay,
  Provider,
  ProviderWithUser,

  // Profile types
  ProviderProfileUpdateInput,
  ProviderRegistrationInput,
  ProviderVerificationInput,

  // Filter types
  ProviderFilters,
  ProviderSortOptions,
  ProviderSearchParams,

  // Search result types
  ProviderSearchResult,
  ProviderSearchResponse,

  // Service types
  Service,
  ServiceWithProvider,
  ServiceCreateInput,
  ServiceUpdateInput,
  ServiceFilters,
  ServiceStatistics,

  // Availability types
  Availability,
  AvailabilityUpdateInput,
  ProviderAvailabilityStatus,

  // Statistics types
  ProviderStatistics,
  ProviderPerformance,
  ProviderDashboardData,

  // Document types
  ProviderDocumentType,
  ProviderDocument,
  ProviderDocumentUploadInput,

  // Earning types
  ProviderEarning,
  ProviderEarningSummary,

  // Response types
  ProviderListResponse,
  ProviderDetailResponse,
  ProviderVerificationStatusResponse,
};
