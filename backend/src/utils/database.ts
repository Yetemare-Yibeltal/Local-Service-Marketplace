import { Prisma, prisma } from "../config/database";
import { PrismaClient } from "@prisma/client";
import logger from "./logger";

// ============================================================
// TYPES
// ============================================================

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
  range?: {
    field: string;
    min?: any;
    max?: any;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TransactionOptions {
  isolationLevel?: Prisma.TransactionIsolationLevel;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface BulkOperationResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// ============================================================
// PAGINATION HELPERS
// ============================================================

/**
 * Build pagination parameters for Prisma queries
 */
export function buildPaginationParams(options: PaginationOptions): {
  skip: number;
  take: number;
  orderBy: Record<string, "asc" | "desc">;
} {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const skip = (page - 1) * limit;
  const take = limit;
  const orderBy = { [sortBy]: sortOrder };

  return { skip, take, orderBy };
}

/**
 * Build where clause with search, filters, and range
 */
export function buildWhereClause(
  options: Partial<PaginationOptions>,
): Record<string, any> {
  const where: Record<string, any> = {};

  // Search
  if (
    options.search &&
    options.searchFields &&
    options.searchFields.length > 0
  ) {
    where.OR = options.searchFields.map((field) => ({
      [field]: { contains: options.search, mode: "insensitive" },
    }));
  } else if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { email: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
    ];
  }

  // Filters
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "object" && !Array.isArray(value)) {
          // Handle nested filters like { gte, lte }
          where[key] = value;
        } else {
          where[key] = value;
        }
      }
    }
  }

  // Range
  if (options.range) {
    const { field, min, max } = options.range;
    if (min !== undefined) {
      where[field] = { ...where[field], gte: min };
    }
    if (max !== undefined) {
      where[field] = { ...where[field], lte: max };
    }
  }

  return where;
}

/**
 * Execute paginated query
 */
export async function paginatedQuery<T>(
  model: any,
  options: PaginationOptions,
  include?: any,
  where?: Record<string, any>,
): Promise<PaginatedResult<T>> {
  try {
    const { skip, take, orderBy } = buildPaginationParams(options);
    const whereClause = { ...where, ...buildWhereClause(options) };

    const [data, totalItems] = await Promise.all([
      model.findMany({
        where: whereClause,
        skip,
        take,
        orderBy,
        ...(include && { include }),
      }),
      model.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalItems / take);
    const page = options.page || 1;
    const limit = options.limit || 10;

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error("Paginated query failed:", error);
    throw error;
  }
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  totalItems: number,
  page: number,
  limit: number,
): PaginatedResult<any>["pagination"] {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ============================================================
// TRANSACTION HELPERS
// ============================================================

/**
 * Execute a transaction with retry logic
 */
export async function executeTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const {
    isolationLevel = "Serializable",
    timeout = 30000,
    maxRetries = 3,
    retryDelay = 100,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          return await fn(tx);
        },
        {
          isolationLevel,
          timeout,
        },
      );
    } catch (error) {
      lastError = error as Error;
      const isRetryable = isRetryableError(error);

      if (isRetryable && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        logger.debug(
          `Transaction attempt ${attempt} failed. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("Transaction failed after retries");
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const message = String(error);
  return (
    message.includes("deadlock") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("concurrent") ||
    message.includes("serialization") ||
    message.includes("could not serialize")
  );
}

/**
 * Execute multiple transactions in sequence
 */
export async function executeSequence<T>(
  fns: ((tx: PrismaClient) => Promise<T>)[],
  options: TransactionOptions = {},
): Promise<T[]> {
  const results: T[] = [];
  for (const fn of fns) {
    const result = await executeTransaction(fn, options);
    results.push(result);
  }
  return results;
}

/**
 * Execute transactions in parallel with separate connections
 */
export async function executeParallel<T>(
  fns: ((tx: PrismaClient) => Promise<T>)[],
  options: TransactionOptions = {},
): Promise<T[]> {
  const promises = fns.map((fn) => executeTransaction(fn, options));
  return Promise.all(promises);
}

// ============================================================
// BULK OPERATION HELPERS
// ============================================================

/**
 * Execute bulk operation with chunking
 */
export async function bulkOperation<T>(
  items: T[],
  operation: (chunk: T[]) => Promise<void>,
  chunkSize: number = 1000,
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    total: items.length,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    try {
      await operation(chunk);
      result.succeeded += chunk.length;
    } catch (error) {
      result.failed += chunk.length;
      result.errors.push({
        id: "chunk",
        error: String(error),
      });
    }
  }

  return result;
}

/**
 * Execute bulk upsert operation
 */
export async function bulkUpsert<T extends { id?: string }>(
  model: any,
  items: T[],
  uniqueField: string,
  chunkSize: number = 500,
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    total: items.length,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    try {
      const operations = chunk.map((item) => {
        const { id, ...data } = item;
        return {
          where: { [uniqueField]: data[uniqueField] },
          update: data,
          create: data,
        };
      });

      await Promise.all(
        operations.map((op) =>
          model.upsert({
            where: op.where,
            update: op.update,
            create: op.create,
          }),
        ),
      );

      result.succeeded += chunk.length;
    } catch (error) {
      result.failed += chunk.length;
      result.errors.push({
        id: "chunk",
        error: String(error),
      });
    }
  }

  return result;
}

// ============================================================
// SOFT DELETE HELPERS
// ============================================================

/**
 * Soft delete options
 */
export interface SoftDeleteOptions {
  field?: string;
  value?: any;
}

/**
 * Apply soft delete filter to where clause
 */
export function applySoftDeleteFilter(
  where: Record<string, any>,
  options: SoftDeleteOptions = {},
): Record<string, any> {
  const { field = "deletedAt", value = null } = options;
  return {
    ...where,
    [field]: value,
  };
}

/**
 * Check if record is soft deleted
 */
export function isSoftDeleted(
  record: any,
  field: string = "deletedAt",
): boolean {
  return record && record[field] !== null && record[field] !== undefined;
}

// ============================================================
// AGGREGATION HELPERS
// ============================================================

/**
 * Aggregate result interface
 */
export interface AggregateResult {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}

/**
 * Execute aggregate query
 */
export async function aggregateQuery(
  model: any,
  field: string,
  where: Record<string, any> = {},
): Promise<AggregateResult> {
  try {
    const result = await model.aggregate({
      where,
      _count: { [field]: true },
      _sum: { [field]: true },
      _avg: { [field]: true },
      _min: { [field]: true },
      _max: { [field]: true },
    });

    return {
      count: result._count?.[field] || 0,
      sum: result._sum?.[field] || 0,
      avg: result._avg?.[field] || 0,
      min: result._min?.[field] || 0,
      max: result._max?.[field] || 0,
    };
  } catch (error) {
    logger.error("Aggregate query failed:", error);
    throw error;
  }
}

// ============================================================
// DATABASE HEALTH CHECK
// ============================================================

/**
 * Check database connection health
 */
export async function healthCheck(): Promise<{
  status: "ok" | "degraded" | "down";
  latency: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      status: "ok",
      latency,
    };
  } catch (error) {
    logger.error("Database health check failed:", error);
    return {
      status: "down",
      latency: -1,
      error: String(error),
    };
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  buildPaginationParams,
  buildWhereClause,
  paginatedQuery,
  createPaginationMeta,
  executeTransaction,
  executeSequence,
  executeParallel,
  bulkOperation,
  bulkUpsert,
  applySoftDeleteFilter,
  isSoftDeleted,
  aggregateQuery,
  healthCheck,
  isRetryableError,
};
