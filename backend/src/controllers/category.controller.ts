import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import {
  createCategory,
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
  getCategoryBreadcrumb,
  getCategoryDescendants,
  getSubCategoryTree,
} from "../services/internal/category.service";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryFilterSchema,
  bulkCategoryUpdateSchema,
} from "../schemas/category.schema";
import { USER_ROLES } from "../utils/constants";
import logger from "../utils/logger";

// ============================================================
// CATEGORY CONTROLLER
// ============================================================

// ============================================================
// CREATE CATEGORY
// ============================================================

/**
 * Create a new category (admin only)
 * @route POST /api/v1/categories
 * @description Creates a new service category
 * @header Authorization: Bearer {accessToken}
 * @body { name, nameAm?, slug?, description?, icon?, image?, parentId?, displayOrder?, isActive? }
 * @returns { category } with 201 status
 */
export const createCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedData = createCategorySchema.parse(req.body);

    const category = await createCategory({
      name: validatedData.name,
      nameAm: validatedData.nameAm,
      slug: validatedData.slug,
      description: validatedData.description,
      icon: validatedData.icon,
      image: validatedData.image,
      parentId: validatedData.parentId,
      displayOrder: validatedData.displayOrder,
      isActive: validatedData.isActive,
    });

    sendSuccess(res, category, "Category created successfully", 201);
  },
);

// ============================================================
// GET CATEGORIES
// ============================================================

/**
 * Get category by ID
 * @route GET /api/v1/categories/:id
 * @description Retrieves a specific category by ID
 * @param {id} - Category ID
 * @returns { category } with 200 status
 */
export const getCategoryByIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = categoryIdParamSchema.parse(req.params);

    const category = await getCategoryById(validatedParams.id);

    if (!category) {
      sendError(res, "Category not found", 404);
      return;
    }

    sendSuccess(res, category, "Category retrieved successfully");
  },
);

/**
 * Get category by slug
 * @route GET /api/v1/categories/slug/:slug
 * @description Retrieves a specific category by slug
 * @param {slug} - Category slug
 * @returns { category } with 200 status
 */
export const getCategoryBySlugController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;

    if (!slug) {
      sendError(res, "Slug is required", 400);
      return;
    }

    const category = await getCategoryBySlug(slug);

    if (!category) {
      sendError(res, "Category not found", 404);
      return;
    }

    sendSuccess(res, category, "Category retrieved successfully");
  },
);

/**
 * Get categories with filters
 * @route GET /api/v1/categories
 * @description Retrieves all categories with optional filters
 * @query { page, limit, parentId, isActive, search, sortBy, sortOrder }
 * @returns { categories, pagination } with 200 status
 */
export const getCategoriesController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = categoryFilterSchema.parse(req.query);

    const result = await getCategoryList(
      {
        search: validatedQuery.search,
        parentId: validatedQuery.parentId,
        isActive: validatedQuery.isActive,
        name: validatedQuery.name,
        slug: validatedQuery.slug,
      },
      validatedQuery.page || 1,
      validatedQuery.limit || 20,
      validatedQuery.sortBy || "displayOrder",
      validatedQuery.sortOrder || "asc",
    );

    sendPaginated(
      res,
      result.data,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.totalItems,
    );
  },
);

/**
 * Get all active categories (for dropdowns)
 * @route GET /api/v1/categories/active
 * @description Retrieves all active categories
 * @returns { categories } with 200 status
 */
export const getActiveCategoriesController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const categories = await getActiveCategoryList();

    sendSuccess(res, categories, "Active categories retrieved successfully");
  },
);

/**
 * Get root categories
 * @route GET /api/v1/categories/root
 * @description Retrieves all root categories (no parent)
 * @returns { categories } with 200 status
 */
export const getRootCategoriesController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const categories = await getRootCategoryList();

    sendSuccess(res, categories, "Root categories retrieved successfully");
  },
);

/**
 * Get child categories by parent ID
 * @route GET /api/v1/categories/:parentId/children
 * @description Retrieves all child categories of a parent
 * @param {parentId} - Parent Category ID
 * @returns { categories } with 200 status
 */
export const getChildCategoriesController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { parentId } = req.params;

    if (!parentId) {
      sendError(res, "Parent ID is required", 400);
      return;
    }

    const categories = await getChildCategoryList(parentId);

    sendSuccess(res, categories, "Child categories retrieved successfully");
  },
);

