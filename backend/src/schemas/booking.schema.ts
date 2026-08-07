import { z } from "zod";
import {
  uuidSchema,
  datetimeSchema,
  bookingStatusSchema,
  priceTypeSchema,
} from "../middlewares/validation.middleware";

// ============================================================
// BOOKING SCHEMAS
// ============================================================

/**
 * Create booking request schema
 */
export const createBookingSchema = z.object({
  providerId: uuidSchema,
  serviceId: uuidSchema.optional(),
  scheduledDate: datetimeSchema,
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must not exceed 500 characters"),
  specialNotes: z
    .string()
    .max(500, "Special notes must not exceed 500 characters")
    .optional(),
  totalPrice: z
    .number()
    .min(0, "Total price must be at least 0")
    .positive("Total price must be greater than 0"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Update booking status schema
 */
export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema,
  cancellationReason: z
    .string()
    .max(500, "Cancellation reason must not exceed 500 characters")
    .optional(),
});

export type UpdateBookingStatusInput = z.infer<
  typeof updateBookingStatusSchema
>;

/**
 * Booking ID param schema
 */
export const bookingIdParamSchema = z.object({
  id: uuidSchema,
});

export type BookingIdParamInput = z.infer<typeof bookingIdParamSchema>;

/**
 * Booking filter query schema
 */
export const bookingFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: bookingStatusSchema.optional(),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  providerId: uuidSchema.optional(),
  customerId: uuidSchema.optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "scheduledDate", "totalPrice", "status"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type BookingFilterInput = z.infer<typeof bookingFilterSchema>;

/**
 * Provider booking filter schema
 */
export const providerBookingFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: bookingStatusSchema.optional(),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  sortBy: z
    .enum(["createdAt", "scheduledDate", "totalPrice", "status"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ProviderBookingFilterInput = z.infer<
  typeof providerBookingFilterSchema
>;

/**
 * Customer booking filter schema
 */
export const customerBookingFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: bookingStatusSchema.optional(),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  sortBy: z
    .enum(["createdAt", "scheduledDate", "totalPrice", "status"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CustomerBookingFilterInput = z.infer<
  typeof customerBookingFilterSchema
>;

/**
 * Admin booking filter schema
 */
export const adminBookingFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: bookingStatusSchema.optional(),
  startDate: datetimeSchema.optional(),
  endDate: datetimeSchema.optional(),
  providerId: uuidSchema.optional(),
  customerId: uuidSchema.optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "scheduledDate", "totalPrice", "status"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type AdminBookingFilterInput = z.infer<typeof adminBookingFilterSchema>;

/**
 * Booking response schema
 */
export const bookingResponseSchema = z.object({
  id: z.string().uuid(),
  bookingNumber: z.string(),
  customerId: z.string().uuid(),
  providerId: z.string().uuid(),
  serviceId: z.string().uuid().nullable(),
  status: bookingStatusSchema,
  scheduledDate: z.string().datetime(),
  estimatedEndDate: z.string().datetime().nullable(),
  address: z.string(),
  specialNotes: z.string().nullable(),
  totalPrice: z.number(),
  depositAmount: z.number(),
  confirmedAt: z.string().datetime().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  cancelledAt: z.string().datetime().nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type BookingResponse = z.infer<typeof bookingResponseSchema>;

/**
 * Cancel booking schema
 */
export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .min(5, "Cancellation reason must be at least 5 characters")
    .max(500, "Cancellation reason must not exceed 500 characters"),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

/**
 * Booking dashboard stats response schema
 */
export const bookingDashboardStatsSchema = z.object({
  totalBookings: z.number(),
  pendingBookings: z.number(),
  confirmedBookings: z.number(),
  inProgressBookings: z.number(),
  completedBookings: z.number(),
  cancelledBookings: z.number(),
  disputedBookings: z.number(),
  totalEarnings: z.number(),
  monthlyEarnings: z.number(),
  weeklyBookings: z.number(),
});

export type BookingDashboardStats = z.infer<typeof bookingDashboardStatsSchema>;

// ============================================================
// EXPORTS
// ============================================================

export default {
  createBookingSchema,
  updateBookingStatusSchema,
  bookingIdParamSchema,
  bookingFilterSchema,
  providerBookingFilterSchema,
  customerBookingFilterSchema,
  adminBookingFilterSchema,
  bookingResponseSchema,
  cancelBookingSchema,
  bookingDashboardStatsSchema,
};
