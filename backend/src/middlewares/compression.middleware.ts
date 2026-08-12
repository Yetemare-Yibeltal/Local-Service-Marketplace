import { Request, Response, NextFunction } from "express";
import compression from "compression";
import zlib from "zlib";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface CompressionOptions {
  level?: number;
  threshold?: number;
  filter?: (req: Request, res: Response) => boolean;
  brotli?: {
    enabled: boolean;
    level?: number;
    quality?: number;
    chunkSize?: number;
  };
  gzip?: {
    enabled: boolean;
    level?: number;
    memLevel?: number;
    strategy?: number;
  };
  deflate?: {
    enabled: boolean;
    level?: number;
  };
}

export interface CompressionStats {
  totalCompressed: number;
  totalUncompressed: number;
  totalSavings: number;
  gzipCount: number;
  brotliCount: number;
  deflateCount: number;
  skipCount: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default compression options
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  level: zlib.constants.Z_DEFAULT_COMPRESSION,
  threshold: 1024, // Only compress responses larger than 1KB
  brotli: {
    enabled: true,
    level: 4,
    quality: 6,
    chunkSize: 16 * 1024,
  },
  gzip: {
    enabled: true,
    level: zlib.constants.Z_DEFAULT_COMPRESSION,
    memLevel: 8,
    strategy: zlib.constants.Z_DEFAULT_STRATEGY,
  },
  deflate: {
    enabled: true,
    level: zlib.constants.Z_DEFAULT_COMPRESSION,
  },
};

/**
 * Content types that should be compressed
 */
const COMPRESSIBLE_CONTENT_TYPES = [
  "text/plain",
  "text/html",
  "text/css",
  "text/xml",
  "text/javascript",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/x-javascript",
  "application/rss+xml",
  "application/atom+xml",
  "application/ld+json",
  "application/manifest+json",
  "application/vnd.api+json",
  "application/hal+json",
  "image/svg+xml",
];

/**
 * Content types that should NOT be compressed (already compressed)
 */
const ALREADY_COMPRESSED = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/ogg",
  "application/zip",
  "application/gzip",
  "application/x-tar",
  "application/x-bzip2",
  "application/x-7z-compressed",
  "application/pdf",
];

// ============================================================
// STATISTICS
// ============================================================

/**
 * Compression statistics
 */
const stats: CompressionStats = {
  totalCompressed: 0,
  totalUncompressed: 0,
  totalSavings: 0,
  gzipCount: 0,
  brotliCount: 0,
  deflateCount: 0,
  skipCount: 0,
};

// ============================================================
// DEFAULT FILTER
// ============================================================

/**
 * Default filter function
 */
function defaultFilter(req: Request, res: Response): boolean {
  // Skip compression for specific paths
  const skipPaths = [
    "/health",
    "/ping",
    "/api-docs",
    "/api-docs.json",
    "/robots.txt",
  ];
  if (skipPaths.includes(req.path)) {
    return false;
  }

  // Skip if content-type is not compressible
  const contentType = res.getHeader("content-type") as string;
  if (contentType) {
    // Check if already compressed format
    if (ALREADY_COMPRESSED.some((type) => contentType.includes(type))) {
      return false;
    }

    // Check if compressible
    const isCompressible = COMPRESSIBLE_CONTENT_TYPES.some((type) =>
      contentType.includes(type),
    );

    if (!isCompressible) {
      return false;
    }
  }

  // Skip if content-length is less than threshold
  const contentLength = parseInt(
    (res.getHeader("content-length") as string) || "0",
    10,
  );
  if (
    contentLength > 0 &&
    contentLength < (DEFAULT_OPTIONS.threshold || 1024)
  ) {
    return false;
  }

  return true;
}

// ============================================================
// CREATE COMPRESSION MIDDLEWARE
// ============================================================

/**
 * Create compression middleware with custom options
 */
export function createCompressionMiddleware(
  options: CompressionOptions = {},
): ReturnType<typeof compression> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Build compression filter
  const filter = opts.filter || defaultFilter;

  // Build compression options for compression library
  const compressionOptions: compression.CompressionOptions = {
    level: opts.level,
    threshold: opts.threshold,
    filter: (req: Request, res: Response) => {
      const shouldCompress = filter(req, res);

      if (!shouldCompress) {
        stats.skipCount++;
      }

      return shouldCompress;
    },
  };

  // Add Brotli compression if enabled
  if (opts.brotli?.enabled) {
    compressionOptions.brotli = {
      enabled: true,
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: opts.brotli.quality || 6,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]:
          opts.brotli.chunkSize || 16 * 1024,
      },
    };
  }

  // Add Gzip compression if enabled
  if (opts.gzip?.enabled) {
    compressionOptions.gzip = {
      enabled: true,
      level: opts.gzip.level || zlib.constants.Z_DEFAULT_COMPRESSION,
      memLevel: opts.gzip.memLevel || 8,
      strategy: opts.gzip.strategy || zlib.constants.Z_DEFAULT_STRATEGY,
    };
  }

  // Add Deflate compression if enabled
  if (opts.deflate?.enabled) {
    compressionOptions.deflate = {
      enabled: true,
      level: opts.deflate.level || zlib.constants.Z_DEFAULT_COMPRESSION,
    };
  }

  return compression(compressionOptions);
}

// ============================================================
// MAIN COMPRESSION MIDDLEWARE
// ============================================================