/**
 * Get full category tree
 * @route GET /api/v1/categories/tree
 * @description Retrieves the complete category hierarchy tree
 * @returns { category tree } with 200 status
 */
export const getCategoryTreeController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const tree = await getCategoryHierarchy();

    sendSuccess(res, tree, "Category tree retrieved successfully");
  },
);

/**
 * Get category breadcrumb
 * @route GET /api/v1/categories/:id/breadcrumb
 * @description Retrieves the breadcrumb path for a category
 * @param {id} - Category ID
 * @returns { breadcrumb } with 200 status
 */
export const getCategoryBreadcrumbController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = categoryIdParamSchema.parse(req.params);

    const breadcrumb = await getCategoryBreadcrumb(validatedParams.id);

    sendSuccess(res, breadcrumb, "Category breadcrumb retrieved successfully");
  },
);

/**
 * Get category descendants (all children, grandchildren, etc.)
 * @route GET /api/v1/categories/:id/descendants
 * @description Retrieves all descendants of a category
 * @param {id} - Category ID
 * @returns { descendants } with 200 status
 */
export const getCategoryDescendantsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = categoryIdParamSchema.parse(req.params);

    const descendants = await getCategoryDescendants(validatedParams.id);

    sendSuccess(
      res,
      descendants,
      "Category descendants retrieved successfully",
    );
  },
);

/**
 * Get subcategory tree for a specific parent
 * @route GET /api/v1/categories/:id/subtree
 * @description Retrieves the subcategory tree for a specific parent
 * @param {id} - Category ID
 * @returns { subtree } with 200 status
 */
export const getSubCategoryTreeController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const validatedParams = categoryIdParamSchema.parse(req.params);

    const subtree = await getSubCategoryTree(validatedParams.id);

    sendSuccess(res, subtree, "Subcategory tree retrieved successfully");
  },
);

// ============================================================
// UPDATE CATEGORY
// ============================================================

/**
 * Update category (admin only)
 * @route PUT /api/v1/categories/:id
 * @description Updates a category
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Category ID
 * @body { name?, nameAm?, slug?, description?, icon?, image?, parentId?, displayOrder?, isActive? }
 * @returns { updated category } with 200 status
 */
export const updateCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedParams = categoryIdParamSchema.parse(req.params);
    const validatedData = updateCategorySchema.parse(req.body);

    // Validate parentId if provided
    if (validatedData.parentId !== undefined) {
      const validation = await validateCategoryHierarchy(
        validatedParams.id,
        validatedData.parentId,
      );

      if (!validation.isValid) {
        sendError(res, validation.message || "Invalid category hierarchy", 400);
        return;
      }
    }

    const category = await updateCategoryById(
      validatedParams.id,
      validatedData,
    );

    sendSuccess(res, category, "Category updated successfully");
  },
);

// ============================================================
// DELETE CATEGORY
// ============================================================

/**
 * Delete category (soft delete) (admin only)
 * @route DELETE /api/v1/categories/:id
 * @description Soft deletes a category (sets isActive to false)
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Category ID
 * @returns { success: true } with 200 status
 */
export const deleteCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedParams = categoryIdParamSchema.parse(req.params);

    // Check if category exists
    const exists = await checkCategoryExists(validatedParams.id);
    if (!exists) {
      sendError(res, "Category not found", 404);
      return;
    }

    // Check if category has children
    const childCount = await getChildCategoryCount(validatedParams.id);
    if (childCount > 0) {
      sendError(
        res,
        "Cannot delete category with child categories. Delete children first or reassign them.",
        400,
      );
      return;
    }

    const category = await deleteCategoryById(validatedParams.id);

    sendSuccess(res, null, "Category deleted successfully");
  },
);

/**
 * Hard delete category (admin only)
 * @route DELETE /api/v1/categories/:id/permanent
 * @description Permanently deletes a category
 * @header Authorization: Bearer {accessToken}
 * @param {id} - Category ID
 * @returns { success: true } with 200 status
 */
