// ============================================================
// FILTER HELPERS
// Complete filter utility functions for the application
// ============================================================

// ============================================================
// TYPES
// ============================================================

/**
 * Filter operator types
 */
export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "in"
  | "nin"
  | "between"
  | "isNull"
  | "isNotNull";

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Filter group (AND/OR)
 */
export interface FilterGroup {
  type: "AND" | "OR";
  conditions: (FilterCondition | FilterGroup)[];
}

/**
 * Parsed filter from query string
 */
export interface ParsedFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Filter options
 */
export interface FilterOptions {
  caseSensitive?: boolean;
  trimValues?: boolean;
  allowEmpty?: boolean;
  maxArraySize?: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default filter options
 */
export const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  caseSensitive: false,
  trimValues: true,
  allowEmpty: false,
  maxArraySize: 100,
};

/**
 * Valid filter operators
 */
export const VALID_OPERATORS: FilterOperator[] = [
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "startsWith",
  "endsWith",
  "in",
  "nin",
  "between",
  "isNull",
  "isNotNull",
];

/**
 * Filter operator mapping to Prisma operators
 */
export const PRISMA_OPERATOR_MAP: Record<FilterOperator, string> = {
  eq: "equals",
  ne: "not",
  gt: "gt",
  gte: "gte",
  lt: "lt",
  lte: "lte",
  contains: "contains",
  startsWith: "startsWith",
  endsWith: "endsWith",
  in: "in",
  nin: "notIn",
  between: "gte",
  isNull: "equals",
  isNotNull: "not",
};

// ============================================================
// PARSING FUNCTIONS
// ============================================================

/**
 * Parse filter from query string
 */
export function parseFilter(
  filterString: string,
  options: FilterOptions = DEFAULT_FILTER_OPTIONS,
): ParsedFilter | null {
  if (!filterString || typeof filterString !== "string") {
    return null;
  }

  // Format: field|operator|value
  // Example: price|gt|100
  const parts = filterString.split("|");
  if (parts.length < 3) {
    return null;
  }

  const field = parts[0].trim();
  const operator = parts[1] as FilterOperator;
  let value = parts.slice(2).join("|");

  if (!VALID_OPERATORS.includes(operator)) {
    return null;
  }

  if (options.trimValues) {
    value = value.trim();
  }

  // Parse value based on operator
  if (["in", "nin"].includes(operator)) {
    const values = value.split(",").map((v) => v.trim());
    if (options.maxArraySize && values.length > options.maxArraySize) {
      return null;
    }
    return { field, operator, value: values };
  }

  if (operator === "between") {
    const values = value.split(",").map((v) => v.trim());
    if (values.length !== 2) {
      return null;
    }
    return { field, operator, value: values };
  }

  if (operator === "isNull" || operator === "isNotNull") {
    return { field, operator, value: null };
  }

  // Try to parse as number
  if (!isNaN(Number(value)) && value !== "") {
    return { field, operator, value: Number(value) };
  }

  // Try to parse as boolean
  if (value.toLowerCase() === "true") {
    return { field, operator, value: true };
  }
  if (value.toLowerCase() === "false") {
    return { field, operator, value: false };
  }

  return { field, operator, value };
}

/**
 * Parse multiple filters from query string
 */
export function parseFilters(
  filterStrings: string | string[],
  options: FilterOptions = DEFAULT_FILTER_OPTIONS,
): ParsedFilter[] {
  const filters: ParsedFilter[] = [];

  if (!filterStrings) {
    return filters;
  }

  const strings = Array.isArray(filterStrings)
    ? filterStrings
    : [filterStrings];

  for (const str of strings) {
    const parsed = parseFilter(str, options);
    if (parsed) {
      filters.push(parsed);
    }
  }

  return filters;
}

/**
 * Parse filter from object
 */
export function parseFilterFromObject(
  obj: Record<string, any>,
  options: FilterOptions = DEFAULT_FILTER_OPTIONS,
): FilterCondition[] {
  const filters: FilterCondition[] = [];

  for (const [field, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }
      filters.push({ field, operator: "in", value });
    } else if (typeof value === "object") {
      // Handle range: { gte: 10, lte: 20 }
      for (const [op, v] of Object.entries(value)) {
        if (v !== undefined && v !== null) {
          filters.push({ field, operator: op as FilterOperator, value: v });
        }
      }
    } else {
      filters.push({ field, operator: "eq", value });
    }
  }

  return filters;
}

// ============================================================
// BUILDING FUNCTIONS
// ============================================================

/**
 * Build filter condition for database query
 */
