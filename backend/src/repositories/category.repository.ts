import { Prisma, Category } from "@prisma/client";
import prisma from "../config/database";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface CategoryFilters {
  search?: string;
  parentId?: string | null;
  isActive?: boolean;
  name?: string;
  slug?: string;
}

export interface CategoryCreateData {
  name: string;
  nameAm?: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoryUpdateData {
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

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  parent?: {
    id: string;
    name: string;
    nameAm: string | null;
    slug: string;
  } | null;
}

export interface CategoryWithParent extends Category {
  parent?: {
    id: string;
    name: string;
    nameAm: string | null;
    slug: string;
  } | null;
}

export interface CategoryTree {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  children: CategoryTree[];
}

// ============================================================
// CATEGORY REPOSITORY
// ============================================================

/**
 * Generate slug from category name
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
 * Create a new category
 */
export async function createCategory(
  data: CategoryCreateData,
): Promise<Category> {
  try {
    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (existing) {
      throw new Error(`Category with slug "${data.slug}" already exists`);
    }

    // If parentId is provided, verify it exists
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
        select: { id: true },
      });
      if (!parent) {
        throw new Error(`Parent category with id "${data.parentId}" not found`);
      }
    }

    return await prisma.category.create({
      data: {
        name: data.name,
        nameAm: data.nameAm,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        image: data.image,
        parentId: data.parentId || null,
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  } catch (error) {
    logger.error("Create category failed:", error);
    throw error;
  }
}

/**
 * Find category by ID
 */
export async function findCategoryById(
  id: string,
): Promise<CategoryWithParent | null> {
  try {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            nameAm: true,
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Find category ${id} failed:`, error);
    throw error;
  }
}

/**
 * Find category by slug
 */
export async function findCategoryBySlug(
  slug: string,
): Promise<CategoryWithParent | null> {
  try {
    return await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            nameAm: true,
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Find category by slug ${slug} failed:`, error);
    throw error;
  }
}

/**
 * Get categories with filters and pagination
 */
export async function getCategories(
  filters: CategoryFilters = {},
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
    const where: Prisma.CategoryWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { nameAm: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.name) {
      where.name = { contains: filters.name, mode: "insensitive" };
    }

    if (filters.slug) {
      where.slug = filters.slug;
    }

    const totalItems = await prisma.category.count({ where });

    const skip = (page - 1) * limit;
    const data = await prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            nameAm: true,
            slug: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalItems / limit);
    const pagination = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, pagination };
  } catch (error) {
    logger.error("Get categories failed:", error);
    throw error;
  }
}

/**
 * Get all active categories (for dropdowns)
 */
export async function getActiveCategories(): Promise<Category[]> {
  try {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  } catch (error) {
    logger.error("Get active categories failed:", error);
    throw error;
  }
}

/**
 * Get root categories (parent is null)
 */
export async function getRootCategories(): Promise<Category[]> {
  try {
    return await prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  } catch (error) {
    logger.error("Get root categories failed:", error);
    throw error;
  }
}

/**
 * Get child categories by parent ID
 */
export async function getChildCategories(
  parentId: string,
): Promise<Category[]> {
  try {
    return await prisma.category.findMany({
      where: {
        parentId: parentId,
        isActive: true,
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  } catch (error) {
    logger.error(`Get child categories for ${parentId} failed:`, error);
    throw error;
  }
}

/**
 * Get category with all children (tree)
 */
export async function getCategoryTree(): Promise<CategoryTree[]> {
  try {
    // Get all categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    // Build tree
    const categoryMap = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    // First pass: create nodes
    categories.forEach((category) => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        nameAm: category.nameAm,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        image: category.image,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
        children: [],
      });
    });

    // Second pass: build parent-child relationships
    categories.forEach((category) => {
      const node = categoryMap.get(category.id)!;
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort children by displayOrder
    roots.forEach((root) => {
      sortCategoryChildren(root);
    });

    return roots;
  } catch (error) {
    logger.error("Get category tree failed:", error);
    throw error;
  }
}

/**
 * Sort category children recursively by displayOrder
 */
export function sortCategoryChildren(category: CategoryTree): void {
  category.children.sort((a, b) => a.displayOrder - b.displayOrder);
  category.children.forEach((child) => sortCategoryChildren(child));
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  data: CategoryUpdateData,
): Promise<Category> {
  try {
    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error(`Category with id "${id}" not found`);
    }

    // If slug is being updated, check uniqueness
    if (data.slug) {
      const slugExists = await prisma.category.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
        select: { id: true },
      });

      if (slugExists) {
        throw new Error(`Category with slug "${data.slug}" already exists`);
      }
    }

    // If parentId is being updated, verify it exists and is not itself
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new Error("Category cannot be its own parent");
      }

      if (data.parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: data.parentId },
          select: { id: true },
        });
        if (!parent) {
          throw new Error(
            `Parent category with id "${data.parentId}" not found`,
          );
        }
      }
    }

    return await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        nameAm: data.nameAm,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        image: data.image,
        parentId: data.parentId !== undefined ? data.parentId : undefined,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
    });
  } catch (error) {
    logger.error(`Update category ${id} failed:`, error);
    throw error;
  }
}

