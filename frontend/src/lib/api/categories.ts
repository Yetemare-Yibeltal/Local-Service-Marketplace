'use client';

import { getApiClient } from './client';

// ============================================================
// TYPES
// ============================================================

export interface Category {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: Category[];
  childCount?: number;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface CreateCategoryData {
  name: string;
  nameAm?: string | null;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  nameAm?: string | null;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoryFilters {
  search?: string;
  parentId?: string | null;
  isActive?: boolean;
  name?: string;
  slug?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkCategoryUpdate {
  id: string;
  displayOrder?: number;
  isActive?: boolean;
  name?: string;
  slug?: string;
  parentId?: string | null;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  rootCategories: number;
  categoriesWithChildren: number;
  maxDepth: number;
  averageChildrenPerCategory: number;
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
// API FUNCTIONS
// ============================================================

/**
 * Create a new category (admin only)
 */
export async function createCategory(data: CreateCategoryData): Promise<Category> {
  const client = getApiClient();
  const response = await client.post<{ data: Category }>('/categories', {
    name: data.name,
    nameAm: data.nameAm || null,
    slug: data.slug,
    description: data.description || null,
    icon: data.icon || null,
    image: data.image || null,
    parentId: data.parentId || null,
    displayOrder: data.displayOrder || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });
  return response.data;
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category> {
  const client = getApiClient();
  const response = await client.get<{ data: Category }>(`/categories/${id}`);
  return response.data;
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category> {
  const client = getApiClient();
  const response = await client.get<{ data: Category }>(`/categories/slug/${slug}`);
  return response.data;
}

/**
 * Get categories with filters and pagination
 */
export async function getCategories(
  filters: CategoryFilters = {}
): Promise<PaginatedResponse<Category>> {
  const client = getApiClient();
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.parentId !== undefined) params.append('parentId', filters.parentId || '');
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  if (filters.name) params.append('name', filters.name);
  if (filters.slug) params.append('slug', filters.slug);
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 20).toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await client.get<{ data: Category[]; pagination: any }>(
    `/categories?${params.toString()}`
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
 * Get all active categories (for dropdowns)
 */
export async function getActiveCategories(): Promise<Category[]> {
  const client = getApiClient();
  const response = await client.get<{ data: Category[] }>('/categories/active');
  return response.data || [];
}

/**
 * Get root categories (no parent)
 */
export async function getRootCategories(): Promise<Category[]> {
  const client = getApiClient();
  const response = await client.get<{ data: Category[] }>('/categories/root');
  return response.data || [];
}

/**
 * Get child categories by parent ID
 */
export async function getChildCategories(parentId: string): Promise<Category[]> {
  const client = getApiClient();
  const response = await client.get<{ data: Category[] }>(`/categories/${parentId}/children`);
  return response.data || [];
}

/**
 * Get full category tree
 */
export async function getCategoryTree(): Promise<CategoryTree[]> {
  const client = getApiClient();
  const response = await client.get<{ data: CategoryTree[] }>('/categories/tree');
  return response.data || [];
}

/**
 * Get category breadcrumb path
 */
export async function getCategoryBreadcrumb(id: string): Promise<Category[]> {
  const client = getApiClient();
  const response = await client.get<{ data: Category[] }>(`/categories/${id}/breadcrumb`);
  return response.data || [];
}

/**
 * Get category descendants (all children, grandchildren, etc.)
 */
export async function getCategoryDescendants(id: string): Promise<Category[]> {
  const client = getApiClient();
  const response = await client.get<{ data: Category[] }>(`/categories/${id}/descendants`);
  return response.data || [];
}

/**
 * Get subcategory tree for a specific parent
 */
export async function getSubCategoryTree(parentId: string): Promise<CategoryTree[]> {
  const client = getApiClient();
  const response = await client.get<{ data: CategoryTree[] }>(`/categories/${parentId}/subtree`);
  return response.data || [];
}

/**
 * Update category (admin only)
 */
export async function updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
  const client = getApiClient();
  const response = await client.put<{ data: Category }>(`/categories/${id}`, {
    name: data.name,
    nameAm: data.nameAm,
    slug: data.slug,
    description: data.description,
    icon: data.icon,
    image: data.image,
    parentId: data.parentId !== undefined ? data.parentId : null,
    displayOrder: data.displayOrder,
    isActive: data.isActive,
  });
  return response.data;
}

/**
 * Delete category (soft delete) - admin only
 */
export async function deleteCategory(id: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/categories/${id}`);
}

/**
 * Permanently delete category - admin only
 */
export async function hardDeleteCategory(id: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/categories/${id}/permanent`);
}

/**
 * Bulk update category display order - admin only
 */
export async function bulkUpdateCategories(updates: BulkCategoryUpdate[]): Promise<Category[]> {
  const client = getApiClient();
  const response = await client.put<{ data: Category[] }>('/categories/bulk/order', {
    categories: updates.map((u) => ({
      id: u.id,
      displayOrder: u.displayOrder,
      isActive: u.isActive,
      name: u.name,
      slug: u.slug,
      parentId: u.parentId,
    })),
  });
  return response.data || [];
}

/**
 * Get category statistics - admin only
 */
export async function getCategoryStats(): Promise<CategoryStats> {
  const client = getApiClient();
  const response = await client.get<{ data: CategoryStats }>('/categories/stats');
  return response.data;
}

/**
 * Get categories with child count
 */
export async function getCategoriesWithChildCount(): Promise<
  Array<Category & { childCount: number }>
> {
  const client = getApiClient();
  const response = await client.get<{ data: Array<Category & { childCount: number }> }>(
    '/categories/with-count'
  );
  return response.data || [];
}

/**
 * Validate category name
 */
export async function validateCategoryName(
  name: string
): Promise<{ isValid: boolean; message?: string }> {
  const client = getApiClient();
  return await client.get<{ isValid: boolean; message?: string }>(
    `/categories/validate/name?name=${encodeURIComponent(name)}`
  );
}

/**
 * Validate category slug
 */
export async function validateCategorySlug(
  slug: string
): Promise<{ isValid: boolean; message?: string }> {
  const client = getApiClient();
  return await client.get<{ isValid: boolean; message?: string }>(
    `/categories/validate/slug?slug=${encodeURIComponent(slug)}`
  );
}

/**
 * Check if slug already exists
 */
export async function checkSlugExists(
  slug: string,
  excludeId?: string
): Promise<{ exists: boolean }> {
  const client = getApiClient();
  const params = new URLSearchParams();
  params.append('slug', slug);
  if (excludeId) params.append('excludeId', excludeId);
  return await client.get<{ exists: boolean }>(`/categories/check-slug?${params.toString()}`);
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  createCategory,
  getCategoryById,
  getCategoryBySlug,
  getCategories,
  getActiveCategories,
  getRootCategories,
  getChildCategories,
  getCategoryTree,
  getCategoryBreadcrumb,
  getCategoryDescendants,
  getSubCategoryTree,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
  bulkUpdateCategories,
  getCategoryStats,
  getCategoriesWithChildCount,
  validateCategoryName,
  validateCategorySlug,
  checkSlugExists,
};