export function buildFilterCondition(
  filter: FilterCondition,
  options: FilterOptions = DEFAULT_FILTER_OPTIONS,
): Record<string, any> {
  const { field, operator, value } = filter;

  switch (operator) {
    case "eq":
      return { [field]: { equals: value } };

    case "ne":
      return { [field]: { not: value } };

    case "gt":
      return { [field]: { gt: value } };

    case "gte":
      return { [field]: { gte: value } };

    case "lt":
      return { [field]: { lt: value } };

    case "lte":
      return { [field]: { lte: value } };

    case "contains":
      return {
        [field]: {
          contains: value,
          mode: options.caseSensitive ? "default" : "insensitive",
        },
      };

    case "startsWith":
      return {
        [field]: {
          startsWith: value,
          mode: options.caseSensitive ? "default" : "insensitive",
        },
      };

    case "endsWith":
      return {
        [field]: {
          endsWith: value,
          mode: options.caseSensitive ? "default" : "insensitive",
        },
      };

    case "in":
      return { [field]: { in: value } };

    case "nin":
      return { [field]: { notIn: value } };

    case "between":
      if (Array.isArray(value) && value.length === 2) {
        return {
          [field]: {
            gte: value[0],
            lte: value[1],
          },
        };
      }
      return {};

    case "isNull":
      return { [field]: { equals: null } };

    case "isNotNull":
      return { [field]: { not: null } };

    default:
      return {};
  }
}

/**
 * Build where clause from filter conditions
 */
export function buildWhereClause(
  conditions: FilterCondition[],
  options: FilterOptions = DEFAULT_FILTER_OPTIONS,
): Record<string, any> {
  if (!conditions || conditions.length === 0) {
    return {};
  }

  const where: Record<string, any> = {};

  for (const condition of conditions) {
    const conditionWhere = buildFilterCondition(condition, options);
    Object.assign(where, conditionWhere);
  }

  return where;
}

/**
 * Build filter group
 */
