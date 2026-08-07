import { z } from "zod";
import { uuidSchema, slugSchema } from "../middlewares/validation.middleware";

// ============================================================
// CATEGORY SCHEMAS
// ============================================================

/**
 * Create category schema
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must not exceed 50 characters"),
  nameAm: z
    .string()
    .min(2, "Amharic name must be at least 2 characters")
    .max(50, "Amharic name must not exceed 50 characters")
    .optional(),
  slug: slugSchema,
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  icon: z
    .string()
    .max(50, "Icon name must not exceed 50 characters")
    .optional(),
  image: z.string().url("Image must be a valid URL").optional(),
  parentId: uuidSchema.optional().nullable(),
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/**
 * Update category schema
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must not exceed 50 characters")
    .optional(),
  nameAm: z
    .string()
    .min(2, "Amharic name must be at least 2 characters")
    .max(50, "Amharic name must not exceed 50 characters")
    .optional(),
  slug: slugSchema.optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  icon: z
    .string()
    .max(50, "Icon name must not exceed 50 characters")
    .optional(),
  image: z.string().url("Image must be a valid URL").optional(),
  parentId: uuidSchema.optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/**
 * Category ID param schema
 */
export const categoryIdParamSchema = z.object({
  id: uuidSchema,
});

export type CategoryIdParamInput = z.infer<typeof categoryIdParamSchema>;

/**
 * Category filter query schema
 */
export const categoryFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  parentId: uuidSchema.optional().nullable(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  search: z.string().optional(),
  sortBy: z
    .enum(["name", "displayOrder", "createdAt"])
    .optional()
    .default("displayOrder"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type CategoryFilterInput = z.infer<typeof categoryFilterSchema>;

/**
 * Category with children response schema
 */
export const categoryWithChildrenSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nameAm: z.string().nullable(),
  slug: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  image: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  displayOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  children: z.array(z.lazy(() => categoryWithChildrenSchema)).optional(),
});

export type CategoryWithChildren = z.infer<typeof categoryWithChildrenSchema>;

/**
 * Category response schema
 */
export const categoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nameAm: z.string().nullable(),
  slug: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  image: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  displayOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CategoryResponse = z.infer<typeof categoryResponseSchema>;

/**
 * Bulk category update schema
 */
export const bulkCategoryUpdateSchema = z.object({
  categories: z.array(
    z.object({
      id: uuidSchema,
      displayOrder: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  ),
});

export type BulkCategoryUpdateInput = z.infer<typeof bulkCategoryUpdateSchema>;

// ============================================================
// HELPER VALIDATORS
// ============================================================

/**
 * Validate category name
 */
export function isValidCategoryName(name: string): boolean {
  return name.length >= 2 && name.length <= 50;
}

/**
 * Validate category slug
 */
export function isValidCategorySlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Validate display order
 */
export function isValidDisplayOrder(order: number): boolean {
  return Number.isInteger(order) && order >= 0;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryFilterSchema,
  categoryWithChildrenSchema,
  categoryResponseSchema,
  bulkCategoryUpdateSchema,
  isValidCategoryName,
  isValidCategorySlug,
  isValidDisplayOrder,
};
