'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ============================================================
// TYPES
// ============================================================

export interface PaginationOptions {
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Items per page (default: 10) */
  initialLimit?: number;
  /** Total number of items (default: 0) */
  totalItems?: number;
  /** Whether to sync page with URL query params (default: false) */
  syncWithUrl?: boolean;
  /** URL parameter name for page (default: 'page') */
  pageParamName?: string;
  /** URL parameter name for limit (default: 'limit') */
  limitParamName?: string;
  /** Maximum number of visible page buttons (default: 5) */
  maxVisiblePages?: number;
  /** Callback when page or limit changes */
  onChange?: (page: number, limit: number) => void;
}

export interface PaginationResult {
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
  /** Start index of current page items (0-based) */
  startIndex: number;
  /** End index of current page items (0-based) */
  endIndex: number;
  /** Array of page numbers to display (for pagination buttons) */
  visiblePages: number[];
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  goToNext: () => void;
  /** Go to previous page */
  goToPrev: () => void;
  /** Go to first page */
  goToFirst: () => void;
  /** Go to last page */
  goToLast: () => void;
  /** Change items per page (resets to page 1) */
  setLimit: (limit: number) => void;
  /** Set total items (updates pagination) */
  setTotalItems: (total: number) => void;
  /** Reset to initial state */
  reset: () => void;
}

// ============================================================
// HOOK
// ============================================================

export function usePagination(options: PaginationOptions = {}): PaginationResult {
  const {
    initialPage = 1,
    initialLimit = 10,
    totalItems: initialTotalItems = 0,
    syncWithUrl = false,
    pageParamName = 'page',
    limitParamName = 'limit',
    maxVisiblePages = 5,
    onChange,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL if syncing
  const getInitialPage = (): number => {
    if (syncWithUrl) {
      const urlPage = searchParams?.get(pageParamName);
      if (urlPage) {
        const parsed = parseInt(urlPage, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return initialPage;
  };

  const getInitialLimit = (): number => {
    if (syncWithUrl) {
      const urlLimit = searchParams?.get(limitParamName);
      if (urlLimit) {
        const parsed = parseInt(urlLimit, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return initialLimit;
  };

  const [page, setPage] = useState<number>(getInitialPage());
  const [limit, setLimitState] = useState<number>(getInitialLimit());
  const [totalItems, setTotalItemsState] = useState<number>(initialTotalItems);

  // Calculate derived values
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / limit));
  }, [totalItems, limit]);

  const hasNext = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrev = useMemo(() => page > 1, [page]);

  const startIndex = useMemo(() => (page - 1) * limit, [page, limit]);
  const endIndex = useMemo(
    () => Math.min(startIndex + limit, totalItems),
    [startIndex, limit, totalItems]
  );

  // Calculate visible page numbers for pagination controls
  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }, [page, totalPages, maxVisiblePages]);

  // Update URL when page or limit changes
  useEffect(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams(searchParams?.toString() || '');
    if (page > 1) {
      params.set(pageParamName, page.toString());
    } else {
      params.delete(pageParamName);
    }
    if (limit !== initialLimit) {
      params.set(limitParamName, limit.toString());
    } else {
      params.delete(limitParamName);
    }

    const queryString = params.toString();
    const url = queryString ? `?${queryString}` : window.location.pathname;

    router.replace(url, { scroll: false });
  }, [page, limit, syncWithUrl, router, searchParams, pageParamName, limitParamName, initialLimit]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(page, limit);
    }
  }, [page, limit, onChange]);

  // Navigation functions
  const goToPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages));
      if (validPage !== page) {
        setPage(validPage);
      }
    },
    [page, totalPages]
  );

  const goToNext = useCallback(() => {
    if (hasNext) {
      setPage(page + 1);
    }
  }, [page, hasNext]);

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setPage(page - 1);
    }
  }, [page, hasPrev]);

  const goToFirst = useCallback(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [page]);

  const goToLast = useCallback(() => {
    if (page !== totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const setLimit = useCallback(
    (newLimit: number) => {
      const validLimit = Math.max(1, newLimit);
      if (validLimit !== limit) {
        setLimitState(validLimit);
        // Reset to first page when changing limit
        if (page !== 1) {
          setPage(1);
        }
      }
    },
    [limit, page]
  );

  const setTotalItems = useCallback(
    (total: number) => {
      setTotalItemsState(Math.max(0, total));
      // Adjust page if current page exceeds new total pages
      const newTotalPages = Math.max(1, Math.ceil(total / limit));
      if (page > newTotalPages) {
        setPage(newTotalPages);
      }
    },
    [limit, page]
  );

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimitState(initialLimit);
    setTotalItemsState(initialTotalItems);
  }, [initialPage, initialLimit, initialTotalItems]);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
    visiblePages,
    goToPage,
    goToNext,
    goToPrev,
    goToFirst,
    goToLast,
    setLimit,
    setTotalItems,
    reset,
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate pagination metadata for API requests
 */
export function getPaginationParams(page: number, limit: number): Record<string, string | number> {
  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

/**
 * Create a pagination response from API data
 */
export function createPaginationResponse<T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number
): {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} {
  const totalPages = Math.ceil(totalItems / limit);
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
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default usePagination;