export const hardDeleteCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedParams = categoryIdParamSchema.parse(req.params);

    // Check if category exists
    const exists = await checkCategoryExists(validatedParams.id);
    if (!exists) {
      sendError(res, "Category not found", 404);
      return;
    }

    // Check if category has children
    const childCount = await getChildCategoryCount(validatedParams.id);
    if (childCount > 0) {
      sendError(
        res,
        "Cannot delete category with child categories. Delete children first or reassign them.",
        400,
      );
      return;
    }

    const category = await hardDeleteCategoryById(validatedParams.id);

    sendSuccess(res, null, "Category permanently deleted successfully");
  },
);

// ============================================================
// BULK OPERATIONS
// ============================================================

/**
 * Bulk update category display order (admin only)
 * @route PUT /api/v1/categories/bulk/order
 * @description Updates display order for multiple categories
 * @header Authorization: Bearer {accessToken}
 * @body { categories: [{ id, displayOrder }] }
 * @returns { updated categories } with 200 status
 */
export const bulkUpdateCategoryOrderController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const validatedData = bulkCategoryUpdateSchema.parse(req.body);

    const categories = await bulkUpdateCategoryOrder(validatedData.categories);

    sendSuccess(res, categories, "Category order updated successfully");
  },
);

// ============================================================
// CATEGORY STATISTICS
// ============================================================

/**
 * Get category statistics (admin only)
 * @route GET /api/v1/categories/stats
 * @description Gets overall category statistics
 * @header Authorization: Bearer {accessToken}
 * @returns { stats } with 200 status
 */
export const getCategoryStatsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userRole = (req as any).user?.role;

    if (userRole !== "ADMIN") {
      sendError(res, "Admin access required", 403);
      return;
    }

    const stats = await getCategoryStatistics();

    sendSuccess(res, stats, "Category statistics retrieved successfully");
  },
);

/**
 * Get categories with child count
 * @route GET /api/v1/categories/with-count
 * @description Retrieves all categories with child count
 * @returns { categories } with 200 status
 */
export const getCategoriesWithCountController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const categories = await getCategoriesWithChildrenCount();

    sendSuccess(
      res,
      categories,
      "Categories with child count retrieved successfully",
    );
  },
);

// ============================================================
// CATEGORY VALIDATION HELPERS
// ============================================================

/**
 * Validate category name
 * @route GET /api/v1/categories/validate/name
 * @description Validates a category name
 * @query { name }
 * @returns { isValid: boolean, message? } with 200 status
 */
export const validateCategoryNameController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      sendError(res, "Name is required", 400);
      return;
    }

    const result = validateCategoryName(name);

    sendSuccess(res, result, "Category name validation completed");
  },
);

/**
 * Validate category slug
 * @route GET /api/v1/categories/validate/slug
 * @description Validates a category slug
 * @query { slug }
 * @returns { isValid: boolean, message? } with 200 status
 */
export const validateCategorySlugController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.query;

    if (!slug || typeof slug !== "string") {
      sendError(res, "Slug is required", 400);
      return;
    }

    const result = validateCategorySlug(slug);

    sendSuccess(res, result, "Category slug validation completed");
  },
);

/**
 * Check if slug exists
 * @route GET /api/v1/categories/check-slug
 * @description Checks if a slug already exists
 * @query { slug, excludeId? }
 * @returns { exists: boolean } with 200 status
 */
export const checkSlugExistsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { slug, excludeId } = req.query;

    if (!slug || typeof slug !== "string") {
      sendError(res, "Slug is required", 400);
      return;
    }

    const exists = await checkSlugExists(slug, excludeId as string);

    sendSuccess(res, { exists }, "Slug existence check completed");
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Create
  createCategoryController,

  // Get
  getCategoryByIdController,
  getCategoryBySlugController,
  getCategoriesController,
  getActiveCategoriesController,
  getRootCategoriesController,
  getChildCategoriesController,
  getCategoryTreeController,
  getCategoryBreadcrumbController,
  getCategoryDescendantsController,
  getSubCategoryTreeController,

  // Update
  updateCategoryController,

  // Delete
  deleteCategoryController,
  hardDeleteCategoryController,

  // Bulk
  bulkUpdateCategoryOrderController,

  // Stats
  getCategoryStatsController,
  getCategoriesWithCountController,

  // Validation
  validateCategoryNameController,
  validateCategorySlugController,
  checkSlugExistsController,
};
