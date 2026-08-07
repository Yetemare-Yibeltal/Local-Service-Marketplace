import { z } from "zod";
import {
  uuidSchema,
  latitudeSchema,
  longitudeSchema,
} from "../middlewares/validation.middleware";

// ============================================================
// PROVIDER SCHEMAS
// ============================================================

/**
 * Provider registration schema
 */
export const providerRegistrationSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must not exceed 100 characters"),
  businessLogo: z.string().url().optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters"),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters"),
  subCategory: z.string().max(50).optional(),
  yearsExperience: z
    .number()
    .int()
    .min(0, "Years experience cannot be negative")
    .max(50, "Years experience cannot exceed 50"),
  hourlyRate: z.number().min(0, "Hourly rate cannot be negative").optional(),
  locationLat: latitudeSchema,
  locationLng: longitudeSchema,
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must not exceed 500 characters"),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters"),
  subCity: z.string().max(100).optional(),
  workingHours: z
    .record(
      z.object({
        start: z
          .string()
          .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
        end: z
          .string()
          .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      }),
    )
    .optional(),
});

export type ProviderRegistrationInput = z.infer<
  typeof providerRegistrationSchema
>;

/**
 * Update provider schema
 */
export const updateProviderSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must not exceed 100 characters")
    .optional(),
  businessLogo: z.string().url().optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters")
    .optional(),
  subCategory: z.string().max(50).optional(),
  yearsExperience: z
    .number()
    .int()
    .min(0, "Years experience cannot be negative")
    .max(50, "Years experience cannot exceed 50")
    .optional(),
  hourlyRate: z.number().min(0, "Hourly rate cannot be negative").optional(),
  isAvailable: z.boolean().optional(),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must not exceed 500 characters")
    .optional(),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .optional(),
  subCity: z.string().max(100).optional(),
  workingHours: z
    .record(
      z.object({
        start: z
          .string()
          .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
        end: z
          .string()
          .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      }),
    )
    .optional(),
});

export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;

/**
 * Provider ID param schema
 */
export const providerIdParamSchema = z.object({
  id: uuidSchema,
});

export type ProviderIdParamInput = z.infer<typeof providerIdParamSchema>;

/**
 * Provider filter query schema
 */
export const providerFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  city: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isAvailable: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  isVerified: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  isFeatured: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "averageRating", "completedJobs", "hourlyRate"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ProviderFilterInput = z.infer<typeof providerFilterSchema>;

/**
 * Provider search schema (geo-location)
 */
export const providerSearchSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
  radius: z.coerce.number().min(1).max(100).optional().default(10),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isAvailable: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  isVerified: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ProviderSearchInput = z.infer<typeof providerSearchSchema>;

/**
 * Service creation schema
 */
export const createServiceSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters"),
  priceType: z.enum(["FIXED", "HOURLY"]),
  price: z.number().min(0, "Price cannot be negative"),
  discountPrice: z
    .number()
    .min(0, "Discount price cannot be negative")
    .optional(),
  estimatedDurationMinutes: z
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(1440, "Duration cannot exceed 1440 minutes (24 hours)")
    .optional(),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters"),
  subCategory: z.string().max(50).optional(),
  images: z
    .array(z.string().url())
    .max(5, "Maximum 5 images allowed")
    .optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

/**
 * Update service schema
 */
export const updateServiceSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  priceType: z.enum(["FIXED", "HOURLY"]).optional(),
  price: z.number().min(0, "Price cannot be negative").optional(),
  discountPrice: z
    .number()
    .min(0, "Discount price cannot be negative")
    .optional(),
  estimatedDurationMinutes: z
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(1440, "Duration cannot exceed 1440 minutes (24 hours)")
    .optional(),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters")
    .optional(),
  subCategory: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  images: z
    .array(z.string().url())
    .max(5, "Maximum 5 images allowed")
    .optional(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

/**
 * Service ID param schema
 */
export const serviceIdParamSchema = z.object({
  id: uuidSchema,
});

export type ServiceIdParamInput = z.infer<typeof serviceIdParamSchema>;

/**
 * Availability schema
 */
export const availabilitySchema = z.object({
  day: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  isAvailable: z.boolean().default(true),
});

export type AvailabilityInput = z.infer<typeof availabilitySchema>;

/**
 * Bulk availability update schema
 */
export const bulkAvailabilitySchema = z.object({
  availability: z.array(availabilitySchema),
});

export type BulkAvailabilityInput = z.infer<typeof bulkAvailabilitySchema>;

/**
 * Provider response schema
 */
export const providerResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  businessName: z.string(),
  businessLogo: z.string().nullable(),
  description: z.string(),
  category: z.string(),
  subCategory: z.string().nullable(),
  yearsExperience: z.number(),
  hourlyRate: z.number().nullable(),
  isAvailable: z.boolean(),
  isVerified: z.boolean(),
  averageRating: z.number(),
  totalReviews: z.number(),
  locationLat: z.number(),
  locationLng: z.number(),
  address: z.string(),
  city: z.string(),
  subCity: z.string().nullable(),
  workingHours: z.record(z.any()).nullable(),
  completedJobs: z.number(),
  responseTime: z.number().nullable(),
  isFeatured: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProviderResponse = z.infer<typeof providerResponseSchema>;

// ============================================================
// EXPORTS
// ============================================================

export default {
  providerRegistrationSchema,
  updateProviderSchema,
  providerIdParamSchema,
  providerFilterSchema,
  providerSearchSchema,
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  availabilitySchema,
  bulkAvailabilitySchema,
  providerResponseSchema,
};
