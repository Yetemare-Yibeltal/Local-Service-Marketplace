import { Router } from "express";
import {
  createCategoryController,
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
  updateCategoryController,
  deleteCategoryController,
  hardDeleteCategoryController,
  bulkUpdateCategoryOrderController,
  getCategoryStatsController,
  getCategoriesWithCountController,
  validateCategoryNameController,
  validateCategorySlugController,
  checkSlugExistsController,
} from "../../controllers/category.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryFilterSchema,
  bulkCategoryUpdateSchema,
} from "../../schemas/category.schema";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// CATEGORY ROUTES
// ============================================================

const router = Router();

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

/**
 * @route GET /api/v1/categories
 * @description Get all categories with filters
 * @query { page, limit, parentId, isActive, search, sortBy, sortOrder }
 * @returns { categories, pagination } with 200 status
 * @access Public
 */
router.get(
  "/",
  validateQuery(categoryFilterSchema),
  catchAsync(getCategoriesController),
);

/**
 * @route GET /api/v1/categories/active
 * @description Get all active categories
 * @returns { categories } with 200 status
 * @access Public
 */
router.get("/active", catchAsync(getActiveCategoriesController));

/**
 * @route GET /api/v1/categories/root
 * @description Get root categories
 * @returns { categories } with 200 status
 * @access Public
 */
router.get("/root", catchAsync(getRootCategoriesController));

/**
 * @route GET /api/v1/categories/tree
 * @description Get full category tree
 * @returns { category tree } with 200 status
 * @access Public
 */
router.get("/tree", catchAsync(getCategoryTreeController));

/**
 * @route GET /api/v1/categories/:parentId/children
 * @description Get child categories by parent ID
 * @param {parentId} - Parent Category ID
 * @returns { categories } with 200 status
 * @access Public
 */
router.get("/:parentId/children", catchAsync(getChildCategoriesController));

/**
 * @route GET /api/v1/categories/with-count
 * @description Get categories with child count
 * @returns { categories } with 200 status
 * @access Public
 */
router.get("/with-count", catchAsync(getCategoriesWithCountController));

/**
 * @route GET /api/v1/categories/:id
 * @description Get category by ID
 * @param {id} - Category ID
 * @returns { category } with 200 status
 * @access Public
 */
router.get(
  "/:id",
  validateParams(categoryIdParamSchema),
  catchAsync(getCategoryByIdController),
);

/**
 * @route GET /api/v1/categories/slug/:slug
 * @description Get category by slug
 * @param {slug} - Category slug
 * @returns { category } with 200 status
 * @access Public
 */
router.get("/slug/:slug", catchAsync(getCategoryBySlugController));

/**
 * @route GET /api/v1/categories/:id/breadcrumb
 * @description Get category breadcrumb path
 * @param {id} - Category ID
 * @returns { breadcrumb } with 200 status
 * @access Public
 */
router.get(
  "/:id/breadcrumb",
  validateParams(categoryIdParamSchema),
  catchAsync(getCategoryBreadcrumbController),
);

/**
 * @route GET /api/v1/categories/:id/descendants
 * @description Get category descendants
 * @param {id} - Category ID
 * @returns { descendants } with 200 status
 * @access Public
 */
router.get(
  "/:id/descendants",
  validateParams(categoryIdParamSchema),
  catchAsync(getCategoryDescendantsController),
);

/**
 * @route GET /api/v1/categories/:id/subtree
 * @description Get subcategory tree for a specific parent
 * @param {id} - Category ID
 * @returns { subtree } with 200 status
 * @access Public
 */
router.get(
  "/:id/subtree",
  validateParams(categoryIdParamSchema),
  catchAsync(getSubCategoryTreeController),
);

// ============================================================
// VALIDATION ROUTES (Public)
// ============================================================

/**
 * @route GET /api/v1/categories/validate/name
 * @description Validate category name
 * @query { name }
 * @returns { isValid: boolean, message? } with 200 status
 * @access Public
 */
router.get("/validate/name", catchAsync(validateCategoryNameController));

/**
 * @route GET /api/v1/categories/validate/slug
 * @description Validate category slug
 * @query { slug }
 * @returns { isValid: boolean, message? } with 200 status
 * @access Public
 */
router.get("/validate/slug", catchAsync(validateCategorySlugController));

/**
 * @route GET /api/v1/categories/check-slug
 * @description Check if slug exists
 * @query { slug, excludeId? }
 * @returns { exists: boolean } with 200 status
 * @access Public
 */
router.get("/check-slug", catchAsync(checkSlugExistsController));

// ============================================================
// ADMIN ROUTES (Authentication required)
// ============================================================

// All admin routes require authentication
router.use(authenticate);

/**
 * @route POST /api/v1/categories
 * @description Create a new category
 * @body { name, nameAm?, slug?, description?, icon?, image?, parentId?, displayOrder?, isActive? }
 * @returns { category } with 201 status
 * @access Admin only
 */
router.post(
  "/",
  validateBody(createCategorySchema),
  catchAsync(createCategoryController),
);

/**
 * @route PUT /api/v1/categories/:id
 * @description Update category
 * @param {id} - Category ID
 * @body { name?, nameAm?, slug?, description?, icon?, image?, parentId?, displayOrder?, isActive? }
 * @returns { updated category } with 200 status
 * @access Admin only
 */
router.put(
  "/:id",
  validateParams(categoryIdParamSchema),
  validateBody(updateCategorySchema),
  catchAsync(updateCategoryController),
);

/**
 * @route DELETE /api/v1/categories/:id
 * @description Soft delete category
 * @param {id} - Category ID
 * @returns { success: true } with 200 status
 * @access Admin only
 */
router.delete(
  "/:id",
  validateParams(categoryIdParamSchema),
  catchAsync(deleteCategoryController),
);

/**
 * @route DELETE /api/v1/categories/:id/permanent
 * @description Hard delete category
 * @param {id} - Category ID
 * @returns { success: true } with 200 status
 * @access Admin only
 */
router.delete(
  "/:id/permanent",
  validateParams(categoryIdParamSchema),
  catchAsync(hardDeleteCategoryController),
);

/**
 * @route PUT /api/v1/categories/bulk/order
 * @description Bulk update category display order
 * @body { categories: [{ id, displayOrder }] }
 * @returns { updated categories } with 200 status
 * @access Admin only
 */
router.put(
  "/bulk/order",
  validateBody(bulkCategoryUpdateSchema),
  catchAsync(bulkUpdateCategoryOrderController),
);

/**
 * @route GET /api/v1/categories/stats
 * @description Get category statistics
 * @returns { stats } with 200 status
 * @access Admin only
 */
router.get("/stats", catchAsync(getCategoryStatsController));

// ============================================================
// EXPORTS
// ============================================================

export default router;
