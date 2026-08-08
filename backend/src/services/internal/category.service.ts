import { Category } from "@prisma/client";
import {
  createCategory as createCategoryRepo,
  findCategoryById,
  findCategoryBySlug,
  getCategories,
  getActiveCategories,
  getRootCategories,
  getChildCategories,
  getCategoryTree,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
  bulkUpdateCategoryOrder,
  getCategoryCount,
  getActiveCategoryCount,
  categoryExists,
  slugExists,
  getCategoriesWithChildCount,
  CategoryCreateData,
  CategoryUpdateData,
  CategoryWithChildren,
  CategoryWithParent,
  CategoryTree,
} from "../../repositories/category.repository";
import { createNotification } from "../../repositories/notification.repository";
import logger from "../../utils/logger";
import {
  validateRequired,
  isValidLength,
  isValidSlug,
} from "../../utils/validator";

// ============================================================
// TYPES
// ============================================================

export interface CreateCategoryData {
  name: string;
  nameAm?: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  nameAm?: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoryFilter {
  search?: string;
  parentId?: string | null;
  isActive?: boolean;
  name?: string;
  slug?: string;
}

export interface BulkCategoryOrderUpdate {
  id: string;
  displayOrder: number;
}

// ============================================================
// CATEGORY SERVICE
// ============================================================

/**
 * Create a new category
 */
export async function createCategory(
  data: CreateCategoryData,
): Promise<Category> {
  try {
    // Validate required fields
    if (!data.name || data.name.length < 2) {
      throw new Error("Category name must be at least 2 characters");
    }

    if (data.name.length > 50) {
      throw new Error("Category name must not exceed 50 characters");
    }

    // Generate slug if not provided
    let slug = data.slug;
    if (!slug) {
      slug = generateSlug(data.name);
    }

    // Validate slug
    if (!isValidSlug(slug)) {
      throw new Error(
        "Invalid slug format. Use lowercase letters, numbers, and hyphens only.",
      );
    }

    // Check if slug already exists
    const slugExistsResult = await slugExists(slug);
    if (slugExistsResult) {
      throw new Error(`Category with slug "${slug}" already exists`);
    }

    // If parentId is provided, verify it exists
    if (data.parentId) {
      const parent = await findCategoryById(data.parentId);
      if (!parent) {
        throw new Error(`Parent category with id "${data.parentId}" not found`);
      }
    }

    // Create category
    const categoryData: CategoryCreateData = {
      name: data.name.trim(),
      nameAm: data.nameAm ? data.nameAm.trim() : undefined,
      slug,
      description: data.description ? data.description.trim() : undefined,
      icon: data.icon ? data.icon.trim() : undefined,
      image: data.image ? data.image.trim() : undefined,
      parentId: data.parentId || null,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    const category = await createCategoryRepo(categoryData);

    logger.info(`Category created: ${category.id} (${category.name})`);

    return category;
  } catch (error) {
    logger.error("Create category failed:", error);
    throw error;
  }
}

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Get category by ID
 */
export async function getCategoryById(
  id: string,
): Promise<CategoryWithParent | null> {
  try {
    const category = await findCategoryById(id);
    if (!category) {
      return null;
    }
    return category;
  } catch (error) {
    logger.error(`Get category ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryWithParent | null> {
  try {
    return await findCategoryBySlug(slug);
  } catch (error) {
    logger.error(`Get category by slug ${slug} failed:`, error);
    throw error;
  }
}

/**
 * Get categories with filters and pagination
 */
export async function getCategoryList(
  filters: CategoryFilter = {},
  page: number = 1,
  limit: number = 20,
  sortBy: string = "displayOrder",
  sortOrder: "asc" | "desc" = "asc",
): Promise<{
  data: CategoryWithParent[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    return await getCategories(filters, page, limit, sortBy, sortOrder);
  } catch (error) {
    logger.error("Get category list failed:", error);
    throw error;
  }
}

/**
 * Get all active categories (for dropdowns)
 */
export async function getActiveCategoryList(): Promise<Category[]> {
  try {
    return await getActiveCategories();
  } catch (error) {
    logger.error("Get active category list failed:", error);
    throw error;
  }
}

/**
 * Get root categories
 */
export async function getRootCategoryList(): Promise<Category[]> {
  try {
    return await getRootCategories();
  } catch (error) {
    logger.error("Get root category list failed:", error);
    throw error;
  }
}

/**
 * Get child categories by parent ID
 */
export async function getChildCategoryList(
  parentId: string,
): Promise<Category[]> {
  try {
    return await getChildCategories(parentId);
  } catch (error) {
    logger.error(`Get child categories for ${parentId} failed:`, error);
    throw error;
  }
}

/**
 * Get full category tree
 */
export async function getCategoryHierarchy(): Promise<CategoryTree[]> {
  try {
    return await getCategoryTree();
  } catch (error) {
    logger.error("Get category hierarchy failed:", error);
    throw error;
  }
}

/**
 * Update category
 */
export async function updateCategoryById(
  id: string,
  data: UpdateCategoryData,
): Promise<Category> {
  try {
    // Check if category exists
    const existing = await findCategoryById(id);
    if (!existing) {
      throw new Error(`Category with id "${id}" not found`);
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (data.name.length < 2) {
        throw new Error("Category name must be at least 2 characters");
      }
      if (data.name.length > 50) {
        throw new Error("Category name must not exceed 50 characters");
      }
    }

    // Validate slug if provided
    if (data.slug) {
      if (!isValidSlug(data.slug)) {
        throw new Error(
          "Invalid slug format. Use lowercase letters, numbers, and hyphens only.",
        );
      }

      // Check if slug already exists (excluding current category)
      const slugExistsResult = await slugExists(data.slug, id);
      if (slugExistsResult) {
        throw new Error(`Category with slug "${data.slug}" already exists`);
      }
    }

    // Validate parentId if provided
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new Error("Category cannot be its own parent");
      }

      if (data.parentId) {
        const parent = await findCategoryById(data.parentId);
        if (!parent) {
          throw new Error(
            `Parent category with id "${data.parentId}" not found`,
          );
        }

        // Check for circular reference
        const isCircular = await checkCircularReference(id, data.parentId);
        if (isCircular) {
          throw new Error("Circular reference detected in category hierarchy");
        }
      }
    }

    const updateData: CategoryUpdateData = {
      name: data.name ? data.name.trim() : undefined,
      nameAm: data.nameAm ? data.nameAm.trim() : undefined,
      slug: data.slug,
      description: data.description ? data.description.trim() : undefined,
      icon: data.icon ? data.icon.trim() : undefined,
      image: data.image ? data.image.trim() : undefined,
      parentId: data.parentId !== undefined ? data.parentId : undefined,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    };

    const category = await updateCategory(id, updateData);

    logger.info(`Category ${id} updated`);

    return category;
  } catch (error) {
    logger.error(`Update category ${id} failed:`, error);
    throw error;
  }
}

/**
 * Check for circular reference in category hierarchy
 */
async function checkCircularReference(
  categoryId: string,
  newParentId: string,
): Promise<boolean> {
  let currentId = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === categoryId) {
      return true;
    }

    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);

    const parent = await findCategoryById(currentId);
    if (!parent || !parent.parentId) {
      break;
    }

    currentId = parent.parentId;
  }

  return false;
}

/**
 * Delete category (soft delete)
 */
export async function deleteCategoryById(id: string): Promise<Category> {
  try {
    // Check if category exists
    const existing = await findCategoryById(id);
    if (!existing) {
      throw new Error(`Category with id "${id}" not found`);
    }

    // Check if category has children
    const childCount = await getChildCategoryCount(id);
    if (childCount > 0) {
      throw new Error(
        "Cannot delete category with child categories. Delete children first or reassign them.",
      );
    }

    const category = await deleteCategory(id);

    logger.info(`Category ${id} deleted (soft delete)`);

    return category;
  } catch (error) {
    logger.error(`Delete category ${id} failed:`, error);
    throw error;
  }
}

/**
 * Hard delete category
 */
export async function hardDeleteCategoryById(id: string): Promise<Category> {
  try {
    // Check if category exists
    const existing = await findCategoryById(id);
    if (!existing) {
      throw new Error(`Category with id "${id}" not found`);
    }

    // Check if category has children
    const childCount = await getChildCategoryCount(id);
    if (childCount > 0) {
      throw new Error(
        "Cannot delete category with child categories. Delete children first or reassign them.",
      );
    }

    const category = await hardDeleteCategory(id);

    logger.info(`Category ${id} permanently deleted`);

    return category;
  } catch (error) {
    logger.error(`Hard delete category ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get child category count
 */
export async function getChildCategoryCount(
  categoryId: string,
): Promise<number> {
  try {
    const children = await getChildCategories(categoryId);
    return children.length;
  } catch (error) {
    logger.error(`Get child category count for ${categoryId} failed:`, error);
    throw error;
  }
}

/**
 * Bulk update category display order
 */
export async function bulkUpdateCategoryOrder(
  updates: BulkCategoryOrderUpdate[],
): Promise<Category[]> {
  try {
    if (!updates || updates.length === 0) {
      throw new Error("No updates provided");
    }

    // Validate all categories exist
    for (const update of updates) {
      const exists = await categoryExists(update.id);
      if (!exists) {
        throw new Error(`Category with id "${update.id}" not found`);
      }

      if (update.displayOrder < 0) {
        throw new Error("Display order cannot be negative");
      }
    }

    const categories = await bulkUpdateCategoryOrder(updates);

    logger.info(`Bulk updated ${categories.length} categories order`);

    return categories;
  } catch (error) {
    logger.error("Bulk update category order failed:", error);
    throw error;
  }
}

/**
 * Get category statistics
 */
export async function getCategoryStatistics(): Promise<{
  totalCategories: number;
  activeCategories: number;
  rootCategories: number;
  categoriesWithChildren: number;
}> {
  try {
    const [total, active, root, withChildren] = await Promise.all([
      getCategoryCount(),
      getActiveCategoryCount(),
      getRootCategories().then((categories) => categories.length),
      getCategoriesWithChildCount(null).then(
        (categories) => categories.filter((c) => c.childCount > 0).length,
      ),
    ]);

    return {
      totalCategories: total,
      activeCategories: active,
      rootCategories: root,
      categoriesWithChildren: withChildren,
    };
  } catch (error) {
    logger.error("Get category statistics failed:", error);
    throw error;
  }
}

/**
 * Get categories with child count
 */
export async function getCategoriesWithChildrenCount(): Promise<
  Array<Category & { childCount: number }>
> {
  try {
    return await getCategoriesWithChildCount(null);
  } catch (error) {
    logger.error("Get categories with child count failed:", error);
    throw error;
  }
}

/**
 * Check if category exists
 */
export async function checkCategoryExists(id: string): Promise<boolean> {
  return await categoryExists(id);
}

/**
 * Check if slug exists
 */
export async function checkSlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  return await slugExists(slug, excludeId);
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string): {
  isValid: boolean;
  message?: string;
} {
  if (!name) {
    return { isValid: false, message: "Category name is required" };
  }

  if (name.length < 2) {
    return {
      isValid: false,
      message: "Category name must be at least 2 characters",
    };
  }

  if (name.length > 50) {
    return {
      isValid: false,
      message: "Category name must not exceed 50 characters",
    };
  }

  return { isValid: true };
}

/**
 * Validate category slug
 */
export function validateCategorySlug(slug: string): {
  isValid: boolean;
  message?: string;
} {
  if (!slug) {
    return { isValid: false, message: "Category slug is required" };
  }

  if (!isValidSlug(slug)) {
    return {
      isValid: false,
      message:
        "Invalid slug format. Use lowercase letters, numbers, and hyphens only.",
    };
  }

  return { isValid: true };
}

/**
 * Validate category hierarchy
 */
export async function validateCategoryHierarchy(
  categoryId: string,
  parentId: string | null,
): Promise<{ isValid: boolean; message?: string }> {
  if (!parentId) {
    return { isValid: true };
  }

  if (parentId === categoryId) {
    return { isValid: false, message: "Category cannot be its own parent" };
  }

  const parent = await findCategoryById(parentId);
  if (!parent) {
    return {
      isValid: false,
      message: `Parent category with id "${parentId}" not found`,
    };
  }

  // Check for circular reference
  const isCircular = await checkCircularReference(categoryId, parentId);
  if (isCircular) {
    return {
      isValid: false,
      message: "Circular reference detected in category hierarchy",
    };
  }

  return { isValid: true };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createCategory,
  generateSlug,
  getCategoryById,
  getCategoryBySlug,
  getCategoryList,
  getActiveCategoryList,
  getRootCategoryList,
  getChildCategoryList,
  getCategoryHierarchy,
  updateCategoryById,
  deleteCategoryById,
  hardDeleteCategoryById,
  getChildCategoryCount,
  bulkUpdateCategoryOrder,
  getCategoryStatistics,
  getCategoriesWithChildrenCount,
  checkCategoryExists,
  checkSlugExists,
  validateCategoryName,
  validateCategorySlug,
  validateCategoryHierarchy,
};
