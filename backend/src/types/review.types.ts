// ============================================================
// REVIEW TYPES
// Complete review type definitions for the application
// ============================================================

// ============================================================
// ENUMS
// ============================================================

/**
 * Review status enum
 */
export type ReviewStatus = "PUBLISHED" | "HIDDEN" | "FLAGGED" | "REMOVED";

/**
 * Review verification status
 */
export type ReviewVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

/**
 * Review flag reason enum
 */
export type ReviewFlagReason =
  | "INAPPROPRIATE"
  | "SPAM"
  | "FAKE"
  | "OFFENSIVE"
  | "DISCRIMINATORY"
  | "OTHER";

// ============================================================
// BASE REVIEW TYPES
// ============================================================

/**
 * Review interface
 */
export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string;
  images: string[];
  isPublic: boolean;
  isVerified: boolean;
  status: ReviewStatus;
  verificationStatus: ReviewVerificationStatus;
  flaggedAt: Date | null;
  flagReason: ReviewFlagReason | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review with reviewer details
 */
export interface ReviewWithReviewer extends Review {
  reviewer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
}

/**
 * Review with provider details
 */
export interface ReviewWithProvider extends Review {
  provider: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
  };
}

/**
 * Review with booking details
 */
export interface ReviewWithBooking extends Review {
  booking: {
    id: string;
    bookingNumber: string;
    scheduledDate: Date;
    totalPrice: number;
  };
}

/**
 * Review with reviewer, provider, booking, and responses
 */
export interface ReviewWithRelations extends Review {
  reviewer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  provider: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    averageRating: number;
    totalReviews: number;
  };
  booking: {
    id: string;
    bookingNumber: string;
    scheduledDate: Date;
    totalPrice: number;
  };
  reviewResponses: ReviewResponse[];
}

// ============================================================
// REVIEW RESPONSE TYPES
// ============================================================

/**
 * Review response interface
 */
export interface ReviewResponse {
  id: string;
  reviewId: string;
  providerId: string;
  response: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review response with provider details
 */
export interface ReviewResponseWithProvider extends ReviewResponse {
  provider: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
  };
}

/**
 * Review response input
 */
export interface ReviewResponseInput {
  reviewId: string;
  providerId: string;
  response: string;
}

/**
 * Review response update input
 */
export interface ReviewResponseUpdateInput {
  response: string;
}

// ============================================================
// REVIEW CRUD TYPES
// ============================================================

/**
 * Review creation input
 */
export interface ReviewCreateInput {
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string;
  images?: string[];
  isPublic?: boolean;
}

/**
 * Review update input
 */
export interface ReviewUpdateInput {
  rating?: number;
  comment?: string;
  images?: string[];
  isPublic?: boolean;
}

/**
 * Review verification input
 */
export interface ReviewVerificationInput {
  reviewId: string;
  isVerified: boolean;
}

/**
 * Review flag input
 */
export interface ReviewFlagInput {
  reviewId: string;
  reason: ReviewFlagReason;
  note?: string;
}

// ============================================================
// REVIEW FILTERS AND QUERIES
// ============================================================

/**
 * Review filter parameters
 */
export interface ReviewFilters {
  providerId?: string;
  reviewerId?: string;
  bookingId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
  isVerified?: boolean;
  status?: ReviewStatus;
  verificationStatus?: ReviewVerificationStatus;
  flagged?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  createdAtStart?: Date;
  createdAtEnd?: Date;
}

/**
 * Review sort options
 */
export interface ReviewSortOptions {
  field: "createdAt" | "rating" | "updatedAt" | "reviewerId" | "providerId";
  order: "asc" | "desc";
}

/**
 * Review pagination parameters
 */
export interface ReviewPaginationParams {
  page: number;
  limit: number;
  filters?: ReviewFilters;
  sort?: ReviewSortOptions;
}

/**
 * Provider review filter parameters
 */
export interface ProviderReviewFilters {
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
  isVerified?: boolean;
  search?: string;
}

/**
 * Admin review filter parameters
 */
export interface AdminReviewFilters {
  providerId?: string;
  reviewerId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isVerified?: boolean;
  status?: ReviewStatus;
  flagged?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// ============================================================
// PROVIDER RATING STATISTICS TYPES
// ============================================================

/**
 * Provider rating distribution
 */
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

/**
 * Provider rating statistics
 */
export interface ProviderRatingStats {
  providerId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  ratingTrend: Array<{
    date: string;
    average: number;
    count: number;
  }>;
  recentReviews: Review[];
}

/**
 * Provider rating summary
 */
export interface ProviderRatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  recommendationRate: number; // Percentage of 4-5 star reviews
  responseRate: number; // Percentage of reviews with provider response
  averageResponseTime: number | null; // Average time to respond to reviews in hours
}

