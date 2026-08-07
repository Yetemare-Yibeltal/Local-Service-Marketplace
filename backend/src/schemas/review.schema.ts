import { z } from "zod";
import { uuidSchema } from "../middlewares/validation.middleware";

// ============================================================
// REVIEW SCHEMAS
// ============================================================

/**
 * Create review request schema
 */
export const createReviewSchema = z.object({
  bookingId: uuidSchema,
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating must not exceed 5 stars"),
  comment: z
    .string()
    .min(3, "Comment must be at least 3 characters")
    .max(1000, "Comment must not exceed 1000 characters"),
  images: z
    .array(z.string().url())
    .max(5, "Maximum 5 images allowed")
    .optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/**
 * Update review schema
 */
export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating must not exceed 5 stars")
    .optional(),
  comment: z
    .string()
    .min(3, "Comment must be at least 3 characters")
    .max(1000, "Comment must not exceed 1000 characters")
    .optional(),
  images: z
    .array(z.string().url())
    .max(5, "Maximum 5 images allowed")
    .optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

/**
 * Review ID param schema
 */
export const reviewIdParamSchema = z.object({
  id: uuidSchema,
});

export type ReviewIdParamInput = z.infer<typeof reviewIdParamSchema>;

/**
 * Provider review response schema
 */
export const reviewResponseSchema = z.object({
  reviewId: uuidSchema,
  response: z
    .string()
    .min(3, "Response must be at least 3 characters")
    .max(1000, "Response must not exceed 1000 characters"),
});

export type ReviewResponseInput = z.infer<typeof reviewResponseSchema>;

/**
 * Review filter schema
 */
export const reviewFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isPublic: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  isVerified: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  sortBy: z.enum(["createdAt", "rating"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ReviewFilterInput = z.infer<typeof reviewFilterSchema>;

/**
 * Provider reviews filter schema
 */
export const providerReviewsFilterSchema = z.object({
  providerId: uuidSchema,
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sortBy: z.enum(["createdAt", "rating"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ProviderReviewsFilterInput = z.infer<
  typeof providerReviewsFilterSchema
>;

/**
 * Review response schema
 */
export const reviewResponseSchemaFull = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  providerId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  images: z.array(z.string()),
  isPublic: z.boolean(),
  isVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ReviewResponseFull = z.infer<typeof reviewResponseSchemaFull>;

/**
 * Review with reviewer and provider response schema
 */
export const reviewWithUserSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  providerId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  images: z.array(z.string()),
  isPublic: z.boolean(),
  isVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  reviewer: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    profileImage: z.string().nullable(),
  }),
  provider: z.object({
    id: z.string().uuid(),
    businessName: z.string(),
    businessLogo: z.string().nullable(),
  }),
});

export type ReviewWithUser = z.infer<typeof reviewWithUserSchema>;

// ============================================================
// HELPER VALIDATORS
// ============================================================

/**
 * Validate review rating is valid
 */
export function isValidReviewRating(rating: number): boolean {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
}

/**
 * Validate comment length
 */
export function isValidReviewComment(comment: string): boolean {
  return comment.length >= 3 && comment.length <= 1000;
}

/**
 * Validate review images
 */
export function isValidReviewImages(images: string[]): boolean {
  return images.length <= 5;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  reviewResponseSchema,
  reviewFilterSchema,
  providerReviewsFilterSchema,
  reviewResponseSchemaFull,
  reviewWithUserSchema,
  isValidReviewRating,
  isValidReviewComment,
  isValidReviewImages,
};
