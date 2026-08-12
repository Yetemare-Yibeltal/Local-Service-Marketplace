// ============================================================
// CATEGORY TYPES
// Complete category type definitions for the application
// ============================================================

// ============================================================
// ENUMS
// ============================================================

/**
 * Category status enum
 */
export type CategoryStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

/**
 * Category icon types
 */
export type CategoryIcon =
  | "PLUMBING"
  | "ELECTRICAL"
  | "CLEANING"
  | "TUTORING"
  | "PHOTOGRAPHY"
  | "MECHANIC"
  | "CARPENTRY"
  | "PAINTING"
  | "GARDENING"
  | "MOVING"
  | "OTHER";

/**
 * Category icon mapping
 */
export const CategoryIconMap: Record<CategoryIcon, string> = {
  PLUMBING: "🔧",
  ELECTRICAL: "⚡",
  CLEANING: "🧹",
  TUTORING: "📚",
  PHOTOGRAPHY: "📷",
  MECHANIC: "🔩",
  CARPENTRY: "🪵",
  PAINTING: "🎨",
  GARDENING: "🌿",
  MOVING: "🚚",
  OTHER: "📌",
};

// ============================================================
// BASE CATEGORY TYPES
// ============================================================

/**
 * Category interface
 */
export interface Category {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
  description: string | null;
  icon: CategoryIcon | null;
  image: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category with parent
 */
export interface CategoryWithParent extends Category {
  parent: {
    id: string;
    name: string;
    nameAm: string | null;
    slug: string;
  } | null;
}

/**
 * Category with children
 */
export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
  parent: {
    id: string;
    name: string;
    nameAm: string | null;
    slug: string;
  } | null;
}

/**
 * Category tree node
 */
export interface CategoryTreeNode {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
  description: string | null;
  icon: CategoryIcon | null;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  children: CategoryTreeNode[];
  itemCount?: number;
}

/**
 * Category with stats
 */
export interface CategoryWithStats extends Category {
  childCount: number;
  providerCount: number;
  bookingCount: number;
  revenue: number;
}

// ============================================================
// CATEGORY CRUD TYPES
// ============================================================

/**
 * Category creation input
 */
