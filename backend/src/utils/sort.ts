// ============================================================
// SORT HELPERS
// Complete sort utility functions for the application
// ============================================================

// ============================================================
// TYPES
// ============================================================

/**
 * Sort direction enum
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort field configuration
 */
export interface SortField {
  field: string;
  direction: SortDirection;
}

/**
 * Sort options
 */
export interface SortOptions {
  caseSensitive?: boolean;
  ignoreAccents?: boolean;
  nullsFirst?: boolean;
  numeric?: boolean;
  descending?: boolean;
}

/**
 * Sort result
 */
export interface SortResult<T> {
  data: T[];
  sortField: string;
  sortDirection: SortDirection;
  totalItems: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default sort options
 */
export const DEFAULT_SORT_OPTIONS: SortOptions = {
  caseSensitive: false,
  ignoreAccents: true,
  nullsFirst: false,
  numeric: false,
  descending: false,
};

/**
 * Sort direction labels
 */
export const SORT_DIRECTION_LABELS: Record<SortDirection, string> = {
  asc: "Ascending",
  desc: "Descending",
};

// ============================================================
// BASE SORTING FUNCTIONS
// ============================================================

/**
 * Sort an array of strings
 */
export function sortStrings(
  array: string[],
  direction: SortDirection = "asc",
  options: SortOptions = {},
): string[] {
  if (!array || array.length === 0) {
    return [];
  }

  const {
    caseSensitive = false,
    ignoreAccents = true,
    nullsFirst = false,
  } = options;

  const sorted = [...array];

  sorted.sort((a, b) => {
    // Handle null/undefined
    if (a == null && b == null) return 0;
    if (a == null) return nullsFirst ? -1 : 1;
    if (b == null) return nullsFirst ? 1 : -1;

    let strA = String(a);
    let strB = String(b);

    if (!caseSensitive) {
      strA = strA.toLowerCase();
      strB = strB.toLowerCase();
    }

    if (ignoreAccents) {
      strA = removeAccents(strA);
      strB = removeAccents(strB);
    }

    const comparison = strA.localeCompare(strB);

    return direction === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Sort an array of numbers
 */
export function sortNumbers(
  array: number[],
  direction: SortDirection = "asc",
): number[] {
  if (!array || array.length === 0) {
    return [];
  }

  const sorted = [...array];

  sorted.sort((a, b) => {
    // Handle null/undefined
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    return direction === "asc" ? a - b : b - a;
  });

  return sorted;
}

/**
 * Sort an array of dates
 */
export function sortDates(
  array: Date[],
  direction: SortDirection = "asc",
): Date[] {
  if (!array || array.length === 0) {
    return [];
  }

  const sorted = [...array];

  sorted.sort((a, b) => {
    // Handle null/undefined
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    const timeA = a.getTime();
    const timeB = b.getTime();

    return direction === "asc" ? timeA - timeB : timeB - timeA;
  });

  return sorted;
}

/**
 * Sort an array of objects by a single field
 */
export function sortByField<T>(
  array: T[],
  field: keyof T,
  direction: SortDirection = "asc",
  options: SortOptions = {},
): T[] {
  if (!array || array.length === 0) {
    return [];
  }

  const {
    caseSensitive = false,
    ignoreAccents = true,
    nullsFirst = false,
    numeric = false,
  } = options;

  const sorted = [...array];

  sorted.sort((a, b) => {
    const valA = a[field];
    const valB = b[field];

    // Handle null/undefined
    if (valA == null && valB == null) return 0;
    if (valA == null) return nullsFirst ? -1 : 1;
    if (valB == null) return nullsFirst ? 1 : -1;

    let comparison: number;

    if (typeof valA === "string" && typeof valB === "string") {
      let strA = valA;
      let strB = valB;

      if (!caseSensitive) {
        strA = strA.toLowerCase();
        strB = strB.toLowerCase();
      }

      if (ignoreAccents) {
        strA = removeAccents(strA);
        strB = removeAccents(strB);
      }

      comparison = strA.localeCompare(strB);
    } else if (typeof valA === "number" && typeof valB === "number") {
      comparison = numeric
        ? valA - valB
        : valA > valB
          ? 1
          : valA < valB
            ? -1
            : 0;
    } else if (valA instanceof Date && valB instanceof Date) {
      comparison = valA.getTime() - valB.getTime();
    } else if (typeof valA === "boolean" && typeof valB === "boolean") {
      comparison = valA === valB ? 0 : valA ? 1 : -1;
    } else {
      comparison = String(valA).localeCompare(String(valB));
    }

    return direction === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Sort an array of objects by multiple fields
 */
export function sortByMultipleFields<T>(
  array: T[],
  fields: SortField[],
  options: SortOptions = {},
): T[] {
  if (!array || array.length === 0 || !fields || fields.length === 0) {
    return [...array];
  }

  const {
    caseSensitive = false,
    ignoreAccents = true,
    nullsFirst = false,
    numeric = false,
  } = options;

  const sorted = [...array];

  sorted.sort((a, b) => {
    for (const sortField of fields) {
      const valA = a[sortField.field as keyof T];
      const valB = b[sortField.field as keyof T];

      // Handle null/undefined
      if (valA == null && valB == null) continue;
      if (valA == null) return nullsFirst ? -1 : 1;
      if (valB == null) return nullsFirst ? 1 : -1;

      let comparison: number;

      if (typeof valA === "string" && typeof valB === "string") {
        let strA = valA;
        let strB = valB;

        if (!caseSensitive) {
          strA = strA.toLowerCase();
          strB = strB.toLowerCase();
        }

        if (ignoreAccents) {
          strA = removeAccents(strA);
          strB = removeAccents(strB);
        }

        comparison = strA.localeCompare(strB);
      } else if (typeof valA === "number" && typeof valB === "number") {
        comparison = numeric
          ? valA - valB
          : valA > valB
            ? 1
            : valA < valB
              ? -1
              : 0;
      } else if (valA instanceof Date && valB instanceof Date) {
        comparison = valA.getTime() - valB.getTime();
      } else if (typeof valA === "boolean" && typeof valB === "boolean") {
        comparison = valA === valB ? 0 : valA ? 1 : -1;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      if (comparison !== 0) {
        return sortField.direction === "asc" ? comparison : -comparison;
      }
    }

    return 0;
  });

  return sorted;
}

// ============================================================
// ADVANCED SORTING
// ============================================================

/**
 * Natural sorting for strings containing numbers
 */
export function naturalSort(
  array: string[],
  direction: SortDirection = "asc",
): string[] {
  if (!array || array.length === 0) {
    return [];
  }

  const sorted = [...array];

  sorted.sort((a, b) => {
    const comparison = naturalCompare(a, b);
    return direction === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Natural compare function for strings with numbers
 */
export function naturalCompare(a: string, b: string): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  const chunksA = a.match(/\d+|\D+/g) || [];
  const chunksB = b.match(/\d+|\D+/g) || [];

  const minLength = Math.min(chunksA.length, chunksB.length);

  for (let i = 0; i < minLength; i++) {
    const chunkA = chunksA[i];
    const chunkB = chunksB[i];

    // Check if both chunks are numbers
    const isNumA = /^\d+$/.test(chunkA);
    const isNumB = /^\d+$/.test(chunkB);

    if (isNumA && isNumB) {
      const numA = parseInt(chunkA, 10);
      const numB = parseInt(chunkB, 10);
      if (numA !== numB) {
        return numA - numB;
      }
    } else {
      const comparison = chunkA.localeCompare(chunkB);
      if (comparison !== 0) {
        return comparison;
      }
    }
  }

  return chunksA.length - chunksB.length;
}

/**
 * Stable sort (preserves original order for equal items)
 */
export function stableSort<T>(
  array: T[],
  compareFn: (a: T, b: T) => number,
): T[] {
  if (!array || array.length === 0) {
    return [];
  }

  // Add original index to preserve stability
  const indexed = array.map((item, index) => ({ item, index }));

  indexed.sort((a, b) => {
    const comparison = compareFn(a.item, b.item);
    return comparison !== 0 ? comparison : a.index - b.index;
  });

  return indexed.map((item) => item.item);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Remove accents from a string
 */
export function removeAccents(str: string): string {
  if (!str || typeof str !== "string") {
    return "";
  }

  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Get sort direction from string
 */
export function getSortDirection(value: string): SortDirection {
  const lower = value.toLowerCase();
  if (lower === "asc" || lower === "ascending") {
    return "asc";
  }
  if (lower === "desc" || lower === "descending") {
    return "desc";
  }
  return "asc";
}

/**
 * Get sort direction label
 */
export function getSortDirectionLabel(direction: SortDirection): string {
  return SORT_DIRECTION_LABELS[direction];
}

/**
 * Toggle sort direction
 */
export function toggleSortDirection(direction: SortDirection): SortDirection {
  return direction === "asc" ? "desc" : "asc";
}

/**
 * Parse sort string (format: "field:asc,field2:desc")
 */
export function parseSortString(sortString: string): SortField[] {
  if (!sortString || typeof sortString !== "string") {
    return [];
  }

  const parts = sortString.split(",").filter((p) => p.trim());
  const fields: SortField[] = [];

  for (const part of parts) {
    const [field, direction] = part.split(":").map((s) => s.trim());
    if (field) {
      fields.push({
        field,
        direction: getSortDirection(direction || "asc"),
      });
    }
  }

  return fields;
}

/**
 * Format sort fields to string
 */
export function formatSortString(fields: SortField[]): string {
  if (!fields || fields.length === 0) {
    return "";
  }

  return fields.map((field) => `${field.field}:${field.direction}`).join(",");
}

/**
 * Create sort result
 */
export function createSortResult<T>(
  data: T[],
  sortField: string,
  sortDirection: SortDirection,
): SortResult<T> {
  return {
    data,
    sortField,
    sortDirection,
    totalItems: data.length,
  };
}

// ============================================================
// TYPE-SPECIFIC SORTING
// ============================================================

/**
 * Sort objects by date field
 */
export function sortByDateField<T>(
  array: T[],
  field: keyof T,
  direction: SortDirection = "desc",
): T[] {
  return sortByField(array, field, direction, { numeric: true });
}

/**
 * Sort objects by string field (case-insensitive)
 */
export function sortByStringField<T>(
  array: T[],
  field: keyof T,
  direction: SortDirection = "asc",
): T[] {
  return sortByField(array, field, direction, { caseSensitive: false });
}

/**
 * Sort objects by numeric field
 */
export function sortByNumericField<T>(
  array: T[],
  field: keyof T,
  direction: SortDirection = "desc",
): T[] {
  return sortByField(array, field, direction, { numeric: true });
}

/**
 * Sort objects by boolean field
 */
export function sortByBooleanField<T>(
  array: T[],
  field: keyof T,
  direction: SortDirection = "desc",
): T[] {
  return sortByField(array, field, direction);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  SortDirection,
  SortField,
  SortOptions,
  SortResult,

  // Constants
  DEFAULT_SORT_OPTIONS,
  SORT_DIRECTION_LABELS,

  // Base sorting
  sortStrings,
  sortNumbers,
  sortDates,
  sortByField,
  sortByMultipleFields,

  // Advanced sorting
  naturalSort,
  naturalCompare,
  stableSort,

  // Helpers
  removeAccents,
  getSortDirection,
  getSortDirectionLabel,
  toggleSortDirection,
  parseSortString,
  formatSortString,
  createSortResult,

  // Type-specific sorting
  sortByDateField,
  sortByStringField,
  sortByNumericField,
  sortByBooleanField,
};