/**
 * Delete category (soft delete)
 */
export async function deleteCategory(id: string): Promise<Category> {
  try {
    // Check if category has children
    const childCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw new Error(
        "Cannot delete category with child categories. Delete children first or reassign them.",
      );
    }

    return await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    logger.error(`Delete category ${id} failed:`, error);
    throw error;
  }
}

/**
 * Hard delete category
 */
export async function hardDeleteCategory(id: string): Promise<Category> {
  try {
    // Check if category has children
    const childCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw new Error("Cannot delete category with child categories");
    }

    return await prisma.category.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Hard delete category ${id} failed:`, error);
    throw error;
  }
}

/**
 * Bulk update category display order
 */
export async function bulkUpdateCategoryOrder(
  updates: { id: string; displayOrder: number }[],
): Promise<Category[]> {
  try {
    const results: Category[] = [];

    for (const update of updates) {
      const category = await prisma.category.update({
        where: { id: update.id },
        data: { displayOrder: update.displayOrder },
      });
      results.push(category);
    }

    logger.info(`Bulk updated ${results.length} categories order`);

    return results;
  } catch (error) {
    logger.error("Bulk update category order failed:", error);
    throw error;
  }
}

/**
 * Get category count
 */
export async function getCategoryCount(): Promise<number> {
  try {
    return await prisma.category.count();
  } catch (error) {
    logger.error("Get category count failed:", error);
    throw error;
  }
}

/**
 * Get active category count
 */
export async function getActiveCategoryCount(): Promise<number> {
  try {
    return await prisma.category.count({
      where: { isActive: true },
    });
  } catch (error) {
    logger.error("Get active category count failed:", error);
    throw error;
  }
}

/**
 * Check if category exists
 */
export async function categoryExists(id: string): Promise<boolean> {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!category;
  } catch (error) {
    logger.error(`Check category exists ${id} failed:`, error);
    return false;
  }
}

/**
 * Check if slug exists
 */
export async function slugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    const where: Prisma.CategoryWhereInput = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const category = await prisma.category.findFirst({
      where,
      select: { id: true },
    });
    return !!category;
  } catch (error) {
    logger.error(`Check slug exists ${slug} failed:`, error);
    return false;
  }
}

/**
 * Get categories by parent ID with children count
 */
export async function getCategoriesWithChildCount(
  parentId: string | null = null,
): Promise<Array<Category & { childCount: number }>> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parentId: parentId,
        isActive: true,
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    const result = await Promise.all(
      categories.map(async (category) => {
        const childCount = await prisma.category.count({
          where: {
            parentId: category.id,
            isActive: true,
          },
        });
        return {
          ...category,
          childCount,
        };
      }),
    );

    return result;
  } catch (error) {
    logger.error("Get categories with child count failed:", error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  generateSlug,
  createCategory,
  findCategoryById,
  findCategoryBySlug,
  getCategories,
  getActiveCategories,
  getRootCategories,
  getChildCategories,
  getCategoryTree,
  sortCategoryChildren,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
  bulkUpdateCategoryOrder,
  getCategoryCount,
  getActiveCategoryCount,
  categoryExists,
  slugExists,
  getCategoriesWithChildCount,
};
