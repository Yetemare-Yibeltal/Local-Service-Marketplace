import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError, ZodSchema, z } from "zod";
import { sendValidationError } from "../utils/response";

// ============================================================
// TYPES
// ============================================================

export type ValidationSource = "body" | "query" | "params";

export interface ValidationOptions {
  source?: ValidationSource;
  stripUnknown?: boolean;
}

// ============================================================
// VALIDATION MIDDLEWARE
// ============================================================

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T extends AnyZodObject>(
  schema: T,
  options: ValidationOptions = {},
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return sendValidationError(
          res,
          "Validation failed",
          errors.map((e) => `${e.field}: ${e.message}`),
        );
      }
      next(error);
    }
  };
}

/**
 * Validate request query parameters against a Zod schema
 */
export function validateQuery<T extends AnyZodObject>(
  schema: T,
  options: ValidationOptions = {},
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return sendValidationError(
          res,
          "Invalid query parameters",
          errors.map((e) => `${e.field}: ${e.message}`),
        );
      }
      next(error);
    }
  };
}

/**
 * Validate request URL parameters against a Zod schema
 */
export function validateParams<T extends AnyZodObject>(
  schema: T,
  options: ValidationOptions = {},
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return sendValidationError(
          res,
          "Invalid URL parameters",
          errors.map((e) => `${e.field}: ${e.message}`),
        );
      }
      next(error);
    }
  };
}

/**
 * Validate all request sources (body, query, params) with schemas
 */
export function validateAll(schemas: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    try {
      if (schemas.body) {
        const validated = await schemas.body.parseAsync(req.body);
        req.body = validated;
      }

      if (schemas.query) {
        const validated = await schemas.query.parseAsync(req.query);
        req.query = validated;
      }

      if (schemas.params) {
        const validated = await schemas.params.parseAsync(req.params);
        req.params = validated;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return sendValidationError(
          res,
          "Validation failed",
          errors.map((e) => `${e.field}: ${e.message}`),
        );
      }
      next(error);
    }
  };
}

// ============================================================
// CUSTOM VALIDATION RULES
// ============================================================

/**
 * Custom validation rule: validate Ethiopian phone number
 */
export const ethiopianPhone = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(13, "Phone number must not exceed 13 digits")
  .regex(/^(09|\+2519)[0-9]{8}$/, "Invalid Ethiopian phone number format");

/**
 * Custom validation rule: validate email
 */
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email must not exceed 255 characters");

/**
 * Custom validation rule: validate password
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must not exceed 72 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]/,
    "Password must contain at least one special character",
  );

/**
 * Custom validation rule: validate UUID
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Custom validation rule: validate slug
 */
export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  )
  .min(2, "Slug must be at least 2 characters")
  .max(100, "Slug must not exceed 100 characters");

/**
 * Custom validation rule: validate URL
 */
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(2048, "URL must not exceed 2048 characters");

/**
 * Custom validation rule: validate latitude
 */
export const latitudeSchema = z
  .number()
  .min(-90, "Latitude must be between -90 and 90")
  .max(90, "Latitude must be between -90 and 90");

/**
 * Custom validation rule: validate longitude
 */
export const longitudeSchema = z
  .number()
  .min(-180, "Longitude must be between -180 and 180")
  .max(180, "Longitude must be between -180 and 180");

/**
 * Custom validation rule: validate OTP (6 digits)
 */
export const otpSchema = z
  .string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^[0-9]{6}$/, "OTP must contain only numbers");

/**
 * Custom validation rule: validate booking status
 */
export const bookingStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
]);

/**
 * Custom validation rule: validate user role
 */
export const userRoleSchema = z.enum(["CUSTOMER", "PROVIDER", "ADMIN"]);

/**
 * Custom validation rule: validate price type
 */
export const priceTypeSchema = z.enum(["FIXED", "HOURLY"]);

/**
 * Custom validation rule: validate date (YYYY-MM-DD)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

/**
 * Custom validation rule: validate datetime (ISO format)
 */
export const datetimeSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/));

/**
 * Custom validation rule: validate coordinates
 */
export const coordinatesSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
});

/**
 * Custom validation rule: validate pagination
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ============================================================
// PRE-DEFINED VALIDATION SCHEMAS
// ============================================================

/**
 * Pagination query schema
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

/**
 * ID param schema
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Coordinates query schema
 */
export const coordinatesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).optional().default(10),
});

// ============================================================
// EXPORTS
// ============================================================

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateAll,
  ethiopianPhone,
  emailSchema,
  passwordSchema,
  uuidSchema,
  slugSchema,
  urlSchema,
  latitudeSchema,
  longitudeSchema,
  otpSchema,
  bookingStatusSchema,
  userRoleSchema,
  priceTypeSchema,
  dateSchema,
  datetimeSchema,
  coordinatesSchema,
  paginationSchema,
  paginationQuerySchema,
  searchQuerySchema,
  idParamSchema,
  coordinatesQuerySchema,
};
