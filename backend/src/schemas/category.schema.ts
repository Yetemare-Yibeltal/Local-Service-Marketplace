import { z } from "zod";
import { uuidSchema, slugSchema } from "../middlewares/validation.middleware";

// ============================================================
// CATEGORY SCHEMAS
// ============================================================

/**
 * Category validation for category name (English)
 */
export const categoryNameSchema = z
  .string()
  .min(2, "Category name must be at least 2 characters")
  .max(50, "Category name must not exceed 50 characters")
  .regex(
    /^[a-zA-Z0-9\s\-&]+$/,
    "Category name can only contain letters, numbers, spaces, hyphens, and ampersands",
  );

/**
 * Category validation for Amharic name
 */
export const categoryNameAmSchema = z
  .string()
  .min(2, "Amharic name must be at least 2 characters")
  .max(50, "Amharic name must not exceed 50 characters")
  .optional();

/**
 * Category validation for description
 */
export const categoryDescriptionSchema = z
  .string()
  .min(10, "Description must be at least 10 characters")
  .max(500, "Description must not exceed 500 characters")
  .optional();

/**
 * Category validation for icon
 */
export const categoryIconSchema = z
  .string()
  .max(50, "Icon name must not exceed 50 characters")
  .regex(
    /^[a-zA-Z0-9\-]+$/,
    "Icon name can only contain letters, numbers, and hyphens",
  )
  .optional();

/**
 * Category validation for image URL
 */
export const categoryImageSchema = z
  .string()
  .url("Image must be a valid URL")
  .max(2048, "Image URL must not exceed 2048 characters")
  .optional();

/**
 * Category validation for display order
 */
export const categoryDisplayOrderSchema = z
  .number()
  .int("Display order must be an integer")
  .min(0, "Display order cannot be negative")
  .default(0);

/**
 * Category validation for active status
 */
export const categoryIsActiveSchema = z.boolean().default(true);

// ============================================================
// MAIN CATEGORY SCHEMAS
// ============================================================

/**
 * Create category request schema
 */
export const createCategorySchema = z.object({
  name: categoryNameSchema,
  nameAm: categoryNameAmSchema,
  slug: slugSchema,
  description: categoryDescriptionSchema,
  icon: categoryIconSchema,
  image: categoryImageSchema,
  parentId: uuidSchema.nullable().optional(),
  displayOrder: categoryDisplayOrderSchema,
  isActive: categoryIsActiveSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/**
 * Update category request schema
 */
export const updateCategorySchema = z.object({
  name: categoryNameSchema.optional(),
  nameAm: categoryNameAmSchema,
  slug: slugSchema.optional(),
  description: categoryDescriptionSchema,
  icon: categoryIconSchema,
  image: categoryImageSchema,
  parentId: uuidSchema.nullable().optional(),
  displayOrder: categoryDisplayOrderSchema.optional(),
  isActive: categoryIsActiveSchema.optional(),
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
  parentId: uuidSchema.nullable().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  search: z.string().min(1).max(100).optional(),
  sortBy: z
    .enum(["name", "displayOrder", "createdAt", "updatedAt"])
    .optional()
    .default("displayOrder"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type CategoryFilterInput = z.infer<typeof categoryFilterSchema>;

/**
 * Category with children response schema
 */
export const categoryWithChildrenSchema: z.ZodSchema = z.lazy(() =>
  z.object({
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
    children: z.array(categoryWithChildrenSchema).optional(),
    parent: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        slug: z.string(),
      })
      .nullable()
      .optional(),
  }),
);

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
 * Category with parent response schema
 */
export const categoryWithParentSchema = z.object({
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
  parent: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      nameAm: z.string().nullable(),
      slug: z.string(),
    })
    .nullable(),
});

export type CategoryWithParent = z.infer<typeof categoryWithParentSchema>;

/**
 * Bulk category update schema
 */
export const bulkCategoryUpdateSchema = z.object({
  categories: z
    .array(
      z.object({
        id: uuidSchema,
        displayOrder: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
        name: categoryNameSchema.optional(),
        nameAm: categoryNameAmSchema,
        slug: slugSchema.optional(),
        parentId: uuidSchema.nullable().optional(),
      }),
    )
    .min(1, "At least one category is required"),
});

export type BulkCategoryUpdateInput = z.infer<typeof bulkCategoryUpdateSchema>;

/**
 * Category tree response schema
 */
export const categoryTreeSchema = z.array(categoryWithChildrenSchema);

export type CategoryTree = z.infer<typeof categoryTreeSchema>;

/**
 * Category hierarchy validation schema
 */
export const categoryHierarchySchema = z.object({
  parentId: uuidSchema.nullable().optional(),
  children: z
    .array(
      z.object({
        id: uuidSchema,
        displayOrder: z.number().int().min(0),
      }),
    )
    .optional(),
});

export type CategoryHierarchyInput = z.infer<typeof categoryHierarchySchema>;

// ============================================================
// HELPER VALIDATORS
// ============================================================

/**
 * Validate category name
 */
export function isValidCategoryName(name: string): boolean {
  return categoryNameSchema.safeParse(name).success;
}

/**
 * Validate category slug
 */
export function isValidCategorySlug(slug: string): boolean {
  return slugSchema.safeParse(slug).success;
}

/**
 * Validate display order
 */
export function isValidDisplayOrder(order: number): boolean {
  return categoryDisplayOrderSchema.safeParse(order).success;
}

/**
 * Validate category ID
 */
export function isValidCategoryId(id: string): boolean {
  return uuidSchema.safeParse(id).success;
}

/**
 * Validate parent category
 */
export function isValidParentId(parentId: string | null): boolean {
  if (parentId === null) return true;
  return uuidSchema.safeParse(parentId).success;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  categoryNameSchema,
  categoryNameAmSchema,
  categoryDescriptionSchema,
  categoryIconSchema,
  categoryImageSchema,
  categoryDisplayOrderSchema,
  categoryIsActiveSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryFilterSchema,
  categoryWithChildrenSchema,
  categoryResponseSchema,
  categoryWithParentSchema,
  bulkCategoryUpdateSchema,
  categoryTreeSchema,
  categoryHierarchySchema,
  isValidCategoryName,
  isValidCategorySlug,
  isValidDisplayOrder,
  isValidCategoryId,
  isValidParentId,
};
