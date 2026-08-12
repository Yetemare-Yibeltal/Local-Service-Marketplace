// ============================================================
// PAGINATE HELPERS
// Complete pagination utility functions for the application
// ============================================================

// ============================================================
// TYPES
// ============================================================

/**
 * Pagination parameters
 */
export interface PaginateParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  cursor?: string;
  search?: string;
}

/**
 * Pagination metadata
 */
export interface PaginateMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
  cursor?: string;
  nextCursor?: string;
  prevCursor?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginateMeta;
}

/**
 * Cursor pagination response
 */
export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
  };
}

/**
 * Prisma find many options for pagination
 */
export interface PrismaPaginationOptions {
  skip: number;
  take: number;
  orderBy: Record<string, "asc" | "desc">;
  cursor?: Record<string, any>;
  where?: Record<string, any>;
}

/**
 * Pagination config
 */
export interface PaginateConfig {
  defaultLimit: number;
  maxLimit: number;
  defaultPage: number;
  defaultSortBy: string;
  defaultSortOrder: "asc" | "desc";
  cursorField?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATE_CONFIG: PaginateConfig = {
  defaultLimit: 10,
  maxLimit: 100,
  defaultPage: 1,
  defaultSortBy: "createdAt",
  defaultSortOrder: "desc",
  cursorField: "id",
};

/**
 * Minimum and maximum limits
 */
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 10;
export const DEFAULT_PAGE = 1;

// ============================================================
// PARAMETER EXTRACTION
// ============================================================

/**
 * Extract pagination parameters from request
 */
export function extractPaginateParams(
  query: Record<string, any>,
  config: Partial<PaginateConfig> = {},
): PaginateParams {
  const cfg = { ...DEFAULT_PAGINATE_CONFIG, ...config };

  const page = parseInt(query.page) || cfg.defaultPage;
  const limit = Math.min(
    parseInt(query.limit) || cfg.defaultLimit,
    cfg.maxLimit,
  );
  const sortBy = query.sortBy || cfg.defaultSortBy;
  const sortOrder = (query.sortOrder === "asc" ? "asc" : "desc") as
    | "asc"
    | "desc";
  const cursor = query.cursor || undefined;
  const search = query.search || undefined;

  return {
    page: Math.max(page, 1),
    limit: Math.max(limit, MIN_LIMIT),
    sortBy,
    sortOrder,
    cursor,
    search,
  };
}

/**
 * Extract pagination params with validation
 */
export function extractValidatedPaginateParams(
  query: Record<string, any>,
  config: Partial<PaginateConfig> = {},
): PaginateParams {
  const params = extractPaginateParams(query, config);

  // Validate and sanitize
  if (params.page && params.page < 1) {
    params.page = DEFAULT_PAGE;
  }

  if (
    params.limit &&
    (params.limit < MIN_LIMIT || params.limit > (config.maxLimit || MAX_LIMIT))
  ) {
    params.limit = config.defaultLimit || DEFAULT_LIMIT;
  }

  return params;
}

// ============================================================
// BUILD PAGINATION OPTIONS
// ============================================================

/**
 * Build Prisma pagination options
 */
export function buildPrismaPaginationOptions(
  params: PaginateParams,
  config: Partial<PaginateConfig> = {},
  additionalWhere: Record<string, any> = {},
  additionalOrderBy: Record<string, "asc" | "desc"> = {},
): PrismaPaginationOptions {
  const cfg = { ...DEFAULT_PAGINATE_CONFIG, ...config };

  const page = Math.max(params.page || cfg.defaultPage, 1);
  const limit = Math.min(params.limit || cfg.defaultLimit, cfg.maxLimit);

  const skip = (page - 1) * limit;
  const take = limit;

  const orderBy = {
    [params.sortBy || cfg.defaultSortBy]:
      params.sortOrder || cfg.defaultSortOrder,
    ...additionalOrderBy,
  };

  const where = { ...additionalWhere };

  // Handle cursor-based pagination
  let cursor: Record<string, any> | undefined = undefined;
  if (params.cursor) {
    const cursorField = cfg.cursorField || "id";
    cursor = { [cursorField]: params.cursor };
  }

  return {
    skip,
    take,
    orderBy,
    where,
    cursor,
  };
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  totalItems: number,
  params: PaginateParams,
  config: Partial<PaginateConfig> = {},
): PaginateMeta {
  const cfg = { ...DEFAULT_PAGINATE_CONFIG, ...config };

  const page = Math.max(params.page || cfg.defaultPage, 1);
  const limit = Math.min(params.limit || cfg.defaultLimit, cfg.maxLimit);

  const totalPages = Math.ceil(totalItems / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const meta: PaginateMeta = {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext,
    hasPrev,
  };

  if (hasNext) {
    meta.nextPage = page + 1;
  }

  if (hasPrev) {
    meta.prevPage = page - 1;
  }

  return meta;
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  params: PaginateParams,
  config: Partial<PaginateConfig> = {},
): PaginatedResponse<T> {
  const pagination = buildPaginationMeta(totalItems, params, config);

  return {
    data,
    pagination,
  };
}

// ============================================================
// CURSOR-BASED PAGINATION
// ============================================================

/**
 * Build cursor pagination options
 */
export function buildCursorPaginationOptions(
  params: PaginateParams,
  config: Partial<PaginateConfig> = {},
  additionalWhere: Record<string, any> = {},
  additionalOrderBy: Record<string, "asc" | "desc"> = {},
): PrismaPaginationOptions {
  const cfg = { ...DEFAULT_PAGINATE_CONFIG, ...config };

  const limit = Math.min(params.limit || cfg.defaultLimit, cfg.maxLimit);

  const take = limit + 1; // Take one extra to check for next page
  const cursorField = cfg.cursorField || "id";
  const sortOrder = params.sortOrder || cfg.defaultSortOrder;

  const orderBy = {
    [params.sortBy || cfg.defaultSortBy]: sortOrder,
    [cursorField]: sortOrder,
    ...additionalOrderBy,
  };

  const where = { ...additionalWhere };

  let cursor: Record<string, any> | undefined = undefined;
  if (params.cursor) {
    cursor = { [cursorField]: params.cursor };
  }

  return {
    skip: 0,
    take,
    orderBy,
    where,
    cursor,
  };
}

/**
 * Create cursor paginated response
 */
export function createCursorPaginatedResponse<T>(
  items: T[],
  limit: number,
  hasPrev: boolean = false,
  prevCursor: string | null = null,
  config: Partial<PaginateConfig> = {},
): CursorPaginatedResponse<T> {
  const cfg = { ...DEFAULT_PAGINATE_CONFIG, ...config };

  // Determine if there is a next page
  const hasNext = items.length > limit;

  // Remove the extra item if it exists
  const data = hasNext ? items.slice(0, limit) : items;

  // Get the cursor for the first and last item
  const cursorField = cfg.cursorField || "id";
  const firstItem = data.length > 0 ? data[0] : null;
  const lastItem = data.length > 0 ? data[data.length - 1] : null;

  const nextCursor =
    lastItem && hasNext ? (lastItem as any)[cursorField] : null;
  const nextPrevCursor =
    firstItem && hasPrev ? (firstItem as any)[cursorField] : null;

  return {
    data,
    pagination: {
      limit,
      totalItems: 0, // Unknown in cursor pagination
      hasNext,
      hasPrev,
      nextCursor: nextCursor || null,
      prevCursor: (hasPrev && prevCursor) || nextPrevCursor || null,
    },
  };
}

// ============================================================
// CURSOR ENCODING/DECODING
// ============================================================

/**
 * Encode cursor for safe transmission
 */
export function encodeCursor(cursor: string): string {
  if (!cursor) return "";
  try {
    return Buffer.from(cursor, "utf8").toString("base64");
  } catch {
    return cursor;
  }
}

/**
 * Decode cursor
 */
export function decodeCursor(encodedCursor: string): string {
  if (!encodedCursor) return "";
  try {
    return Buffer.from(encodedCursor, "base64").toString("utf8");
  } catch {
    return encodedCursor;
  }
}

/**
 * Create cursor from object
 */
export function createCursorFromObject(
  obj: Record<string, any>,
  fields: string[],
): string {
  if (!obj || !fields || fields.length === 0) {
    return "";
  }

  const cursorParts = fields.map((field) => {
    const value = obj[field];
    if (value === undefined || value === null) {
      return "";
    }
    return `${field}:${String(value)}`;
  });

  const cursorString = cursorParts.filter((p) => p).join("|");
  return encodeCursor(cursorString);
}

/**
 * Parse cursor from string
 */
export function parseCursorFromString(
  cursorString: string,
): Record<string, any> {
  if (!cursorString) {
    return {};
  }

  const decoded = decodeCursor(cursorString);
  const parts = decoded.split("|");
  const result: Record<string, any> = {};

  for (const part of parts) {
    if (!part) continue;
    const [field, ...valueParts] = part.split(":");
    const value = valueParts.join(":");

    // Try to parse as number
    if (!isNaN(Number(value))) {
      result[field] = Number(value);
    } else if (value === "true" || value === "false") {
      result[field] = value === "true";
    } else {
      result[field] = value;
    }
  }

  return result;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Normalize pagination parameters
 */
export function normalizePaginateParams(
  params: Partial<PaginateParams>,
  config: Partial<PaginateConfig> = {},
): PaginateParams {
  const cfg = { ...DEFAULT_PAGINATE_CONFIG, ...config };

  return {
    page: Math.max(params.page || cfg.defaultPage, 1),
    limit: Math.min(params.limit || cfg.defaultLimit, cfg.maxLimit),
    sortBy: params.sortBy || cfg.defaultSortBy,
    sortOrder: (params.sortOrder === "asc" ? "asc" : "desc") as "asc" | "desc",
    cursor: params.cursor,
    search: params.search,
  };
}

/**
 * Get pagination limits
 */
export function getPaginationLimits(
  requestedLimit?: number,
  config: Partial<PaginateConfig> = {},
): { limit: number; maxLimit: number; minLimit: number } {
  const cfg = { ...DEFAULT_PAGINATE_CONFIG, ...config };

  const limit = Math.min(requestedLimit || cfg.defaultLimit, cfg.maxLimit);

  return {
    limit: Math.max(limit, MIN_LIMIT),
    maxLimit: cfg.maxLimit,
    minLimit: MIN_LIMIT,
  };
}

/**
 * Calculate offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
  return Math.max((page - 1) * limit, 0);
}

/**
 * Calculate total pages from total items and limit
 */
export function calculateTotalPages(totalItems: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.ceil(totalItems / limit);
}

/**
 * Check if there is a next page
 */
export function hasNextPage(
  totalItems: number,
  page: number,
  limit: number,
): boolean {
  const totalPages = calculateTotalPages(totalItems, limit);
  return page < totalPages;
}

/**
 * Check if there is a previous page
 */
export function hasPrevPage(page: number): boolean {
  return page > 1;
}

/**
 * Get next page number
 */
export function getNextPage(
  page: number,
  totalItems: number,
  limit: number,
): number | null {
  const totalPages = calculateTotalPages(totalItems, limit);
  if (page < totalPages) {
    return page + 1;
  }
  return null;
}

/**
 * Get previous page number
 */
export function getPrevPage(page: number): number | null {
  if (page > 1) {
    return page - 1;
  }
  return null;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  PaginateParams,
  PaginateMeta,
  PaginatedResponse,
  CursorPaginatedResponse,
  PrismaPaginationOptions,
  PaginateConfig,

  // Constants
  DEFAULT_PAGINATE_CONFIG,
  MIN_LIMIT,
  MAX_LIMIT,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,

  // Parameter extraction
  extractPaginateParams,
  extractValidatedPaginateParams,

  // Build functions
  buildPrismaPaginationOptions,
  buildPaginationMeta,
  createPaginatedResponse,
  buildCursorPaginationOptions,
  createCursorPaginatedResponse,

  // Cursor encoding/decoding
  encodeCursor,
  decodeCursor,
  createCursorFromObject,
  parseCursorFromString,

  // Utility functions
  normalizePaginateParams,
  getPaginationLimits,
  calculateOffset,
  calculateTotalPages,
  hasNextPage,
  hasPrevPage,
  getNextPage,
  getPrevPage,
};