export function buildFilterGroup(
  group: FilterGroup,
  options: FilterOptions = DEFAULT_FILTER_OPTIONS,
): Record<string, any> {
  if (!group.conditions || group.conditions.length === 0) {
    return {};
  }

  const conditions: Record<string, any>[] = [];

  for (const condition of group.conditions) {
    if (
      ("type" in condition && condition.type === "AND") ||
      condition.type === "OR"
    ) {
      // Nested group
      conditions.push(buildFilterGroup(condition as FilterGroup, options));
    } else {
      // Single condition
      const built = buildFilterCondition(condition as FilterCondition, options);
      if (Object.keys(built).length > 0) {
        conditions.push(built);
      }
    }
  }

  if (conditions.length === 0) {
    return {};
  }

  if (group.type === "AND") {
    return { AND: conditions };
  }

  return { OR: conditions };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Check if a value matches a filter condition
 */
export function matchesFilter(
  value: any,
  condition: FilterCondition,
  options: FilterOptions = DEFAULT_FILTER_OPTIONS,
): boolean {
  const { operator, value: filterValue } = condition;

  if (value === undefined || value === null) {
    return operator === "isNull";
  }

  switch (operator) {
    case "eq":
      return value === filterValue;

    case "ne":
      return value !== filterValue;

    case "gt":
      return value > filterValue;

    case "gte":
      return value >= filterValue;

    case "lt":
      return value < filterValue;

    case "lte":
      return value <= filterValue;

    case "contains":
      if (typeof value !== "string") return false;
      const strValue = options.caseSensitive ? value : value.toLowerCase();
      const strFilter = options.caseSensitive
        ? filterValue
        : filterValue.toLowerCase();
      return strValue.includes(strFilter);

    case "startsWith":
      if (typeof value !== "string") return false;
      return options.caseSensitive
        ? value.startsWith(filterValue)
        : value.toLowerCase().startsWith(filterValue.toLowerCase());

    case "endsWith":
      if (typeof value !== "string") return false;
      return options.caseSensitive
        ? value.endsWith(filterValue)
        : value.toLowerCase().endsWith(filterValue.toLowerCase());

    case "in":
      return Array.isArray(filterValue) && filterValue.includes(value);

    case "nin":
      return Array.isArray(filterValue) && !filterValue.includes(value);

    case "between":
      return (
        Array.isArray(filterValue) &&
        filterValue.length === 2 &&
        value >= filterValue[0] &&
        value <= filterValue[1]
      );

    case "isNull":
      return value === null;

    case "isNotNull":
      return value !== null;

    default:
      return false;
  }
}

/**
 * Filter an array of items
 */
export function filterArray<T>(
  items: T[],
  filters: FilterCondition[],
  options: FilterOptions = DEFAULT_FILTER_OPTIONS,
): T[] {
  if (!items || items.length === 0 || !filters || filters.length === 0) {
    return items;
  }

  return items.filter((item) => {
    return filters.every((filter) => {
      const value = (item as any)[filter.field];
      return matchesFilter(value, filter, options);
    });
  });
}

/**
 * Validate filter condition
 */
export function validateFilterCondition(
  condition: FilterCondition,
  options: FilterOptions = DEFAULT_FILTER_OPTIONS,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!condition.field || typeof condition.field !== "string") {
    errors.push("Field name is required");
  }

  if (!VALID_OPERATORS.includes(condition.operator)) {
    errors.push(`Invalid operator: ${condition.operator}`);
  }

  if (condition.value === undefined || condition.value === null) {
    if (!["isNull", "isNotNull"].includes(condition.operator)) {
      errors.push("Value is required for this operator");
    }
  }

  if (["in", "nin"].includes(condition.operator)) {
    if (!Array.isArray(condition.value) || condition.value.length === 0) {
      errors.push("Value must be a non-empty array for in/nin operators");
    }
    if (options.maxArraySize && condition.value.length > options.maxArraySize) {
      errors.push(`Array size exceeds maximum of ${options.maxArraySize}`);
    }
  }

  if (condition.operator === "between") {
    if (!Array.isArray(condition.value) || condition.value.length !== 2) {
      errors.push("Value must be an array of two values for between operator");
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// OPERATOR HELPERS
// ============================================================

/**
 * Get operator label
 */
export function getOperatorLabel(operator: FilterOperator): string {
  const labels: Record<FilterOperator, string> = {
    eq: "Equals",
    ne: "Not Equals",
    gt: "Greater Than",
    gte: "Greater Than or Equal",
    lt: "Less Than",
    lte: "Less Than or Equal",
    contains: "Contains",
    startsWith: "Starts With",
    endsWith: "Ends With",
    in: "In",
    nin: "Not In",
    between: "Between",
    isNull: "Is Null",
    isNotNull: "Is Not Null",
  };

  return labels[operator] || operator;
}

/**
 * Get operator category
 */
export function getOperatorCategory(
  operator: FilterOperator,
): "comparison" | "string" | "array" | "null" {
  const comparisonOps: FilterOperator[] = [
    "eq",
    "ne",
    "gt",
    "gte",
    "lt",
    "lte",
  ];
  const stringOps: FilterOperator[] = ["contains", "startsWith", "endsWith"];
  const arrayOps: FilterOperator[] = ["in", "nin", "between"];
  const nullOps: FilterOperator[] = ["isNull", "isNotNull"];

  if (comparisonOps.includes(operator)) return "comparison";
  if (stringOps.includes(operator)) return "string";
  if (arrayOps.includes(operator)) return "array";
  if (nullOps.includes(operator)) return "null";
  return "comparison";
}

/**
 * Get valid operators for field type
 */
export function getOperatorsForFieldType(
  fieldType: "string" | "number" | "boolean" | "date" | "array" | "any",
): FilterOperator[] {
  const operators: Record<string, FilterOperator[]> = {
    string: [
      "eq",
      "ne",
      "contains",
      "startsWith",
      "endsWith",
      "isNull",
      "isNotNull",
    ],
    number: [
      "eq",
      "ne",
      "gt",
      "gte",
      "lt",
      "lte",
      "between",
      "isNull",
      "isNotNull",
    ],
    boolean: ["eq", "ne", "isNull", "isNotNull"],
    date: [
      "eq",
      "ne",
      "gt",
      "gte",
      "lt",
      "lte",
      "between",
      "isNull",
      "isNotNull",
    ],
    array: ["in", "nin", "isNull", "isNotNull"],
    any: [
      "eq",
      "ne",
      "contains",
      "gt",
      "gte",
      "lt",
      "lte",
      "in",
      "nin",
      "between",
      "isNull",
      "isNotNull",
    ],
  };

  return operators[fieldType] || operators.any;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  FilterOperator,
  FilterCondition,
  FilterGroup,
  ParsedFilter,
  FilterOptions,

  // Constants
  DEFAULT_FILTER_OPTIONS,
  VALID_OPERATORS,
  PRISMA_OPERATOR_MAP,

  // Parsing
  parseFilter,
  parseFilters,
  parseFilterFromObject,

  // Building
  buildFilterCondition,
  buildWhereClause,
  buildFilterGroup,

  // Utility
  matchesFilter,
  filterArray,
  validateFilterCondition,

  // Operator helpers
  getOperatorLabel,
  getOperatorCategory,
  getOperatorsForFieldType,
};