/**
 * Default compression middleware instance
 */
export const compressionMiddleware = createCompressionMiddleware();

// ============================================================
// CUSTOM COMPRESSION MIDDLEWARES
// ============================================================

/**
 * High compression level (slower, better compression)
 */
export const highCompression = createCompressionMiddleware({
  level: zlib.constants.Z_BEST_COMPRESSION,
  threshold: 1024,
});

/**
 * Low compression level (faster, less compression)
 */
export const lowCompression = createCompressionMiddleware({
  level: zlib.constants.Z_BEST_SPEED,
  threshold: 2048,
});

/**
 * Minimal compression (only compress large responses)
 */
export const minimalCompression = createCompressionMiddleware({
  level: zlib.constants.Z_DEFAULT_COMPRESSION,
  threshold: 4096,
});

// ============================================================
// SELECTIVE COMPRESSION
// ============================================================

/**
 * Create compression middleware that only compresses specific routes
 */
export function selectiveCompression(
  routes: string[],
  options: CompressionOptions = {},
): ReturnType<typeof compression> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const filter = (req: Request, res: Response): boolean => {
    const matchesRoute = routes.some((route) => req.path.startsWith(route));
    if (!matchesRoute) {
      stats.skipCount++;
      return false;
    }

    // Apply default filter
    return defaultFilter(req, res);
  };

  return createCompressionMiddleware({
    ...opts,
    filter,
  });
}

// ============================================================
// COMPRESSION HEADERS
// ============================================================

/**
 * Set compression-related headers
 */
export function setCompressionHeaders(
  res: Response,
  encoding: string,
  contentLength: number,
  originalLength: number,
): void {
  res.setHeader("X-Content-Encoding", encoding);
  res.setHeader("X-Compressed-Size", contentLength);
  res.setHeader("X-Original-Size", originalLength);
  res.setHeader(
    "X-Compression-Ratio",
    `${((contentLength / originalLength) * 100).toFixed(1)}%`,
  );

  // Update statistics
  stats.totalCompressed += contentLength;
  stats.totalUncompressed += originalLength;
  stats.totalSavings += originalLength - contentLength;

  if (encoding === "gzip") {
    stats.gzipCount++;
  } else if (encoding === "br") {
    stats.brotliCount++;
  } else if (encoding === "deflate") {
    stats.deflateCount++;
  }
}

// ============================================================
// COMPRESSION STATISTICS
// ============================================================

/**
 * Get compression statistics
 */
export function getCompressionStats(): CompressionStats {
  return { ...stats };
}

/**
 * Reset compression statistics
 */
export function resetCompressionStats(): void {
  stats.totalCompressed = 0;
  stats.totalUncompressed = 0;
  stats.totalSavings = 0;
  stats.gzipCount = 0;
  stats.brotliCount = 0;
  stats.deflateCount = 0;
  stats.skipCount = 0;
}

/**
 * Get compression summary
 */
export function getCompressionSummary(): {
  totalRequests: number;
  totalCompressed: number;
  totalSavings: number;
  averageRatio: number;
  gzipUsage: number;
  brotliUsage: number;
  deflateUsage: number;
  skipRate: number;
} {
  const totalRequests =
    stats.gzipCount + stats.brotliCount + stats.deflateCount + stats.skipCount;

  return {
    totalRequests,
    totalCompressed: stats.totalCompressed,
    totalSavings: stats.totalSavings,
    averageRatio:
      stats.totalUncompressed > 0
        ? (stats.totalCompressed / stats.totalUncompressed) * 100
        : 0,
    gzipUsage: totalRequests > 0 ? (stats.gzipCount / totalRequests) * 100 : 0,
    brotliUsage:
      totalRequests > 0 ? (stats.brotliCount / totalRequests) * 100 : 0,
    deflateUsage:
      totalRequests > 0 ? (stats.deflateCount / totalRequests) * 100 : 0,
    skipRate: totalRequests > 0 ? (stats.skipCount / totalRequests) * 100 : 0,
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if response should be compressed
 */
export function shouldCompress(req: Request, res: Response): boolean {
  return defaultFilter(req, res);
}

/**
 * Get preferred encoding from Accept-Encoding header
 */
export function getPreferredEncoding(req: Request): string | null {
  const acceptEncoding = req.headers["accept-encoding"];

  if (!acceptEncoding) {
    return null;
  }

  const encodings = acceptEncoding.split(",").map((e) => e.trim());

  // Brotli has highest priority
  if (encodings.some((e) => e.startsWith("br"))) {
    return "br";
  }

  // Gzip is second
  if (encodings.some((e) => e.startsWith("gzip"))) {
    return "gzip";
  }

  // Deflate is third
  if (encodings.some((e) => e.startsWith("deflate"))) {
    return "deflate";
  }

  return null;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Main middleware
  compressionMiddleware,

  // Custom middlewares
  createCompressionMiddleware,
  highCompression,
  lowCompression,
  minimalCompression,
  selectiveCompression,

  // Headers
  setCompressionHeaders,

  // Statistics
  getCompressionStats,
  resetCompressionStats,
  getCompressionSummary,

  // Helpers
  shouldCompress,
  getPreferredEncoding,

  // Constants
  DEFAULT_OPTIONS,
  COMPRESSIBLE_CONTENT_TYPES,
  ALREADY_COMPRESSED,
};
