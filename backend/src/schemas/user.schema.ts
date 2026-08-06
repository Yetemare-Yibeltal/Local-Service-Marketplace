import { z } from "zod";
import {
  emailSchema,
  phoneSchema,
  passwordSchema,
  uuidSchema,
  userRoleSchema,
} from "../middlewares/validation.middleware";

// ============================================================
// USER SCHEMAS
// ============================================================

/**
 * User registration schema (full)
 */
export const userRegisterSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  role: userRoleSchema.optional().default("CUSTOMER"),
});

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;

/**
 * User registration schema (public)
 */
export const publicRegisterSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
});

export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>;

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces")
    .optional(),
  phone: phoneSchema.optional(),
  bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
  profileImage: z.string().url("Profile image must be a valid URL").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Update profile image schema
 */
export const updateProfileImageSchema = z.object({
  image: z
    .string()
    .url("Image must be a valid URL")
    .min(1, "Image URL is required"),
});

export type UpdateProfileImageInput = z.infer<typeof updateProfileImageSchema>;

/**
 * User ID param schema
 */
export const userIdParamSchema = z.object({
  userId: uuidSchema,
});

export type UserIdParamInput = z.infer<typeof userIdParamSchema>;

/**
 * User filter query schema
 */
export const userFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  role: userRoleSchema.optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  isVerified: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  sortBy: z
    .enum(["createdAt", "fullName", "email"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type UserFilterInput = z.infer<typeof userFilterSchema>;

/**
 * Admin create user schema
 */
export const adminCreateUserSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  role: userRoleSchema,
  isEmailVerified: z.boolean().optional().default(false),
  isPhoneVerified: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

/**
 * Admin update user schema
 */
export const adminUpdateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
  isEmailVerified: z.boolean().optional(),
  isPhoneVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  bio: z.string().max(500).optional(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

/**
 * User response schema (for API responses)
 */
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string(),
  fullName: z.string(),
  role: z.enum(["CUSTOMER", "PROVIDER", "ADMIN"]),
  profileImage: z.string().nullable(),
  bio: z.string().nullable(),
  isEmailVerified: z.boolean(),
  isPhoneVerified: z.boolean(),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

// ============================================================
// EXPORTS
// ============================================================

export default {
  userRegisterSchema,
  publicRegisterSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateProfileImageSchema,
  userIdParamSchema,
  userFilterSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  userResponseSchema,
};