export interface CategoryCreateInput {
  name: string;
  nameAm?: string;
  slug?: string;
  description?: string;
  icon?: CategoryIcon;
  image?: string;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Category update input
 */
export interface CategoryUpdateInput {
  name?: string;
  nameAm?: string;
  slug?: string;
  description?: string;
  icon?: CategoryIcon;
  image?: string;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Category slug generation input
 */
export interface CategorySlugInput {
  name: string;
  existingId?: string;
}

/**
 * Category bulk update input
 */
export interface CategoryBulkUpdateInput {
  categories: Array<{
    id: string;
    displayOrder?: number;
    isActive?: boolean;
    name?: string;
    slug?: string;
    parentId?: string | null;
  }>;
}

/**
 * Category hierarchy update input
 */
export interface CategoryHierarchyUpdateInput {
  parentId: string | null;
  children: Array<{
    id: string;
    displayOrder: number;
  }>;
}

// ============================================================
// CATEGORY FILTERS AND QUERIES
// ============================================================

/**
 * Category filter parameters
 */
export interface CategoryFilters {
  search?: string;
  parentId?: string | null;
  isActive?: boolean;
  name?: string;
  slug?: string;
  hasChildren?: boolean;
  hasProviders?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Category sort options
 */
export interface CategorySortOptions {
  field: "name" | "displayOrder" | "createdAt" | "updatedAt" | "slug";
  order: "asc" | "desc";
}

/**
 * Category pagination parameters
 */
export interface CategoryPaginationParams {
  page: number;
  limit: number;
  filters?: CategoryFilters;
  sort?: CategorySortOptions;
}

/**
 * Category tree options
 */
export interface CategoryTreeOptions {
  includeInactive?: boolean;
  includeCounts?: boolean;
  maxDepth?: number;
  filter?: CategoryFilters;
}

// ============================================================
// CATEGORY VALIDATION TYPES
// ============================================================

/**
 * Category validation result
 */
export interface CategoryValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Category hierarchy validation
 */
export interface CategoryHierarchyValidation {
  isValid: boolean;
  circularReference: boolean;
  maxDepthExceeded: boolean;
  errors: string[];
  path: string[];
}

/**
 * Category uniqueness check
 */
export interface CategoryUniquenessCheck {
  exists: boolean;
  field: "name" | "slug" | "both";
  existingId?: string;
}

// ============================================================
// CATEGORY STATISTICS TYPES
// ============================================================

/**
 * Category statistics
 */
export interface CategoryStatistics {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  rootCategories: number;
  categoriesWithChildren: number;
  categoriesWithoutChildren: number;
  maxDepth: number;
  averageChildrenPerCategory: number;
  mostBookedCategories: Array<{
    id: string;
    name: string;
    bookings: number;
  }>;
  topRevenueCategories: Array<{
    id: string;
    name: string;
    revenue: number;
  }>;
  categoriesByLevel: Array<{
    level: number;
    count: number;
  }>;
}

/**
 * Category provider statistics
 */
export interface CategoryProviderStats {
  categoryId: string;
  categoryName: string;
  totalProviders: number;
  verifiedProviders: number;
  activeProviders: number;
  averageRating: number;
  totalBookings: number;
  totalRevenue: number;
}

// ============================================================
// CATEGORY RESPONSE TYPES
// ============================================================

/**
 * Category list response
 */
export interface CategoryListResponse {
  data: CategoryWithParent[];
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
 * Category tree response
 */
export interface CategoryTreeResponse {
  data: CategoryTreeNode[];
  total: number;
  depth: number;
}

/**
 * Category detail response
 */
export interface CategoryDetailResponse {
  category: CategoryWithParent;
  children: CategoryWithChildren[];
  breadcrumb: Category[];
  stats: {
    providerCount: number;
    bookingCount: number;
    revenue: number;
  };
}

/**
 * Category breadcrumb response
 */
export interface CategoryBreadcrumbResponse {
  categories: Category[];
  path: string[];
}

// ============================================================
// CATEGORY ANALYTICS TYPES
// ============================================================

/**
 * Category analytics data
 */
export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  growthRate: number;
  topProviders: Array<{
    providerId: string;
    businessName: string;
    bookings: number;
  }>;
  bookingTrend: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

/**
 * Category performance metrics
 */
export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  totalProviders: number;
  averageProviderRating: number;
  totalReviews: number;
  totalBookings: number;
  totalRevenue: number;
  completionRate: number;
  cancellationRate: number;
  customerSatisfaction: number;
}

// ============================================================
// CATEGORY EXPORT TYPES
// ============================================================

/**
 * Category export data
 */
export interface CategoryExportData {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
  description: string | null;
  icon: string | null;
  parentName: string | null;
  displayOrder: number;
  isActive: boolean;
  providerCount: number;
  bookingCount: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category export options
 */
export interface CategoryExportOptions {
  includeStats?: boolean;
  includeChildren?: boolean;
  format: "csv" | "json" | "excel";
}

// ============================================================
// CATEGORY SEARCH TYPES
// ============================================================

/**
 * Category search result
 */
export interface CategorySearchResult {
  category: Category;
  relevanceScore: number;
  matchedFields: string[];
}

/**
 * Category autocomplete result
 */
export interface CategoryAutocompleteResult {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
  icon: CategoryIcon | null;
}

// ============================================================
// CATEGORY CACHE TYPES
// ============================================================

/**
 * Category cache data
 */
export interface CategoryCache {
  categories: Category[];
  lastUpdated: Date;
  version: number;
}

/**
 * Category tree cache
 */
export interface CategoryTreeCache {
  tree: CategoryTreeNode[];
  lastUpdated: Date;
  version: number;
  depth: number;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Enums
  CategoryStatus,
  CategoryIcon,
  CategoryIconMap,

  // Base types
  Category,
  CategoryWithParent,
  CategoryWithChildren,
  CategoryTreeNode,
  CategoryWithStats,

  // CRUD types
  CategoryCreateInput,
  CategoryUpdateInput,
  CategorySlugInput,
  CategoryBulkUpdateInput,
  CategoryHierarchyUpdateInput,

  // Filter types
  CategoryFilters,
  CategorySortOptions,
  CategoryPaginationParams,
  CategoryTreeOptions,

  // Validation types
  CategoryValidationResult,
  CategoryHierarchyValidation,
  CategoryUniquenessCheck,

  // Statistics types
  CategoryStatistics,
  CategoryProviderStats,

  // Response types
  CategoryListResponse,
  CategoryTreeResponse,
  CategoryDetailResponse,
  CategoryBreadcrumbResponse,

  // Analytics types
  CategoryAnalytics,
  CategoryPerformance,

  // Export types
  CategoryExportData,
  CategoryExportOptions,

  // Search types
  CategorySearchResult,
  CategoryAutocompleteResult,

  // Cache types
  CategoryCache,
  CategoryTreeCache,
};