// ============================================================
// REVIEW STATISTICS TYPES
// ============================================================

/**
 * Review statistics
 */
export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  reviewsByRating: Record<number, number>;
  verifiedReviews: number;
  unverifiedReviews: number;
  reviewsWithImages: number;
  reviewsWithResponses: number;
  flaggedReviews: number;
  reviewsByDay: Array<{ date: string; count: number; average: number }>;
  reviewsByMonth: Array<{ month: string; count: number; average: number }>;
}

/**
 * Provider review statistics
 */
export interface ProviderReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: Review[];
  responseRate: number;
}

// ============================================================
// REVIEW NOTIFICATION TYPES
// ============================================================

/**
 * Review notification data
 */
export interface ReviewNotificationData {
  reviewId: string;
  bookingId: string;
  providerId: string;
  reviewerId: string;
  providerName: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

/**
 * Review response notification data
 */
export interface ReviewResponseNotificationData {
  reviewId: string;
  providerId: string;
  reviewerId: string;
  providerName: string;
  reviewerName: string;
  response: string;
  createdAt: Date;
}

// ============================================================
// REVIEW RESPONSE TYPES
// ============================================================

/**
 * Review list response
 */
export interface ReviewListResponse {
  data: ReviewWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats?: ProviderRatingStats;
}

/**
 * Provider review list response
 */
export interface ProviderReviewListResponse {
  data: ReviewWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: ProviderRatingStats;
}

/**
 * Admin review list response
 */
export interface AdminReviewListResponse {
  data: ReviewWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalReviews: number;
    averageRating: number;
    verifiedReviews: number;
    unverifiedReviews: number;
    flaggedReviews: number;
    ratingDistribution: RatingDistribution;
  };
}

/**
 * Review detail response
 */
export interface ReviewDetailResponse {
  review: ReviewWithRelations;
  stats?: ProviderRatingStats;
}

// ============================================================
// REVIEW EXPORT TYPES
// ============================================================

/**
 * Review export data
 */
export interface ReviewExportData {
  id: string;
  bookingNumber: string;
  reviewerName: string;
  providerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  hasResponse: boolean;
  responseText: string | null;
}

/**
 * Review export options
 */
export interface ReviewExportOptions {
  providerId?: string;
  startDate?: Date;
  endDate?: Date;
  format: "csv" | "json" | "excel";
}

// ============================================================
// REVIEW HELPER TYPES
// ============================================================

/**
 * Review eligibility check
 */
export interface ReviewEligibility {
  canReview: boolean;
  reason?: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  isCompleted: boolean;
  hasExistingReview: boolean;
}

/**
 * Review validation result
 */
export interface ReviewValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Review rating breakdown
 */
export interface RatingBreakdown {
  total: number;
  average: number;
  distribution: RatingDistribution;
  percentagePositive: number; // 4-5 stars
  percentageNeutral: number; // 3 stars
  percentageNegative: number; // 1-2 stars
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Enums
  ReviewStatus,
  ReviewVerificationStatus,
  ReviewFlagReason,

  // Base types
  Review,
  ReviewWithReviewer,
  ReviewWithProvider,
  ReviewWithBooking,
  ReviewWithRelations,

  // Response types
  ReviewResponse,
  ReviewResponseWithProvider,
  ReviewResponseInput,
  ReviewResponseUpdateInput,

  // CRUD types
  ReviewCreateInput,
  ReviewUpdateInput,
  ReviewVerificationInput,
  ReviewFlagInput,

  // Filter types
  ReviewFilters,
  ReviewSortOptions,
  ReviewPaginationParams,
  ProviderReviewFilters,
  AdminReviewFilters,

  // Statistics types
  RatingDistribution,
  ProviderRatingStats,
  ProviderRatingSummary,
  ReviewStatistics,
  ProviderReviewStats,

  // Notification types
  ReviewNotificationData,
  ReviewResponseNotificationData,

  // Response types
  ReviewListResponse,
  ProviderReviewListResponse,
  AdminReviewListResponse,
  ReviewDetailResponse,

  // Export types
  ReviewExportData,
  ReviewExportOptions,

  // Helper types
  ReviewEligibility,
  ReviewValidationResult,
  RatingBreakdown,
};
